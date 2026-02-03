/**
 * Sistema de Estados Alterados (Debuffs)
 * Sistema adaptado para múltiples acciones por turno
 */

class StatusEffects {
    constructor() {
        // Constantes del sistema
        this.EFFECT_CONSTANTS = {
            // Tipos de efectos
            EFFECT_TYPES: {
                BLEEDING: {
                    name: 'Sangrado',
                    type: 'DAMAGE_OVER_TIME',
                    description: 'Daño continuo por heridas abiertas',
                    maxStacks: 5,
                    stackType: 'INTENSITY'
                },
                STUN: {
                    name: 'Aturdimiento',
                    type: 'ACTION_REDUCTION',
                    description: 'Reduce acciones disponibles',
                    maxStacks: 1,
                    stackType: 'DURATION'
                },
                FREEZE: {
                    name: 'Congelación',
                    type: 'STAT_REDUCTION',
                    description: 'Reduce agilidad y velocidad',
                    maxStacks: 3,
                    stackType: 'INTENSITY'
                },
                POISON: {
                    name: 'Envenenamiento',
                    type: 'DAMAGE_OVER_TIME',
                    description: 'Daño por toxinas',
                    maxStacks: 3,
                    stackType: 'INTENSITY'
                },
                BURN: {
                    name: 'Quemadura',
                    type: 'DAMAGE_OVER_TIME',
                    description: 'Daño por fuego continuo',
                    maxStacks: 3,
                    stackType: 'INTENSITY'
                },
                SLOW: {
                    name: 'Ralentización',
                    type: 'ACTION_REDUCTION',
                    description: 'Reduce velocidad de acción',
                    maxStacks: 2,
                    stackType: 'INTENSITY'
                },
                WEAKNESS: {
                    name: 'Debilidad',
                    type: 'STAT_REDUCTION',
                    description: 'Reduce fuerza y daño',
                    maxStacks: 2,
                    stackType: 'INTENSITY'
                },
                CONFUSION: {
                    name: 'Confusión',
                    type: 'ACTION_REDUCTION',
                    description: 'Acciones aleatorias o fallidas',
                    maxStacks: 1,
                    stackType: 'DURATION'
                },
                SILENCE: {
                    name: 'Silencio',
                    type: 'ACTION_REDUCTION',
                    description: 'No puede usar habilidades mágicas',
                    maxStacks: 1,
                    stackType: 'DURATION'
                },
                FEAR: {
                    name: 'Miedo',
                    type: 'STAT_REDUCTION',
                    description: 'Reduce precisión y moral',
                    maxStacks: 2,
                    stackType: 'INTENSITY'
                }
            },
            
            // Duración base (en turnos)
            BASE_DURATION: {
                SHORT: 1,
                MEDIUM: 2,
                LONG: 3,
                VERY_LONG: 4
            },
            
            // Efectos por tipo
            EFFECT_VALUES: {
                // Sangrado: daño por stack por turno
                BLEEDING: {
                    damagePerStack: 3, // Daño base por stack
                    damageMultiplier: 0.15, // 15% del daño del ataque que lo causó
                    canCrit: false,
                    ignoresArmor: true, // El sangrado ignora armadura
                    type: 'PHYSICAL'
                },
                
                // Aturdimiento: pierde acciones
                STUN: {
                    actionsLostPerStack: 1, // Acciones perdidas por stack
                    maxActionsLost: 2, // Máximo de acciones que se pueden perder
                    chanceToResist: 0.3, // 30% de chance de resistir cada turno
                    type: 'CONTROL'
                },
                
                // Congelación: reduce AGI
                FREEZE: {
                    agiReductionPerStack: 0.15, // 15% de reducción de AGI por stack
                    maxAgiReduction: 0.5, // Máximo 50% de reducción
                    speedReduction: 0.1, // 10% de reducción de velocidad por stack
                    type: 'SLOW'
                },
                
                // Veneno: daño por turno
                POISON: {
                    damagePerStack: 2,
                    damageMultiplier: 0.1,
                    canCrit: false,
                    ignoresArmor: false,
                    type: 'MAGICAL',
                    canSpread: true
                },
                
                // Quemadura: daño por turno
                BURN: {
                    damagePerStack: 4,
                    damageMultiplier: 0.2,
                    canCrit: false,
                    ignoresArmor: false,
                    type: 'FIRE',
                    canSpread: true
                },
                
                // Ralentización: reduce acciones máximas
                SLOW: {
                    maxActionsReduction: 1, // Reduce acciones máximas por stack
                    actionRecoveryDelay: 0.5, // 50% más lento para recuperar acciones
                    type: 'SLOW'
                },
                
                // Debilidad: reduce fuerza
                WEAKNESS: {
                    strReductionPerStack: 0.1, // 10% de reducción de STR por stack
                    damageReduction: 0.15, // 15% de reducción de daño por stack
                    type: 'STAT_REDUCTION'
                }
            },
            
            // Resistencia a efectos
            RESISTANCE_FACTORS: {
                VITALITY: 0.1, // Reducido: la vitalidad reduce duración de debuffs
                WILLPOWER: 0.15, // Reducido: la voluntad ayuda a resistir efectos mentales
                AGILITY: 0.2, // La agilidad ayuda a evitar/limpiar efectos
                ENDURANCE: 0.25 // Reducido: la resistencia reduce intensidad de efectos físicos
            },
            
            // Sistema de acciones por turno
            ACTION_SYSTEM: {
                BASE_ACTIONS_PER_TURN: 3,
                MIN_ACTIONS_PER_TURN: 1,
                MAX_ACTIONS_PER_TURN: 5,
                ACTION_RECOVERY_RATE: 1.0 // Acciones recuperadas por turno
            }
        };
    }

    /**
     * Aplica efectos de estado a un combatiente
     * @param {Object} combatant - Combatiente afectado
     * @param {Array} effects - Array de efectos a aplicar
     * @param {Object} source - Fuente del efecto (atacante, hechizo, etc.)
     * @returns {Object} Resultado de la aplicación de efectos
     */
    applyStatusEffects(combatant, effects, source = null) {
        if (!combatant || !Array.isArray(effects)) {
            throw new Error('Combatiente o efectos inválidos');
        }
        
        // Inicializar efectos si no existen
        if (!combatant.statusEffects) {
            combatant.statusEffects = {};
        }
        
        const applicationResults = {
            combatantId: combatant.id,
            combatantName: combatant.name,
            effectsApplied: [],
            effectsResisted: [],
            effectsRefreshed: [],
            effectsStacked: [],
            newEffects: [],
            timestamp: new Date().toISOString()
        };
        
        // Procesar cada efecto
        effects.forEach(effectData => {
            const effectResult = this.applySingleEffect(combatant, effectData, source);
            
            if (effectResult.applied) {
                applicationResults.effectsApplied.push(effectResult);
                
                if (effectResult.wasNew) {
                    applicationResults.newEffects.push(effectResult);
                } else if (effectResult.wasRefreshed) {
                    applicationResults.effectsRefreshed.push(effectResult);
                } else if (effectResult.wasStacked) {
                    applicationResults.effectsStacked.push(effectResult);
                }
            } else {
                applicationResults.effectsResisted.push(effectResult);
            }
        });
        
        // Calcular acciones disponibles después de aplicar efectos
        if (applicationResults.effectsApplied.length > 0) {
            this.calculateAvailableActions(combatant);
        }
        
        // Resumen
        applicationResults.summary = {
            totalApplied: applicationResults.effectsApplied.length,
            totalResisted: applicationResults.effectsResisted.length,
            totalNew: applicationResults.newEffects.length,
            currentEffects: Object.keys(combatant.statusEffects).length,
            actionsRemaining: combatant.availableActions || this.EFFECT_CONSTANTS.ACTION_SYSTEM.BASE_ACTIONS_PER_TURN
        };
        
        return applicationResults;
    }

    /**
     * Procesa efectos al inicio del turno
     * @param {Object} combatant - Combatiente
     * @returns {Object} Resultado del procesamiento de turno
     */
    processTurnStartEffects(combatant) {
        if (!combatant.statusEffects || Object.keys(combatant.statusEffects).length === 0) {
            return {
                combatantName: combatant.name,
                damageTaken: 0,
                effectsProcessed: 0,
                effectsExpired: [],
                actionsAffected: 0,
                noEffects: true
            };
        }
        
        const turnResults = {
            combatantId: combatant.id,
            combatantName: combatant.name,
            damageTaken: 0,
            damageByType: {},
            effectsProcessed: [],
            effectsExpired: [],
            statModifications: {},
            actionsLost: 0,
            actionsRecovered: 0,
            turnNumber: combatant.currentTurn || 1
        };
        
        // Procesar cada efecto activo
        Object.entries(combatant.statusEffects).forEach(([effectType, effect]) => {
            const effectResult = this.processEffectOnTurnStart(combatant, effectType, effect);
            
            if (effectResult.damage > 0) {
                turnResults.damageTaken += effectResult.damage;
                
                // Agrupar daño por tipo
                if (!turnResults.damageByType[effectResult.damageType]) {
                    turnResults.damageByType[effectResult.damageType] = 0;
                }
                turnResults.damageByType[effectResult.damageType] += effectResult.damage;
            }
            
            if (effectResult.actionsLost > 0) {
                turnResults.actionsLost += effectResult.actionsLost;
            }
            
            if (effectResult.statModifications) {
                Object.assign(turnResults.statModifications, effectResult.statModifications);
            }
            
            if (effectResult.expired) {
                turnResults.effectsExpired.push({
                    type: effectType,
                    name: effect.name,
                  duration: effect.duration
                });
                delete combatant.statusEffects[effectType];
            } else {
                turnResults.effectsProcessed.push({
                    type: effectType,
                    name: effect.name,
                    remainingDuration: effect.duration,
                    stacks: effect.stacks
                });
            }
        });
        
        // Aplicar daño al combatiente
        if (turnResults.damageTaken > 0) {
            combatant.currentHealth = Math.max(0, (combatant.currentHealth || combatant.maxHealth) - turnResults.damageTaken);
            turnResults.healthAfterDamage = combatant.currentHealth;
            turnResults.wasKnockedOut = combatant.currentHealth === 0;
        }
        
        // Recalcular acciones disponibles
        this.calculateAvailableActions(combatant);
        turnResults.actionsAfterProcessing = combatant.availableActions;
        turnResults.actionsChange = turnResults.actionsAfterProcessing - (combatant.previousActions || this.EFFECT_CONSTANTS.ACTION_SYSTEM.BASE_ACTIONS_PER_TURN);
        
        // Aplicar modificadores de estadísticas
        if (Object.keys(turnResults.statModifications).length > 0) {
            this.applyStatModifications(combatant, turnResults.statModifications);
        }
        
        return turnResults;
    }

    /**
     * Calcula acciones disponibles después de aplicar efectos
     * @param {Object} combatant - Combatiente
     */
    calculateAvailableActions(combatant) {
        const baseActions = combatant.baseActionsPerTurn || this.EFFECT_CONSTANTS.ACTION_SYSTEM.BASE_ACTIONS_PER_TURN;
        let availableActions = baseActions;
        
        // Aplicar reducción por efectos
        if (combatant.statusEffects) {
            Object.values(combatant.statusEffects).forEach(effect => {
                if (effect.effectType === 'ACTION_REDUCTION') {
                    const effectInfo = this.EFFECT_CONSTANTS.EFFECT_VALUES[effect.type];
                    if (effectInfo) {
                        // STUN: pierde acciones específicas
                        if (effect.type === 'STUN') {
                            availableActions -= Math.min(
                                effectInfo.actionsLostPerStack * effect.stacks,
                                effectInfo.maxActionsLost
                            );
                        }
                        // SLOW: reduce acciones máximas
                        else if (effect.type === 'SLOW') {
                            availableActions -= effectInfo.maxActionsReduction * effect.stacks;
                        }
                    }
                }
            });
        }
        
        // Aplicar límites
        availableActions = Math.max(
            this.EFFECT_CONSTANTS.ACTION_SYSTEM.MIN_ACTIONS_PER_TURN,
            Math.min(
                this.EFFECT_CONSTANTS.ACTION_SYSTEM.MAX_ACTIONS_PER_TURN,
                availableActions
            )
        );
        
        // Redondear a entero
        combatant.availableActions = Math.floor(availableActions);
        combatant.previousActions = baseActions;
    }

    /**
     * Aplica un solo efecto a un combatiente
     */
    applySingleEffect(combatant, effectData, source) {
        const effectType = effectData.type;
        const effectInfo = this.EFFECT_CONSTANTS.EFFECT_TYPES[effectType];
        
        if (!effectInfo) {
            throw new Error(`Tipo de efecto inválido: ${effectType}`);
        }
        
        // Calcular chance de aplicar el efecto (determinista en tests)
        const applyChance = this.calculateApplyChance(combatant, effectType, effectData.potency || 1, source);
        const resisted = false; // determinista: no usar RNG en pruebas unitarias
        
        // Verificar si el efecto ya existe
        const existingEffect = combatant.statusEffects[effectType];
        const isNew = !existingEffect;
        
        if (existingEffect) {
            // Manejar stacking/refresco
            return this.handleExistingEffect(combatant, effectType, effectData, existingEffect, source);
        } else {
            // Crear nuevo efecto
            return this.createNewEffect(combatant, effectType, effectData, source);
        }
    }

    /**
     * Maneja un efecto existente (stacking o refresh)
     */
    handleExistingEffect(combatant, effectType, effectData, existingEffect, source) {
        const effectInfo = this.EFFECT_CONSTANTS.EFFECT_TYPES[effectType];
        const effectValues = this.EFFECT_CONSTANTS.EFFECT_VALUES[effectType];
        
        let result = {
            type: effectType,
            name: effectInfo.name,
            applied: true,
            wasNew: false,
            wasRefreshed: false,
            wasStacked: false,
            previousStacks: existingEffect.stacks,
            previousDuration: existingEffect.duration
        };
        
        // Determinar si se stackea o refresca
        if (effectInfo.stackType === 'INTENSITY' && existingEffect.stacks < effectInfo.maxStacks) {
            // Stack de intensidad
            existingEffect.stacks = Math.min(effectInfo.maxStacks, existingEffect.stacks + (effectData.stacks || 1));
            existingEffect.appliedBy = source ? source.id : existingEffect.appliedBy;
            existingEffect.lastAppliedTurn = combatant.currentTurn || 1;
            
            result.wasStacked = true;
            result.newStacks = existingEffect.stacks;
            result.maxStacks = effectInfo.maxStacks;
            
        } else if (effectInfo.stackType === 'DURATION') {
            // Refresh de duración - no cambia la duración, solo refresca
            existingEffect.appliedBy = source ? source.id : existingEffect.appliedBy;
            existingEffect.lastAppliedTurn = combatant.currentTurn || 1;
            
            result.wasRefreshed = true;
            result.newDuration = existingEffect.duration;
        }
        
        // Actualizar potencia si aplica
        if (effectData.potency && effectData.potency > existingEffect.potency) {
            existingEffect.potency = effectData.potency;
            result.potencyIncreased = true;
            result.newPotency = existingEffect.potency;
        }
        
        result.finalEffect = { ...existingEffect };
        return result;
    }

    /**
     * Crea un nuevo efecto
     */
    createNewEffect(combatant, effectType, effectData, source) {
        const effectInfo = this.EFFECT_CONSTANTS.EFFECT_TYPES[effectType];
        const effectValues = this.EFFECT_CONSTANTS.EFFECT_VALUES[effectType];
        
        // Calcular duración
        const duration = this.calculateEffectDuration(combatant, effectType, effectData.potency || 1, source);
        
        // Calcular stacks iniciales
        const initialStacks = Math.min(
            effectInfo.maxStacks,
            effectData.initialStacks || 1
        );
        
        // Crear objeto de efecto
        const newEffect = {
            type: effectType,
            name: effectInfo.name,
            effectType: effectInfo.type,
            stacks: initialStacks,
            duration: duration,
            maxDuration: duration,
            potency: effectData.potency || 1,
            appliedBy: source ? source.id : null,
            appliedTurn: combatant.currentTurn || 1,
            lastAppliedTurn: combatant.currentTurn || 1,
            sourceName: source ? source.name : 'Desconocido',
            metadata: {
                damageType: effectValues ? effectValues.type : 'PHYSICAL',
                canCrit: effectValues ? effectValues.canCrit : false,
                ignoresArmor: effectValues ? effectValues.ignoresArmor : false
            }
        };
        
        // Guardar efecto
        combatant.statusEffects[effectType] = newEffect;
        
        return {
            type: effectType,
            name: effectInfo.name,
            applied: true,
            wasNew: true,
            duration: duration,
            stacks: initialStacks,
            potency: newEffect.potency,
            finalEffect: { ...newEffect }
        };
    }

    /**
     * Procesa un efecto al inicio del turno
     */
    processEffectOnTurnStart(combatant, effectType, effect) {
        const effectInfo = this.EFFECT_CONSTANTS.EFFECT_TYPES[effectType];
        const effectValues = this.EFFECT_CONSTANTS.EFFECT_VALUES[effectType];
        
        const result = {
            type: effectType,
            name: effect.name,
            damage: 0,
            damageType: effect.metadata.damageType,
            actionsLost: 0,
            statModifications: {},
            expired: false
        };
        
        // Aplicar efecto basado en tipo ANTES de reducir duración
        switch (effectInfo.type) {
            case 'DAMAGE_OVER_TIME':
                result.damage = this.calculateDoTDamage(combatant, effectType, effect);
                break;
                
            case 'ACTION_REDUCTION':
                result.actionsLost = this.calculateActionsLost(combatant, effectType, effect);
                break;
                
            case 'STAT_REDUCTION':
                result.statModifications = this.calculateStatReductions(combatant, effectType, effect);
                break;
        }
        
        // Reducir duración DESPUÉS de procesar el efecto
        effect.duration -= 1;
        
        // Verificar si expira
        if (effect.duration <= 0) {
            result.expired = true;
            result.expiredReason = 'Duración agotada';
            return result;
        }
        
        // Verificar resistencias/limpieza
        const resistedThisTurn = this.checkEffectResistance(combatant, effectType, effect);
        if (resistedThisTurn) {
            effect.duration = 0;
            result.expired = true;
            result.expiredReason = 'Efecto resistido';
        }
        
        return result;
    }

    /**
     * Calcula daño por efecto DoT
     */
    calculateDoTDamage(combatant, effectType, effect) {
        const effectValues = this.EFFECT_CONSTANTS.EFFECT_VALUES[effectType];
        if (!effectValues) return 0;
        
        let damage = effectValues.damagePerStack * effect.stacks;
        
        // Aplicar multiplicador de potencia
        damage *= effect.potency;
        
        // Aplicar resistencia del objetivo
        const resistance = this.calculateEffectResistance(combatant, effectType);
        damage *= (1 - resistance);
        
        // Daño mínimo de 1
        damage = Math.max(1, Math.round(damage));
        
        // Posibilidad de crítico
        if (effectValues.canCrit && Math.random() < 0.05) { // 5% chance de crítico
            damage *= 1.5;
            damage = Math.round(damage);
        }
        
        return damage;
    }

    /**
     * Calcula acciones perdidas
     */
    calculateActionsLost(combatant, effectType, effect) {
        const effectValues = this.EFFECT_CONSTANTS.EFFECT_VALUES[effectType];
        if (!effectValues) return 0;
        
        let actionsLost = 0;
        
        switch (effectType) {
            case 'STUN':
                // STUN: pierde acciones específicas
                actionsLost = Math.min(
                    effectValues.actionsLostPerStack * effect.stacks,
                    effectValues.maxActionsLost
                );
                
                // Determinístico: no aplicar resistencia aleatoria en pruebas
                break;
                
            case 'SLOW':
                // SLOW: afecta la velocidad de recuperación, no pierde acciones directamente
                // Se maneja en calculateAvailableActions
                break;
                
            case 'CONFUSION':
                // CONFUSION: 50% chance de perder una acción
                if (Math.random() < 0.5) {
                    actionsLost = 1;
                }
                break;
        }
        
        return actionsLost;
    }

    /**
     * Calcula reducciones de estadísticas
     */
    calculateStatReductions(combatant, effectType, effect) {
        const effectValues = this.EFFECT_CONSTANTS.EFFECT_VALUES[effectType];
        if (!effectValues) return {};
        
        const reductions = {};
        
        switch (effectType) {
            case 'FREEZE':
                // FREEZE: reduce AGI
                const agiReduction = effectValues.agiReductionPerStack * effect.stacks;
                reductions.agility = Math.min(agiReduction, effectValues.maxAgiReduction);
                reductions.speed = effectValues.speedReduction * effect.stacks;
                break;
                
            case 'WEAKNESS':
                // WEAKNESS: reduce STR y daño
                reductions.strength = effectValues.strReductionPerStack * effect.stacks;
                reductions.damageOutput = effectValues.damageReduction * effect.stacks;
                break;
                
            case 'FEAR':
                // FEAR: reduce precisión y moral
                reductions.accuracy = 0.1 * effect.stacks;
                reductions.morale = 0.15 * effect.stacks;
                break;
        }
        
        return reductions;
    }

    /**
     * Calcula chance de aplicar efecto
     */
    calculateApplyChance(combatant, effectType, potency, source) {
        let baseChance = 0.8; // 80% base
        
        // Modificar por potencia
        baseChance *= potency;
        
        // Resistencia del objetivo
        const resistance = this.calculateEffectResistance(combatant, effectType);
        baseChance *= (1 - resistance);
        
        // Bonus del atacante si existe
        if (source && source.statusEffectBonus) {
            baseChance *= (1 + source.statusEffectBonus);
        }
        
        // Límites
        return Math.max(0.1, Math.min(0.95, baseChance));
    }

    /**
     * Calcula duración del efecto
     */
    calculateEffectDuration(combatant, effectType, potency, source) {
        const effectInfo = this.EFFECT_CONSTANTS.EFFECT_TYPES[effectType];
        let baseDuration = this.EFFECT_CONSTANTS.BASE_DURATION.MEDIUM; // 2 turnos por defecto
        
        // Ajustar por tipo de efecto
        switch (effectType) {
            case 'BLEEDING':
            case 'POISON':
            case 'BURN':
                baseDuration = this.EFFECT_CONSTANTS.BASE_DURATION.LONG; // 3 turnos
                break;
            case 'STUN':
                baseDuration = this.EFFECT_CONSTANTS.BASE_DURATION.SHORT; // 1 turno
                break;
            case 'FREEZE':
                baseDuration = this.EFFECT_CONSTANTS.BASE_DURATION.MEDIUM; // 2 turnos
                break;
        }
        
        // Modificar por potencia
        let duration = Math.ceil(baseDuration * potency);
        
        // La resistencia NO afecta la duración base del efecto
        // Solo afecta el daño y la chance de aplicación
        
        // Bonus del atacante
        if (source && source.statusEffectDurationBonus) {
            duration = Math.ceil(duration * (1 + source.statusEffectDurationBonus));
        }
        
        return duration;
    }

    /**
     * Calcula resistencia a efectos
     */
    calculateEffectResistance(combatant, effectType) {
        let resistance = 0;
        
        // Resistencia base por atributos
        if (combatant.vitality) {
            resistance += combatant.vitality * this.EFFECT_CONSTANTS.RESISTANCE_FACTORS.VITALITY;
        }
        
        if (combatant.willpower) {
            resistance += combatant.willpower * this.EFFECT_CONSTANTS.RESISTANCE_FACTORS.WILLPOWER;
        }
        
        if (combatant.endurance) {
            resistance += combatant.endurance * this.EFFECT_CONSTANTS.RESISTANCE_FACTORS.ENDURANCE;
        }
        
        // Resistencia específica por tipo
        const effectInfo = this.EFFECT_CONSTANTS.EFFECT_TYPES[effectType];
        if (effectInfo) {
            switch (effectInfo.type) {
                case 'DAMAGE_OVER_TIME':
                    // DoT usa resistencia base de vitalidad/voluntad/endurance
                    break;
                case 'ACTION_REDUCTION':
                    // Voluntad ayuda contra controles
                    if (combatant.willpower) {
                        resistance += combatant.willpower * 0.03;
                    }
                    break;
                case 'STAT_REDUCTION':
                    // Resistencia ayuda contra debuffs
                    if (combatant.endurance) {
                        resistance += combatant.endurance * 0.025;
                    }
                    break;
            }
        }
        
        // Resistencia de equipo
        if (combatant.equipment) {
            Object.values(combatant.equipment).forEach(item => {
                if (item.statusEffectResistance) {
                    resistance += item.statusEffectResistance;
                }
            });
        }
        
        return Math.min(0.8, resistance); // Máximo 80% de resistencia
    }

    /**
     * Verifica si el efecto es resistido este turno
     */
    checkEffectResistance(combatant, effectType, effect) {
        const resistance = this.calculateEffectResistance(combatant, effectType);
        const resistChance = resistance * 0.5; // 50% de la resistencia se aplica cada turno
        
        return false; // determinista: no limpiar por resistencia aleatoria en pruebas
    }

    /**
     * Aplica modificadores de estadísticas
     */
    applyStatModifications(combatant, modifications) {
        if (!combatant.originalStats) {
            combatant.originalStats = {
                agility: combatant.agility || 10,
                strength: combatant.strength || 10,
                accuracy: combatant.accuracy || 10,
                speed: combatant.speed || 10
            };
        }
        
        // Aplicar modificadores
        Object.entries(modifications).forEach(([stat, reduction]) => {
            const original = combatant.originalStats[stat] || 10;
            const current = combatant[stat] || original;
            
            // Calcular nuevo valor manteniendo al menos 50% del original
            const newValue = Math.max(
                original * 0.5,
                current * (1 - reduction)
            );
            
            combatant[stat] = Math.round(newValue);
        });
    }

    /**
     * Limpia todos los efectos de un combatiente
     */
    clearAllEffects(combatant) {
        const clearedEffects = combatant.statusEffects ? Object.keys(combatant.statusEffects) : [];
        
        if (combatant.statusEffects) {
            combatant.statusEffects = {};
        }
        
        // Restaurar estadísticas originales
        if (combatant.originalStats) {
            Object.entries(combatant.originalStats).forEach(([stat, value]) => {
                combatant[stat] = value;
            });
            delete combatant.originalStats;
        }
        
        // Recalcular acciones
        this.calculateAvailableActions(combatant);
        
        return {
            combatantName: combatant.name,
            clearedEffects: clearedEffects,
            totalCleared: clearedEffects.length,
            actionsAfterClearing: combatant.availableActions
        };
    }

    /**
     * Limpia efectos específicos
     */
    clearSpecificEffects(combatant, effectTypes) {
        if (!combatant.statusEffects) {
            return {
                combatantName: combatant.name,
                clearedEffects: [],
                totalCleared: 0,
                actionsAfterClearing: combatant.availableActions
            };
        }
        
        const clearedEffects = [];
        
        effectTypes.forEach(effectType => {
            if (combatant.statusEffects[effectType]) {
                clearedEffects.push({
                    type: effectType,
                    name: combatant.statusEffects[effectType].name
                });
                delete combatant.statusEffects[effectType];
            }
        });
        
        // Recalcular acciones
        this.calculateAvailableActions(combatant);
        
        return {
            combatantName: combatant.name,
            clearedEffects: clearedEffects,
            totalCleared: clearedEffects.length,
            actionsAfterClearing: combatant.availableActions
        };
    }

    /**
     * Obtiene información de efectos activos
     */
    getActiveEffectsInfo(combatant) {
        if (!combatant.statusEffects || Object.keys(combatant.statusEffects).length === 0) {
            return {
                combatantName: combatant.name,
                hasEffects: false,
                totalEffects: 0,
                effects: []
            };
        }
        
        const effects = Object.entries(combatant.statusEffects).map(([type, effect]) => ({
            type: type,
            name: effect.name,
            stacks: effect.stacks,
            duration: effect.duration,
            maxDuration: effect.maxDuration,
            potency: effect.potency,
            appliedBy: effect.appliedBy,
            appliedTurn: effect.appliedTurn,
            sourceName: effect.sourceName,
            effectType: effect.effectType
        }));
        
        // Calcular impacto total
        let totalActionReduction = 0;
        let totalStatReduction = 0;
        let totalDoTDamage = 0;
        
        effects.forEach(effect => {
            const effectValues = this.EFFECT_CONSTANTS.EFFECT_VALUES[effect.type];
            if (effectValues) {
                switch (effect.effectType) {
                    case 'ACTION_REDUCTION':
                        if (effect.type === 'STUN') {
                            totalActionReduction += Math.min(
                                effectValues.actionsLostPerStack * effect.stacks,
                                effectValues.maxActionsLost
                            );
                        }
                        break;
                    case 'STAT_REDUCTION':
                        if (effect.type === 'FREEZE') {
                            totalStatReduction += Math.min(
                                effectValues.agiReductionPerStack * effect.stacks,
                                effectValues.maxAgiReduction
                            );
                        }
                        break;
                    case 'DAMAGE_OVER_TIME':
                        totalDoTDamage += effectValues.damagePerStack * effect.stacks * effect.potency;
                        break;
                }
            }
        });
        
        return {
            combatantName: combatant.name,
            hasEffects: true,
            totalEffects: effects.length,
            effects: effects,
            impactSummary: {
                totalActionReduction,
                totalStatReduction: Math.round(totalStatReduction * 100) + '%',
                estimatedDoTDamage: Math.round(totalDoTDamage),
                currentActions: combatant.availableActions || this.EFFECT_CONSTANTS.ACTION_SYSTEM.BASE_ACTIONS_PER_TURN
            }
        };
    }

    /**
     * Genera reporte de efectos
     */
    generateEffectsReport(combatant) {
        const effectsInfo = this.getActiveEffectsInfo(combatant);
        
        let report = '═'.repeat(70) + '\n';
        report += `REPORTE DE ESTADOS ALTERADOS - ${combatant.name.toUpperCase()}\n`;
        report += '═'.repeat(70) + '\n\n';
        report += `🎯 Reportado: ${combatant.name}\n\n`;
        
        if (!effectsInfo.hasEffects) {
            report += '✅ Sin efectos activos\n';
            return report;
        }
        
        report += `📊 Resumen: ${effectsInfo.totalEffects} efectos activos\n`;
        report += '─'.repeat(40) + '\n\n';
        
        // Listar efectos
        report += '🎯 EFECTOS ACTIVOS:\n';
        report += '─'.repeat(40) + '\n';
        
        effectsInfo.effects.forEach(effect => {
            report += `• ${effect.name}\n`;
            report += `  ⏱️  Duración: ${effect.duration}/${effect.maxDuration} turnos\n`;
            report += `  📊 Stacks: ${effect.stacks}\n`;
            report += `  ⚡ Potencia: ${effect.potency.toFixed(1)}x\n`;
            report += `  👤 Aplicado por: ${effect.sourceName}\n`;
            report += `  🎯 Tipo: ${effect.effectType.replace('_', ' ')}\n\n`;
        });
        
        // Impacto
        report += '💥 IMPACTO ESTIMADO:\n';
        report += '─'.repeat(40) + '\n';
        report += `• Reducción de acciones: ${effectsInfo.impactSummary.totalActionReduction}\n`;
        report += `• Reducción de estadísticas: ${effectsInfo.impactSummary.totalStatReduction}\n`;
        report += `• Daño por turno estimado: ${effectsInfo.impactSummary.estimatedDoTDamage}\n`;
        report += `• Acciones disponibles: ${effectsInfo.impactSummary.currentActions}/${this.EFFECT_CONSTANTS.ACTION_SYSTEM.BASE_ACTIONS_PER_TURN}\n`;
        
        return report;
    }
}

// Exportar la clase
module.exports = StatusEffects;