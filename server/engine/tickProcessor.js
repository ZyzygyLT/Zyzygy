/**
 * Tick Processor - Orquestador maestro del sistema de combate
 * Ejecuta combates, distribuye loot y XP para todas las parties activas
 */

const fs = require('fs').promises;
const path = require('path');
const CombatSystem = require('./combatResolver');
const { LootGenerator } = require('./lootGenerator');
const TacticsProcessor = require('./tacticsProcessor');

class TickProcessor {
    constructor() {
        this.combatSystem = new CombatSystem();
        this.lootGenerator = new LootGenerator();
        this.tacticsProcessor = new TacticsProcessor();
        
        // Directorios para logs
        this.logsDir = path.join(__dirname, '../../combat_logs');
        this.partiesDir = path.join(__dirname, '../../data/parties');
        this.playersDir = path.join(__dirname, '../../data/players');
        
        this.ensureDirectories();
        this.tickCount = 0;
        this.debugMode = false;
    }

    /**
     * Asegura que los directorios necesarios existan
     */
    async ensureDirectories() {
        const directories = [this.logsDir, this.partiesDir, this.playersDir];
        
        for (const dir of directories) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                console.error(`Error creando directorio ${dir}:`, error);
            }
        }
    }

    /**
     * Ejecuta un tick completo del sistema
     * @returns {Object} Resultado del tick
     */
    async executeTick() {
        const tickId = Date.now();
        const tickStart = Date.now();
        
        console.log(`=== EJECUTANDO TICK #${this.tickCount + 1} (ID: ${tickId}) ===`);
        
        try {
            // 1. Obtener todas las parties activas en dungeons
            const activeParties = await this.getActiveParties();
            
            if (activeParties.length === 0) {
                console.log('No hay parties activas en dungeons');
                const duration = Date.now() - tickStart;
                return {
                    tickId,
                    timestamp: new Date().toISOString(),
                    status: 'completed',
                    message: 'No active parties found',
                    totalParties: 0,
                    partiesProcessed: 0,
                    duration: duration,
                    partyResults: []
                };
            }
            
            console.log(`Procesando ${activeParties.length} parties activas`);
            
            // 2. Procesar cada party
            const tickResults = {
                tickId,
                timestamp: new Date().toISOString(),
                totalParties: activeParties.length,
                partiesProcessed: 0,
                partiesCompleted: 0,
                totalBattles: 0,
                totalXpDistributed: 0,
                totalLootDistributed: 0,
                partyResults: [],
                errors: []
            };
            
            for (const party of activeParties) {
                try {
                    const partyResult = await this.processParty(party, tickId);
                    tickResults.partyResults.push(partyResult);
                    tickResults.partiesProcessed++;
                    
                    if (partyResult.status === 'completed') {
                        tickResults.partiesCompleted++;
                    }
                    
                    tickResults.totalBattles += partyResult.battles.length || 0;
                    tickResults.totalXpDistributed += partyResult.totalXp || 0;
                    tickResults.totalLootDistributed += partyResult.totalLootValue || 0;
                    
                } catch (error) {
                    console.error(`Error procesando party ${party.id}:`, error);
                    tickResults.errors.push({
                        partyId: party.id,
                        error: error.message,
                        stack: error.stack
                    });
                }
            }
            
            // 3. Guardar log del tick
            tickResults.duration = Date.now() - tickStart;
            tickResults.status = 'completed';
            
            await this.saveTickLog(tickResults);
            
            // 4. Limpiar parties completadas
            await this.cleanupCompletedParties(tickResults.partyResults);
            
            // 5. Incrementar contador
            this.tickCount++;
            
            console.log(`=== TICK COMPLETADO EN ${tickResults.duration}ms ===`);
            console.log(`Parties procesadas: ${tickResults.partiesProcessed}`);
            console.log(`Batallas ejecutadas: ${tickResults.totalBattles}`);
            console.log(`XP distribuida: ${tickResults.totalXpDistributed}`);
            console.log(`Valor de loot: ${tickResults.totalLootDistributed}`);
            
            return tickResults;
            
        } catch (error) {
            console.error('Error crítico en executeTick:', error);
            
            const errorResult = {
                tickId,
                timestamp: new Date().toISOString(),
                status: 'error',
                error: error.message,
                stack: error.stack,
                duration: Date.now() - tickStart
            };
            
            await this.saveTickLog(errorResult);
            throw error;
        }
    }

    /**
     * Obtiene todas las parties activas en dungeons
     * @returns {Array} Array de parties activas
     */
    async getActiveParties() {
        try {
            const files = await fs.readdir(this.partiesDir);
            const activeParties = [];
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(this.partiesDir, file);
                    try {
                        const data = await fs.readFile(filePath, 'utf8');
                        const party = JSON.parse(data);
                        
                        // Verificar que la party esté activa y en dungeon
                        if (party.status === 'active' && party.location?.type === 'dungeon') {
                            // Cargar datos completos de los jugadores
                            await this.enrichPartyWithPlayerData(party);
                            activeParties.push(party);
                        }
                        
                    } catch (error) {
                        console.error(`Error leyendo archivo de party ${file}:`, error);
                    }
                }
            }
            
            return activeParties;
            
        } catch (error) {
            console.error('Error obteniendo parties activas:', error);
            return [];
        }
    }

    /**
     * Enriquece la party con datos completos de los jugadores
     */
    async enrichPartyWithPlayerData(party) {
        if (!party.members || !Array.isArray(party.members)) {
            party.members = [];
            return;
        }
        
        for (const member of party.members) {
            try {
                const playerFilePath = path.join(this.playersDir, `${member.id}.json`);
                const playerData = await fs.readFile(playerFilePath, 'utf8');
                const player = JSON.parse(playerData);
                
                // Combinar datos básicos con datos completos del jugador
                Object.assign(member, {
                    class: player.class,
                    level: player.level,
                    xp: player.xp,
                    maxXp: player.maxXp || this.calculateMaxXp(player.level),
                    stats: player.stats,
                    equipment: player.equipment,
                    inventory: player.inventory,
                    skills: player.skills || []
                });
                
            } catch (error) {
                console.error(`Error cargando datos de jugador ${member.id}:`, error);
            }
        }
    }

    /**
     * Procesa una party completa
     */
    async processParty(party, tickId) {
        console.log(`Procesando party: ${party.name} (ID: ${party.id})`);
        
        const partyResult = {
            partyId: party.id,
            partyName: party.name,
            dungeon: party.location?.name || 'Unknown',
            status: 'processing',
            battles: [],
            totalXp: 0,
            totalLoot: [],
            totalLootValue: 0,
            membersUpdated: [],
            startTime: new Date().toISOString()
        };
        
        try {
            // 1. Generar encuentros basados en el dungeon
            const encounters = this.generateEncounters(party);
            
            if (encounters.length === 0) {
                partyResult.status = 'no_encounters';
                partyResult.endTime = new Date().toISOString();
                return partyResult;
            }
            
            // 2. Ejecutar cada encuentro
            for (const encounter of encounters) {
                try {
                    const battleResult = await this.executeBattle(party, encounter, tickId);
                    partyResult.battles.push(battleResult);
                    
                    // Acumular XP y loot
                    partyResult.totalXp += battleResult.xpEarned || 0;
                    partyResult.totalLootValue += battleResult.lootValue || 0;
                    
                    // Agregar loot a la lista
                    if (battleResult.loot && battleResult.loot.length > 0) {
                        partyResult.totalLoot.push(...battleResult.loot);
                    }
                    
                    // Verificar si la party fue derrotada
                    if (battleResult.outcome === 'defeat') {
                        partyResult.status = 'defeated';
                        partyResult.defeatReason = 'Party defeated in battle';
                        break;
                    }
                    
                    // Verificar si quedan miembros vivos
                    const aliveMembers = party.members.filter(m => m.hp > 0);
                    if (aliveMembers.length === 0) {
                        partyResult.status = 'wiped';
                        partyResult.defeatReason = 'All party members defeated';
                        break;
                    }
                    
                } catch (error) {
                    console.error(`Error en encuentro para party ${party.id}:`, error);
                    partyResult.battles.push({
                        error: error.message,
                        encounter: encounter.type
                    });
                }
            }
            
            // 3. Si la party sobrevivió todos los encuentros
            if (partyResult.status === 'processing') {
                partyResult.status = 'completed';
                
                // Distribuir XP y loot a los jugadores
                await this.distributeRewards(party, partyResult);
                
                // Actualizar progreso en el dungeon
                await this.updatePartyProgress(party, partyResult);
                
                // Guardar estados actualizados de los jugadores
                await this.saveUpdatedPlayers(party);
                
                // Marcar miembros actualizados
                party.members.forEach(member => {
                    partyResult.membersUpdated.push({
                        id: member.id,
                        name: member.name,
                        level: member.level,
                        xp: member.xp,
                        hp: member.hp,
                        maxHp: member.maxHp
                    });
                });
            }
            
        } catch (error) {
            console.error(`Error procesando party ${party.id}:`, error);
            partyResult.status = 'error';
            partyResult.error = error.message;
        }
        
        partyResult.endTime = new Date().toISOString();
        partyResult.duration = new Date(partyResult.endTime) - new Date(partyResult.startTime);
        
        // Guardar log específico de la party
        await this.savePartyLog(partyResult, tickId);
        
        return partyResult;
    }

    /**
     * Genera encuentros basados en la party y dungeon
     */
    generateEncounters(party) {
        const dungeonDifficulty = party.location?.difficulty || 1;
        const partyLevel = this.calculateAveragePartyLevel(party);
        const encounters = [];
        
        // Determinar cantidad de encuentros (1-3)
        const encounterCount = Math.min(3, Math.max(1, Math.floor(dungeonDifficulty / 2)));
        
        for (let i = 0; i < encounterCount; i++) {
            const encounterType = this.determineEncounterType(dungeonDifficulty, i);
            const encounter = this.createEncounter(encounterType, partyLevel, dungeonDifficulty);
            encounters.push(encounter);
        }
        
        if (this.debugMode) {
            console.log(`Generados ${encounters.length} encuentros para party nivel ${partyLevel}`);
        }
        
        return encounters;
    }

    /**
     * Determina el tipo de encuentro
     */
    determineEncounterType(difficulty, index) {
        const types = ['normal', 'normal', 'elite', 'boss'];
        const weights = [
            [70, 25, 5, 0],   // Dificultad 1
            [60, 30, 8, 2],   // Dificultad 2
            [50, 35, 12, 3],  // Dificultad 3
            [40, 40, 15, 5],  // Dificultad 4
            [30, 45, 20, 5],  // Dificultad 5
        ];
        
        const difficultyIndex = Math.min(difficulty - 1, weights.length - 1);
        const typeWeights = weights[difficultyIndex] || weights[0];
        
        // Usar índice para variar tipos en un mismo tick
        const adjustedWeights = typeWeights.map((w, idx) => 
            idx === index % typeWeights.length ? w * 1.5 : w
        );
        
        const total = adjustedWeights.reduce((a, b) => a + b, 0);
        let roll = Math.random() * total;
        
        for (let i = 0; i < adjustedWeights.length; i++) {
            if (roll < adjustedWeights[i]) {
                return types[i];
            }
            roll -= adjustedWeights[i];
        }
        
        return types[0];
    }

    /**
     * Crea un encuentro específico
     */
    createEncounter(type, partyLevel, difficulty) {
        const baseEnemies = {
            normal: ['goblin', 'skeleton', 'spider', 'wolf'],
            elite: ['orc_warrior', 'dark_knight', 'ogre', 'troll'],
            boss: ['dragon', 'lich', 'demon', 'behemoth']
        };
        
        const enemyType = type === 'normal' ? 'normal' : 
                         type === 'elite' ? 'elite' : 'boss';
        
        const enemyTemplates = baseEnemies[enemyType] || baseEnemies.normal;
        const enemyName = enemyTemplates[Math.floor(Math.random() * enemyTemplates.length)];
        
        // Calcular nivel de enemigos basado en party level y dificultad
        const enemyLevel = Math.max(1, partyLevel + (difficulty - 1) * 2);
        
        // Cantidad de enemigos
        let enemyCount;
        switch (type) {
            case 'boss':
                enemyCount = 1;
                break;
            case 'elite':
                enemyCount = 1 + Math.floor(Math.random() * 2);
                break;
            default:
                enemyCount = 2 + Math.floor(Math.random() * 3);
        }
        
        // Crear enemigos
        const enemies = [];
        for (let i = 0; i < enemyCount; i++) {
            enemies.push(this.createEnemy(enemyName, enemyLevel, type));
        }
        
        // Determinar loot table
        let lootTable;
        switch (type) {
            case 'boss':
                lootTable = 'DRAGON';
                break;
            case 'elite':
                lootTable = 'ORC_CHIEFTAIN';
                break;
            default:
                lootTable = 'GOBLIN';
        }
        
        return {
            id: `encounter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            enemyType: enemyName,
            enemyCount,
            enemies,
            lootTable,
            difficulty: this.calculateEncounterDifficulty(type, enemyLevel, enemyCount),
            xpReward: this.calculateXpReward(type, enemyLevel, enemyCount)
        };
    }

    /**
     * Crea un enemigo individual
     */
    createEnemy(type, level, rarity = 'normal') {
        const baseStats = {
            goblin: { attack: 5, defense: 2, hp: 20, speed: 3 },
            skeleton: { attack: 4, defense: 3, hp: 25, speed: 2 },
            spider: { attack: 3, defense: 1, hp: 15, speed: 4 },
            wolf: { attack: 6, defense: 1, hp: 18, speed: 5 },
            orc_warrior: { attack: 12, defense: 6, hp: 50, speed: 2 },
            dark_knight: { attack: 15, defense: 10, hp: 60, speed: 1 },
            ogre: { attack: 20, defense: 8, hp: 80, speed: 1 },
            troll: { attack: 18, defense: 5, hp: 70, speed: 2, regeneration: 5 },
            dragon: { attack: 40, defense: 20, hp: 200, speed: 3, fire_breath: 25 },
            lich: { attack: 25, defense: 12, hp: 100, speed: 2, magic_power: 30 },
            demon: { attack: 35, defense: 15, hp: 150, speed: 4 },
            behemoth: { attack: 45, defense: 25, hp: 250, speed: 1 }
        };
        
        const base = baseStats[type] || baseStats.goblin;
        const rarityMultiplier = {
            normal: 1.0,
            elite: 1.8,
            boss: 3.0
        }[rarity] || 1.0;
        
        const levelMultiplier = 1 + (level - 1) * 0.1;
        
        const stats = {};
        for (const [stat, value] of Object.entries(base)) {
            stats[stat] = Math.floor(value * rarityMultiplier * levelMultiplier);
        }
        
        return {
            id: `enemy_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            name: this.getEnemyDisplayName(type, rarity),
            type,
            level,
            rarity,
            hp: stats.hp,
            maxHp: stats.hp,
            attack: stats.attack,
            defense: stats.defense,
            speed: stats.speed,
            ...stats
        };
    }

    /**
     * Obtiene nombre de visualización para enemigo
     */
    getEnemyDisplayName(type, rarity) {
        const names = {
            goblin: 'Goblin',
            skeleton: 'Esqueleto',
            spider: 'Araña Gigante',
            wolf: 'Lobo Salvaje',
            orc_warrior: 'Guerrero Orco',
            dark_knight: 'Caballero Oscuro',
            ogre: 'Ogro',
            troll: 'Troll',
            dragon: 'Dragón',
            lich: 'Lich',
            demon: 'Demonio',
            behemoth: 'Behemoth'
        };
        
        const baseName = names[type] || type;
        
        switch (rarity) {
            case 'elite':
                return `${baseName} Élite`;
            case 'boss':
                return `${baseName} Anciano`;
            default:
                return baseName;
        }
    }

    /**
     * Ejecuta una batalla completa
     */
    async executeBattle(party, encounter, tickId) {
        const battleId = `battle_${tickId}_${encounter.id}`;
        const battleStart = Date.now();
        
        console.log(`Iniciando batalla: ${encounter.type} con ${encounter.enemyCount} enemigos`);
        
        const battleResult = {
            battleId,
            encounterId: encounter.id,
            encounterType: encounter.type,
            enemyType: encounter.enemyType,
            enemyCount: encounter.enemyCount,
            startTime: new Date().toISOString(),
            turns: [],
            outcome: 'unknown',
            xpEarned: 0,
            loot: [],
            lootValue: 0,
            partyMembers: [],
            enemies: []
        };
        
        try {
            // Registrar estado inicial
            battleResult.partyMembers = party.members.map(m => ({
                id: m.id,
                name: m.name,
                hp: m.hp,
                maxHp: m.maxHp,
                level: m.level
            }));
            
            battleResult.enemies = encounter.enemies.map(e => ({
                id: e.id,
                name: e.name,
                hp: e.hp,
                maxHp: e.maxHp,
                level: e.level,
                rarity: e.rarity
            }));
            
            // Ejecutar combate por turnos
            let turn = 1;
            let partyAlive = true;
            let enemiesAlive = true;
            
            while (partyAlive && enemiesAlive && turn <= 50) { // Límite de 50 turnos
                const turnResult = await this.executeCombatTurn(party, encounter, turn);
                battleResult.turns.push(turnResult);
                
                // Verificar estado de la party
                const aliveMembers = party.members.filter(m => m.hp > 0);
                partyAlive = aliveMembers.length > 0;
                
                // Verificar estado de los enemigos
                const aliveEnemies = encounter.enemies.filter(e => e.hp > 0);
                enemiesAlive = aliveEnemies.length > 0;
                
                // Registrar baja de enemigos
                if (turnResult.enemiesDefeated && turnResult.enemiesDefeated.length > 0) {
                    battleResult.enemiesDefeated = battleResult.enemiesDefeated || [];
                    battleResult.enemiesDefeated.push(...turnResult.enemiesDefeated);
                }
                
                turn++;
                
                // Pausa para no sobrecargar (solo en debug)
                if (this.debugMode && turn % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }
            
            // Determinar resultado
            if (!partyAlive) {
                battleResult.outcome = 'defeat';
                battleResult.defeatReason = 'All party members defeated';
            } else if (!enemiesAlive) {
                battleResult.outcome = 'victory';
                
                // Calcular XP
                battleResult.xpEarned = encounter.xpReward;
                
                // Generar loot
                const luck = this.calculatePartyLuck(party);
                const loot = this.lootGenerator.generateLoot(encounter.lootTable, luck);
                battleResult.loot = loot.items;
                battleResult.lootValue = loot.gold;
                battleResult.lootDetails = loot;
                
                // Aplicar daño persistente (10% de HP máximo)
                party.members.forEach(member => {
                    if (member.hp > 0) {
                        const damage = Math.floor(member.maxHp * 0.1);
                        member.hp = Math.max(1, member.hp - damage);
                    }
                });
                
            } else {
                battleResult.outcome = 'timeout';
                battleResult.defeatReason = 'Battle exceeded maximum turns';
            }
            
        } catch (error) {
            console.error(`Error en batalla ${battleId}:`, error);
            battleResult.outcome = 'error';
            battleResult.error = error.message;
        }
        
        battleResult.endTime = new Date().toISOString();
        battleResult.duration = Date.now() - battleStart;
        battleResult.turnCount = battleResult.turns.length;
        
        // Guardar log de batalla
        await this.saveBattleLog(battleResult, tickId);
        
        return battleResult;
    }

    /**
     * Ejecuta un turno de combate
     */
    async executeCombatTurn(party, encounter, turnNumber) {
        const turnResult = {
            turn: turnNumber,
            actions: [],
            damageDealt: { party: 0, enemies: 0 },
            heals: { party: 0, enemies: 0 },
            enemiesDefeated: []
        };
        
        // Ordenar por velocidad (party + enemigos mezclados)
        const allCombatants = [
            ...party.members.filter(m => m.hp > 0).map(m => ({ ...m, type: 'party' })),
            ...encounter.enemies.filter(e => e.hp > 0).map(e => ({ ...e, type: 'enemy' }))
        ];
        
        allCombatants.sort((a, b) => (b.speed || 1) - (a.speed || 1));
        
        // Ejecutar acciones por orden de velocidad
        for (const combatant of allCombatants) {
            if (combatant.hp <= 0) continue;
            
            let action;
            if (combatant.type === 'party') {
                action = await this.executePlayerAction(combatant, party, encounter, turnNumber);
            } else {
                action = await this.executeEnemyAction(combatant, party, encounter, turnNumber);
            }
            
            if (action) {
                turnResult.actions.push(action);
                
                // Registrar daño y curaciones
                if (action.damage) {
                    if (action.targetType === 'enemy') {
                        turnResult.damageDealt.party += action.damage;
                    } else {
                        turnResult.damageDealt.enemies += action.damage;
                    }
                }
                
                if (action.heal) {
                    if (action.sourceType === 'party') {
                        turnResult.heals.party += action.heal;
                    } else {
                        turnResult.heals.enemies += action.heal;
                    }
                }
                
                // Registrar enemigos derrotados
                if (action.defeated && action.targetType === 'enemy') {
                    turnResult.enemiesDefeated.push({
                        enemyId: action.targetId,
                        enemyName: action.targetName,
                        killedBy: action.sourceName,
                        turn: turnNumber
                    });
                }
            }
        }
        
        // Verificar estado después del turno
        turnResult.partyStatus = party.members.map(m => ({
            id: m.id,
            name: m.name,
            hp: m.hp,
            maxHp: m.maxHp
        }));
        
        turnResult.enemyStatus = encounter.enemies.filter(e => e.hp > 0).map(e => ({
            id: e.id,
            name: e.name,
            hp: e.hp,
            maxHp: e.maxHp
        }));
        
        return turnResult;
    }

    /**
     * Ejecuta acción de jugador
     */
    async executePlayerAction(player, party, encounter, turnNumber) {
        // Encontrar objetivo
        const aliveEnemies = encounter.enemies.filter(e => e.hp > 0);
        if (aliveEnemies.length === 0) return null;
        
        // Seleccionar objetivo (estrategia simple: atacar al más débil)
        const target = aliveEnemies.reduce((weakest, enemy) => 
            (enemy.hp / enemy.maxHp) < (weakest.hp / weakest.maxHp) ? enemy : weakest
        );
        
        // Calcular daño
        const baseDamage = player.attack || 5;
        const defenseReduction = (target.defense || 1) * 0.1;
        const damage = Math.max(1, Math.floor(baseDamage - defenseReduction));
        
        // Aplicar daño
        target.hp = Math.max(0, target.hp - damage);
        
        const defeated = target.hp === 0;
        
        return {
            sourceId: player.id,
            sourceName: player.name,
            sourceType: 'party',
            action: 'attack',
            targetId: target.id,
            targetName: target.name,
            targetType: 'enemy',
            damage,
            defeated,
            turn: turnNumber,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Ejecuta acción de enemigo
     */
    async executeEnemyAction(enemy, party, encounter, turnNumber) {
        // Encontrar objetivo vivo
        const alivePlayers = party.members.filter(p => p.hp > 0);
        if (alivePlayers.length === 0) return null;
        
        // Seleccionar objetivo (ataque aleatorio)
        const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
        
        // Calcular daño
        const baseDamage = enemy.attack || 3;
        const defenseReduction = (target.defense || 1) * 0.1;
        const damage = Math.max(1, Math.floor(baseDamage - defenseReduction));
        
        // Aplicar daño
        target.hp = Math.max(0, target.hp - damage);
        
        const defeated = target.hp === 0;
        
        return {
            sourceId: enemy.id,
            sourceName: enemy.name,
            sourceType: 'enemy',
            action: 'attack',
            targetId: target.id,
            targetName: target.name,
            targetType: 'party',
            damage,
            defeated,
            turn: turnNumber,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Distribuye recompensas a la party
     */
    async distributeRewards(party, partyResult) {
        if (!partyResult.totalXp && !partyResult.totalLootValue) {
            return;
        }
        
        // Distribuir XP
        if (partyResult.totalXp > 0) {
            const xpPerMember = Math.floor(partyResult.totalXp / party.members.length);
            
            party.members.forEach(member => {
                if (member.hp > 0) { // Solo miembros vivos reciben XP
                    member.xp += xpPerMember;
                    
                    // Verificar subida de nivel
                    const maxXp = member.maxXp || this.calculateMaxXp(member.level);
                    if (member.xp >= maxXp) {
                        member.level += 1;
                        member.xp = member.xp - maxXp;
                        member.maxXp = this.calculateMaxXp(member.level);
                        
                        // Mejorar stats al subir nivel
                        this.levelUpPlayer(member);
                        
                        partyResult.levelUps = partyResult.levelUps || [];
                        partyResult.levelUps.push({
                            playerId: member.id,
                            playerName: member.name,
                            newLevel: member.level
                        });
                    }
                }
            });
        }
        
        // Distribuir loot (sistema simple: todos reciben oro igualmente)
        if (partyResult.totalLootValue > 0) {
            const goldPerMember = Math.floor(partyResult.totalLootValue / party.members.length);
            
            party.members.forEach(member => {
                if (member.hp > 0) {
                    member.gold = (member.gold || 0) + goldPerMember;
                }
            });
            
            partyResult.goldDistributed = goldPerMember * party.members.filter(m => m.hp > 0).length;
        }
        
        // Distribuir items (sistema simple: primer jugador vivo recibe items)
        if (partyResult.totalLoot && partyResult.totalLoot.length > 0) {
            const aliveMembers = party.members.filter(m => m.hp > 0);
            if (aliveMembers.length > 0) {
                const luckyMember = aliveMembers[0];
                luckyMember.inventory = luckyMember.inventory || [];
                luckyMember.inventory.push(...partyResult.totalLoot);
                
                partyResult.itemsDistributed = {
                    playerId: luckyMember.id,
                    playerName: luckyMember.name,
                    items: partyResult.totalLoot.map(item => item.name)
                };
            }
        }
    }

    /**
     * Actualiza progreso de la party en el dungeon
     */
    async updatePartyProgress(party, partyResult) {
        const partyFilePath = path.join(this.partiesDir, `${party.id}.json`);
        
        try {
            const partyData = JSON.parse(await fs.readFile(partyFilePath, 'utf8'));
            
            // Actualizar progreso
            partyData.progress = partyData.progress || {};
            partyData.progress.battlesCompleted = (partyData.progress.battlesCompleted || 0) + partyResult.battles.length;
            partyData.progress.totalXpEarned = (partyData.progress.totalXpEarned || 0) + partyResult.totalXp;
            partyData.progress.totalGoldEarned = (partyData.progress.totalGoldEarned || 0) + partyResult.totalLootValue;
            
            // Verificar si completó el dungeon
            const dungeonSize = partyData.location?.size || 10;
            if (partyData.progress.battlesCompleted >= dungeonSize) {
                partyData.status = 'completed';
                partyData.completedAt = new Date().toISOString();
                partyResult.dungeonCompleted = true;
            }
            
            // Guardar party actualizada
            await fs.writeFile(partyFilePath, JSON.stringify(partyData, null, 2), 'utf8');
            
        } catch (error) {
            console.error(`Error actualizando progreso de party ${party.id}:`, error);
        }
    }

    /**
     * Guarda jugadores actualizados
     */
    async saveUpdatedPlayers(party) {
        for (const member of party.members) {
            try {
                const playerFilePath = path.join(this.playersDir, `${member.id}.json`);
                const playerData = JSON.parse(await fs.readFile(playerFilePath, 'utf8'));
                
                // Actualizar solo campos relevantes
                playerData.level = member.level;
                playerData.xp = member.xp;
                playerData.maxXp = member.maxXp;
                playerData.hp = member.hp;
                playerData.maxHp = member.maxHp;
                playerData.gold = (playerData.gold || 0) + (member.gold || 0);
                
                if (member.inventory) {
                    playerData.inventory = member.inventory;
                }
                
                // Actualizar stats si subió de nivel
                if (member.stats) {
                    playerData.stats = member.stats;
                }
                
                await fs.writeFile(playerFilePath, JSON.stringify(playerData, null, 2), 'utf8');
                
            } catch (error) {
                console.error(`Error guardando jugador ${member.id}:`, error);
            }
        }
    }

    /**
     * Limpia parties completadas
     */
    async cleanupCompletedParties(partyResults) {
        for (const result of partyResults) {
            if (result.status === 'completed' || result.status === 'defeated' || result.status === 'wiped') {
                try {
                    const partyFilePath = path.join(this.partiesDir, `${result.partyId}.json`);
                    const partyData = JSON.parse(await fs.readFile(partyFilePath, 'utf8'));
                    
                    // Si la party completó o fue derrotada, marcarla como inactiva
                    if (partyData.status === 'active') {
                        partyData.status = result.status === 'completed' ? 'completed' : 'defeated';
                        partyData.endedAt = new Date().toISOString();
                        partyData.finalResult = result;
                        
                        await fs.writeFile(partyFilePath, JSON.stringify(partyData, null, 2), 'utf8');
                    }
                    
                } catch (error) {
                    console.error(`Error limpiando party ${result.partyId}:`, error);
                }
            }
        }
    }

    /**
     * Guarda log del tick
     */
    async saveTickLog(tickResult) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const logFilePath = path.join(this.logsDir, `tick_${timestamp}.json`);
            
            await fs.writeFile(logFilePath, JSON.stringify(tickResult, null, 2), 'utf8');
            
            if (this.debugMode) {
                console.log(`Tick log guardado: ${logFilePath}`);
            }
            
        } catch (error) {
            console.error('Error guardando tick log:', error);
        }
    }

    /**
     * Guarda log de party
     */
    async savePartyLog(partyResult, tickId) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const logDir = path.join(this.logsDir, 'parties');
            await fs.mkdir(logDir, { recursive: true });
            
            const logFilePath = path.join(logDir, `party_${partyResult.partyId}_${timestamp}.json`);
            
            await fs.writeFile(logFilePath, JSON.stringify(partyResult, null, 2), 'utf8');
            
        } catch (error) {
            console.error('Error guardando party log:', error);
        }
    }

    /**
     * Guarda log de batalla
     */
    async saveBattleLog(battleResult, tickId) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const logDir = path.join(this.logsDir, 'battles');
            await fs.mkdir(logDir, { recursive: true });
            
            const logFilePath = path.join(logDir, `battle_${battleResult.battleId}_${timestamp}.json`);
            
            // Limitar tamaño del log (no guardar todos los turnos en producción)
            const simplifiedResult = { ...battleResult };
            if (simplifiedResult.turns && simplifiedResult.turns.length > 20) {
                simplifiedResult.turns = simplifiedResult.turns.slice(0, 20);
                simplifiedResult.turnsTruncated = true;
            }
            
            await fs.writeFile(logFilePath, JSON.stringify(simplifiedResult, null, 2), 'utf8');
            
        } catch (error) {
            console.error('Error guardando battle log:', error);
        }
    }

    /**
     * Métodos de ayuda
     */
    calculateAveragePartyLevel(party) {
        if (!party.members || party.members.length === 0) return 1;
        
        const totalLevel = party.members.reduce((sum, member) => sum + (member.level || 1), 0);
        return Math.floor(totalLevel / party.members.length);
    }

    calculateMaxXp(level) {
        return 100 * level * level;
    }

    calculateEncounterDifficulty(type, enemyLevel, enemyCount) {
        const typeMultiplier = {
            normal: 1.0,
            elite: 2.5,
            boss: 5.0
        }[type] || 1.0;
        
        return Math.floor(enemyLevel * typeMultiplier * Math.sqrt(enemyCount));
    }

    calculateXpReward(type, enemyLevel, enemyCount) {
        const baseXp = enemyLevel * 10;
        const typeMultiplier = {
            normal: 1.0,
            elite: 2.0,
            boss: 5.0
        }[type] || 1.0;
        
        return Math.floor(baseXp * typeMultiplier * enemyCount);
    }

    calculatePartyLuck(party) {
        if (!party.members || party.members.length === 0) return 0;
        
        const totalLuck = party.members.reduce((sum, member) => {
            return sum + (member.stats?.luck || 0);
        }, 0);
        
        return Math.min(100, totalLuck / party.members.length);
    }

    levelUpPlayer(player) {
        player.maxHp = (player.maxHp || 50) + 10;
        player.hp = player.maxHp; // Curar completamente al subir nivel
        
        player.attack = (player.attack || 5) + 2;
        player.defense = (player.defense || 3) + 1;
        
        if (!player.stats) player.stats = {};
        player.stats.strength = (player.stats.strength || 0) + 1;
        player.stats.vitality = (player.stats.vitality || 0) + 1;
        
        console.log(`${player.name} subió al nivel ${player.level}!`);
    }

    /**
     * Habilita/deshabilita modo depuración
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        if (this.combatSystem) this.combatSystem.debugMode = enabled;
        if (this.lootGenerator) this.lootGenerator.setDebugMode(enabled);
    }

    /**
     * Ejecuta un tick de prueba
     */
    async executeTestTick() {
        console.log('=== EJECUTANDO TICK DE PRUEBA ===');
        
        // Crear datos de prueba
        await this.createTestData();
        
        // Ejecutar tick
        const result = await this.executeTick();
        
        console.log('=== TICK DE PRUEBA COMPLETADO ===');
        return result;
    }

    /**
     * Crea datos de prueba
     */
    async createTestData() {
        // Crear jugadores de prueba
        const testPlayers = [
            {
                id: 'player1',
                name: 'Aragorn',
                class: 'warrior',
                level: 5,
                xp: 150,
                maxXp: 2500,
                hp: 80,
                maxHp: 100,
                attack: 25,
                defense: 15,
                speed: 3,
                gold: 100,
                stats: { strength: 10, vitality: 8, luck: 3 },
                inventory: [{ name: 'Health Potion', quantity: 3 }],
                equipment: { weapon: 'Longsword', armor: 'Chainmail' }
            },
            {
                id: 'player2',
                name: 'Gandalf',
                class: 'mage',
                level: 6,
                xp: 300,
                maxXp: 3600,
                hp: 60,
                maxHp: 80,
                attack: 15,
                defense: 8,
                speed: 2,
                magic_power: 35,
                gold: 150,
                stats: { intelligence: 12, wisdom: 10, luck: 2 },
                inventory: [{ name: 'Mana Potion', quantity: 2 }],
                equipment: { weapon: 'Staff', armor: 'Robe' }
            },
            {
                id: 'player3',
                name: 'Legolas',
                class: 'archer',
                level: 5,
                xp: 200,
                maxXp: 2500,
                hp: 70,
                maxHp: 85,
                attack: 30,
                defense: 10,
                speed: 4,
                gold: 80,
                stats: { dexterity: 14, agility: 12, luck: 4 },
                inventory: [{ name: 'Arrows', quantity: 50 }],
                equipment: { weapon: 'Bow', armor: 'Leather' }
            }
        ];
        
        // Guardar jugadores
        for (const player of testPlayers) {
            const playerPath = path.join(this.playersDir, `${player.id}.json`);
            await fs.writeFile(playerPath, JSON.stringify(player, null, 2), 'utf8');
        }
        
        // Crear parties de prueba
        const testParties = [
            {
                id: 'party1',
                name: 'Los Valientes',
                status: 'active',
                location: {
                    type: 'dungeon',
                    name: 'Cueva del Dragón',
                    difficulty: 3,
                    size: 10
                },
                members: testPlayers.slice(0, 2),
                created: new Date().toISOString()
            },
            {
                id: 'party2',
                name: 'Los Exploradores',
                status: 'active',
                location: {
                    type: 'dungeon',
                    name: 'Bosque Encantado',
                    difficulty: 2,
                    size: 8
                },
                members: [testPlayers[2], testPlayers[0]],
                created: new Date().toISOString()
            }
        ];
        
        // Guardar parties
        for (const party of testParties) {
            const partyPath = path.join(this.partiesDir, `${party.id}.json`);
            await fs.writeFile(partyPath, JSON.stringify(party, null, 2), 'utf8');
        }
        
        console.log('Datos de prueba creados: 2 parties activas');
    }
}

module.exports = TickProcessor;