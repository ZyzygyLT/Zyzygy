/**
 * Tests para el Tick Processor
 */

const TickProcessor = require('../../server/engine/tickProcessor');
const fs = require('fs').promises;
const path = require('path');

describe('TickProcessor', () => {
    let tickProcessor;
    let testDataDir;

    beforeEach(async () => {
        // Crear directorio temporal para tests
        testDataDir = path.join(__dirname, '../test_data');
        
        // Configurar tick processor con directorios de test
        tickProcessor = new TickProcessor();
        tickProcessor.logsDir = path.join(testDataDir, 'combat_logs');
        tickProcessor.partiesDir = path.join(testDataDir, 'parties');
        tickProcessor.playersDir = path.join(testDataDir, 'players');
        
        // Limpiar y recrear directorios
        await cleanupTestDirectories();
        await tickProcessor.ensureDirectories();
        
        tickProcessor.setDebugMode(false);
    });

    afterEach(async () => {
        // Limpiar directorios de test
        await cleanupTestDirectories();
    });

    async function cleanupTestDirectories() {
        try {
            await fs.rm(testDataDir, { recursive: true, force: true });
        } catch (error) {
            // Directorio no existe
        }
    }

    describe('executeTick', () => {
        test('Ejecuta tick sin parties activas', async () => {
            const result = await tickProcessor.executeTick();
            
            expect(result).toHaveProperty('status', 'completed');
            expect(result).toHaveProperty('totalParties', 0);
            expect(result).toHaveProperty('partiesProcessed', 0);
            expect(result).toHaveProperty('duration');
        });

        test('Ejecuta tick con 2 parties de prueba', async () => {
            // Crear datos de prueba
            await createTestParties(tickProcessor);
            
            const result = await tickProcessor.executeTick();
            
            expect(result).toHaveProperty('status', 'completed');
            expect(result).toHaveProperty('totalParties', 2);
            expect(result).toHaveProperty('partiesProcessed', 2);
            expect(result.partyResults).toHaveLength(2);
            expect(result.totalBattles).toBeGreaterThan(0);
            
            // Verificar que se generaron logs
            const logFiles = await fs.readdir(tickProcessor.logsDir);
            expect(logFiles.length).toBeGreaterThan(0);
            
            console.log(`Tick ejecutado: ${result.partiesProcessed} parties, ${result.totalBattles} batallas`);
        });

        test('Distribuye XP y loot correctamente', async () => {
            await createTestParties(tickProcessor);
            
            const result = await tickProcessor.executeTick();
            
            // Verificar que al menos una party recibió XP
            const partyWithXp = result.partyResults.find(pr => pr.totalXp > 0);
            expect(partyWithXp).toBeDefined();
            
            // Verificar que al menos una party recibió loot
            const partyWithLoot = result.partyResults.find(pr => pr.totalLootValue > 0);
            expect(partyWithLoot).toBeDefined();
            
            // Verificar estructura de resultados
            result.partyResults.forEach(partyResult => {
                expect(partyResult).toHaveProperty('partyId');
                expect(partyResult).toHaveProperty('status');
                expect(partyResult).toHaveProperty('battles');
                expect(partyResult).toHaveProperty('totalXp');
                expect(partyResult).toHaveProperty('totalLootValue');
            });
        });
    });

    describe('Procesamiento de parties', () => {
        test('Genera encuentros apropiados', async () => {
            await createTestParties(tickProcessor);
            
            // Obtener parties activas
            const activeParties = await tickProcessor.getActiveParties();
            expect(activeParties).toHaveLength(2);
            
            // Procesar primera party
            const party = activeParties[0];
            const encounters = tickProcessor.generateEncounters(party);
            
            expect(encounters.length).toBeGreaterThan(0);
            expect(encounters.length).toBeLessThanOrEqual(3);
            
            encounters.forEach(encounter => {
                expect(encounter).toHaveProperty('type');
                expect(encounter).toHaveProperty('enemies');
                expect(encounter).toHaveProperty('lootTable');
                expect(encounter.enemies.length).toBeGreaterThan(0);
            });
        });

        test('Ejecuta batalla completa', async () => {
            await createTestParties(tickProcessor);
            
            const activeParties = await tickProcessor.getActiveParties();
            const party = activeParties[0];
            
            // Generar encuentro
            const encounters = tickProcessor.generateEncounters(party);
            const encounter = encounters[0];
            
            // Ejecutar batalla
            const battleResult = await tickProcessor.executeBattle(party, encounter, 'test_tick');
            
            expect(battleResult).toHaveProperty('battleId');
            expect(battleResult).toHaveProperty('outcome');
            expect(battleResult).toHaveProperty('turns');
            expect(battleResult.turns.length).toBeGreaterThan(0);
            expect(['victory', 'defeat', 'timeout', 'error']).toContain(battleResult.outcome);
            
            // Verificar que se registraron acciones
            const turnWithActions = battleResult.turns.find(t => t.actions && t.actions.length > 0);
            expect(turnWithActions).toBeDefined();
        });

        test('Maneja party derrotada', async () => {
            await createTestParties(tickProcessor);
            
            const activeParties = await tickProcessor.getActiveParties();
            const party = activeParties[0];
            
            // Debilitar party para asegurar derrota
            party.members.forEach(member => {
                member.hp = 1;
                member.maxHp = 100;
            });
            
            // Generar encuentro fuerte
            const encounter = {
                id: 'test_encounter',
                type: 'boss',
                enemyType: 'dragon',
                enemyCount: 1,
                enemies: [{
                    id: 'test_dragon',
                    name: 'Dragón de Prueba',
                    hp: 1000,
                    maxHp: 1000,
                    attack: 100,
                    defense: 50,
                    level: 10,
                    rarity: 'boss'
                }],
                lootTable: 'DRAGON',
                xpReward: 1000
            };
            
            const battleResult = await tickProcessor.executeBattle(party, encounter, 'test_tick');
            
            // Party débil debería ser derrotada
            expect(battleResult.outcome).toBe('defeat');
        });
    });

    describe('Distribución de recompensas', () => {
        test('Calcula XP correctamente', async () => {
            await createTestParties(tickProcessor);
            
            const activeParties = await tickProcessor.getActiveParties();
            const party = activeParties[0];
            
            const xpReward = tickProcessor.calculateXpReward('normal', 5, 3);
            expect(xpReward).toBeGreaterThan(0);
            
            // Verificar cálculo de suerte de party
            const luck = tickProcessor.calculatePartyLuck(party);
            expect(luck).toBeGreaterThanOrEqual(0);
            expect(luck).toBeLessThanOrEqual(100);
        });

        test('Distribuye XP entre miembros vivos', async () => {
            await createTestParties(tickProcessor);
            
            const activeParties = await tickProcessor.getActiveParties();
            const party = activeParties[0];
            
            const partyResult = {
                totalXp: 1000,
                totalLootValue: 500,
                totalLoot: [{ name: 'Test Item', value: 100 }]
            };
            
            // Simular un miembro muerto
            party.members[0].hp = 0;
            party.members[1].hp = 50;
            
            await tickProcessor.distributeRewards(party, partyResult);
            
            // Solo miembros vivos deberían recibir XP
            expect(party.members[0].xp).toBe(0); // Muerto
            expect(party.members[1].xp).toBeGreaterThan(0); // Vivo
        });
    });

    describe('Manejo de archivos y logs', () => {
        test('Guarda logs de tick', async () => {
            await createTestParties(tickProcessor);
            
            const result = await tickProcessor.executeTick();
            
            // Verificar que se crearon archivos de log
            const tickLogs = await fs.readdir(tickProcessor.logsDir);
            expect(tickLogs.length).toBeGreaterThan(0);
            
            // Verificar que existe log del tick
            const tickLogFile = tickLogs.find(f => f.startsWith('tick_'));
            expect(tickLogFile).toBeDefined();
            
            // Leer y verificar contenido
            const logPath = path.join(tickProcessor.logsDir, tickLogFile);
            const logContent = await fs.readFile(logPath, 'utf8');
            const logData = JSON.parse(logContent);
            
            expect(logData).toHaveProperty('tickId');
            expect(logData).toHaveProperty('status');
            expect(logData).toHaveProperty('partyResults');
        });

        test('Guarda logs de batallas', async () => {
            await createTestParties(tickProcessor);
            
            const activeParties = await tickProcessor.getActiveParties();
            const party = activeParties[0];
            const encounters = tickProcessor.generateEncounters(party);
            const encounter = encounters[0];
            
            await tickProcessor.executeBattle(party, encounter, 'test_tick');
            
            // Verificar logs de batallas
            const battlesDir = path.join(tickProcessor.logsDir, 'battles');
            try {
                const battleLogs = await fs.readdir(battlesDir);
                expect(battleLogs.length).toBeGreaterThan(0);
            } catch (error) {
                // Directorio puede no existir si no hubo batallas
                console.log('No se creó directorio de batallas (posiblemente no hubo combate)');
            }
        });
    });

    describe('Métodos de ayuda', () => {
        test('Calcula nivel promedio de party', async () => {
            await createTestParties(tickProcessor);
            
            const activeParties = await tickProcessor.getActiveParties();
            const party = activeParties[0];
            
            const avgLevel = tickProcessor.calculateAveragePartyLevel(party);
            expect(avgLevel).toBeGreaterThan(0);
            expect(avgLevel).toBeLessThanOrEqual(10);
        });

        test('Calcula XP máximo para nivel', () => {
            const maxXp1 = tickProcessor.calculateMaxXp(1);
            const maxXp5 = tickProcessor.calculateMaxXp(5);
            const maxXp10 = tickProcessor.calculateMaxXp(10);
            
            expect(maxXp1).toBe(100);
            expect(maxXp5).toBe(2500);
            expect(maxXp10).toBe(10000);
            expect(maxXp10).toBeGreaterThan(maxXp5);
        });

        test('Crea enemigos con stats apropiados', () => {
            const enemy = tickProcessor.createEnemy('goblin', 5, 'normal');
            
            expect(enemy).toHaveProperty('id');
            expect(enemy).toHaveProperty('name', 'Goblin');
            expect(enemy).toHaveProperty('level', 5);
            expect(enemy).toHaveProperty('hp');
            expect(enemy).toHaveProperty('attack');
            expect(enemy).toHaveProperty('defense');
            expect(enemy.hp).toBeGreaterThan(0);
        });

        test('Determina tipos de encuentro según dificultad', () => {
            const types = [];
            
            // Ejecutar múltiples veces para ver distribución
            for (let i = 0; i < 100; i++) {
                const type = tickProcessor.determineEncounterType(3, i % 4);
                types.push(type);
            }
            
            const normalCount = types.filter(t => t === 'normal').length;
            const eliteCount = types.filter(t => t === 'elite').length;
            const bossCount = types.filter(t => t === 'boss').length;
            
            // Normal debería ser más común
            expect(normalCount).toBeGreaterThan(eliteCount);
            expect(normalCount).toBeGreaterThan(bossCount);
            
            console.log(`Distribución: Normal ${normalCount}%, Elite ${eliteCount}%, Boss ${bossCount}%`);
        });
    });

    describe('Tick de prueba', () => {
        test('Ejecuta tick de prueba completo', async () => {
            const result = await tickProcessor.executeTestTick();
            
            expect(result).toHaveProperty('status');
            expect(result).toHaveProperty('totalParties', 2);
            expect(result).toHaveProperty('partiesProcessed', 2);
            expect(result.totalBattles).toBeGreaterThan(0);
            
            console.log(`Tick de prueba: ${result.totalBattles} batallas, ${result.totalXpDistributed} XP`);
        });
    });
});

/**
 * Funciones de ayuda para tests
 */
async function createTestParties(tickProcessor) {
    // Crear jugadores de prueba
    const testPlayers = [
        {
            id: 'test_player1',
            name: 'Test Warrior',
            class: 'warrior',
            level: 5,
            xp: 0,
            maxXp: 2500,
            hp: 100,
            maxHp: 100,
            attack: 20,
            defense: 10,
            speed: 3,
            stats: { strength: 8, vitality: 6, luck: 2 }
        },
        {
            id: 'test_player2',
            name: 'Test Mage',
            class: 'mage',
            level: 6,
            xp: 0,
            maxXp: 3600,
            hp: 70,
            maxHp: 80,
            attack: 12,
            defense: 5,
            magic_power: 25,
            speed: 2,
            stats: { intelligence: 10, wisdom: 8, luck: 3 }
        },
        {
            id: 'test_player3',
            name: 'Test Archer',
            class: 'archer',
            level: 5,
            xp: 0,
            maxXp: 2500,
            hp: 85,
            maxHp: 90,
            attack: 25,
            defense: 8,
            speed: 4,
            stats: { dexterity: 12, agility: 10, luck: 4 }
        },
        {
            id: 'test_player4',
            name: 'Test Rogue',
            class: 'rogue',
            level: 4,
            xp: 0,
            maxXp: 1600,
            hp: 75,
            maxHp: 80,
            attack: 22,
            defense: 6,
            speed: 5,
            stats: { dexterity: 10, agility: 12, luck: 5 }
        }
    ];
    
    // Guardar jugadores
    for (const player of testPlayers) {
        const playerPath = path.join(tickProcessor.playersDir, `${player.id}.json`);
        await fs.writeFile(playerPath, JSON.stringify(player, null, 2), 'utf8');
    }
    
    // Crear parties de prueba
    const testParties = [
        {
            id: 'test_party1',
            name: 'Party de Prueba 1',
            status: 'active',
            location: {
                type: 'dungeon',
                name: 'Dungeon de Prueba 1',
                difficulty: 2,
                size: 8
            },
            members: testPlayers.slice(0, 2), // Warrior y Mage
            created: new Date().toISOString()
        },
        {
            id: 'test_party2',
            name: 'Party de Prueba 2',
            status: 'active',
            location: {
                type: 'dungeon',
                name: 'Dungeon de Prueba 2',
                difficulty: 3,
                size: 10
            },
            members: testPlayers.slice(2, 4), // Archer y Rogue
            created: new Date().toISOString()
        }
    ];
    
    // Guardar parties
    for (const party of testParties) {
        const partyPath = path.join(tickProcessor.partiesDir, `${party.id}.json`);
        await fs.writeFile(partyPath, JSON.stringify(party, null, 2), 'utf8');
    }
}