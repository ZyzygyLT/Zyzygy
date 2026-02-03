/**
 * Sistema de Combate - Fase C (Resistencia Mágica)
 * Maneja resistencia a daño mágico/elemental con límites y especializaciones
 */

class MagicResistance {
    constructor() {
        // Constantes del sistema
        this.RESISTANCE_CONSTANTS = {
            // Fórmula base: (WILL × 1.5) / 100 (cap 75%)
            BASE_FORMULA: {
                willMultiplier: 1.5,
                baseDivisor: 100,
                maximumCap: 0.75, // 75%
                minimumCap: 0.05  // 5% mínimo de daño siempre pasa
            },
            
            // Tipos de daño mágico
            MAGIC_DAMAGE_TYPES: {
                FIRE: {
                    name: 'Fuego',
                    opposite: 'ICE',
                    description: 'Daño por calor y llamas',
                    resistanceType: 'FIRE_RESISTANCE'
                },
                ICE: {
                    name: 'Hielo',
                    opposite: 'FIRE',
                    description: 'Daño por frío extremo',
                    resistanceType: 'COLD_RESISTANCE'
                },
                LIGHTNING: {
                    name: 'Rayo',
                    opposite: 'EARTH',
                    description: 'Daño eléctrico',
                    resistanceType: 'LIGHTNING_RESISTANCE'
                },
                HOLY: {
                    name: 'Sagrado',
                    opposite: 'SHADOW',
                    description: 'Daño divino',
                    resistanceType: 'HOLY_RESISTANCE'
                },
                SHADOW: {
                    name: 'Sombras',
                    opposite: 'HOLY',
                    description: 'Daño oscuro',
                    resistanceType: 'SHADOW_RESISTANCE'
                },
                POISON: {
                    name: 'Veneno',
                    opposite: 'NATURE',
                    description: 'Daño tóxico',
                    resistanceType: 'POISON_RESISTANCE'
                },
                NATURE: {
                    name: 'Naturaleza',
                    opposite: 'POISON',
                    description: 'Daño natural/árcano',
                    resistanceType: 'NATURE_RESISTANCE'
                },
                PSYCHIC: {
                    name: 'Psíquico',
                    opposite: null,
                    description: 'Daño mental',
                    resistanceType: 'PSYCHIC_RESISTANCE'
                },
                ARCANE: {
                    name: 'Arcano',
                    opposite: null,
                    description: 'Daño puro mágico',
                    resistanceType: 'ARCANE_RESISTANCE'
                },
                EARTH: {
                    name: 'Tierra',
                    opposite: 'LIGHTNING',
                    description: 'Daño telúrico',
                    resistanceType: 'EARTH_RESISTANCE'
                },
                WATER: {
                    name: 'Agua',
                    opposite: 'FIRE',
                    description: 'Daño acuático',
                    resistanceType: 'WATER_RESISTANCE'
                },
                WIND: {
                    name: 'Viento',
                    opposite: 'EARTH',
                    description: 'Daño de aire',
                    resistanceType: 'WIND_RESISTANCE'
                }
            },
            
            // Elementos opuestos (daño extra)
            OPPOSITE_ELEMENTS: {
                FIRE: 'ICE',
                ICE: 'FIRE',
                LIGHTNING: 'EARTH',
                EARTH: 'LIGHTNING',
                HOLY: 'SHADOW',
                SHADOW: 'HOLY',
                WATER: 'FIRE',
                WIND: 'EARTH'
            },
            
            // Modificadores por raza/clase
            RACE_MODIFIERS: {
                HUMAN: { baseResistance: 0.0, willBonus: 0 },
                ELF: { arcaneResistance: 0.1, natureResistance: 0.15 },
                DWARF: { earthResistance: 0.2, poisonResistance: 0.15 },
                ORC: { shadowResistance: 0.1, psychicResistance: -0.1 }, // Vulnerable a psíquico
                DRAGONBORN: { fireResistance: 0.3, lightningResistance: 0.1 },
                UNDEAD: { holyResistance: -0.5, shadowResistance: 0.3, poisonResistance: 1.0 }, // Inmune a veneno
                DEMON: { fireResistance: 0.5, shadowResistance: 0.4, holyResistance: -0.3 }
            },
            
            // Modificadores por clase
            CLASS_MODIFIERS: {
                WARRIOR: { baseResistance: -0.1 }, // Menos resistencia mágica
                MAGE: { arcaneResistance: 0.2, willBonus: 5 },
                CLERIC: { holyResistance: 0.3, shadowResistance: 0.2 },
                ROGUE: { poisonResistance: 0.15 },
                PALADIN: { holyResistance: 0.4, shadowResistance: -0.1 },
                DRUID: { natureResistance: 0.3, fireResistance: 0.1, iceResistance: 0.1 },
                SORCERER: { allResistance: 0.1, willBonus: 3 }
            },
            
            // Objetos mágicos y encantamientos
            ENCHANTMENT_MODIFIERS: {
                MINOR: 0.05,
                MODERATE: 0.10,
                MAJOR: 0.15,
                LEGENDARY: 0.25,
                MYTHIC: 0.35
            },
            
            // Estados que afectan resistencia
            CONDITION_MODIFIERS: {
                BLESSED: { holyResistance: 0.2, shadowResistance: -0.1 },
                CURSED: { holyResistance: -0.3, shadowResistance: 0.2 },
                WET: { fireResistance: 0.3, lightningResistance: -0.4 },
                BURNING: { iceResistance: -0.3, fireResistance: 0.1 },
                FROZEN: { fireResistance: -0.4, iceResistance: 0.2 },
                SHOCKED: { lightningResistance: -0.3 }
            }
        };
    }

    /**
     * Calcula la resistencia mágica base de un defensor
     * Fórmula: (WILL × 1.5) / 100 (cap 75%)
     * @param {Object} defender - Objeto del defensor
     * @param {string} damageType - Tipo de daño mágico
     * @returns {Object} Resultado del cálculo de resistencia
     */
    calculateMagicResistance(defender, damageType) {
        this.validateDefender(defender);
        
        const damageTypeInfo = this.RESISTANCE_CONSTANTS.MAGIC_DAMAGE_TYPES[damageType];
        if (!damageTypeInfo) {
            throw new Error(`Tipo de daño mágico inválido: ${damageType}`);
        }
        
        // Calcular resistencia base por voluntad
        const baseResistance = this.calculateBaseResistance(defender);
        
        // Aplicar modificadores específicos del tipo de daño
        const typeSpecificResistance = this.calculateTypeSpecificResistance(defender, damageType);
        
        // Aplicar modificadores por raza y clase
        const racialResistance = this.calculateRacialResistance(defender, damageType);
        const classResistance = this.calculateClassResistance(defender, damageType);
        
        // Aplicar modificadores por equipo
        const equipmentResistance = this.calculateEquipmentResistance(defender, damageType);
        
        // Aplicar modificadores por condiciones
        const conditionResistance = this.calculateConditionResistance(defender, damageType);
        
        // Calcular resistencia total
        // Para no-elementales con resistencia específica, usa SOLO esa (reemplaza fórmula base)
        const isElemental = this.isElementalDamage(damageType);
        let totalResistance;
        
        if (!isElemental && typeSpecificResistance > 0) {
            // No-elemental con resistencia específica: usa solo la específica + equipo/condición
            totalResistance = typeSpecificResistance + equipmentResistance + conditionResistance;
        } else {
            // Elemental o sin resistencia específica: suma todos los componentes
            totalResistance = baseResistance + 
                             typeSpecificResistance + 
                             racialResistance + 
                             classResistance + 
                             equipmentResistance + 
                             conditionResistance;
        }
        
        // Aplicar límite máximo (75%)
        totalResistance = Math.min(totalResistance, this.RESISTANCE_CONSTANTS.BASE_FORMULA.maximumCap);
        
        // Aplicar límite mínimo (siempre pasa algo de daño)
        totalResistance = Math.max(totalResistance, -1.0); // Permite vulnerabilidades hasta -100%
        
        
        return {
            defenderId: defender.id,
            defenderName: defender.name,
            damageType: damageType,
            damageTypeName: damageTypeInfo.name,
            
            // Componentes del cálculo
            components: {
                baseResistance: parseFloat(baseResistance.toFixed(3)),
                typeSpecificResistance: parseFloat(typeSpecificResistance.toFixed(3)),
                racialResistance: parseFloat(racialResistance.toFixed(3)),
                classResistance: parseFloat(classResistance.toFixed(3)),
                equipmentResistance: parseFloat(equipmentResistance.toFixed(3)),
                conditionResistance: parseFloat(conditionResistance.toFixed(3)),
                rawTotal: parseFloat(totalResistance.toFixed(3))
            },
            
            // Resultados
            totalResistance: parseFloat(totalResistance.toFixed(3)),
            resistancePercent: parseFloat((totalResistance * 100).toFixed(1)),
            isCapped: totalResistance >= this.RESISTANCE_CONSTANTS.BASE_FORMULA.maximumCap,
            isElemental: isElemental,
            hasVulnerability: totalResistance < 0,
            vulnerabilityPercent: totalResistance < 0 ? parseFloat((Math.abs(totalResistance) * 100).toFixed(1)) : 0,
            
            // Elemento opuesto (si aplica)
            oppositeElement: this.RESISTANCE_CONSTANTS.OPPOSITE_ELEMENTS[damageType] || null,
            hasOppositeElement: !!this.RESISTANCE_CONSTANTS.OPPOSITE_ELEMENTS[damageType],
            
            // Metadatos
            timestamp: new Date().toISOString(),
            formulaUsed: isElemental ? '(WILL × 1.5) / 100' : 'Resistencia específica',
            calculationDetails: this.generateCalculationDetails(defender, damageType, totalResistance)
        };
    }

    /**
     * Aplica resistencia mágica al daño
     * @param {number} rawDamage - Daño bruto mágico
     * @param {Object} defender - Defensor
     * @param {string} damageType - Tipo de daño mágico
     * @returns {Object} Daño final después de resistencia
     */
    applyMagicResistance(rawDamage, defender, damageType) {
        const resistanceResult = this.calculateMagicResistance(defender, damageType);
        const resistance = resistanceResult.totalResistance;
        
        // Calcular daño después de resistencia
        let finalDamage = rawDamage * (1 - resistance);
        
        // Aplicar daño mínimo (5% siempre pasa)
        const minimumDamage = rawDamage * this.RESISTANCE_CONSTANTS.BASE_FORMULA.minimumCap;
        const isMinDamage = finalDamage < minimumDamage;
        finalDamage = Math.max(minimumDamage, finalDamage);
        
        // Redondear para simplicidad en juego
        finalDamage = Math.round(finalDamage * 10) / 10;
        
        // Verificar si hay elemento opuesto para daño extra
        const oppositeBonus = this.calculateOppositeElementBonus(defender, damageType, rawDamage);
        
        return {
            rawDamage: parseFloat(rawDamage.toFixed(1)),
            resistanceResult: resistanceResult,
            resistanceApplied: resistance,
            damageMultiplier: parseFloat((1 - resistance).toFixed(3)),
            damageAfterResistance: parseFloat(finalDamage.toFixed(1)),
            damageReduced: parseFloat((rawDamage - finalDamage).toFixed(1)),
            percentReduced: parseFloat(((rawDamage - finalDamage) / rawDamage * 100).toFixed(1)),
            oppositeElementBonus: oppositeBonus,
            finalDamage: parseFloat((finalDamage + oppositeBonus).toFixed(1)),
            isMinimumDamage: isMinDamage,
            minimumDamageThreshold: parseFloat(minimumDamage.toFixed(1))
        };
    }

    /**
     * Calcula resistencia mágica para múltiples tipos de daño
     * @param {Object} defender - Defensor
     * @param {Array} damageTypes - Tipos de daño a calcular
     * @returns {Object} Resistencia para cada tipo
     */
    calculateMultipleResistances(defender, damageTypes = ['FIRE', 'ICE', 'LIGHTNING']) {
        const results = {};
        
        damageTypes.forEach(type => {
            try {
                results[type] = this.calculateMagicResistance(defender, type);
            } catch (error) {
                results[type] = { error: error.message };
            }
        });
        
        // Calcular resistencia promedio
        const validResults = Object.values(results).filter(r => !r.error);
        const averageResistance = validResults.length > 0 ? 
            validResults.reduce((sum, r) => sum + r.totalResistance, 0) / validResults.length : 0;
        
        return {
            defenderName: defender.name,
            damageTypes: damageTypes,
            results: results,
            summary: {
                averageResistance: parseFloat(averageResistance.toFixed(3)),
                averageResistancePercent: parseFloat((averageResistance * 100).toFixed(1)),
                strongestResistance: this.findStrongestResistance(validResults),
                weakestResistance: this.findWeakestResistance(validResults),
                cappedResistances: validResults.filter(r => r.isCapped).length
            }
        };
    }

    /**
     * Simula múltiples ataques mágicos para análisis
     * @param {number} baseDamage - Daño base del hechizo
     * @param {Object} defender - Defensor
     * @param {string} damageType - Tipo de daño
     * @param {number} iterations - Número de simulaciones
     * @returns {Object} Estadísticas de simulación
     */
    simulateMagicAttacks(baseDamage, defender, damageType, iterations = 1000) {
        const results = {
            totalSimulations: iterations,
            rawDamages: [],
            finalDamages: [],
            resistances: [],
            damageReductions: [],
            details: []
        };
        
        for (let i = 0; i < iterations; i++) {
            // Variación aleatoria en daño (±20%)
            const damageVariation = 0.8 + (Math.random() * 0.4);
            const rawDamage = baseDamage * damageVariation;
            
            const damageResult = this.applyMagicResistance(rawDamage, defender, damageType);
            
            results.rawDamages.push(damageResult.rawDamage);
            results.finalDamages.push(damageResult.finalDamage);
            results.resistances.push(damageResult.resistanceResult.totalResistance);
            results.damageReductions.push(damageResult.damageReduced);
            results.details.push(damageResult);
        }
        
        // Calcular estadísticas
        results.statistics = this.calculateMagicStatistics(results);
        
        // Análisis de efectividad
        results.effectiveness = this.analyzeResistanceEffectiveness(results);
        
        // Contar hits con daño mínimo
        results.effectiveness.hitsWithMinimumDamage = results.details.filter(d => d.isMinimumDamage).length;
        
        return results;
    }

    /**
     * Verifica si un tipo de daño es elemental
     * @param {string} damageType - Tipo de daño
     * @returns {boolean} True si es elemental
     */
    isElementalDamage(damageType) {
        const elementalTypes = ['FIRE', 'ICE', 'LIGHTNING', 'EARTH', 'WATER', 'WIND'];
        return elementalTypes.includes(damageType);
    }

    /**
     * Obtiene todos los tipos de daño mágico disponibles
     * @returns {Array} Lista de tipos de daño
     */
    getMagicDamageTypes() {
        return Object.keys(this.RESISTANCE_CONSTANTS.MAGIC_DAMAGE_TYPES);
    }

    /**
     * Obtiene descripción de un tipo de daño
     * @param {string} damageType - Tipo de daño
     * @returns {Object} Información del tipo de daño
     */
    getDamageTypeInfo(damageType) {
        return this.RESISTANCE_CONSTANTS.MAGIC_DAMAGE_TYPES[damageType] || null;
    }

    /**
     * Genera un reporte de resistencia mágica
     * @param {Object} resistanceResult - Resultado de resistencia
     * @returns {string} Reporte formateado
     */
    generateResistanceReport(resistanceResult) {
        let report = '═'.repeat(70) + '\n';
        report += 'INFORME DE RESISTENCIA MÁGICA\n';
        report += '═'.repeat(70) + '\n\n';
        
        // Información básica
        report += '📋 INFORMACIÓN BÁSICA:\n';
        report += '─'.repeat(40) + '\n';
        report += `• Defensor: ${resistanceResult.defenderName}\n`;
        report += `• Tipo de daño: ${resistanceResult.damageTypeName} (${resistanceResult.damageType})\n`;
        report += `• Es elemental: ${resistanceResult.isElemental ? '✅ Sí' : '❌ No'}\n\n`;
        
        // Resultados
        report += '🛡️ RESISTENCIA CALCULADA:\n';
        report += '─'.repeat(40) + '\n';
        report += `• Resistencia total: ${resistanceResult.resistancePercent}%\n`;
        report += `• Fórmula usada: ${resistanceResult.formulaUsed}\n`;
        
        if (resistanceResult.isCapped) {
            report += `• ⚠️ Resistencia alcanzó el límite máximo (75%)\n`;
        }
        
        if (resistanceResult.hasVulnerability) {
            report += `• ⚡ Vulnerabilidad: +${resistanceResult.vulnerabilityPercent}% de daño\n`;
        }
        
        if (resistanceResult.hasOppositeElement) {
            report += `• ⚔️ Elemento opuesto: ${resistanceResult.oppositeElement}\n`;
        }
        
        // Desglose detallado
        report += '\n📊 DESGLOSE DE COMPONENTES:\n';
        report += '─'.repeat(40) + '\n';
        const components = resistanceResult.components;
        report += `• Resistencia base (VOL): ${(components.baseResistance * 100).toFixed(1)}%\n`;
        report += `• Específica del tipo: ${(components.typeSpecificResistance * 100).toFixed(1)}%\n`;
        report += `• Racial: ${(components.racialResistance * 100).toFixed(1)}%\n`;
        report += `• De clase: ${(components.classResistance * 100).toFixed(1)}%\n`;
        report += `• De equipo: ${(components.equipmentResistance * 100).toFixed(1)}%\n`;
        report += `• Por condiciones: ${(components.conditionResistance * 100).toFixed(1)}%\n`;
        
        // Efecto en combate
        report += '\n💥 EFECTO EN COMBATE:\n';
        report += '─'.repeat(40) + '\n';
        report += `• Multiplicador de daño: ${(1 - resistanceResult.totalResistance).toFixed(2)}x\n`;
        report += `• Ejemplo: 100 daño → ${(100 * (1 - resistanceResult.totalResistance)).toFixed(1)} daño final\n`;
        report += `• Daño mínimo garantizado: 5% (siempre pasa)\n`;
        
        return report;
    }

    // ===================== MÉTODOS DE APOYO =====================

    /**
     * Valida que el defensor tenga los atributos necesarios
     */
    validateDefender(defender) {
        if (!defender || typeof defender !== 'object') {
            throw new Error('Defensor inválido');
        }
        
        if (!defender.name) {
            throw new Error('Defensor debe tener un nombre');
        }
        
        if (defender.willpower === undefined) {
            defender.willpower = 10; // Valor por defecto
            console.warn(`Defensor ${defender.name} no tiene voluntad definida, usando 10`);
        }
    }

    /**
     * Calcula resistencia base por voluntad
     * Fórmula: (WILL × 1.5) / 100 (cap 75%)
     */
    calculateBaseResistance(defender) {
        const { willMultiplier, baseDivisor } = this.RESISTANCE_CONSTANTS.BASE_FORMULA;
        const will = defender.willpower || 10;
        
        let baseResistance = (will * willMultiplier) / baseDivisor;
        
        // Aplicar bonus de objetos/efectos
        if (defender.willpowerBonus) {
            baseResistance += (defender.willpowerBonus * willMultiplier) / baseDivisor;
        }
        
        return Math.min(baseResistance, this.RESISTANCE_CONSTANTS.BASE_FORMULA.maximumCap);
    }

    /**
     * Calcula resistencia específica del tipo de daño
     */
    calculateTypeSpecificResistance(defender, damageType) {
        if (!defender.resistances) return 0;
        
        // Buscar resistencia específica
        const resistanceKey = `${damageType}_RESISTANCE`;
        const hasSpecificResistance = defender.resistances[resistanceKey] !== undefined;
        
        // Para no-elementales, la resistencia específica toma precedencia
        const isElemental = this.isElementalDamage(damageType);
        if (!isElemental && hasSpecificResistance) {
            // Para tipos no-elementales, usa SOLO la resistencia específica (reemplaza fórmula base)
            return defender.resistances[resistanceKey];
        }
        
        // Para elementales, suma la resistencia específica al total
        if (hasSpecificResistance) {
            return defender.resistances[resistanceKey];
        }
        
        // Buscar resistencia genérica a magia
        if (defender.resistances.MAGIC_RESISTANCE !== undefined) {
            return defender.resistances.MAGIC_RESISTANCE * 0.5; // La genérica vale la mitad
        }
        
        return 0;
    }

    /**
     * Calcula resistencia por raza
     */
    calculateRacialResistance(defender, damageType) {
        if (!defender.race) return 0;
        
        const raceModifiers = this.RESISTANCE_CONSTANTS.RACE_MODIFIERS[defender.race];
        if (!raceModifiers) return 0;
        
        // Buscar resistencia específica
        const resistanceKey = `${damageType.toLowerCase()}Resistance`;
        if (raceModifiers[resistanceKey] !== undefined) {
            return raceModifiers[resistanceKey];
        }
        
        // Buscar resistencia base
        if (raceModifiers.baseResistance !== undefined) {
            return raceModifiers.baseResistance;
        }
        
        // Buscar resistencia a todo
        if (raceModifiers.allResistance !== undefined) {
            return raceModifiers.allResistance * 0.5; // La genérica vale la mitad
        }
        
        return 0;
    }

    /**
     * Calcula resistencia por clase
     */
    calculateClassResistance(defender, damageType) {
        if (!defender.class) return 0;
        
        const classModifiers = this.RESISTANCE_CONSTANTS.CLASS_MODIFIERS[defender.class];
        if (!classModifiers) return 0;
        
        // Buscar resistencia específica
        const resistanceKey = `${damageType.toLowerCase()}Resistance`;
        if (classModifiers[resistanceKey] !== undefined) {
            return classModifiers[resistanceKey];
        }
        
        // Buscar resistencia base
        if (classModifiers.baseResistance !== undefined) {
            return classModifiers.baseResistance;
        }
        
        // Buscar resistencia a todo
        if (classModifiers.allResistance !== undefined) {
            return classModifiers.allResistance;
        }
        
        // Bonus de voluntad para clases mágicas (NO mutar el defensor)
        if (classModifiers.willBonus && defender.willpower) {
            // Solo calcula el bonus, no modifica el objeto original
            const effectiveWill = defender.willpower + classModifiers.willBonus;
            const { willMultiplier, baseDivisor } = this.RESISTANCE_CONSTANTS.BASE_FORMULA;
            return (effectiveWill * willMultiplier) / baseDivisor * 0.1; // Pequeño bonus de resistencia
        }
        
        return 0;
    }

    /**
     * Calcula resistencia por equipo
     */
    calculateEquipmentResistance(defender, damageType) {
        if (!defender.equipment) return 0;
        
        let totalResistance = 0;
        
        // Verificar cada pieza de equipo
        Object.values(defender.equipment).forEach(item => {
            if (item.resistances) {
                // Resistencia específica
                const resistanceKey = `${damageType}_RESISTANCE`;
                if (item.resistances[resistanceKey] !== undefined) {
                    totalResistance += item.resistances[resistanceKey];
                }
                
                // Resistencia mágica general
                if (item.resistances.MAGIC_RESISTANCE !== undefined) {
                    totalResistance += item.resistances.MAGIC_RESISTANCE * 0.3; // La genérica vale menos
                }
            }
            
            // Encantamientos
            if (item.enchantments) {
                Object.values(item.enchantments).forEach(enchantment => {
                    if (enchantment.type === 'RESISTANCE' && enchantment.element === damageType) {
                        const level = enchantment.level || 'MINOR';
                        totalResistance += this.RESISTANCE_CONSTANTS.ENCHANTMENT_MODIFIERS[level] || 0;
                    }
                });
            }
        });
        
        return totalResistance;
    }

    /**
     * Calcula resistencia por condiciones
     */
    calculateConditionResistance(defender, damageType) {
        if (!defender.conditions) return 0;
        
        let totalResistance = 0;
        
        defender.conditions.forEach(condition => {
            const conditionModifiers = this.RESISTANCE_CONSTANTS.CONDITION_MODIFIERS[condition];
            if (conditionModifiers) {
                const resistanceKey = `${damageType.toLowerCase()}Resistance`;
                if (conditionModifiers[resistanceKey] !== undefined) {
                    totalResistance += conditionModifiers[resistanceKey];
                }
            }
        });
        
        return totalResistance;
    }

    /**
     * Calcula bonus por elemento opuesto
     */
    calculateOppositeElementBonus(defender, damageType, rawDamage) {
        const oppositeElement = this.RESISTANCE_CONSTANTS.OPPOSITE_ELEMENTS[damageType];
        if (!oppositeElement) return 0;
        
        // Verificar si el defensor es vulnerable al elemento opuesto
        try {
            const oppositeResistance = this.calculateMagicResistance(defender, oppositeElement);
            // Si tiene vulnerabilidad al opuesto, aplica bonus de daño
            if (oppositeResistance.totalResistance < 0) { 
                const bonusMultiplier = Math.abs(oppositeResistance.totalResistance) * 0.5;
                return rawDamage * bonusMultiplier;
            }
        } catch (error) {
            // Si no se puede calcular, no hay bonus
        }
        
        return 0;
    }

    /**
     * Genera detalles del cálculo
     */
    generateCalculationDetails(defender, damageType, totalResistance) {
        const will = defender.willpower || 10;
        const { willMultiplier, baseDivisor } = this.RESISTANCE_CONSTANTS.BASE_FORMULA;
        
        let details = `Fórmula: (${will} × ${willMultiplier}) / ${baseDivisor} = ${((will * willMultiplier) / baseDivisor).toFixed(2)}`;
        
        if (totalResistance >= this.RESISTANCE_CONSTANTS.BASE_FORMULA.maximumCap) {
            details += ` → Limitado a ${(this.RESISTANCE_CONSTANTS.BASE_FORMULA.maximumCap * 100).toFixed(0)}%`;
        }
        
        return details;
    }

    /**
     * Calcula estadísticas de simulación mágica
     */
    calculateMagicStatistics(results) {
        const stats = {
            // Daño
            averageRawDamage: this.calculateAverage(results.rawDamages),
            averageFinalDamage: this.calculateAverage(results.finalDamages),
            minFinalDamage: Math.min(...results.finalDamages),
            maxFinalDamage: Math.max(...results.finalDamages),
            
            // Resistencia
            averageResistance: this.calculateAverage(results.resistances),
            minResistance: Math.min(...results.resistances),
            maxResistance: Math.max(...results.resistances),
            
            // Reducción
            averageReduction: this.calculateAverage(results.damageReductions),
            totalReduction: results.damageReductions.reduce((a, b) => a + b, 0)
        };
        
        // Eficiencia
        stats.damageEfficiency = parseFloat((stats.averageFinalDamage / stats.averageRawDamage * 100).toFixed(1));
        stats.effectiveResistance = parseFloat((100 - stats.damageEfficiency).toFixed(1));
        
        return stats;
    }

    /**
     * Analiza efectividad de resistencia
     */
    analyzeResistanceEffectiveness(results) {
        const hitsWithMinimumDamage = results.details.filter(d => d.isMinimumDamage).length;
        const hitsWithVulnerability = results.details.filter(d => d.resistanceResult.hasVulnerability).length;
        
        return {
            hitsWithMinimumDamage: hitsWithMinimumDamage,
            percentWithMinimumDamage: parseFloat((hitsWithMinimumDamage / results.totalSimulations * 100).toFixed(1)),
            hitsWithVulnerability: hitsWithVulnerability,
            percentWithVulnerability: parseFloat((hitsWithVulnerability / results.totalSimulations * 100).toFixed(1)),
            averageDamageMultiplier: parseFloat((1 - results.statistics.averageResistance).toFixed(3))
        };
    }

    /**
     * Encuentra la resistencia más fuerte
     */
    findStrongestResistance(results) {
        if (results.length === 0) return null;
        
        return results.reduce((strongest, current) => 
            current.totalResistance > strongest.totalResistance ? current : strongest
        );
    }

    /**
     * Encuentra la resistencia más débil
     */
    findWeakestResistance(results) {
        if (results.length === 0) return null;
        
        return results.reduce((weakest, current) => 
            current.totalResistance < weakest.totalResistance ? current : weakest
        );
    }

    /**
     * Calcula promedio
     */
    calculateAverage(values) {
        return parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));
    }

    /**
     * Genera resumen de resistencias para personaje
     */
    generateCharacterResistanceProfile(defender) {
        const allTypes = this.getMagicDamageTypes();
        const resistances = {};
        
        allTypes.forEach(type => {
            try {
                resistances[type] = this.calculateMagicResistance(defender, type);
            } catch (error) {
                resistances[type] = { error: error.message };
            }
        });
        
        // Calcular estadísticas
        const validResults = Object.values(resistances).filter(r => !r.error);
        const average = validResults.length > 0 ? 
            validResults.reduce((sum, r) => sum + r.totalResistance, 0) / validResults.length : 0;
        
        // Encontrar fortalezas y debilidades
        const strengths = validResults.filter(r => r.totalResistance >= 0.3);
        const weaknesses = validResults.filter(r => r.totalResistance < 0);
        
        return {
            characterName: defender.name,
            willpower: defender.willpower,
            race: defender.race || 'Unknown',
            class: defender.class || 'Unknown',
            resistances: resistances,
            summary: {
                averageResistance: parseFloat(average.toFixed(3)),
                averageResistancePercent: parseFloat((average * 100).toFixed(1)),
                cappedResistances: validResults.filter(r => r.isCapped).length,
                strengths: strengths.map(r => ({
                    type: r.damageType,
                    percent: r.resistancePercent
                })),
                weaknesses: weaknesses.map(r => ({
                    type: r.damageType,
                    percent: r.vulnerabilityPercent
                })),
                strongestResistance: this.findStrongestResistance(validResults),
                weakestResistance: this.findWeakestResistance(validResults)
            }
        };
    }

    /**
     * Verifica límite máximo del 75%
     */
    testMaximumCap(defender, damageType = 'FIRE') {
        // Crear defensor con voluntad extremadamente alta
        const maxWillDefender = {
            ...defender,
            willpower: 1000, // Valor extremo
            resistances: { FIRE_RESISTANCE: 1.0 }, // 100% resistencia
            race: 'DRAGONBORN',
            class: 'MAGE',
            equipment: {
                armor: { resistances: { FIRE_RESISTANCE: 0.5 } },
                amulet: { enchantments: [{ type: 'RESISTANCE', element: 'FIRE', level: 'MYTHIC' }] }
            },
            conditions: ['BLESSED']
        };
        
        const resistance = this.calculateMagicResistance(maxWillDefender, damageType);
        
        return {
            testDescription: 'Verificación de límite máximo del 75%',
            defenderWillpower: maxWillDefender.willpower,
            calculatedResistance: resistance.totalResistance,
            resistancePercent: resistance.resistancePercent,
            isCapped: resistance.isCapped,
            passedTest: resistance.totalResistance <= this.RESISTANCE_CONSTANTS.BASE_FORMULA.maximumCap,
            maxAllowed: this.RESISTANCE_CONSTANTS.BASE_FORMULA.maximumCap * 100 + '%'
        };
    }
}

// Exportar la clase
module.exports = MagicResistance;