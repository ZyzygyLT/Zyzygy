/**
 * Sistema de Combate - Fase B (Mitigación Hiperbólica)
 * Calcula daño con fórmula hiperbólica: Coef = 100 / (100 + (Armor × 0.5))
 */

const DiceRoller = require('./diceRoller');

class DamageCalculator {
    constructor() {
        this.diceRoller = new DiceRoller();
        
        // Constantes del sistema
        this.DAMAGE_CONSTANTS = {
            // Fórmula de mitigación hiperbólica: Coef = 100 / (100 + (Armor × 0.5))
            MITIGATION_FORMULA: {
                baseConstant: 100,
                armorMultiplier: 0.5
            },
            
            // Tipos de daño y sus modificadores
            DAMAGE_TYPES: {
                SLASHING: { armorEffectiveness: 1.0, criticalMultiplier: 1.5 },
                PIERCING: { armorEffectiveness: 0.7, criticalMultiplier: 2.0 },
                BLUDGEONING: { armorEffectiveness: 1.3, criticalMultiplier: 1.8 },
                FIRE: { armorEffectiveness: 0.5, criticalMultiplier: 1.7 },
                COLD: { armorEffectiveness: 0.6, criticalMultiplier: 1.6 },
                LIGHTNING: { armorEffectiveness: 0.4, criticalMultiplier: 2.2 },
                POISON: { armorEffectiveness: 0.3, criticalMultiplier: 1.4 },
                HOLY: { armorEffectiveness: 0.8, criticalMultiplier: 2.5 },
                SHADOW: { armorEffectiveness: 0.9, criticalMultiplier: 1.9 }
            },
            
            // Mínimos y máximos
            MIN_DAMAGE: 1, // Daño mínimo garantizado
            MAX_CRITICAL_MULTIPLIER: 3.0,
            
            // Modificadores por posición/condiciones
            POSITION_MODIFIERS: {
                FLANKING: 1.3,
                REAR: 1.5,
                HIGH_GROUND: 1.2,
                PRONE_TARGET: 1.4,
                UNARMED: 0.5,
                SURPRISE: 1.8
            },
            
            // Resistencia de materiales
            MATERIAL_RESISTANCES: {
                CLOTH: { baseDefense: 2, vsSlashing: 0.5, vsPiercing: 0.3, vsBludgeoning: 0.8 },
                LEATHER: { baseDefense: 4, vsSlashing: 0.7, vsPiercing: 0.5, vsBludgeoning: 0.9 },
                CHAINMAIL: { baseDefense: 8, vsSlashing: 1.2, vsPiercing: 0.8, vsBludgeoning: 1.0 },
                PLATE: { baseDefense: 12, vsSlashing: 1.5, vsPiercing: 1.2, vsBludgeoning: 1.3 },
                SCALES: { baseDefense: 10, vsSlashing: 1.4, vsPiercing: 1.0, vsBludgeoning: 1.1 },
                MAGIC: { baseDefense: 6, magicResistance: 0.5 }
            }
        };
    }

    /**
     * Calcula el daño bruto de un arma
     * @param {Object} weapon - Objeto del arma
     * @param {Object} attacker - Objeto del atacante
     * @param {string} hitType - Tipo de golpe (NORMAL, CRITICAL, GRAZE)
     * @returns {Object} Resultado del cálculo de daño bruto
     */
    calculateRawDamage(weapon, attacker, hitType = 'NORMAL') {
        this.validateWeapon(weapon);
        this.validateAttacker(attacker);
        
        // Calcular daño base del arma
        const baseDamage = this.calculateWeaponBaseDamage(weapon);
        
        // Aplicar modificadores de atributos del atacante
        const strengthBonus = this.calculateStrengthBonus(attacker, weapon);
        const dexterityBonus = this.calculateDexterityBonus(attacker, weapon);
        const skillBonus = this.calculateSkillBonus(attacker, weapon);
        
        // Calcular multiplicador de tipo de golpe
        const hitTypeMultiplier = this.getHitTypeMultiplier(hitType, weapon);
        
        // Tirar dados de daño si corresponde
        const diceDamage = this.rollDamageDice(weapon);
        
        // Calcular total bruto
        const rawTotal = (baseDamage + strengthBonus + dexterityBonus + skillBonus + diceDamage) * hitTypeMultiplier;
        
        return {
            weaponName: weapon.name,
            weaponType: weapon.damageType || 'SLASHING',
            attackerName: attacker.name,
            hitType: hitType,
            
            // Componentes del cálculo
            components: {
                baseDamage: parseFloat(baseDamage.toFixed(2)),
                strengthBonus: parseFloat(strengthBonus.toFixed(2)),
                dexterityBonus: parseFloat(dexterityBonus.toFixed(2)),
                skillBonus: parseFloat(skillBonus.toFixed(2)),
                diceDamage: parseFloat(diceDamage.toFixed(2)),
                hitTypeMultiplier: parseFloat(hitTypeMultiplier.toFixed(2))
            },
            
            // Total bruto
            rawDamage: parseFloat(rawTotal.toFixed(2)),
            
            // Metadatos
            timestamp: new Date().toISOString(),
            calculationDetails: `${baseDamage.toFixed(1)} base + ${strengthBonus.toFixed(1)} STR + ` +
                              `${dexterityBonus.toFixed(1)} DEX + ${skillBonus.toFixed(1)} skill + ` +
                              `${diceDamage.toFixed(1)} dice × ${hitTypeMultiplier.toFixed(2)} multiplier`
        };
    }

    /**
     * Calcula el daño final después de la mitigación
     * @param {Object} rawDamageResult - Resultado del daño bruto
     * @param {Object} defender - Objeto del defensor
     * @param {Object} armor - Objeto de la armadura
     * @param {Object} attackResult - Resultado del ataque (para modificadores)
     * @returns {Object} Resultado del daño final
     */
    calculateFinalDamage(rawDamageResult, defender, armor = {}, attackResult = {}) {
        this.validateRawDamageResult(rawDamageResult);
        
        const rawDamage = rawDamageResult.rawDamage;
        const damageType = rawDamageResult.weaponType;
        
        // Calcular defensa efectiva de la armadura
        const effectiveArmor = this.calculateEffectiveArmor(armor, damageType, defender);
        
        // Aplicar fórmula de mitigación hiperbólica
        const mitigationCoefficient = this.calculateMitigationCoefficient(effectiveArmor);
        const mitigatedDamage = rawDamage * mitigationCoefficient;
        
        // Aplicar reducción plana
        const flatReduction = this.calculateFlatReduction(armor, damageType);
        const afterFlatReduction = Math.max(0, mitigatedDamage - flatReduction);
        
        // Aplicar modificadores de posición y condiciones
        const positionModifier = this.calculatePositionModifier(attackResult);
        const conditionModifier = this.calculateConditionModifier(defender);
        
        // Calcular daño final
        let finalDamage = afterFlatReduction * positionModifier * conditionModifier;
        
        // Aplicar daño mínimo garantizado
        finalDamage = Math.max(this.DAMAGE_CONSTANTS.MIN_DAMAGE, finalDamage);
        
        // Aplicar resistencia del defensor
        const resistanceModifier = this.calculateResistanceModifier(defender, damageType);
        finalDamage = finalDamage * resistanceModifier;
        
        // Redondear a entero para simplicidad en el juego
        finalDamage = Math.round(finalDamage);
        
        return {
            // Información básica
            defenderName: defender.name || 'Desconocido',
            armorName: armor.name || 'Sin armadura',
            
            // Daños en cada etapa
            rawDamage: parseFloat(rawDamage.toFixed(2)),
            mitigatedDamage: parseFloat(mitigatedDamage.toFixed(2)),
            afterFlatReduction: parseFloat(afterFlatReduction.toFixed(2)),
            finalDamage: finalDamage,
            
            // Mitigación
            effectiveArmor: parseFloat(effectiveArmor.toFixed(2)),
            mitigationCoefficient: parseFloat(mitigationCoefficient.toFixed(3)),
            flatReduction: parseFloat(flatReduction.toFixed(2)),
            damageReductionPercent: parseFloat(((1 - mitigationCoefficient) * 100).toFixed(1)),
            
            // Modificadores
            positionModifier: parseFloat(positionModifier.toFixed(2)),
            conditionModifier: parseFloat(conditionModifier.toFixed(2)),
            resistanceModifier: parseFloat(resistanceModifier.toFixed(2)),
            
            // Análisis
            analysis: {
                armorEffectiveness: parseFloat((mitigationCoefficient * 100).toFixed(1)) + '%',
                damagePrevented: parseFloat((rawDamage - finalDamage).toFixed(2)),
                percentPrevented: parseFloat(((rawDamage - finalDamage) / rawDamage * 100).toFixed(1)) + '%',
                isMinimumDamage: finalDamage === this.DAMAGE_CONSTANTS.MIN_DAMAGE
            },
            
            // Metadatos
            timestamp: new Date().toISOString(),
            damageType: damageType,
            calculationDetails: `Coef = 100 / (100 + (${effectiveArmor.toFixed(1)} × 0.5)) = ${mitigationCoefficient.toFixed(3)}`
        };
    }

    /**
     * Resuelve el daño completo en un ataque
     * @param {Object} attacker - Atacante
     * @param {Object} weapon - Arma
     * @param {Object} defender - Defensor
     * @param {Object} armor - Armadura
     * @param {string} hitType - Tipo de golpe
     * @param {Object} attackResult - Resultado del ataque
     * @returns {Object} Resultado completo del daño
     */
    resolveDamage(attacker, weapon, defender, armor = {}, hitType = 'NORMAL', attackResult = {}) {
        const rawDamage = this.calculateRawDamage(weapon, attacker, hitType);
        const finalDamage = this.calculateFinalDamage(rawDamage, defender, armor, attackResult);
        
        return {
            damageId: this.generateDamageId(),
            timestamp: new Date().toISOString(),
            
            // Información del combate
            attacker: attacker.name,
            defender: defender.name,
            weapon: weapon.name,
            armor: armor.name || 'Ninguna',
            hitType: hitType,
            
            // Resultados
            rawDamage,
            finalDamage,
            
            // Resumen
            summary: {
                rawDamage: rawDamage.rawDamage,
                finalDamage: finalDamage.finalDamage,
                damageReduction: finalDamage.analysis.damagePrevented,
                reductionPercent: finalDamage.analysis.percentPrevented,
                armorEffectiveness: finalDamage.analysis.armorEffectiveness
            },
            
            // Análisis detallado
            detailedAnalysis: this.analyzeDamageBreakdown(rawDamage, finalDamage)
        };
    }

    /**
     * Calcula el coeficiente de mitigación hiperbólica
     * Fórmula: Coef = 100 / (100 + (Armor × 0.5))
     * @param {number} armorValue - Valor de armadura
     * @returns {number} Coeficiente de mitigación (0-1)
     */
    calculateMitigationCoefficient(armorValue) {
        if (armorValue <= 0) return 1.0;
        
        const { baseConstant, armorMultiplier } = this.DAMAGE_CONSTANTS.MITIGATION_FORMULA;
        const coefficient = baseConstant / (baseConstant + (armorValue * armorMultiplier));
        
        // El coeficiente nunca debe ser 0 (siempre pasa algo de daño)
        return Math.max(0.01, parseFloat(coefficient.toFixed(4)));
    }

    /**
     * Genera datos para gráfica de mitigación vs armadura
     * @param {number} maxArmor - Armadura máxima a graficar
     * @param {number} step - Incremento entre puntos
     * @returns {Object} Datos para la gráfica
     */
    generateMitigationGraphData(maxArmor = 100, step = 5) {
        const data = [];
        const labels = [];
        
        for (let armor = 0; armor <= maxArmor; armor += step) {
            const coefficient = this.calculateMitigationCoefficient(armor);
            const damagePercent = coefficient * 100;
            const reductionPercent = 100 - damagePercent;
            
            data.push({
                armor: armor,
                coefficient: parseFloat(coefficient.toFixed(4)),
                damagePercent: parseFloat(damagePercent.toFixed(1)),
                reductionPercent: parseFloat(reductionPercent.toFixed(1)),
                damageAtArmor: parseFloat((100 * coefficient).toFixed(1)) // Daño de 100 base
            });
            
            labels.push(armor.toString());
        }
        
        // Calcular puntos clave
        const keyPoints = this.calculateKeyMitigationPoints(maxArmor);
        
        return {
            data: data,
            labels: labels,
            keyPoints: keyPoints,
            formula: 'Coef = 100 / (100 + (Armor × 0.5))',
            description: 'Mitigación hiperbólica: cada punto de armadura es menos efectivo que el anterior'
        };
    }

    /**
     * Simula múltiples ataques para análisis estadístico
     * @param {Object} attacker - Atacante
     * @param {Object} weapon - Arma
     * @param {Object} defender - Defensor
     * @param {Object} armor - Armadura
     * @param {number} iterations - Número de simulaciones
     * @returns {Object} Estadísticas de daño
     */
    simulateDamage(attacker, weapon, defender, armor = {}, iterations = 1000) {
        const results = {
            totalSimulations: iterations,
            rawDamages: [],
            finalDamages: [],
            mitigations: [],
            damageReductions: [],
            details: []
        };
        
        for (let i = 0; i < iterations; i++) {
            // Generar tipo de golpe aleatorio ponderado
            const hitType = this.getRandomHitType();
            
            const damageResult = this.resolveDamage(
                attacker, weapon, defender, armor, hitType
            );
            
            results.rawDamages.push(damageResult.summary.rawDamage);
            results.finalDamages.push(damageResult.summary.finalDamage);
            results.mitigations.push(parseFloat(damageResult.summary.reductionPercent));
            results.damageReductions.push(damageResult.summary.damageReduction);
            results.details.push(damageResult);
        }
        
        // Calcular estadísticas
        results.statistics = this.calculateDamageStatistics(results);
        
        // Análisis por tipo de golpe
        results.byHitType = this.analyzeByHitType(results.details);
        
        // Efectividad de la armadura
        results.armorEffectiveness = this.analyzeArmorEffectiveness(results);
        
        return results;
    }

    // ===================== MÉTODOS DE APOYO =====================

    /**
     * Valida que el arma tenga los atributos necesarios
     */
    validateWeapon(weapon) {
        if (!weapon || typeof weapon !== 'object') {
            throw new Error('Arma inválida');
        }
        
        if (!weapon.name) {
            throw new Error('Arma debe tener un nombre');
        }
        
        if (weapon.baseDamage === undefined && !weapon.damageDice) {
            throw new Error('Arma debe tener daño base o dados de daño');
        }
    }

    /**
     * Valida que el atacante tenga los atributos necesarios
     */
    validateAttacker(attacker) {
        if (!attacker || typeof attacker !== 'object') {
            throw new Error('Atacante inválido');
        }
        
        if (!attacker.name) {
            throw new Error('Atacante debe tener un nombre');
        }
    }

    /**
     * Valida el resultado de daño bruto
     */
    validateRawDamageResult(rawDamageResult) {
        if (!rawDamageResult || typeof rawDamageResult !== 'object') {
            throw new Error('Resultado de daño bruto inválido');
        }
        
        if (rawDamageResult.rawDamage === undefined) {
            throw new Error('Resultado de daño bruto debe tener rawDamage');
        }
    }

    /**
     * Calcula el daño base del arma
     */
    calculateWeaponBaseDamage(weapon) {
        let baseDamage = weapon.baseDamage || 0;
        
        // Si hay dados de daño, calcular el promedio
        if (weapon.damageDice) {
            const dicePattern = /(\d+)d(\d+)([+-]\d+)?/;
            const match = weapon.damageDice.match(dicePattern);
            
            if (match) {
                const diceCount = parseInt(match[1]);
                const diceSides = parseInt(match[2]);
                const modifier = match[3] ? parseInt(match[3]) : 0;
                
                // Promedio de un dado: (caras + 1) / 2
                const averagePerDie = (diceSides + 1) / 2;
                baseDamage += (diceCount * averagePerDie) + modifier;
            }
        }
        
        return baseDamage;
    }

    /**
     * Calcula bonus por fuerza
     */
    calculateStrengthBonus(attacker, weapon) {
        if (!attacker.strength) return 0;
        
        let strengthMultiplier = 0.5; // Multiplicador base
        
        // Armas pesadas se benefician más de la fuerza
        if (weapon.weight && weapon.weight > 5) {
            strengthMultiplier += 0.2;
        }
        
        // Armas a dos manos se benefician más
        if (weapon.hands && weapon.hands === 2) {
            strengthMultiplier += 0.3;
        }
        
        return attacker.strength * strengthMultiplier;
    }

    /**
     * Calcula bonus por destreza
     */
    calculateDexterityBonus(attacker, weapon) {
        if (!attacker.dexterity) return 0;
        
        let dexterityMultiplier = 0.3; // Multiplicador base
        
        // Armas ligeras y de precisión se benefician más de la destreza
        if (weapon.type === 'FINESSE' || (weapon.weight && weapon.weight < 3)) {
            dexterityMultiplier += 0.4;
        }
        
        // Armas a distancia siempre usan destreza
        if (weapon.range && weapon.range > 0) {
            dexterityMultiplier = 0.8;
        }
        
        return attacker.dexterity * dexterityMultiplier;
    }

    /**
     * Calcula bonus por habilidad
     */
    calculateSkillBonus(attacker, weapon) {
        if (!attacker.skillLevel) return 0;
        
        // Cada nivel de habilidad añade 0.5 de daño base
        return attacker.skillLevel * 0.5;
    }

    /**
     * Obtiene multiplicador por tipo de golpe
     */
    getHitTypeMultiplier(hitType, weapon) {
        const multipliers = {
            'CRITICAL': weapon.criticalMultiplier || 2.0,
            'SOLID_HIT': 1.0,
            'GRAZE': 0.5,
            'MISS': 0
        };
        
        return multipliers[hitType] || 1.0;
    }

    /**
     * Tira dados de daño
     */
    rollDamageDice(weapon) {
        if (!weapon.damageDice) return 0;
        
        const dicePattern = /(\d+)d(\d+)([+-]\d+)?/;
        const match = weapon.damageDice.match(dicePattern);
        
        if (!match) return 0;
        
        const diceCount = parseInt(match[1]);
        const diceSides = parseInt(match[2]);
        const modifier = match[3] ? parseInt(match[3]) : 0;
        
        let total = 0;
        for (let i = 0; i < diceCount; i++) {
            total += Math.floor(Math.random() * diceSides) + 1;
        }
        
        return total + modifier;
    }

    /**
     * Calcula armadura efectiva considerando tipo de daño
     */
    calculateEffectiveArmor(armor, damageType, defender) {
        let baseArmor = armor.defense || 0;
        
        // Modificar por tipo de daño
        const damageTypeInfo = this.DAMAGE_CONSTANTS.DAMAGE_TYPES[damageType] || 
                               this.DAMAGE_CONSTANTS.DAMAGE_TYPES.SLASHING;
        
        baseArmor *= damageTypeInfo.armorEffectiveness;
        
        // Modificar por material de la armadura
        if (armor.material) {
            const materialInfo = this.DAMAGE_CONSTANTS.MATERIAL_RESISTANCES[armor.material];
            if (materialInfo) {
                baseArmor += materialInfo.baseDefense || 0;
                
                // Bonificaciones específicas por tipo de daño
                if (damageType === 'SLASHING' && materialInfo.vsSlashing) {
                    baseArmor *= materialInfo.vsSlashing;
                } else if (damageType === 'PIERCING' && materialInfo.vsPiercing) {
                    baseArmor *= materialInfo.vsPiercing;
                } else if (damageType === 'BLUDGEONING' && materialInfo.vsBludgeoning) {
                    baseArmor *= materialInfo.vsBludgeoning;
                }
            }
        }
        
        // Modificar por estado del defensor
        if (defender.condition === 'PRONE') {
            baseArmor *= 0.7; // 30% menos efectiva cuando está en el suelo
        } else if (defender.condition === 'STUNNED') {
            baseArmor *= 0.5; // 50% menos efectiva cuando está aturdido
        }
        
        return Math.max(0, baseArmor);
    }

    /**
     * Calcula reducción plana de daño
     */
    calculateFlatReduction(armor, damageType) {
        let reduction = armor.flatReduction || 0;
        
        // Algunos materiales tienen reducción plana adicional
        if (armor.material) {
            const materialInfo = this.DAMAGE_CONSTANTS.MATERIAL_RESISTANCES[armor.material];
            if (materialInfo && materialInfo.baseDefense) {
                reduction += materialInfo.baseDefense * 0.1; // 10% de la defensa base
            }
        }
        
        return reduction;
    }

    /**
     * Calcula modificador por posición
     */
    calculatePositionModifier(attackResult) {
        let modifier = 1.0;
        
        if (attackResult.position === 'FLANKING') {
            modifier *= this.DAMAGE_CONSTANTS.POSITION_MODIFIERS.FLANKING;
        }
        
        if (attackResult.position === 'REAR') {
            modifier *= this.DAMAGE_CONSTANTS.POSITION_MODIFIERS.REAR;
        }
        
        if (attackResult.position === 'HIGH_GROUND') {
            modifier *= this.DAMAGE_CONSTANTS.POSITION_MODIFIERS.HIGH_GROUND;
        }
        
        if (attackResult.targetPosition === 'PRONE') {
            modifier *= this.DAMAGE_CONSTANTS.POSITION_MODIFIERS.PRONE_TARGET;
        }
        
        if (attackResult.isSurprise) {
            modifier *= this.DAMAGE_CONSTANTS.POSITION_MODIFIERS.SURPRISE;
        }
        
        return modifier;
    }

    /**
     * Calcula modificador por condiciones
     */
    calculateConditionModifier(defender) {
        let modifier = 1.0;
        
        if (defender.condition === 'BLEEDING') {
            modifier *= 1.2; // 20% más daño a objetivos sangrando
        }
        
        if (defender.condition === 'POISONED') {
            modifier *= 1.15; // 15% más daño a objetivos envenenados
        }
        
        if (defender.condition === 'BURNING') {
            modifier *= 1.25; // 25% más daño a objetivos en llamas
        }
        
        return modifier;
    }

    /**
     * Calcula modificador por resistencia
     */
    calculateResistanceModifier(defender, damageType) {
        let modifier = 1.0;
        
        // Resistencia genérica
        if (defender.resistance) {
            modifier *= (1 - defender.resistance);
        }
        
        // Resistencia específica por tipo de daño
        if (defender.damageResistances && defender.damageResistances[damageType]) {
            modifier *= (1 - defender.damageResistances[damageType]);
        }
        
        // Vulnerabilidad específica por tipo de daño
        if (defender.damageVulnerabilities && defender.damageVulnerabilities[damageType]) {
            modifier *= (1 + defender.damageVulnerabilities[damageType]);
        }
        
        return Math.max(0.1, modifier); // Mínimo 10% de daño
    }

    /**
     * Obtiene tipo de golpe aleatorio ponderado
     */
    getRandomHitType() {
        const weights = {
            'CRITICAL': 0.05,    // 5%
            'SOLID_HIT': 0.60,   // 60%
            'GRAZE': 0.25,       // 25%
            'MISS': 0.10         // 10%
        };
        
        const rand = Math.random();
        let cumulative = 0;
        
        for (const [type, weight] of Object.entries(weights)) {
            cumulative += weight;
            if (rand <= cumulative) {
                return type;
            }
        }
        
        return 'SOLID_HIT';
    }

    /**
     * Calcula estadísticas de daño
     */
    calculateDamageStatistics(results) {
        const stats = {
            // Raw Damage
            averageRawDamage: this.calculateAverage(results.rawDamages),
            minRawDamage: Math.min(...results.rawDamages),
            maxRawDamage: Math.max(...results.rawDamages),
            rawDamageStdDev: this.calculateStandardDeviation(results.rawDamages),
            
            // Final Damage
            averageFinalDamage: this.calculateAverage(results.finalDamages),
            minFinalDamage: Math.min(...results.finalDamages),
            maxFinalDamage: Math.max(...results.finalDamages),
            finalDamageStdDev: this.calculateStandardDeviation(results.finalDamages),
            
            // Mitigation
            averageMitigation: this.calculateAverage(results.mitigations),
            minMitigation: Math.min(...results.mitigations),
            maxMitigation: Math.max(...results.mitigations),
            
            // Reduction
            averageReduction: this.calculateAverage(results.damageReductions),
            totalReduction: results.damageReductions.reduce((a, b) => a + b, 0)
        };
        
        // Eficiencia de daño (final/raw)
        stats.damageEfficiency = parseFloat((stats.averageFinalDamage / stats.averageRawDamage * 100).toFixed(1));
        
        return stats;
    }

    /**
     * Analiza daño por tipo de golpe
     */
    analyzeByHitType(details) {
        const byType = {
            CRITICAL: { count: 0, totalRaw: 0, totalFinal: 0, instances: [] },
            SOLID_HIT: { count: 0, totalRaw: 0, totalFinal: 0, instances: [] },
            GRAZE: { count: 0, totalRaw: 0, totalFinal: 0, instances: [] },
            MISS: { count: 0, totalRaw: 0, totalFinal: 0, instances: [] }
        };
        
        details.forEach(detail => {
            const type = detail.hitType;
            if (byType[type]) {
                byType[type].count++;
                byType[type].totalRaw += detail.summary.rawDamage;
                byType[type].totalFinal += detail.summary.finalDamage;
                byType[type].instances.push(detail);
            }
        });
        
        // Calcular promedios
        Object.keys(byType).forEach(type => {
            if (byType[type].count > 0) {
                byType[type].averageRaw = byType[type].totalRaw / byType[type].count;
                byType[type].averageFinal = byType[type].totalFinal / byType[type].count;
            }
        });
        
        return byType;
    }

    /**
     * Analiza efectividad de la armadura
     */
    analyzeArmorEffectiveness(results) {
        const totalRaw = results.rawDamages.reduce((a, b) => a + b, 0);
        const totalFinal = results.finalDamages.reduce((a, b) => a + b, 0);
        const totalPrevented = totalRaw - totalFinal;
        
        return {
            totalDamagePrevented: parseFloat(totalPrevented.toFixed(2)),
            percentDamagePrevented: parseFloat((totalPrevented / totalRaw * 100).toFixed(1)),
            averageDamagePerHit: parseFloat((totalFinal / results.totalSimulations).toFixed(2)),
            hitsAtMinimumDamage: results.finalDamages.filter(dmg => dmg === this.DAMAGE_CONSTANTS.MIN_DAMAGE).length,
            percentAtMinimumDamage: parseFloat((results.finalDamages.filter(dmg => dmg === this.DAMAGE_CONSTANTS.MIN_DAMAGE).length / 
                                               results.totalSimulations * 100).toFixed(1))
        };
    }

    /**
     * Calcula puntos clave en la curva de mitigación
     */
    calculateKeyMitigationPoints(maxArmor) {
        const points = [];
        
        // Armadura comúnmente encontrada en el juego
        const commonArmorValues = [0, 5, 10, 15, 20, 30, 50, 75, 100];
        
        commonArmorValues.forEach(armor => {
            if (armor <= maxArmor) {
                const coeff = this.calculateMitigationCoefficient(armor);
                points.push({
                    armor: armor,
                    coefficient: parseFloat(coeff.toFixed(4)),
                    damagePercent: parseFloat((coeff * 100).toFixed(1)),
                    description: this.getArmorDescription(armor)
                });
            }
        });
        
        // Puntos de referencia importantes
        points.push({
            armor: 100,
            coefficient: parseFloat(this.calculateMitigationCoefficient(100).toFixed(4)),
            damagePercent: parseFloat((this.calculateMitigationCoefficient(100) * 100).toFixed(1)),
            description: 'Armadura muy pesada (caballero con armadura completa)'
        });
        
        points.push({
            armor: 200,
            coefficient: parseFloat(this.calculateMitigationCoefficient(200).toFixed(4)),
            damagePercent: parseFloat((this.calculateMitigationCoefficient(200) * 100).toFixed(1)),
            description: 'Armadura extrema (creatura legendaria/boss)'
        });
        
        return points;
    }

    /**
     * Obtiene descripción de nivel de armadura
     */
    getArmorDescription(armor) {
        if (armor === 0) return 'Sin armadura';
        if (armor <= 5) return 'Armadura ligera (cuero/pieles)';
        if (armor <= 15) return 'Armadura media (cota de malla)';
        if (armor <= 30) return 'Armadura pesada (placas)';
        if (armor <= 50) return 'Armadura muy pesada (caballero completo)';
        if (armor <= 100) return 'Armadura de criatura grande';
        return 'Armadura legendaria/mágica';
    }

    /**
     * Analiza el desglose del daño
     */
    analyzeDamageBreakdown(rawDamage, finalDamage) {
        return {
            rawDamageComponents: rawDamage.components,
            mitigationBreakdown: {
                coefficient: finalDamage.mitigationCoefficient,
                flatReduction: finalDamage.flatReduction,
                totalMitigation: finalDamage.damageReductionPercent + '%'
            },
            modifierBreakdown: {
                position: finalDamage.positionModifier,
                condition: finalDamage.conditionModifier,
                resistance: finalDamage.resistanceModifier,
                totalModifier: parseFloat((finalDamage.positionModifier * 
                                          finalDamage.conditionModifier * 
                                          finalDamage.resistanceModifier).toFixed(3))
            },
            efficiency: {
                rawToFinalRatio: parseFloat((finalDamage.finalDamage / rawDamage.rawDamage).toFixed(3)),
                armorEffectiveness: finalDamage.analysis.armorEffectiveness
            }
        };
    }

    /**
     * Calcula promedio
     */
    calculateAverage(values) {
        return parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));
    }

    /**
     * Calcula desviación estándar
     */
    calculateStandardDeviation(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
        return parseFloat(Math.sqrt(variance).toFixed(2));
    }

    /**
     * Genera ID único para el daño
     */
    generateDamageId() {
        return `dmg_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
    }

    /**
     * Genera gráfica ASCII de mitigación
     */
    generateAsciiGraph(maxArmor = 100, width = 60, height = 20) {
        const data = this.generateMitigationGraphData(maxArmor, Math.ceil(maxArmor / width));
        
        let graph = '╔' + '═'.repeat(width + 2) + '╗\n';
        graph += '║ CURVA DE MITIGACIÓN HIPERBÓLICA ║\n';
        graph += '╠' + '═'.repeat(width + 2) + '╣\n';
        graph += '║ Daño recibido vs Armadura          ║\n';
        graph += '║ Coef = 100 / (100 + (Armor × 0.5)) ║\n';
        graph += '╠' + '═'.repeat(width + 2) + '╣\n';
        
        // Eje Y (daño %)
        for (let y = height; y >= 0; y--) {
            const damagePercent = (y / height) * 100;
            
            if (y === height) graph += '║ 100% ';
            else if (y === Math.floor(height / 2)) graph += '║  50% ';
            else if (y === 0) graph += '║   0% ';
            else graph += '║      ';
            
            // Encontrar punto en esta línea Y
            let line = '';
            for (let x = 0; x <= width; x++) {
                const armor = (x / width) * maxArmor;
                const coeff = this.calculateMitigationCoefficient(armor);
                const pointDamagePercent = coeff * 100;
                
                if (Math.abs(pointDamagePercent - damagePercent) <= (100 / height / 2)) {
                    line += '█';
                } else {
                    line += ' ';
                }
            }
            
            graph += line + ' ║\n';
        }
        
        graph += '╠' + '─'.repeat(width + 2) + '╣\n';
        
        // Eje X (armadura)
        graph += '║  0';
        for (let i = 1; i <= 3; i++) {
            const armor = Math.floor((i / 3) * maxArmor);
            graph += ' '.repeat(Math.floor(width / 3) - 3) + armor.toString().padStart(3, ' ');
        }
        graph += ' ║\n';
        graph += '╚' + '═'.repeat(width + 2) + '╝\n';
        
        // Puntos clave
        graph += '\n📊 PUNTOS CLAVE:\n';
        graph += '─'.repeat(40) + '\n';
        
        data.keyPoints.slice(0, 8).forEach(point => {
            graph += `• ${point.armor} armadura: ${point.damagePercent}% daño (${point.description})\n`;
        });
        
        return graph;
    }

    /**
     * Genera reporte de daño completo
     */
    generateDamageReport(damageResult) {
        let report = '═'.repeat(70) + '\n';
        report += 'INFORME DE DAÑO - MITIGACIÓN HIPERBÓLICA\n';
        report += '═'.repeat(70) + '\n\n';
        
        // Información básica
        report += '📋 INFORMACIÓN DEL ATAQUE:\n';
        report += '─'.repeat(40) + '\n';
        report += `• Atacante: ${damageResult.attacker}\n`;
        report += `• Defensor: ${damageResult.defender}\n`;
        report += `• Arma: ${damageResult.weapon}\n`;
        report += `• Armadura: ${damageResult.armor}\n`;
        report += `• Tipo de golpe: ${damageResult.hitType}\n\n`;
        
        // Desglose de daño bruto
        report += '🎯 DAÑO BRUTO:\n';
        report += '─'.repeat(40) + '\n';
        const raw = damageResult.rawDamage;
        report += `• Total: ${raw.rawDamage.toFixed(1)}\n`;
        report += `• Desglose: ${raw.calculationDetails}\n\n`;
        
        // Mitigación
        report += '🛡️ MITIGACIÓN:\n';
        report += '─'.repeat(40) + '\n';
        const final = damageResult.finalDamage;
        report += `• Armadura efectiva: ${final.effectiveArmor.toFixed(1)}\n`;
        report += `• Coeficiente: ${final.mitigationCoefficient.toFixed(3)}\n`;
        report += `• Reducción plana: ${final.flatReduction.toFixed(1)}\n`;
        report += `• Daño mitigado: ${final.mitigatedDamage.toFixed(1)}\n`;
        report += `• Después de reducción: ${final.afterFlatReduction.toFixed(1)}\n\n`;
        
        // Modificadores
        report += '📊 MODIFICADORES APLICADOS:\n';
        report += '─'.repeat(40) + '\n';
        report += `• Posición: ×${final.positionModifier.toFixed(2)}\n`;
        report += `• Condición: ×${final.conditionModifier.toFixed(2)}\n`;
        report += `• Resistencia: ×${final.resistanceModifier.toFixed(2)}\n\n`;
        
        // Resultado final
        report += '💥 DAÑO FINAL:\n';
        report += '─'.repeat(40) + '\n';
        report += `• Daño final: ${final.finalDamage}\n`;
        report += `• Daño prevenido: ${final.analysis.damagePrevented.toFixed(1)}\n`;
        report += `• Efectividad armadura: ${final.analysis.armorEffectiveness}\n`;
        
        if (final.analysis.isMinimumDamage) {
            report += `• ⚠️ Daño mínimo aplicado\n`;
        }
        
        return report;
    }
}

// Exportar la clase
module.exports = DamageCalculator;