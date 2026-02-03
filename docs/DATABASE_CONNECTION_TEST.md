# Verificar Conexión a Base de Datos desde Node.js

## Opciones disponibles

### 1. **Script rápido con mysql2 (recomendado)**
```bash
npm run db:test
```
o
```bash
node scripts/testConnectionNative.js
```

Este script usa **mysql2/promise** que es el driver nativo de MySQL más rápido.

### 2. **Script con Sequelize (ORM)**
```bash
npm run db:test:sequelize
```
o
```bash
node scripts/testConnection.js
```

Este script usa **Sequelize**, el ORM que usas en tu aplicación.

---

## ¿Qué hace cada script?

### testConnectionNative.js
- ✅ Prueba conexión directa con MySQL
- ✅ Obtiene versión del servidor (MySQL/MariaDB)
- ✅ Cuenta el total de tablas
- ✅ Lista todas las tablas creadas
- ✅ Muestra conteo de registros por tabla importante
- ✅ Obtiene datos de ejemplo (jugadores, razas, enemigos)
- ⚡ **Más rápido y directo**

### testConnection.js
- ✅ Prueba conexión usando Sequelize (tu ORM)
- ✅ Verifica la configuración de Sequelize
- ✅ Obtiene los mismos datos que testConnectionNative.js
- ✅ Usa la misma configuración que tu aplicación
- 📊 **Útil para validar que Sequelize funciona correctamente**

---

## Requisitos previos

1. **MySQL/MariaDB debe estar ejecutándose**
   ```bash
   # En Windows
   mysql -u root -p
   # Debería conectar sin errores
   ```

2. **Base de datos debe existir**
   ```bash
   mysql -u root -e "SHOW DATABASES LIKE 'echoes_dungeon';"
   ```

3. **Variables de entorno configuradas en .env**
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=echoes_dungeon
   DB_USER=root
   DB_PASSWORD=
   ```

---

## Solución de problemas

### Error: "connect ECONNREFUSED"
- ❌ MySQL no está ejecutándose
- ✅ Inicia MySQL/MariaDB

### Error: "Access denied for user 'root'@'localhost'"
- ❌ Contraseña incorrecta en .env
- ✅ Verifica DB_PASSWORD en el archivo .env

### Error: "Unknown database 'echoes_dungeon'"
- ❌ La base de datos no existe
- ✅ Ejecuta el schema: `mysql -u root echoes_dungeon < database/schema_complete_corregido.sql`

### Error: "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR"
- ❌ Pool de conexiones agotado o conexión cerrada
- ✅ Reinicia Node.js o MySQL

---

## Resultado esperado

```
✅ Conexión exitosa a la base de datos

📊 Versión MySQL/MariaDB: 10.4.32-MariaDB

📦 Total de tablas: 37

📑 Tablas en la base de datos:
   1. achievements
   2. active_status_effects
   3. auction_bids
   ... [34 tablas más]

📊 Conteo de registros por tabla:
   races: 10 registros
   classes: 10 registros
   skills: 30 registros
   items: 20 registros
   enemies: 13 registros
   dungeons: 3 registros
   players: 3 registros
   achievements: 10 registros

🎮 Datos de ejemplo:
   Jugadores:
      - Thrain (test_warrior) - Nivel 3
      - Elara (test_mage) - Nivel 3
      - Silas (test_rogue) - Nivel 3
   ...

✅ ¡Todas las pruebas completadas exitosamente!
```

---

## Integración con tu aplicación

Una vez verificada la conexión, puedes usar la configuración en:
- **Sequelize**: `server/config/database.js`
- **Conexión directa**: `server/server.js`

Ejemplo de uso en tu código:
```javascript
const { sequelize } = require('./config/database');

async function startup() {
  try {
    await sequelize.authenticate();
    console.log('✅ Base de datos conectada');
  } catch (error) {
    console.error('❌ Error de conexión:', error);
  }
}
```

---

## Comandos útiles de MySQL

Ver base de datos:
```bash
mysql -u root -e "SHOW DATABASES;"
```

Usar la base de datos echoes_dungeon:
```bash
mysql -u root echoes_dungeon
```

Ver tablas:
```bash
mysql -u root echoes_dungeon -e "SHOW TABLES;"
```

Ver estructura de una tabla:
```bash
mysql -u root echoes_dungeon -e "DESCRIBE players;"
```

Contar registros:
```bash
mysql -u root echoes_dungeon -e "SELECT COUNT(*) as count FROM players;"
```

Ver primeros registros:
```bash
mysql -u root echoes_dungeon -e "SELECT * FROM players LIMIT 3;"
```

---

¡Tu base de datos está lista para usar! 🎮
