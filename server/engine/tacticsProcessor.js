/**
 * Procesador de Tácticas - Motor IF/THEN
 * Procesa reglas condicionales y ejecuta acciones tácticas
 */

/**
 * Clase principal del procesador de tácticas
 */
class TacticsProcessor {
    constructor() {
        this.rules = [];
        this.defaultRule = null;
        this.debugMode = false;
    }

    /**
     * Agrega una regla táctica al procesador
     * @param {Object} rule - Regla táctica
     * @param {string} rule.name - Nombre de la regla
     * @param {string|Array} rule.condition - Condición o array de condiciones
     * @param {string} rule.action - Acción a ejecutar
     * @param {number} rule.priority - Prioridad (mayor = más prioritario)
     * @param {string} rule.target - Objetivo de la acción
     */
    addRule(rule) {
        // Validar regla
        if (!rule.name || !rule.condition || !rule.action) {
            throw new Error('Las reglas deben tener nombre, condición y acción');
        }

        // Normalizar condición a array
        const conditions = Array.isArray(rule.condition) ? 
            rule.condition : [rule.condition];
        
        this.rules.push({
            ...rule,
            condition: conditions,
            priority: rule.priority || 1
        });

        // Ordenar por prioridad (descendente)
        this.rules.sort((a, b) => b.priority - a.priority);
        
        if (this.debugMode) {
            console.log(`Regla agregada: ${rule.name} (Prioridad: ${rule.priority || 1})`);
        }
    }

    /**
     * Establece una regla por defecto cuando ninguna otra se cumple
     */
    setDefaultRule(action, target = "random_enemy") {
        this.defaultRule = { action, target };
    }

    /**
     * Procesa todas las reglas y ejecuta la acción más prioritaria que cumpla condiciones
     * @param {Object} context - Contexto del combate
     * @returns {Object} Resultado de la acción seleccionada o null
     */
    process(context) {
        if (!this.validateContext(context)) {
            throw new Error('Contexto inválido para procesar tácticas');
        }

        if (this.debugMode) {
            console.log('=== PROCESANDO TÁCTICAS ===');
            console.log('Contexto:', {
                self: context.self ? `${context.self.name} (${context.self.hp}/${context.self.maxHp} HP)` : 'N/A',
                allies: context.allies?.length || 0,
                enemies: context.enemies?.length || 0
            });
        }

        // Evaluar reglas en orden de prioridad
        for (const rule of this.rules) {
            if (this.evaluateConditions(rule.condition, context)) {
                if (this.debugMode) {
                    console.log(`Regla activada: ${rule.name}`);
                }
                
                const result = this.executeAction(rule.action, rule.target || "random_enemy", context);
                if (result) {
                    return {
                        rule: rule.name,
                        ...result
                    };
                }
            }
        }

        // Ejecutar regla por defecto si existe
        if (this.defaultRule) {
            if (this.debugMode) {
                console.log('Ejecutando regla por defecto');
            }
            
            const result = this.executeAction(
                this.defaultRule.action, 
                this.defaultRule.target, 
                context
            );
            
            if (result) {
                return {
                    rule: 'default',
                    ...result
                };
            }
        }

        if (this.debugMode) {
            console.log('No se activó ninguna regla');
        }

        return null;
    }

    /**
     * Evalúa una lista de condiciones contra el contexto
     */
    evaluateConditions(conditions, context) {
        for (const condition of conditions) {
            if (!this.evaluateCondition(condition, context)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Evalúa una condición individual
     */
    evaluateCondition(condition, context) {
        const conditionHandlers = {
            // Condiciones de HP propio
            'self_hp_below_30': () => this.checkSelfHp(context, 30, 'below'),
            'self_hp_below_50': () => this.checkSelfHp(context, 50, 'below'),
            'self_hp_below_20': () => this.checkSelfHp(context, 20, 'below'),
            'self_hp_above_70': () => this.checkSelfHp(context, 70, 'above'),
            
            // Condiciones de enemigos
            'enemy_hp_low': () => this.findEnemyWithLowestHp(context) !== null,
            'enemy_hp_very_low': () => this.findEnemyWithHpBelow(context, 25) !== null,
            'multiple_enemies': () => context.enemies && context.enemies.length > 1,
            'single_enemy': () => context.enemies && context.enemies.length === 1,
            
            // Condiciones de aliados
            'ally_wounded': () => this.findWoundedAlly(context, 40) !== null,
            'ally_critical': () => this.findWoundedAlly(context, 20) !== null,
            'no_wounded_allies': () => this.findWoundedAlly(context, 70) === null,
            
            // Condiciones de recursos
            'has_potion': () => this.hasItem(context, 'potion'),
            'has_mana': () => this.hasMana(context, 20),
            'low_mana': () => this.checkMana(context, 30, 'below'),
            
            // Condiciones de estado
            'self_poisoned': () => this.hasStatus(context.self, 'poisoned'),
            'self_buffed': () => this.hasBuff(context.self),
            'enemy_debuffed': () => this.anyEnemyHasDebuff(context),
            
            // Condiciones compuestas (se pueden parsear)
            'self_hp_below': (value) => this.checkSelfHp(context, value, 'below'),
            'enemy_hp_below': (value) => this.findEnemyWithHpBelow(context, value) !== null,
            'ally_hp_below': (value) => this.findWoundedAlly(context, value) !== null
        };

        // Parsear condiciones con parámetros (ej: "self_hp_below:25")
        if (condition.includes(':')) {
            const [condName, param] = condition.split(':');
            const numericParam = parseFloat(param);
            
            if (conditionHandlers[condName]) {
                return conditionHandlers[condName](numericParam);
            }
        }

        // Condiciones simples
        if (conditionHandlers[condition]) {
            return conditionHandlers[condition]();
        }

        // Expresión booleana simple
        if (condition.startsWith('!')) {
            const subCondition = condition.substring(1);
            return !this.evaluateCondition(subCondition, context);
        }

        // Operador AND implícito (ya manejado por evaluateConditions)
        
        console.warn(`Condición no reconocida: ${condition}`);
        return false;
    }

    /**
     * Ejecuta una acción específica
     */
    executeAction(action, targetType, context) {
        const actionHandlers = {
            // Acciones ofensivas
            'heavy_strike': (target) => this.executeAttack('heavy_strike', target, context),
            'quick_attack': (target) => this.executeAttack('quick_attack', target, context),
            'cast_fireball': (target) => this.executeSpell('fireball', target, context),
            'cast_lightning': (target) => this.executeSpell('lightning', target, context),
            
            // Acciones defensivas/curativas
            'use_potion': (target) => this.useItem('potion', 'self', context),
            'cast_heal': (target) => this.executeHeal(target, context),
            'cast_shield': (target) => this.executeBuff('shield', target, context),
            'defend': (target) => this.executeDefend(context),
            
            // Acciones de utilidad
            'cast_debuff': (target) => this.executeDebuff(target, context),
            'use_mana_potion': (target) => this.useItem('mana_potion', 'self', context),
            'flee': (target) => this.executeFlee(context),
            
            // Acción por defecto
            'basic_attack': (target) => this.executeAttack('basic_attack', target, context)
        };

        if (actionHandlers[action]) {
            const target = this.resolveTarget(targetType, context);
            
            if (!target && targetType !== 'self' && targetType !== 'none') {
                if (this.debugMode) {
                    console.log(`No se pudo encontrar objetivo para: ${targetType}`);
                }
                return null;
            }

            return actionHandlers[action](target);
        }

        console.warn(`Acción no reconocida: ${action}`);
        return null;
    }

    /**
     * Resuelve el tipo de objetivo a una entidad específica
     */
    resolveTarget(targetType, context) {
        const targetResolvers = {
            'self': () => context.self,
            'random_enemy': () => this.getRandomEnemy(context),
            'lowest_hp_enemy': () => this.findEnemyWithLowestHp(context),
            'highest_hp_enemy': () => this.findEnemyWithHighestHp(context),
            'wounded_ally': () => this.findWoundedAlly(context, 70),
            'most_wounded_ally': () => this.findMostWoundedAlly(context),
            'random_ally': () => this.getRandomAlly(context),
            'all_enemies': () => ({ type: 'multiple', entities: context.enemies }),
            'all_allies': () => ({ type: 'multiple', entities: context.allies })
        };

        if (targetResolvers[targetType]) {
            return targetResolvers[targetType]();
        }

        // Si el targetType es un ID específico
        if (targetType.startsWith('enemy_')) {
            const enemyId = targetType.replace('enemy_', '');
            return context.enemies?.find(e => e.id === enemyId);
        }

        if (targetType.startsWith('ally_')) {
            const allyId = targetType.replace('ally_', '');
            return context.allies?.find(a => a.id === allyId);
        }

        return null;
    }

    /**
     * Métodos de ayuda para evaluar condiciones
     */
    checkSelfHp(context, threshold, comparison = 'below') {
        if (!context.self) return false;
        
        const hpPercent = (context.self.hp / context.self.maxHp) * 100;
        
        switch (comparison) {
            case 'below': return hpPercent < threshold;
            case 'above': return hpPercent > threshold;
            case 'exact': return Math.abs(hpPercent - threshold) < 5;
            default: return false;
        }
    }

    checkMana(context, threshold, comparison = 'below') {
        if (!context.self || context.self.mana === undefined) return false;
        
        const manaPercent = (context.self.mana / context.self.maxMana) * 100;
        
        switch (comparison) {
            case 'below': return manaPercent < threshold;
            case 'above': return manaPercent > threshold;
            default: return false;
        }
    }

    findEnemyWithLowestHp(context) {
        if (!context.enemies || context.enemies.length === 0) return null;
        
        return context.enemies.reduce((lowest, enemy) => {
            const lowestHpPercent = (lowest.hp / lowest.maxHp) * 100;
            const enemyHpPercent = (enemy.hp / enemy.maxHp) * 100;
            return enemyHpPercent < lowestHpPercent ? enemy : lowest;
        });
    }

    findEnemyWithHighestHp(context) {
        if (!context.enemies || context.enemies.length === 0) return null;
        
        return context.enemies.reduce((highest, enemy) => {
            const highestHpPercent = (highest.hp / highest.maxHp) * 100;
            const enemyHpPercent = (enemy.hp / enemy.maxHp) * 100;
            return enemyHpPercent > highestHpPercent ? enemy : highest;
        });
    }

    findEnemyWithHpBelow(context, threshold) {
        if (!context.enemies) return null;
        
        return context.enemies.find(enemy => {
            const hpPercent = (enemy.hp / enemy.maxHp) * 100;
            return hpPercent < threshold;
        });
    }

    findWoundedAlly(context, threshold = 40) {
        if (!context.allies) return null;
        
        return context.allies.find(ally => {
            const hpPercent = (ally.hp / ally.maxHp) * 100;
            return hpPercent < threshold;
        });
    }

    findMostWoundedAlly(context) {
        if (!context.allies || context.allies.length === 0) return null;
        
        return context.allies.reduce((mostWounded, ally) => {
            const mostWoundedHpPercent = (mostWounded.hp / mostWounded.maxHp) * 100;
            const allyHpPercent = (ally.hp / ally.maxHp) * 100;
            return allyHpPercent < mostWoundedHpPercent ? ally : mostWounded;
        });
    }

    getRandomEnemy(context) {
        if (!context.enemies || context.enemies.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * context.enemies.length);
        return context.enemies[randomIndex];
    }

    getRandomAlly(context) {
        if (!context.allies || context.allies.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * context.allies.length);
        return context.allies[randomIndex];
    }

    hasItem(context, itemName) {
        return context.self?.inventory?.some(item => item.name === itemName && item.quantity > 0) || false;
    }

    hasMana(context, minPercent = 0) {
        if (!context.self || context.self.mana === undefined) return false;
        
        const manaPercent = (context.self.mana / context.self.maxMana) * 100;
        return manaPercent >= minPercent;
    }

    hasStatus(entity, status) {
        return entity?.statusEffects?.some(effect => effect.type === status) || false;
    }

    hasBuff(entity) {
        return entity?.buffs && entity.buffs.length > 0;
    }

    anyEnemyHasDebuff(context) {
        if (!context.enemies) return false;
        
        return context.enemies.some(enemy => 
            enemy.debuffs && enemy.debuffs.length > 0
        );
    }

    /**
     * Métodos de ejecución de acciones (simulados)
     */
    executeAttack(attackType, target, context) {
        if (!target) return null;
        
        const damage = this.calculateDamage(attackType, context.self, target);
        
        return {
            action: attackType,
            target: target.id || target.name,
            damage: damage,
            message: `${context.self.name} usa ${this.getAttackName(attackType)} contra ${target.name} (${damage} daño)`
        };
    }

    executeSpell(spellType, target, context) {
        if (!target) return null;
        
        const manaCost = this.getSpellManaCost(spellType);
        
        if (context.self.mana < manaCost) {
            return {
                action: 'failed_spell',
                reason: 'mana_insufficient',
                message: `${context.self.name} intenta lanzar ${spellType} pero no tiene suficiente maná`
            };
        }
        
        const damage = this.calculateSpellDamage(spellType, context.self, target);
        
        return {
            action: spellType,
            target: target.id || target.name,
            damage: damage,
            manaCost: manaCost,
            message: `${context.self.name} lanza ${spellType} contra ${target.name} (${damage} daño mágico)`
        };
    }

    executeHeal(target, context) {
        if (!target) return null;
        
        const manaCost = 15;
        if (context.self.mana < manaCost) {
            return this.useItem('potion', target, context);
        }
        
        const healAmount = Math.floor(context.self.magicPower * 1.5);
        
        return {
            action: 'heal',
            target: target.id || target.name,
            heal: healAmount,
            manaCost: manaCost,
            message: `${context.self.name} cura a ${target.name} por ${healAmount} puntos de vida`
        };
    }

    executeBuff(buffType, target, context) {
        if (!target) return null;
        
        const manaCost = 10;
        if (context.self.mana < manaCost) {
            return null;
        }
        
        return {
            action: 'buff',
            buffType: buffType,
            target: target.id || target.name,
            manaCost: manaCost,
            message: `${context.self.name} fortalece a ${target.name} con ${buffType}`
        };
    }

    executeDebuff(target, context) {
        if (!target) return null;
        
        const manaCost = 12;
        if (context.self.mana < manaCost) {
            return null;
        }
        
        return {
            action: 'debuff',
            target: target.id || target.name,
            manaCost: manaCost,
            message: `${context.self.name} debilita a ${target.name}`
        };
    }

    executeDefend(context) {
        return {
            action: 'defend',
            target: 'self',
            defenseBonus: 0.5,
            message: `${context.self.name} adopta una postura defensiva`
        };
    }

    useItem(itemName, target, context) {
        if (!this.hasItem(context, itemName)) {
            return null;
        }
        
        let effect = {};
        switch (itemName) {
            case 'potion':
                effect.heal = 50;
                effect.message = `${context.self.name} usa una poción y recupera 50 HP`;
                break;
            case 'mana_potion':
                effect.mana = 30;
                effect.message = `${context.self.name} usa una poción de maná y recupera 30 MP`;
                break;
            default:
                effect.message = `${context.self.name} usa ${itemName}`;
        }
        
        return {
            action: 'use_item',
            item: itemName,
            target: target,
            ...effect
        };
    }

    executeFlee(context) {
        const successChance = 0.7;
        const success = Math.random() < successChance;
        
        return {
            action: 'flee',
            success: success,
            message: success ? 
                `${context.self.name} logra huir del combate` :
                `${context.self.name} intenta huir pero falla`
        };
    }

    /**
     * Métodos de ayuda para cálculos (simulados)
     */
    calculateDamage(attackType, attacker, defender) {
        const baseDamage = {
            'basic_attack': attacker.attack * 1.0,
            'heavy_strike': attacker.attack * 1.8,
            'quick_attack': attacker.attack * 0.7
        }[attackType] || attacker.attack;
        
        const defenseReduction = defender.defense * 0.1;
        return Math.max(1, Math.floor(baseDamage - defenseReduction));
    }

    calculateSpellDamage(spellType, caster, target) {
        const baseDamage = {
            'fireball': caster.magicPower * 2.0,
            'lightning': caster.magicPower * 2.5
        }[spellType] || caster.magicPower;
        
        const magicResistReduction = target.magicResist * 0.15;
        return Math.max(1, Math.floor(baseDamage - magicResistReduction));
    }

    getSpellManaCost(spellType) {
        const costs = {
            'fireball': 20,
            'lightning': 30,
            'heal': 15
        };
        return costs[spellType] || 10;
    }

    getAttackName(attackType) {
        const names = {
            'basic_attack': 'Ataque Básico',
            'heavy_strike': 'Golpe Pesado',
            'quick_attack': 'Ataque Rápido'
        };
        return names[attackType] || attackType;
    }

    /**
     * Valida el contexto del combate
     */
    validateContext(context) {
        if (!context) return false;
        if (!context.self) return false;
        if (!context.enemies || !Array.isArray(context.enemies)) return false;
        
        // Validar estructura básica de entidades
        const validateEntity = (entity) => {
            return entity && 
                   typeof entity.hp === 'number' &&
                   typeof entity.maxHp === 'number' &&
                   entity.name;
        };
        
        if (!validateEntity(context.self)) return false;
        
        for (const enemy of context.enemies) {
            if (!validateEntity(enemy)) return false;
        }
        
        if (context.allies) {
            for (const ally of context.allies) {
                if (!validateEntity(ally)) return false;
            }
        }
        
        return true;
    }

    /**
     * Habilita/deshabilita modo depuración
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }

    /**
     * Limpia todas las reglas
     */
    clearRules() {
        this.rules = [];
        this.defaultRule = null;
    }

    /**
     * Carga un preset de reglas predefinidas
     */
    loadPreset(presetName) {
        const presets = {
            'aggressive': this.getAggressivePreset(),
            'defensive': this.getDefensivePreset(),
            'balanced': this.getBalancedPreset(),
            'healer': this.getHealerPreset()
        };
        
        if (presets[presetName]) {
            this.clearRules();
            presets[presetName].forEach(rule => this.addRule(rule));
            this.setDefaultRule('basic_attack', 'random_enemy');
            return true;
        }
        
        return false;
    }

    /**
     * Presets predefinidos
     */
    getAggressivePreset() {
        return [
            {
                name: 'Ataque mortal a enemigo débil',
                condition: ['enemy_hp_very_low'],
                action: 'heavy_strike',
                target: 'lowest_hp_enemy',
                priority: 10
            },
            {
                name: 'Ataque mágico si hay maná',
                condition: ['has_mana', 'multiple_enemies'],
                action: 'cast_fireball',
                target: 'random_enemy',
                priority: 5
            },
            {
                name: 'Curarse si la vida es muy baja',
                condition: ['self_hp_below_20', 'has_potion'],
                action: 'use_potion',
                target: 'self',
                priority: 9
            }
        ];
    }

    getDefensivePreset() {
        return [
            {
                name: 'Curarse si está herido',
                condition: ['self_hp_below_50', 'has_potion'],
                action: 'use_potion',
                target: 'self',
                priority: 8
            },
            {
                name: 'Defenderse si la vida es baja',
                condition: ['self_hp_below_30'],
                action: 'defend',
                target: 'self',
                priority: 7
            },
            {
                name: 'Atacar enemigo más débil',
                condition: ['enemy_hp_low'],
                action: 'quick_attack',
                target: 'lowest_hp_enemy',
                priority: 6
            }
        ];
    }

    getBalancedPreset() {
        return [
            {
                name: 'Usar poción en emergencia',
                condition: ['self_hp_below_30', 'has_potion'],
                action: 'use_potion',
                target: 'self',
                priority: 10
            },
            {
                name: 'Curar aliado herido',
                condition: ['ally_wounded', 'has_mana'],
                action: 'cast_heal',
                target: 'wounded_ally',
                priority: 8
            },
            {
                name: 'Ataque pesado a enemigo débil',
                condition: ['enemy_hp_low'],
                action: 'heavy_strike',
                target: 'lowest_hp_enemy',
                priority: 5
            },
            {
                name: 'Ataque mágico a grupo',
                condition: ['multiple_enemies', 'has_mana'],
                action: 'cast_fireball',
                target: 'random_enemy',
                priority: 4
            }
        ];
    }

    getHealerPreset() {
        return [
            {
                name: 'Curar aliado crítico',
                condition: ['ally_critical', 'has_mana'],
                action: 'cast_heal',
                target: 'most_wounded_ally',
                priority: 10
            },
            {
                name: 'Curarse a sí mismo',
                condition: ['self_hp_below_40', 'has_mana'],
                action: 'cast_heal',
                target: 'self',
                priority: 9
            },
            {
                name: 'Usar poción si no hay maná',
                condition: ['self_hp_below_30', 'has_potion', 'low_mana'],
                action: 'use_potion',
                target: 'self',
                priority: 8
            },
            {
                name: 'Ataque básico si todos están sanos',
                condition: ['no_wounded_allies'],
                action: 'basic_attack',
                target: 'random_enemy',
                priority: 1
            }
        ];
    }
}

module.exports = TacticsProcessor;