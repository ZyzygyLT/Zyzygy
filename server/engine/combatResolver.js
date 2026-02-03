/**
 * Sistema de Combate - Fase A (Precisión)
 * Resuelve ataques y defensas con fórmulas detalladas
 */

const DiceRoller = require('./diceRoller');

class CombatResolver {
    constructor() {
        this.diceRoller = new DiceRoller();
        
        // Constantes del sistema
        this.COMBAT_CONSTANTS = {
            // Fórmula de ataque: (DEX × 0.8) + (PER × 0.4) + Bono_Arma + 2d10 - (Peso × 0.1)
            ATTACK_FORMULA: {
                dexMultiplier: 0.8,
                perMultiplier: 0.4,
                weightPenaltyMultiplier: 0.1
            },
            
            // Fórmula de defensa: (AGI × 1.0) + (PER × 0.2) + 2d10
            DEFENSE_FORMULA: {
                agiMultiplier: 1.0,
                perMultiplier: 0.2
            },
            
            // Límites de combate
            MIN_ATTACK_ROLL: 2,    // 2d10 mínimo
            MAX_ATTACK_ROLL: 20,   // 2d10 máximo
            MIN_DEFENSE_ROLL: 2,
            MAX_DEFENSE_ROLL: 20,
            
            // Umbrales de éxito
            CRITICAL_THRESHOLD: 15, // Diferencia para crítico
            GRAZE_THRESHOLD: 5,     // Diferencia para golpe leve
            
            // Penalizaciones
            EXHAUSTION_PENALTY: 0.1, // 10% por punto de fatiga
            WOUND_PENALTY: 0.15      // 15% por herida
        };
    }

    /**
     * Calcula el roll de ataque para un personaje
     * @param {Object} attacker - Objeto del atacante
     * @param {Object} weapon - Objeto del arma
     * @returns {Object} Resultado del cálculo de ataque
     */
    calculateAttackRoll(attacker, weapon) {
        // Validaciones básicas
        this.validateAttacker(attacker);
        this.validateWeapon(weapon);
        
        // Calcular bonificaciones base
        const dexBonus = attacker.dexterity * this.COMBAT_CONSTANTS.ATTACK_FORMULA.dexMultiplier;
        const perBonus = attacker.perception * this.COMBAT_CONSTANTS.ATTACK_FORMULA.perMultiplier;
        const weaponBonus = weapon.accuracyBonus || 0;
        
        // Calcular penalizaciones
        const weightPenalty = (weapon.weight || 0) * this.COMBAT_CONSTANTS.ATTACK_FORMULA.weightPenaltyMultiplier;
        const exhaustionPenalty = this.calculateExhaustionPenalty(attacker);
        const woundPenalty = this.calculateWoundPenalty(attacker);
        
        // Tirar dados
        const diceRoll = this.diceRoller.roll2d10();
        
        // Calcular total
        const baseTotal = dexBonus + perBonus + weaponBonus + diceRoll.total - weightPenalty;
        const finalTotal = Math.max(1, baseTotal - exhaustionPenalty - woundPenalty);
        
        return {
            attackerId: attacker.id,
            attackerName: attacker.name,
            weaponName: weapon.name,
            weaponType: weapon.type,
            
            // Componentes del cálculo
            components: {
                dexBonus: parseFloat(dexBonus.toFixed(2)),
                perBonus: parseFloat(perBonus.toFixed(2)),
                weaponBonus: weaponBonus,
                weightPenalty: parseFloat(weightPenalty.toFixed(2)),
                exhaustionPenalty: parseFloat(exhaustionPenalty.toFixed(2)),
                woundPenalty: parseFloat(woundPenalty.toFixed(2)),
                diceRoll: diceRoll.total,
                diceDetails: diceRoll
            },
            
            // Totales
            baseTotal: parseFloat(baseTotal.toFixed(2)),
            finalTotal: parseFloat(finalTotal.toFixed(2)),
            
            // Metadatos
            timestamp: new Date().toISOString(),
            calculationDetails: `(${attacker.dexterity}×${this.COMBAT_CONSTANTS.ATTACK_FORMULA.dexMultiplier}) + ` +
                              `(${attacker.perception}×${this.COMBAT_CONSTANTS.ATTACK_FORMULA.perMultiplier}) + ` +
                              `${weaponBonus} + ${diceRoll.total} - ` +
                              `(${weapon.weight || 0}×${this.COMBAT_CONSTANTS.ATTACK_FORMULA.weightPenaltyMultiplier})`
        };
    }

    /**
     * Calcula el roll de defensa para un personaje
     * @param {Object} defender - Objeto del defensor
     * @param {Object} armor - Objeto de la armadura (opcional)
     * @returns {Object} Resultado del cálculo de defensa
     */
    calculateDefenseRoll(defender, armor = {}) {
        // Validaciones básicas
        this.validateDefender(defender);
        
        // Calcular bonificaciones base
        const agiBonus = defender.agility * this.COMBAT_CONSTANTS.DEFENSE_FORMULA.agiMultiplier;
        const perBonus = defender.perception * this.COMBAT_CONSTANTS.DEFENSE_FORMULA.perMultiplier;
        const armorBonus = armor.defenseBonus || 0;
        
        // Calcular penalizaciones
        const armorWeightPenalty = (armor.weight || 0) * 0.05; // 5% de penalización por peso de armadura
        const exhaustionPenalty = this.calculateExhaustionPenalty(defender);
        const woundPenalty = this.calculateWoundPenalty(defender);
        
        // Tirar dados
        const diceRoll = this.diceRoller.roll2d10();
        
        // Calcular total
        const baseTotal = agiBonus + perBonus + armorBonus + diceRoll.total - armorWeightPenalty;
        const finalTotal = Math.max(1, baseTotal - exhaustionPenalty - woundPenalty);
        
        return {
            defenderId: defender.id,
            defenderName: defender.name,
            armorName: armor.name || 'Sin armadura',
            
            // Componentes del cálculo
            components: {
                agiBonus: parseFloat(agiBonus.toFixed(2)),
                perBonus: parseFloat(perBonus.toFixed(2)),
                armorBonus: armorBonus,
                armorWeightPenalty: parseFloat(armorWeightPenalty.toFixed(2)),
                exhaustionPenalty: parseFloat(exhaustionPenalty.toFixed(2)),
                woundPenalty: parseFloat(woundPenalty.toFixed(2)),
                diceRoll: diceRoll.total,
                diceDetails: diceRoll
            },
            
            // Totales
            baseTotal: parseFloat(baseTotal.toFixed(2)),
            finalTotal: parseFloat(finalTotal.toFixed(2)),
            
            // Metadatos
            timestamp: new Date().toISOString(),
            calculationDetails: `(${defender.agility}×${this.COMBAT_CONSTANTS.DEFENSE_FORMULA.agiMultiplier}) + ` +
                              `(${defender.perception}×${this.COMBAT_CONSTANTS.DEFENSE_FORMULA.perMultiplier}) + ` +
                              `${armorBonus} + ${diceRoll.total}`
        };
    }

    /**
     * Resuelve un ataque completo (ataque vs defensa)
     * @param {Object} attacker - Atacante
     * @param {Object} weapon - Arma
     * @param {Object} defender - Defensor
     * @param {Object} armor - Armadura (opcional)
     * @returns {Object} Resultado completo del combate
     */
    resolveAttack(attacker, weapon, defender, armor = {}) {
        const attackRoll = this.calculateAttackRoll(attacker, weapon);
        const defenseRoll = this.calculateDefenseRoll(defender, armor);
        
        const attackTotal = attackRoll.finalTotal;
        const defenseTotal = defenseRoll.finalTotal;
        const difference = parseFloat((attackTotal - defenseTotal).toFixed(2));
        
        // Determinar resultado
        let resultType = 'MISS';
        let description = 'El ataque falla completamente';
        
        if (difference > 0) {
            if (difference >= this.COMBAT_CONSTANTS.CRITICAL_THRESHOLD) {
                resultType = 'CRITICAL_HIT';
                description = '¡Golpe crítico! El ataque impacta con fuerza devastadora';
            } else if (difference >= this.COMBAT_CONSTANTS.GRAZE_THRESHOLD) {
                resultType = 'SOLID_HIT';
                description = 'Golpe sólido, el ataque impacta con fuerza';
            } else {
                resultType = 'GRAZE';
                description = 'Golpe leve, el ataque apenas alcanza al objetivo';
            }
        }
        
        // Calcular modificadores de posición/entorno
        const positionModifier = this.calculatePositionModifier(attacker, defender);
        const environmentalModifier = this.calculateEnvironmentalModifier();
        
        return {
            // Información básica
            combatId: this.generateCombatId(),
            timestamp: new Date().toISOString(),
            
            // Resultados
            attackRoll,
            defenseRoll,
            
            // Comparación
            attackTotal,
            defenseTotal,
            difference,
            
            // Determinación del resultado
            result: {
                type: resultType,
                description: description,
                isHit: difference > 0,
                isCritical: difference >= this.COMBAT_CONSTANTS.CRITICAL_THRESHOLD,
                isGraze: difference > 0 && difference < this.COMBAT_CONSTANTS.GRAZE_THRESHOLD,
                thresholdForCritical: this.COMBAT_CONSTANTS.CRITICAL_THRESHOLD,
                thresholdForGraze: this.COMBAT_CONSTANTS.GRAZE_THRESHOLD
            },
            
            // Modificadores adicionales
            modifiers: {
                position: positionModifier,
                environment: environmentalModifier,
                totalModifier: positionModifier + environmentalModifier
            },
            
            // Análisis estadístico
            analysis: {
                attackerAdvantage: this.calculateAdvantage(attacker, defender),
                hitChance: this.estimateHitChance(attacker, weapon, defender, armor),
                expectedDamage: this.estimateExpectedDamage(attackRoll, defenseRoll, resultType)
            }
        };
    }

    /**
     * Simula múltiples ataques para análisis estadístico
     * @param {Object} attacker - Atacante
     * @param {Object} weapon - Arma
     * @param {Object} defender - Defensor
     * @param {Object} armor - Armadura
     * @param {number} iterations - Número de simulaciones
     * @returns {Object} Estadísticas de la simulación
     */
    simulateAttacks(attacker, weapon, defender, armor = {}, iterations = 1000) {
        if (iterations < 100) {
            console.warn('Se recomiendan al menos 100 iteraciones para resultados significativos');
        }
        
        const results = {
            totalSimulations: iterations,
            hits: 0,
            criticals: 0,
            grazes: 0,
            misses: 0,
            attackRolls: [],
            defenseRolls: [],
            differences: [],
            hitResults: []
        };
        
        // Ejecutar simulaciones
        for (let i = 0; i < iterations; i++) {
            const combatResult = this.resolveAttack(attacker, weapon, defender, armor);
            
            results.attackRolls.push(combatResult.attackTotal);
            results.defenseRolls.push(combatResult.defenseTotal);
            results.differences.push(combatResult.difference);
            results.hitResults.push(combatResult.result.type);
            
            if (combatResult.result.isHit) {
                results.hits++;
                if (combatResult.result.isCritical) {
                    results.criticals++;
                } else if (combatResult.result.isGraze) {
                    results.grazes++;
                }
            } else {
                results.misses++;
            }
        }
        
        // Calcular estadísticas
        results.statistics = {
            hitRate: parseFloat((results.hits / iterations * 100).toFixed(2)),
            criticalRate: parseFloat((results.criticals / iterations * 100).toFixed(2)),
            grazeRate: parseFloat((results.grazes / iterations * 100).toFixed(2)),
            missRate: parseFloat((results.misses / iterations * 100).toFixed(2)),
            
            averageAttackRoll: parseFloat((results.attackRolls.reduce((a, b) => a + b, 0) / iterations).toFixed(2)),
            averageDefenseRoll: parseFloat((results.defenseRolls.reduce((a, b) => a + b, 0) / iterations).toFixed(2)),
            averageDifference: parseFloat((results.differences.reduce((a, b) => a + b, 0) / iterations).toFixed(2)),
            
            minAttackRoll: Math.min(...results.attackRolls),
            maxAttackRoll: Math.max(...results.attackRolls),
            minDefenseRoll: Math.min(...results.defenseRolls),
            maxDefenseRoll: Math.max(...results.defenseRolls),
            
            attackRollStdDev: this.calculateStandardDeviation(results.attackRolls),
            defenseRollStdDev: this.calculateStandardDeviation(results.defenseRolls)
        };
        
        // Distribución de resultados
        results.distribution = {
            critical: results.criticals,
            solidHit: results.hits - results.criticals - results.grazes,
            graze: results.grazes,
            miss: results.misses
        };
        
        // Análisis de probabilidad
        results.probabilityAnalysis = this.analyzeProbability(results);
        
        return results;
    }

    /**
     * Calcula la ventaja táctica entre combatientes
     * @param {Object} attacker - Atacante
     * @param {Object} defender - Defensor
     * @returns {number} Puntuación de ventaja (-10 a +10)
     */
    calculateAdvantage(attacker, defender) {
        let advantage = 0;
        
        // Ventaja por atributos
        advantage += (attacker.dexterity - defender.agility) * 0.5;
        advantage += (attacker.perception - defender.perception) * 0.3;
        
        // Ventaja por experiencia
        if (attacker.experienceLevel && defender.experienceLevel) {
            advantage += (attacker.experienceLevel - defender.experienceLevel) * 0.2;
        }
        
        // Limitar rango
        return Math.max(-10, Math.min(10, parseFloat(advantage.toFixed(2))));
    }

    /**
     * Estima la probabilidad de acierto
     * @param {Object} attacker - Atacante
     * @param {Object} weapon - Arma
     * @param {Object} defender - Defensor
     * @param {Object} armor - Armadura
     * @returns {number} Probabilidad estimada (0-100%)
     */
    estimateHitChance(attacker, weapon, defender, armor = {}) {
        // Calcular valores promedio esperados
        const expectedAttack = this.estimateExpectedAttack(attacker, weapon);
        const expectedDefense = this.estimateExpectedDefense(defender, armor);
        
        // Diferencia esperada
        const expectedDiff = expectedAttack - expectedDefense;
        
        // Convertir diferencia a probabilidad (aproximación)
        // Basado en distribución normal de 2d10
        let hitChance = 50; // Probabilidad base
        
        // Ajustar basado en diferencia esperada
        if (expectedDiff > 0) {
            hitChance = 50 + (expectedDiff * 3); // Cada punto de diferencia aumenta 3% de probabilidad
        } else {
            hitChance = 50 + (expectedDiff * 2); // Cada punto negativo disminuye 2%
        }
        
        // Limitar entre 1% y 99%
        return Math.max(1, Math.min(99, parseFloat(hitChance.toFixed(1))));
    }

    // ===================== MÉTODOS DE APOYO =====================

    /**
     * Valida que el atacante tenga los atributos necesarios
     * @param {Object} attacker - Atacante a validar
     */
    validateAttacker(attacker) {
        if (!attacker || typeof attacker !== 'object') {
            throw new Error('Atacante inválido');
        }
        
        if (attacker.dexterity === undefined || attacker.perception === undefined) {
            throw new Error('Atacante debe tener destreza (dexterity) y percepción (perception)');
        }
        
        if (attacker.dexterity < 1 || attacker.perception < 1) {
            console.warn(`Atacante ${attacker.name || 'desconocido'} tiene atributos muy bajos`);
        }
    }

    /**
     * Valida que el arma tenga los atributos necesarios
     * @param {Object} weapon - Arma a validar
     */
    validateWeapon(weapon) {
        if (!weapon || typeof weapon !== 'object') {
            throw new Error('Arma inválida');
        }
        
        if (!weapon.name) {
            throw new Error('Arma debe tener un nombre');
        }
        
        if (weapon.weight === undefined) {
            weapon.weight = 0;
            console.warn(`Arma ${weapon.name} no tiene peso definido, usando 0`);
        }
    }

    /**
     * Valida que el defensor tenga los atributos necesarios
     * @param {Object} defender - Defensor a validar
     */
    validateDefender(defender) {
        if (!defender || typeof defender !== 'object') {
            throw new Error('Defensor inválido');
        }
        
        if (defender.agility === undefined || defender.perception === undefined) {
            throw new Error('Defensor debe tener agilidad (agility) y percepción (perception)');
        }
    }

    /**
     * Calcula penalización por fatiga
     * @param {Object} character - Personaje
     * @returns {number} Penalización total
     */
    calculateExhaustionPenalty(character) {
        if (!character.exhaustionLevel) return 0;
        return character.exhaustionLevel * this.COMBAT_CONSTANTS.EXHAUSTION_PENALTY;
    }

    /**
     * Calcula penalización por heridas
     * @param {Object} character - Personaje
     * @returns {number} Penalización total
     */
    calculateWoundPenalty(character) {
        if (!character.woundLevel) return 0;
        return character.woundLevel * this.COMBAT_CONSTANTS.WOUND_PENALTY;
    }

    /**
     * Calcula modificador por posición
     * @param {Object} attacker - Atacante
     * @param {Object} defender - Defensor
     * @returns {number} Modificador de posición
     */
    calculatePositionModifier(attacker, defender) {
        let modifier = 0;
        
        // Ejemplo simple: ventaja por altura, flanqueo, etc.
        // En un sistema completo, esto se calcularía basado en posición real
        
        if (attacker.position === 'flanking' && defender.position !== 'aware') {
            modifier += 2.5;
        }
        
        if (attacker.position === 'high_ground') {
            modifier += 1.5;
        }
        
        if (defender.position === 'prone') {
            modifier += 3.0;
        }
        
        return parseFloat(modifier.toFixed(2));
    }

    /**
     * Calcula modificador por entorno
     * @returns {number} Modificador de entorno
     */
    calculateEnvironmentalModifier() {
        // Ejemplo simple: condiciones climáticas, visibilidad, etc.
        // En un sistema completo, esto vendría del estado del entorno
        
        let modifier = 0;
        
        // Simular condiciones aleatorias para la demostración
        const conditions = ['clear', 'rain', 'fog', 'darkness'];
        const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
        
        switch(randomCondition) {
            case 'rain':
                modifier -= 0.5;
                break;
            case 'fog':
                modifier -= 1.0;
                break;
            case 'darkness':
                modifier -= 1.5;
                break;
            default:
                modifier += 0.2; // Condiciones claras ligeramente favorables
        }
        
        return parseFloat(modifier.toFixed(2));
    }

    /**
     * Estima el ataque esperado (sin dados)
     * @param {Object} attacker - Atacante
     * @param {Object} weapon - Arma
     * @returns {number} Ataque esperado
     */
    estimateExpectedAttack(attacker, weapon) {
        const dexBonus = attacker.dexterity * this.COMBAT_CONSTANTS.ATTACK_FORMULA.dexMultiplier;
        const perBonus = attacker.perception * this.COMBAT_CONSTANTS.ATTACK_FORMULA.perMultiplier;
        const weaponBonus = weapon.accuracyBonus || 0;
        const weightPenalty = (weapon.weight || 0) * this.COMBAT_CONSTANTS.ATTACK_FORMULA.weightPenaltyMultiplier;
        
        // Promedio de 2d10 es 11
        const diceAverage = 11;
        
        return dexBonus + perBonus + weaponBonus + diceAverage - weightPenalty;
    }

    /**
     * Estima la defensa esperada (sin dados)
     * @param {Object} defender - Defensor
     * @param {Object} armor - Armadura
     * @returns {number} Defensa esperada
     */
    estimateExpectedDefense(defender, armor = {}) {
        const agiBonus = defender.agility * this.COMBAT_CONSTANTS.DEFENSE_FORMULA.agiMultiplier;
        const perBonus = defender.perception * this.COMBAT_CONSTANTS.DEFENSE_FORMULA.perMultiplier;
        const armorBonus = armor.defenseBonus || 0;
        const armorWeightPenalty = (armor.weight || 0) * 0.05;
        
        // Promedio de 2d10 es 11
        const diceAverage = 11;
        
        return agiBonus + perBonus + armorBonus + diceAverage - armorWeightPenalty;
    }

    /**
     * Estima el daño esperado
     * @param {Object} attackRoll - Roll de ataque
     * @param {Object} defenseRoll - Roll de defensa
     * @param {string} resultType - Tipo de resultado
     * @returns {Object} Estimación de daño
     */
    estimateExpectedDamage(attackRoll, defenseRoll, resultType) {
        const baseDamage = attackRoll.weaponDamage || 10;
        const defenseAbsorption = defenseRoll.armorAbsorption || 0;
        
        let damageMultiplier = 1.0;
        
        switch(resultType) {
            case 'CRITICAL_HIT':
                damageMultiplier = 2.0;
                break;
            case 'SOLID_HIT':
                damageMultiplier = 1.5;
                break;
            case 'GRAZE':
                damageMultiplier = 0.5;
                break;
            default:
                damageMultiplier = 0;
        }
        
        const rawDamage = baseDamage * damageMultiplier;
        const netDamage = Math.max(0, rawDamage - defenseAbsorption);
        
        return {
            baseDamage,
            defenseAbsorption,
            damageMultiplier,
            rawDamage: parseFloat(rawDamage.toFixed(2)),
            netDamage: parseFloat(netDamage.toFixed(2))
        };
    }

    /**
     * Calcula desviación estándar
     * @param {Array} values - Valores a analizar
     * @returns {number} Desviación estándar
     */
    calculateStandardDeviation(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
        return parseFloat(Math.sqrt(variance).toFixed(2));
    }

    /**
     * Analiza probabilidades de resultados
     * @param {Object} simulationResults - Resultados de simulación
     * @returns {Object} Análisis de probabilidad
     */
    analyzeProbability(simulationResults) {
        const stats = simulationResults.statistics;
        
        // Intervalo de confianza del 95% para la tasa de acierto
        const hitRate = stats.hitRate / 100;
        const n = simulationResults.totalSimulations;
        const z = 1.96; // Para 95% de confianza
        
        const marginOfError = z * Math.sqrt((hitRate * (1 - hitRate)) / n);
        const confidenceInterval = {
            lower: Math.max(0, (hitRate - marginOfError) * 100).toFixed(2),
            upper: Math.min(100, (hitRate + marginOfError) * 100).toFixed(2)
        };
        
        // Potencia estadística
        const statisticalPower = n >= 1000 ? 'Alta' : n >= 500 ? 'Media' : 'Baja';
        
        return {
            confidenceInterval95: `${confidenceInterval.lower}% - ${confidenceInterval.upper}%`,
            marginOfError: `${(marginOfError * 100).toFixed(2)}%`,
            statisticalPower,
            recommendedSampleSize: this.calculateRecommendedSampleSize(hitRate)
        };
    }

    /**
     * Calcula tamaño de muestra recomendado
     * @param {number} expectedHitRate - Tasa de acierto esperada (0-1)
     * @returns {number} Tamaño de muestra recomendado
     */
    calculateRecommendedSampleSize(expectedHitRate) {
        const z = 1.96; // 95% confianza
        const e = 0.02; // 2% margen de error
        const p = expectedHitRate;
        
        const n = (Math.pow(z, 2) * p * (1 - p)) / Math.pow(e, 2);
        return Math.ceil(n);
    }

    /**
     * Genera un ID único para el combate
     * @returns {string} ID de combate
     */
    generateCombatId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 6);
        return `combat_${timestamp}_${random}`;
    }

       /**
     * Genera un reporte detallado del combate
     * @param {Object} combatResult - Resultado del combate
     * @returns {string} Reporte formateado
     */
    generateCombatReport(combatResult) {
        // Validar que tenemos los datos necesarios
        if (!combatResult || typeof combatResult !== 'object') {
            return '⚠️ Error: Resultado de combate inválido';
        }
        
        let report = '═'.repeat(70) + '\n';
        report += 'INFORME DE COMBATE - SISTEMA DE PRECISIÓN\n';
        report += '═'.repeat(70) + '\n\n';
        
        // Información básica - con comprobación de existencia
        report += '📋 INFORMACIÓN BÁSICA:\n';
        report += '─'.repeat(40) + '\n';
        report += `• ID de Combate: ${combatResult.combatId || 'N/A'}\n`;
        report += `• Atacante: ${combatResult.attackRoll?.attackerName || 'Desconocido'}\n`;
        report += `• Defensor: ${combatResult.defenseRoll?.defenderName || 'Desconocido'}\n`;
        report += `• Arma: ${combatResult.attackRoll?.weaponName || 'No especificada'}\n`;
        report += `• Armadura: ${combatResult.defenseRoll?.armorName || 'Sin armadura'}\n\n`;
        
        // Resultados del cálculo - con comprobación de existencia
        report += '🎯 CÁLCULOS DE PRECISIÓN:\n';
        report += '─'.repeat(40) + '\n';
        
        // Ataque
        report += 'ATAQUE:\n';
        if (combatResult.attackTotal !== undefined) {
            report += `  Total: ${combatResult.attackTotal.toFixed(2)}\n`;
        } else {
            report += `  Total: N/A\n`;
        }
        
        if (combatResult.attackRoll?.calculationDetails) {
            report += `  Detalle: ${combatResult.attackRoll.calculationDetails}\n`;
        }
        
        // Defensa
        report += '\nDEFENSA:\n';
        if (combatResult.defenseTotal !== undefined) {
            report += `  Total: ${combatResult.defenseTotal.toFixed(2)}\n`;
        } else {
            report += `  Total: N/A\n`;
        }
        
        if (combatResult.defenseRoll?.calculationDetails) {
            report += `  Detalle: ${combatResult.defenseRoll.calculationDetails}\n\n`;
        } else {
            report += '\n';
        }
        
        // Resultado
        report += '⚔️ RESULTADO DEL COMBATE:\n';
        report += '─'.repeat(40) + '\n';
        
        if (combatResult.difference !== undefined) {
            report += `• Diferencia: ${combatResult.difference.toFixed(2)} (Ataque - Defensa)\n`;
        } else {
            report += `• Diferencia: N/A\n`;
        }
        
        if (combatResult.result?.type) {
            report += `• Tipo: ${combatResult.result.type}\n`;
            report += `• Descripción: ${combatResult.result.description || 'Sin descripción'}\n`;
            report += `• ¿Es acierto?: ${combatResult.result.isHit ? '✅ Sí' : '❌ No'}\n`;
            report += `• ¿Es crítico?: ${combatResult.result.isCritical ? '✅ Sí' : '❌ No'}\n\n`;
        } else {
            report += `• Resultado: No determinado\n\n`;
        }
        
        // Análisis
        report += '📊 ANÁLISIS ESTADÍSTICO:\n';
        report += '─'.repeat(40) + '\n';
        
        if (combatResult.analysis?.attackerAdvantage !== undefined) {
            report += `• Ventaja del atacante: ${combatResult.analysis.attackerAdvantage}\n`;
        }
        
        if (combatResult.analysis?.hitChance !== undefined) {
            report += `• Probabilidad estimada de acierto: ${combatResult.analysis.hitChance}%\n`;
        }
        
        if (combatResult.result?.isHit && combatResult.analysis?.expectedDamage?.netDamage !== undefined) {
            report += `• Daño esperado: ${combatResult.analysis.expectedDamage.netDamage}\n`;
        }
        
        return report;
    }
}

// Exportar la clase
module.exports = CombatResolver;