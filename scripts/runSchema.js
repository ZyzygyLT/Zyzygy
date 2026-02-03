const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🚀 Buscando y ejecutando schema SQL...');

// Buscar archivo schema en varias ubicaciones posibles
const possiblePaths = [
  'database/schema/001_complete_schema.sql',
  'database/schema.sql',
  'schema.sql',
  'database/001_initial_schema.sql',
  'db/schema.sql'
];

let schemaPath = null;

for (const possiblePath of possiblePaths) {
  const fullPath = path.join(__dirname, '..', possiblePath);
  if (fs.existsSync(fullPath)) {
    schemaPath = fullPath;
    console.log(`✅ Encontrado: ${possiblePath}`);
    break;
  }
}

if (!schemaPath) {
  console.error('❌ No se encontró ningún archivo schema.sql');
  console.log('\n💡 Creando uno básico ahora...');
  
  // Crear carpeta si no existe
  const schemaDir = path.join(__dirname, '..', 'database', 'schema');
  if (!fs.existsSync(schemaDir)) {
    fs.mkdirSync(schemaDir, { recursive: true });
  }
  
  // Crear schema básico
  const basicSchema = `
-- SCHEMA BÁSICO ECHOES DUNGEON
CREATE DATABASE IF NOT EXISTS echoes_dungeon 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE echoes_dungeon;

-- Tabla de jugadores básica
CREATE TABLE IF NOT EXISTS players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(32) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    character_name VARCHAR(32) NOT NULL UNIQUE,
    level INT DEFAULT 1,
    gold BIGINT DEFAULT 1000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SELECT '✅ Base de datos y tabla players creada exitosamente!' as message;
SHOW TABLES;
`;
  
  schemaPath = path.join(schemaDir, '001_basic_schema.sql');
  fs.writeFileSync(schemaPath, basicSchema);
  console.log(`📄 Creado: ${schemaPath}`);
}

// Ejecutar el schema
console.log(`\n⚡ Ejecutando: ${schemaPath}`);
console.log('⏳ Esto puede tomar unos segundos...\n');

// Intenta con contraseña primero, luego sin
const tryExecute = (command, attempt = 1) => {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      if (attempt === 1 && error.message.includes('Access denied')) {
        console.log('🔑 Intento 1 falló (credenciales). Intentando sin contraseña...');
        const noPassCommand = `mysql -u root < "${schemaPath}"`;
        tryExecute(noPassCommand, 2);
      } else if (attempt === 2) {
        console.error('❌ Error ejecutando schema:');
        console.error(stderr || error.message);
        console.log('\n💡 SOLUCIONES:');
        console.log('   1. Verifica que MySQL esté corriendo: net start MySQL80');
        console.log('   2. Usa tus credenciales:');
        console.log('      Edita este archivo y cambia "root" por tu usuario');
        console.log('      Añade -p si tienes contraseña');
      }
    } else {
      console.log('✅ ¡SCHEMA EJECUTADO EXITOSAMENTE!\n');
      if (stdout) {
        const lines = stdout.split('\n');
        lines.forEach(line => {
          if (line.includes('Tables_in') || line.includes('✅')) {
            console.log(line);
          }
        });
      }
      console.log('\n✨ Puedes ahora ejecutar: npm run db:seed');
    }
  });
};

// Comando inicial (ajusta según tu configuración)
const command = `mysql -u root < "${schemaPath}"`;
tryExecute(command, 1);