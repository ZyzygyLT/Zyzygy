#!/usr/bin/env node

/**
 * Test Database Connection Script (mysql2/promise)
 * Verifica la conexión directa con MySQL usando mysql2/promise
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('\n🔍 Iniciando prueba de conexión (mysql2/promise)...\n');
  console.log('📋 Configuración:');
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   Port: ${process.env.DB_PORT}`);
  console.log(`   Base de datos: ${process.env.DB_NAME}`);
  console.log(`   Usuario: ${process.env.DB_USER}`);
  console.log('\n');

  let connection;

  try {
    // Crear conexión
    console.log('⏳ Probando conexión...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: 'utf8mb4'
    });

    console.log('✅ Conexión exitosa a la base de datos\n');

    // Obtener versión
    const [versionResult] = await connection.query('SELECT VERSION() as version');
    console.log(`📊 Versión MySQL/MariaDB: ${versionResult[0].version}\n`);

    // Contar tablas
    const [tableCountResult] = await connection.query(
      "SELECT COUNT(*) as count FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?",
      [process.env.DB_NAME]
    );
    console.log(`📦 Total de tablas: ${tableCountResult[0].count}\n`);

    // Listar tablas
    const [tableListResult] = await connection.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME",
      [process.env.DB_NAME]
    );
    console.log('📑 Tablas en la base de datos:');
    tableListResult.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.TABLE_NAME}`);
    });

    // Conteo de datos
    console.log('\n📊 Conteo de registros por tabla:');
    const tables = [
      'races', 'classes', 'skills', 'items', 'enemies', 'dungeons', 'players', 'achievements'
    ];

    for (const tableName of tables) {
      try {
        const [result] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`   ${tableName}: ${result[0].count} registros`);
      } catch (err) {
        console.log(`   ${tableName}: Error al contar`);
      }
    }

    // Datos de ejemplo
    console.log('\n🎮 Datos de ejemplo:');
    
    const [players] = await connection.query(
      'SELECT username, character_name, level FROM players LIMIT 3'
    );
    console.log('   Jugadores:');
    players.forEach(player => {
      console.log(`      - ${player.character_name} (${player.username}) - Nivel ${player.level}`);
    });

    const [races] = await connection.query(
      'SELECT name, description FROM races LIMIT 3'
    );
    console.log('   Razas:');
    races.forEach(race => {
      console.log(`      - ${race.name}`);
    });

    const [enemies] = await connection.query(
      'SELECT name, level, threat_level FROM enemies LIMIT 5'
    );
    console.log('   Enemigos:');
    enemies.forEach(enemy => {
      console.log(`      - ${enemy.name} (Lvl ${enemy.level}) - ${enemy.threat_level}`);
    });

    console.log('\n✅ ¡Todas las pruebas completadas exitosamente!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error de conexión:', error.message);
    console.error('\n📌 Posibles causas:');
    console.error('   1. MySQL/MariaDB no está ejecutándose');
    console.error('   2. Credenciales incorrectas en .env');
    console.error('   3. Base de datos "echoes_dungeon" no existe');
    console.error('   4. Error de red/firewall');
    console.error('   5. Puerto incorrecto (3306)\n');
    process.exit(1);

  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testConnection();
