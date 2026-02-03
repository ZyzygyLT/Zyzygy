#!/usr/bin/env node

/**
 * Test Database Connection Script
 * Verifica la conexión a la base de datos MySQL usando Sequelize
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: console.log,
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  }
);

async function testConnection() {
  console.log('\n🔍 Iniciando prueba de conexión...\n');
  console.log('📋 Configuración:');
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   Port: ${process.env.DB_PORT}`);
  console.log(`   Base de datos: ${process.env.DB_NAME}`);
  console.log(`   Usuario: ${process.env.DB_USER}`);
  console.log('\n');

  try {
    // Prueba de conexión
    console.log('⏳ Probando conexión...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa a la base de datos\n');

    // Obtener información del servidor
    const result = await sequelize.query('SELECT VERSION() as version');
    console.log(`📊 Versión MySQL/MariaDB: ${result[0][0].version}\n`);

    // Contar tablas
    const tables = await sequelize.query(
      "SELECT COUNT(*) as count FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?",
      {
        replacements: [process.env.DB_NAME],
        type: Sequelize.QueryTypes.SELECT
      }
    );
    console.log(`📦 Total de tablas: ${tables[0].count}\n`);

    // Listar todas las tablas
    const tableList = await sequelize.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME",
      {
        replacements: [process.env.DB_NAME],
        type: Sequelize.QueryTypes.SELECT
      }
    );
    console.log('📑 Tablas en la base de datos:');
    tableList.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.TABLE_NAME}`);
    });

    // Conteo de datos por tabla
    console.log('\n📊 Conteo de registros por tabla:');
    const dataCounts = [
      'races',
      'classes',
      'skills',
      'items',
      'enemies',
      'dungeons',
      'players',
      'achievements'
    ];

    for (const tableName of dataCounts) {
      try {
        const count = await sequelize.query(
          `SELECT COUNT(*) as count FROM ${tableName}`,
          { type: Sequelize.QueryTypes.SELECT }
        );
        console.log(`   ${tableName}: ${count[0].count} registros`);
      } catch (err) {
        console.log(`   ${tableName}: Error al contar`);
      }
    }

    // Prueba de una consulta más compleja
    console.log('\n🎮 Datos de ejemplo:');
    const players = await sequelize.query(
      'SELECT username, character_name, level FROM players LIMIT 3',
      { type: Sequelize.QueryTypes.SELECT }
    );
    console.log('   Jugadores:');
    players.forEach(player => {
      console.log(`      - ${player.character_name} (${player.username}) - Nivel ${player.level}`);
    });

    const races = await sequelize.query(
      'SELECT name FROM races LIMIT 5',
      { type: Sequelize.QueryTypes.SELECT }
    );
    console.log('   Razas:');
    races.forEach(race => {
      console.log(`      - ${race.name}`);
    });

    console.log('\n✅ ¡Todas las pruebas completadas exitosamente!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error de conexión:', error.message);
    console.error('\n📌 Posibles causas:');
    console.error('   1. MySQL/MariaDB no está ejecutándose');
    console.error('   2. Credenciales incorrectas en .env');
    console.error('   3. Base de datos no existe');
    console.error('   4. Error de red/firewall\n');
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

testConnection();
