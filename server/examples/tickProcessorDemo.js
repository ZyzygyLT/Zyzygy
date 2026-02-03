/**
 * Demostración del Tick Processor
 */

const TickProcessor = require('../engine/tickProcessor');
const TickScheduler = require('../cron/tickScheduler');

async function runDemo() {
    console.log('=== DEMO: TICK PROCESSOR ===\n');
    
    // 1. Demo básica del Tick Processor
    console.log('--- PARTE 1: Tick Processor Básico ---');
    
    const tickProcessor = new TickProcessor();
    tickProcessor.setDebugMode(true);
    
    // Ejecutar tick de prueba
    console.log('\nEjecutando tick de prueba...');
    const testResult = await tickProcessor.executeTestTick();
    
    console.log(`\nResultado del tick de prueba:`);
    console.log(`- Parties procesadas: ${testResult.partiesProcessed}`);
    console.log(`- Batallas ejecutadas: ${testResult.totalBattles}`);
    console.log(`- XP distribuida: ${testResult.totalXpDistributed}`);
    console.log(`- Loot distribuido: ${testResult.totalLootDistributed} oro`);
    console.log(`- Duración: ${testResult.duration}ms`);
    
    // Mostrar detalles de las parties
    console.log('\nDetalles por party:');
    testResult.partyResults.forEach((party, index) => {
        console.log(`\nParty ${index + 1}: ${party.partyName}`);
        console.log(`  Estado: ${party.status}`);
        console.log(`  Batallas: ${party.battles.length}`);
        console.log(`  XP ganada: ${party.totalXp}`);
        console.log(`  Loot valor: ${party.totalLootValue} oro`);
        
        if (party.battles.length > 0) {
            const lastBattle = party.battles[party.battles.length - 1];
            console.log(`  Última batalla: ${lastBattle.outcome} en ${lastBattle.turnCount} turnos`);
        }
    });
    
    // 2. Demo del Scheduler
    console.log('\n\n--- PARTE 2: Tick Scheduler ---');
    
    const scheduler = new TickScheduler();
    
    console.log('Estado inicial del scheduler:');
    console.log(scheduler.getStatus());
    
    // Ejecutar un tick manual
    console.log('\nEjecutando tick manual...');
    const manualResult = await scheduler.executeManualTick();
    
    console.log(`Tick manual completado:`);
    console.log(`- Parties: ${manualResult.partiesProcessed || 0}`);
    console.log(`- Batallas: ${manualResult.totalBattles || 0}`);
    
    // 3. Verificar logs generados
    console.log('\n\n--- PARTE 3: Logs Generados ---');
    
    const fs = require('fs').promises;
    const path = require('path');
    
    const logsDir = path.join(__dirname, '../../combat_logs');
    
    try {
        const files = await fs.readdir(logsDir);
        console.log(`\nArchivos de log encontrados: ${files.length}`);
        
        // Mostrar últimos 3 logs
        const tickLogs = files.filter(f => f.startsWith('tick_')).sort().reverse().slice(0, 3);
        
        console.log('\nÚltimos logs de tick:');
        tickLogs.forEach((logFile, index) => {
            console.log(`  ${index + 1}. ${logFile}`);
        });
        
        // Verificar directorio de parties
        const partiesLogDir = path.join(logsDir, 'parties');
        try {
            const partyLogs = await fs.readdir(partiesLogDir);
            console.log(`\nLogs de parties: ${partyLogs.length} archivos`);
        } catch (error) {
            console.log('\nNo se encontraron logs de parties');
        }
        
        // Verificar directorio de batallas
        const battlesLogDir = path.join(logsDir, 'battles');
        try {
            const battleLogs = await fs.readdir(battlesLogDir);
            console.log(`Logs de batallas: ${battleLogs.length} archivos`);
            
            // Mostrar ejemplo de batalla
            if (battleLogs.length > 0) {
                const exampleBattle = battleLogs[0];
                const battlePath = path.join(battlesLogDir, exampleBattle);
                const battleData = await fs.readFile(battlePath, 'utf8');
                const battle = JSON.parse(battleData);
                
                console.log(`\nEjemplo de batalla: ${battle.battleId}`);
                console.log(`  Resultado: ${battle.outcome}`);
                console.log(`  Turnos: ${battle.turnCount}`);
                console.log(`  Duración: ${battle.duration}ms`);
                
                if (battle.turns && battle.turns.length > 0) {
                    const firstTurn = battle.turns[0];
                    console.log(`  Primer turno: ${firstTurn.actions?.length || 0} acciones`);
                }
            }
        } catch (error) {
            console.log('No se encontraron logs de batallas');
        }
        
    } catch (error) {
        console.log('No se pudo leer directorio de logs:', error.message);
    }
    
    // 4. Simulación de múltiples ticks
    console.log('\n\n--- PARTE 4: Simulación de Múltiples Ticks ---');
    
    console.log('Creando datos para simulación...');
    
    // Crear datos adicionales
    await createSimulationData(tickProcessor);
    
    // Ejecutar 3 ticks secuenciales
    const tickResults = [];
    
    for (let i = 0; i < 3; i++) {
        console.log(`\nEjecutando tick de simulación ${i + 1}...`);
        tickProcessor.setDebugMode(false); // Desactivar debug para velocidad
        
        const startTime = Date.now();
        const result = await tickProcessor.executeTick();
        const duration = Date.now() - startTime;
        
        tickResults.push({
            tick: i + 1,
            parties: result.partiesProcessed,
            battles: result.totalBattles,
            xp: result.totalXpDistributed,
            loot: result.totalLootDistributed,
            duration
        });
        
        console.log(`Tick ${i + 1}: ${result.partiesProcessed} parties, ${duration}ms`);
    }
    
    // Mostrar resumen
    console.log('\nResumen de simulación:');
    console.log('Tick | Parties | Batallas | XP | Loot | Duración');
    console.log('-----|---------|----------|----|------|---------');
    tickResults.forEach(r => {
        const tickLabel = String(r.tick ?? 0).padStart(4);
        const partiesLabel = String(r.parties ?? 0).padStart(7);
        const battlesLabel = String(r.battles ?? 0).padStart(8);
        const xpLabel = String(r.xp ?? 0).padStart(4);
        const lootLabel = String(r.loot ?? 0).padStart(4);
        const durationLabel = String(r.duration ?? 0).padStart(7);
        console.log(`${tickLabel} | ${partiesLabel} | ${battlesLabel} | ${xpLabel} | ${lootLabel} | ${durationLabel}ms`);
    });
    
    const totals = tickResults.reduce((acc, r) => ({
        parties: acc.parties + (r.parties ?? 0),
        battles: acc.battles + (r.battles ?? 0),
        xp: acc.xp + (r.xp ?? 0),
        loot: acc.loot + (r.loot ?? 0),
        duration: acc.duration + (r.duration ?? 0)
    }), { parties: 0, battles: 0, xp: 0, loot: 0, duration: 0 });
    
    console.log('\nTotales:');
    console.log(`- Parties procesadas: ${totals.parties}`);
    console.log(`- Batallas ejecutadas: ${totals.battles}`);
    console.log(`- XP total distribuida: ${totals.xp}`);
    console.log(`- Loot total distribuido: ${totals.loot} oro`);
    console.log(`- Tiempo total: ${totals.duration}ms`);
    console.log(`- Tiempo promedio por tick: ${Math.round(totals.duration / tickResults.length)}ms`);
    
    console.log('\n=== DEMO COMPLETADA ===');
}

/**
 * Crea datos adicionales para simulación
 */
async function createSimulationData(tickProcessor) {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Crear parties adicionales
    const extraParties = [
        {
            id: 'sim_party1',
            name: 'Sim Party Alpha',
            status: 'active',
            location: {
                type: 'dungeon',
                name: 'Sim Dungeon A',
                difficulty: 1,
                size: 5
            },
            members: [
                {
                    id: 'sim_player1',
                    name: 'Sim Warrior',
                    level: 3,
                    hp: 60,
                    maxHp: 70,
                    attack: 15,
                    defense: 8
                }
            ],
            created: new Date().toISOString()
        },
        {
            id: 'sim_party2',
            name: 'Sim Party Beta',
            status: 'active',
            location: {
                type: 'dungeon',
                name: 'Sim Dungeon B',
                difficulty: 4,
                size: 12
            },
            members: [
                {
                    id: 'sim_player2',
                    name: 'Sim Mage',
                    level: 7,
                    hp: 50,
                    maxHp: 65,
                    attack: 10,
                    defense: 4,
                    magic_power: 30
                },
                {
                    id: 'sim_player3',
                    name: 'Sim Healer',
                    level: 5,
                    hp: 55,
                    maxHp: 65,
                    attack: 8,
                    defense: 6
                }
            ],
            created: new Date().toISOString()
        }
    ];
    
    // Guardar parties
    for (const party of extraParties) {
        const partyPath = path.join(tickProcessor.partiesDir, `${party.id}.json`);
        await fs.writeFile(partyPath, JSON.stringify(party, null, 2), 'utf8');
    }
    
    // Crear jugadores asociados a las parties de simulación
    const simPlayers = [
        { id: 'sim_player1', name: 'Sim Warrior', class: 'warrior', level: 3, hp: 60, maxHp: 70, attack: 15, defense: 8, stats: { strength: 6, luck: 1 } },
        { id: 'sim_player2', name: 'Sim Mage', class: 'mage', level: 7, hp: 50, maxHp: 65, attack: 10, defense: 4, magic_power: 30, stats: { intelligence: 12, luck: 2 } },
        { id: 'sim_player3', name: 'Sim Healer', class: 'healer', level: 5, hp: 55, maxHp: 65, attack: 8, defense: 6, stats: { wisdom: 10, luck: 1 } }
    ];

    for (const player of simPlayers) {
        const playerPath = path.join(tickProcessor.playersDir, `${player.id}.json`);
        try {
            await fs.writeFile(playerPath, JSON.stringify(player, null, 2), 'utf8');
        } catch (error) {
            console.log(`Error guardando jugador ${player.id}:`, error.message);
        }
    }
    
    console.log('Datos de simulación creados: 2 parties adicionales');
}

// Ejecutar demo si es llamado directamente
if (require.main === module) {
    runDemo().catch(console.error);
}

module.exports = { runDemo };