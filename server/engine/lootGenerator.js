/**
 * Generador de Loot - Sistema de generación procedural de items
 * Implementa rarezas, stats procedurales y tablas de loot
 */

/**
 * Sistema de rareza
 */
const RARITY = {
    COMMON: { name: 'Común', weight: 75, color: '#FFFFFF', statMultiplier: 1.0 },
    UNCOMMON: { name: 'Poco Común', weight: 15, color: '#1EFF00', statMultiplier: 1.3 },
    RARE: { name: 'Raro', weight: 8, color: '#0070DD', statMultiplier: 1.7 },
    EPIC: { name: 'Épico', weight: 2, color: '#A335EE', statMultiplier: 2.2 },
    LEGENDARY: { name: 'Legendario', weight: 0.5, color: '#FF8000', statMultiplier: 3.0 }
};

/**
 * Tipos de ítems
 */
const ITEM_TYPES = {
    WEAPON: 'weapon',
    ARMOR: 'armor',
    HELMET: 'helmet',
    BOOTS: 'boots',
    GLOVES: 'gloves',
    RING: 'ring',
    AMULET: 'amulet',
    CONSUMABLE: 'consumable',
    MATERIAL: 'material'
};

/**
 * Categorías de estadísticas
 */
const STAT_CATEGORIES = {
    OFFENSIVE: ['attack', 'critical_chance', 'critical_damage', 'attack_speed', 'accuracy'],
    DEFENSIVE: ['defense', 'health', 'health_regen', 'damage_reduction', 'dodge_chance'],
    MAGICAL: ['magic_power', 'mana', 'mana_regen', 'spell_cooldown', 'magic_resist'],
    UTILITY: ['luck', 'movement_speed', 'gold_bonus', 'xp_bonus', 'item_find']
};

/**
 * Prefijos para items
 */
const PREFIXES = {
    // Prefijos ofensivos
    'Sharp': { stats: { attack: [3, 6] }, rarityWeight: { COMMON: 5, UNCOMMON: 3 } },
    'Heavy': { stats: { attack: [5, 9], attack_speed: [-0.1, -0.05] }, rarityWeight: { UNCOMMON: 4 } },
    'Deadly': { stats: { critical_chance: [0.03, 0.06], critical_damage: [0.1, 0.2] }, rarityWeight: { RARE: 4 } },
    'Vicious': { stats: { attack: [8, 12], critical_damage: [0.15, 0.25] }, rarityWeight: { EPIC: 3 } },
    
    // Prefijos defensivos
    'Sturdy': { stats: { defense: [2, 4] }, rarityWeight: { COMMON: 5 } },
    'Fortified': { stats: { defense: [4, 7], health: [10, 20] }, rarityWeight: { UNCOMMON: 4 } },
    'Guardian': { stats: { defense: [7, 10], damage_reduction: [0.02, 0.04] }, rarityWeight: { RARE: 3 } },
    'Impenetrable': { stats: { defense: [10, 15], damage_reduction: [0.04, 0.07] }, rarityWeight: { EPIC: 2 } },
    
    // Prefijos mágicos
    'Enchanted': { stats: { magic_power: [3, 6] }, rarityWeight: { UNCOMMON: 4 } },
    'Arcane': { stats: { magic_power: [6, 10], mana: [15, 25] }, rarityWeight: { RARE: 3 } },
    'Mystic': { stats: { magic_power: [9, 14], spell_cooldown: [-0.05, -0.1] }, rarityWeight: { EPIC: 2 } },
    'Celestial': { stats: { magic_power: [12, 18], mana_regen: [1, 2] }, rarityWeight: { LEGENDARY: 1 } },
    
    // Prefijos de utilidad
    'Lucky': { stats: { luck: [1, 2] }, rarityWeight: { COMMON: 3 } },
    'Swift': { stats: { movement_speed: [0.05, 0.1] }, rarityWeight: { UNCOMMON: 3 } },
    'Prosperous': { stats: { gold_bonus: [0.05, 0.1], item_find: [0.03, 0.06] }, rarityWeight: { RARE: 2 } }
};

/**
 * Sufijos para items
 */
const SUFFIXES = {
    // Sufijos ofensivos
    'of Power': { stats: { attack: [2, 5] }, rarityWeight: { COMMON: 4 } },
    'of Precision': { stats: { accuracy: [0.05, 0.1] }, rarityWeight: { COMMON: 3 } },
    'of Crit': { stats: { critical_chance: [0.02, 0.04] }, rarityWeight: { UNCOMMON: 3 } },
    'of Slaughter': { stats: { attack: [5, 8], critical_damage: [0.1, 0.15] }, rarityWeight: { RARE: 2 } },
    
    // Sufijos defensivos
    'of Health': { stats: { health: [15, 25] }, rarityWeight: { COMMON: 4 } },
    'of Defense': { stats: { defense: [3, 6] }, rarityWeight: { COMMON: 4 } },
    'of Protection': { stats: { defense: [5, 8], health_regen: [0.5, 1] }, rarityWeight: { UNCOMMON: 3 } },
    'of Invulnerability': { stats: { damage_reduction: [0.03, 0.06], health: [20, 35] }, rarityWeight: { RARE: 2 } },
    
    // Sufijos mágicos
    'of Magic': { stats: { magic_power: [2, 5] }, rarityWeight: { COMMON: 3 } },
    'of Mana': { stats: { mana: [10, 20] }, rarityWeight: { COMMON: 3 } },
    'of the Sage': { stats: { magic_power: [4, 7], mana_regen: [0.8, 1.5] }, rarityWeight: { UNCOMMON: 2 } },
    'of the Archmage': { stats: { magic_power: [7, 12], spell_cooldown: [-0.08, -0.12] }, rarityWeight: { RARE: 1 } },
    
    // Sufijos de utilidad
    'of Luck': { stats: { luck: [1, 3] }, rarityWeight: { UNCOMMON: 3 } },
    'of Haste': { stats: { movement_speed: [0.03, 0.07] }, rarityWeight: { UNCOMMON: 2 } },
    'of Plenty': { stats: { gold_bonus: [0.07, 0.12] }, rarityWeight: { RARE: 2 } },
    'of Fortune': { stats: { item_find: [0.05, 0.1], luck: [2, 4] }, rarityWeight: { EPIC: 1 } }
};

/**
 * Tablas de loot predefinidas
 */
const LOOT_TABLES = {
    // Loot básico de enemigos comunes
    GOBLIN: {
        name: 'Goblin Loot',
        items: [
            { type: ITEM_TYPES.WEAPON, weight: 20, baseName: 'Dagger', baseStats: { attack: [2, 5] } },
            { type: ITEM_TYPES.ARMOR, weight: 15, baseName: 'Leather Armor', baseStats: { defense: [1, 3] } },
            { type: ITEM_TYPES.CONSUMABLE, weight: 40, baseName: 'Health Potion', baseStats: { heal: [15, 25] } },
            { type: ITEM_TYPES.MATERIAL, weight: 25, baseName: 'Goblin Ear', baseStats: { value: [1, 3] } }
        ],
        gold: [1, 5],
        dropCount: [1, 2]
    },
    
    // Loot de jefe
    ORC_CHIEFTAIN: {
        name: 'Orc Chieftain Loot',
        items: [
            { type: ITEM_TYPES.WEAPON, weight: 30, baseName: 'Axe', baseStats: { attack: [8, 15] } },
            { type: ITEM_TYPES.ARMOR, weight: 25, baseName: 'Chainmail', baseStats: { defense: [5, 10] } },
            { type: ITEM_TYPES.HELMET, weight: 20, baseName: 'Iron Helmet', baseStats: { defense: [3, 6], health: [10, 20] } },
            { type: ITEM_TYPES.RING, weight: 15, baseName: 'Warrior Ring', baseStats: { attack: [2, 5], health: [5, 15] } },
            { type: ITEM_TYPES.CONSUMABLE, weight: 10, baseName: 'Greater Health Potion', baseStats: { heal: [40, 60] } }
        ],
        gold: [20, 50],
        dropCount: [2, 4]
    },
    
    // Loot de dragón
    DRAGON: {
        name: 'Dragon Hoard',
        items: [
            { type: ITEM_TYPES.WEAPON, weight: 25, baseName: 'Dragonbone Sword', baseStats: { attack: [20, 35], fire_damage: [5, 10] } },
            { type: ITEM_TYPES.ARMOR, weight: 20, baseName: 'Dragonscale Armor', baseStats: { defense: [15, 25], fire_resist: [10, 20] } },
            { type: ITEM_TYPES.AMULET, weight: 15, baseName: 'Dragon Heart', baseStats: { health: [50, 100], magic_power: [10, 20] } },
            { type: ITEM_TYPES.RING, weight: 15, baseName: 'Ring of Dragonfire', baseStats: { fire_damage: [8, 15], magic_power: [8, 15] } },
            { type: ITEM_TYPES.MATERIAL, weight: 25, baseName: 'Dragon Scale', baseStats: { value: [50, 100] } }
        ],
        gold: [100, 500],
        dropCount: [3, 6]
    },
    
    // Loot genérico de cofre
    CHEST_COMMON: {
        name: 'Common Chest',
        items: [
            { type: ITEM_TYPES.WEAPON, weight: 20, baseName: 'Sword', baseStats: { attack: [5, 10] } },
            { type: ITEM_TYPES.ARMOR, weight: 20, baseName: 'Armor', baseStats: { defense: [4, 8] } },
            { type: ITEM_TYPES.CONSUMABLE, weight: 40, baseName: 'Potion', baseStats: { heal: [20, 35] } },
            { type: ITEM_TYPES.GLOVES, weight: 10, baseName: 'Gloves', baseStats: { defense: [1, 3], attack: [1, 3] } },
            { type: ITEM_TYPES.BOOTS, weight: 10, baseName: 'Boots', baseStats: { defense: [1, 3], movement_speed: [0.02, 0.05] } }
        ],
        gold: [5, 20],
        dropCount: [1, 3]
    }
};

/**
 * Clase principal del Generador de Loot
 */
class LootGenerator {
    constructor() {
        this.debugMode = false;
        this.seed = null;
        this.random = Math.random;
    }

    /**
     * Establece una semilla para generación reproducible
     * @param {number} seed - Semilla para el generador aleatorio
     */
    setSeed(seed) {
        this.seed = seed;
        // Simple pseudo-random generator (para demostración)
        this.random = function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }

    /**
     * Genera loot basado en una tabla de loot y la suerte del jugador
     * @param {string} lootTableId - ID de la tabla de loot
     * @param {number} killerLuck - Suerte del jugador (0-100)
     * @returns {Object} Loot generado
     */
    generateLoot(lootTableId, killerLuck = 0) {
        const lootTable = LOOT_TABLES[lootTableId];
        
        if (!lootTable) {
            console.warn(`Tabla de loot no encontrada: ${lootTableId}`);
            return { items: [], gold: 0 };
        }

        if (this.debugMode) {
            console.log(`Generando loot de: ${lootTable.name}`);
            console.log(`Suerte del jugador: ${killerLuck}`);
        }

        // Ajustar rareza basado en la suerte
        const luckBonus = killerLuck / 100; // Convertir a multiplicador
        
        // Determinar cantidad de drops
        const dropCount = this.getRandomInRange(lootTable.dropCount[0], lootTable.dropCount[1]);
        
        // Generar items
        const items = [];
        for (let i = 0; i < dropCount; i++) {
            const item = this.generateItemFromTable(lootTable, luckBonus);
            if (item) {
                items.push(item);
            }
        }
        
        // Generar oro - aplicar bonificación de suerte como un incremento más consistente
        const baseGoldRoll = Math.floor(this.getRandomInRange(lootTable.gold[0], lootTable.gold[1]));
        const goldBonus = Math.floor(lootTable.gold[1] * luckBonus * 0.5);
        const gold = Math.max(0, baseGoldRoll + goldBonus);

        const result = {
            table: lootTableId,
            tableName: lootTable.name,
            items: items,
            gold: gold,
            luckUsed: killerLuck
        };

        if (this.debugMode) {
            console.log(`Loot generado: ${items.length} items, ${gold} oro`);
        }

        return result;
    }

    /**
     * Genera un item desde una tabla de loot
     */
    generateItemFromTable(lootTable, luckBonus) {
        // Seleccionar tipo de item basado en pesos
        const selectedItem = this.selectWeightedItem(lootTable.items);
        if (!selectedItem) return null;

        // Determinar rareza
        const rarity = this.determineRarity(luckBonus);
        
        // Generar stats base
        const baseStats = {};
        for (const [stat, range] of Object.entries(selectedItem.baseStats)) {
            baseStats[stat] = this.getRandomInRange(range[0], range[1]);
        }

        // Aplicar multiplicador de rareza a los stats base
        const multipliedStats = {};
        for (const [stat, value] of Object.entries(baseStats)) {
            multipliedStats[stat] = Math.floor(value * rarity.statMultiplier);
        }

        // Determinar si tiene prefijo y/o sufijo
        const hasPrefix = this.random() < (0.1 + luckBonus * 0.1);
        const hasSuffix = this.random() < (0.1 + luckBonus * 0.1);

        let prefix = null;
        let suffix = null;
        let finalStats = { ...multipliedStats };
        let itemName = selectedItem.baseName;

        // Aplicar prefijo si corresponde
        if (hasPrefix) {
            prefix = this.selectPrefixForRarity(rarity);
            if (prefix) {
                itemName = `${prefix.name} ${itemName}`;
                this.applyStats(finalStats, prefix.stats);
            }
        }

        // Aplicar sufijo si corresponde
        if (hasSuffix) {
            suffix = this.selectSuffixForRarity(rarity);
            if (suffix) {
                itemName = `${itemName} ${suffix.name}`;
                this.applyStats(finalStats, suffix.stats);
            }
        }

        // Determinar valor del item
        const baseValue = this.calculateItemValue(selectedItem, finalStats);
        const value = Math.floor(baseValue * (1 + (rarity.statMultiplier - 1) * 0.5));

        // Crear objeto de item
        return {
            id: this.generateItemId(),
            name: itemName,
            originalName: selectedItem.baseName,
            type: selectedItem.type,
            rarity: rarity.name,
            rarityLevel: rarity,
            stats: finalStats,
            value: value,
            prefix: prefix ? prefix.name : null,
            suffix: suffix ? suffix.name : null,
            color: rarity.color,
            requirements: this.generateRequirements(rarity)
        };
    }

    /**
     * Determina la rareza del item
     */
    determineRarity(luckBonus = 0) {
        // Ajustar pesos basado en la suerte
        const adjustedWeights = {};
        let totalWeight = 0;
        
        for (const [rarityKey, rarity] of Object.entries(RARITY)) {
            // Incrementar probabilidad de rarezas más altas con suerte
            let adjustedWeight = rarity.weight;
            if (rarityKey !== 'COMMON') {
                adjustedWeight *= (1 + luckBonus * 2); // Doble efecto para rarezas no comunes
            }
            adjustedWeights[rarityKey] = adjustedWeight;
            totalWeight += adjustedWeight;
        }

        // Selección aleatoria basada en pesos ajustados
        const roll = this.random() * totalWeight;
        let currentWeight = 0;

        for (const [rarityKey, rarity] of Object.entries(RARITY)) {
            currentWeight += adjustedWeights[rarityKey];
            if (roll <= currentWeight) {
                return rarity;
            }
        }

        // Fallback a común
        return RARITY.COMMON;
    }

    /**
     * Selecciona un prefijo apropiado para la rareza
     */
    selectPrefixForRarity(rarity) {
        const availablePrefixes = [];
        // Determine rarity key (e.g., COMMON, UNCOMMON) to match rarityWeight keys
        const rarityKey = Object.keys(RARITY).find(k => RARITY[k] === rarity) || rarity.name.toUpperCase().replace(' ', '_');
        
        for (const [name, data] of Object.entries(PREFIXES)) {
            const weight = data.rarityWeight[rarityKey] || 0;
            if (weight > 0) {
                availablePrefixes.push({ name, data, weight });
            }
        }

        if (availablePrefixes.length === 0) return null;

        // Selección por peso
        const totalWeight = availablePrefixes.reduce((sum, p) => sum + p.weight, 0);
        const roll = this.random() * totalWeight;
        let currentWeight = 0;

        for (const prefix of availablePrefixes) {
            currentWeight += prefix.weight;
            if (roll <= currentWeight) {
                return {
                    name: prefix.name,
                    stats: this.generateStatsFromRange(prefix.data.stats)
                };
            }
        }

        return null;
    }

    /**
     * Selecciona un sufijo apropiado para la rareza
     */
    selectSuffixForRarity(rarity) {
        const availableSuffixes = [];
        // Determine rarity key (e.g., COMMON, UNCOMMON) to match rarityWeight keys
        const rarityKey = Object.keys(RARITY).find(k => RARITY[k] === rarity) || rarity.name.toUpperCase().replace(' ', '_');
        
        for (const [name, data] of Object.entries(SUFFIXES)) {
            const weight = data.rarityWeight[rarityKey] || 0;
            if (weight > 0) {
                availableSuffixes.push({ name, data, weight });
            }
        }

        if (availableSuffixes.length === 0) return null;

        // Selección por peso
        const totalWeight = availableSuffixes.reduce((sum, s) => sum + s.weight, 0);
        const roll = this.random() * totalWeight;
        let currentWeight = 0;

        for (const suffix of availableSuffixes) {
            currentWeight += suffix.weight;
            if (roll <= currentWeight) {
                return {
                    name: suffix.name,
                    stats: this.generateStatsFromRange(suffix.data.stats)
                };
            }
        }

        return null;
    }

    /**
     * Genera stats a partir de rangos
     */
    generateStatsFromRange(statRanges) {
        const stats = {};
        for (const [stat, range] of Object.entries(statRanges)) {
            stats[stat] = this.getRandomInRange(range[0], range[1]);
        }
        return stats;
    }

    /**
     * Aplica stats adicionales al item
     */
    applyStats(itemStats, additionalStats) {
        for (const [stat, value] of Object.entries(additionalStats)) {
            if (itemStats[stat]) {
                itemStats[stat] += value;
            } else {
                itemStats[stat] = value;
            }
        }
    }

    /**
     * Calcula el valor base del item
     */
    calculateItemValue(itemTemplate, stats) {
        let value = 10; // Valor base
        
        // Valor por tipo de item
        const typeMultiplier = {
            [ITEM_TYPES.WEAPON]: 5,
            [ITEM_TYPES.ARMOR]: 4,
            [ITEM_TYPES.HELMET]: 3,
            [ITEM_TYPES.BOOTS]: 2,
            [ITEM_TYPES.GLOVES]: 2,
            [ITEM_TYPES.RING]: 6,
            [ITEM_TYPES.AMULET]: 8,
            [ITEM_TYPES.CONSUMABLE]: 1,
            [ITEM_TYPES.MATERIAL]: 0.5
        }[itemTemplate.type] || 1;

        // Sumar valor de stats
        let statsValue = 0;
        for (const [stat, value] of Object.entries(stats)) {
            const statWeight = {
                attack: 2,
                defense: 1.5,
                health: 0.1,
                mana: 0.05,
                magic_power: 3,
                critical_chance: 50,
                critical_damage: 30,
                luck: 10,
                gold_bonus: 20,
                item_find: 25
            }[stat] || 1;
            
            statsValue += Math.abs(value) * statWeight;
        }

        value += statsValue * typeMultiplier;
        return Math.max(1, Math.floor(value));
    }

    /**
     * Genera requisitos para el item basado en rareza
     */
    generateRequirements(rarity) {
        const requirements = {};
        
        // Solo items raros o mejores tienen requisitos
        if (rarity.statMultiplier >= RARITY.RARE.statMultiplier) {
            if (this.random() < 0.5) {
                requirements.level = Math.floor(5 + (rarity.statMultiplier - 1) * 10);
            }
            
            if (rarity.statMultiplier >= RARITY.EPIC.statMultiplier && this.random() < 0.3) {
                requirements.attribute = this.random() < 0.5 ? 'strength' : 'intelligence';
                requirements.attributeValue = Math.floor(10 + (rarity.statMultiplier - 1) * 20);
            }
        }
        
        return Object.keys(requirements).length > 0 ? requirements : null;
    }

    /**
     * Selecciona un item basado en pesos
     */
    selectWeightedItem(items) {
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        const roll = this.random() * totalWeight;
        let currentWeight = 0;

        for (const item of items) {
            currentWeight += item.weight;
            if (roll <= currentWeight) {
                return item;
            }
        }

        return items[0];
    }

    /**
     * Genera un ID único para el item
     */
    generateItemId() {
        return `item_${Date.now()}_${Math.floor(this.random() * 1000000)}`;
    }

    /**
     * Obtiene un número aleatorio en un rango
     */
    getRandomInRange(min, max) {
        if (Array.isArray(min)) {
            // Si es un array, asumimos que es [min, max]
            max = min[1];
            min = min[0];
        }
        
        if (typeof min === 'number' && typeof max === 'number') {
            return min + (this.random() * (max - min));
        }
        
        return this.random();
    }

    /**
     * Habilita/deshabilita modo depuración
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }

    /**
     * Genera múltiples items para testing
     * @param {number} count - Cantidad de items a generar
     * @param {string} itemType - Tipo de item (opcional)
     * @returns {Array} Array de items generados
     */
    generateTestItems(count = 100, itemType = null) {
        const testTable = {
            name: 'Test Table',
            items: [
                { 
                    type: itemType || ITEM_TYPES.WEAPON, 
                    weight: 1, 
                    baseName: 'Test Sword', 
                    baseStats: { attack: [5, 10] } 
                }
            ],
            gold: [0, 0],
            dropCount: [1, 1]
        };

        const items = [];
        for (let i = 0; i < count; i++) {
            const item = this.generateItemFromTable(testTable, 0);
            if (item) {
                items.push(item);
            }
        }

        return items;
    }

    /**
     * Analiza la distribución de rareza en un array de items
     * @param {Array} items - Array de items a analizar
     * @returns {Object} Estadísticas de distribución
     */
    analyzeRarityDistribution(items) {
        const distribution = {
            total: items.length,
            byRarity: {},
            percentages: {}
        };

        // Inicializar contadores
        for (const rarity of Object.values(RARITY)) {
            distribution.byRarity[rarity.name] = 0;
        }

        // Contar items por rareza
        for (const item of items) {
            if (distribution.byRarity[item.rarity] !== undefined) {
                distribution.byRarity[item.rarity]++;
            }
        }

        // Calcular porcentajes
        for (const [rarityName, count] of Object.entries(distribution.byRarity)) {
            distribution.percentages[rarityName] = (count / distribution.total * 100).toFixed(2) + '%';
        }

        // Calcular stats promedio por rareza
        distribution.averageStats = {};
        for (const rarity of Object.values(RARITY)) {
            const rarityItems = items.filter(item => item.rarity === rarity.name);
            if (rarityItems.length > 0) {
                distribution.averageStats[rarity.name] = this.calculateAverageStats(rarityItems);
            }
        }

        return distribution;
    }

    /**
     * Calcula stats promedio para un array de items
     */
    calculateAverageStats(items) {
        if (items.length === 0) return {};

        const statSums = {};
        const statCounts = {};

        for (const item of items) {
            for (const [stat, value] of Object.entries(item.stats)) {
                if (!statSums[stat]) {
                    statSums[stat] = 0;
                    statCounts[stat] = 0;
                }
                statSums[stat] += value;
                statCounts[stat]++;
            }
        }

        const averages = {};
        for (const [stat, sum] of Object.entries(statSums)) {
            averages[stat] = parseFloat((sum / statCounts[stat]).toFixed(2));
        }

        return averages;
    }

    /**
     * Genera un reporte detallado de loot
     */
    generateLootReport(lootTableId, iterations = 1000, luckValues = [0, 25, 50, 75, 100]) {
        const report = {
            tableId: lootTableId,
            tableName: LOOT_TABLES[lootTableId]?.name || 'Unknown',
            iterations: iterations,
            results: {}
        };

        for (const luck of luckValues) {
            const allItems = [];
            let totalGold = 0;

            for (let i = 0; i < iterations; i++) {
                const loot = this.generateLoot(lootTableId, luck);
                allItems.push(...loot.items);
                totalGold += loot.gold;
            }

            report.results[luck] = {
                itemsGenerated: allItems.length,
                averageItemsPerDrop: (allItems.length / iterations).toFixed(2),
                averageGold: (totalGold / iterations).toFixed(2),
                distribution: this.analyzeRarityDistribution(allItems)
            };
        }

        return report;
    }
}

module.exports = {
    LootGenerator,
    RARITY,
    ITEM_TYPES,
    LOOT_TABLES
};