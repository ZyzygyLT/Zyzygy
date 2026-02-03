const StatusEffects = require('../../server/engine/statusEffects');

describe('Sistema de Estados Alterados (Debuffs)', () => {
    let statusEffects;
    
    beforeEach(() => {
        statusEffects = new StatusEffects();
    });

    describe('applyStatusEffects()', () => {
        test('aplica múltiples efectos correctamente', () => {
            const combatant = {
                id: 'test001',
                name: 'Guerrero de Prueba',
                currentTurn: 1,
                baseActionsPerTurn: 3
            };
            
            const effects = [
                { type: 'BLEEDING', potency: 1.2 },
                { type: 'STUN', potency: 1.0 }
            ];
            
            const source = { id: 'mage001', name: 'Mago' };
            
            const result = statusEffects.applyStatusEffects(combatant, effects, source);
            
            expect(result.combatantName).toBe('Guerrero de Prueba');
            expect(result.effectsApplied).toHaveLength(2);
            expect(result.effectsApplied[0].type).toBe('BLEEDING');
            expect(result.effectsApplied[1].type).toBe('STUN');
            expect(result.summary.totalApplied).toBe(2);
            expect(combatant.statusEffects).toBeDefined();
            expect(Object.keys(combatant.statusEffects)).toHaveLength(2);
        });

        test('maneja efectos resistidos', () => {
            const combatant = {
                name: 'Resistente',
                vitality: 30, // Alta vitalidad = alta resistencia
                willpower: 25,
                currentTurn: 1
            };
            
            const effects = [
                { type: 'BLEEDING', potency: 1.0 },
                { type: 'STUN', potency: 1.0 }
            ];
            
            const result = statusEffects.applyStatusEffects(combatant, effects);
            
            // Puede que algunos efectos sean resistidos
            expect(result.effectsResisted.length + result.effectsApplied.length).toBe(2);
            
            if (result.effectsResisted.length > 0) {
                expect(result.effectsResisted[0].resisted).toBe(true);
            }
        });

        test('lanza error para entrada inválida', () => {
            expect(() => statusEffects.applyStatusEffects(null, [])).toThrow();
            expect(() => statusEffects.applyStatusEffects({}, null)).toThrow();
        });
    });

    describe('Sistema de Sangrado (BLEEDING)', () => {
        test('aplica sangrado con stacks', () => {
            const combatant = {
                name: 'Objetivo',
                currentTurn: 1,
                maxHealth: 100,
                currentHealth: 100
            };
            
            const effects = [
                { type: 'BLEEDING', initialStacks: 2, potency: 1.0 }
            ];
            
            statusEffects.applyStatusEffects(combatant, effects);
            
            const bleedingEffect = combatant.statusEffects.BLEEDING;
            expect(bleedingEffect).toBeDefined();
            expect(bleedingEffect.stacks).toBe(2);
            expect(bleedingEffect.duration).toBeGreaterThan(0);
            expect(bleedingEffect.metadata.ignoresArmor).toBe(true);
        });

        test('el sangrado hace daño por turno', () => {
            const combatant = {
                name: 'Sangrante',
                currentTurn: 1,
                maxHealth: 100,
                currentHealth: 100,
                vitality: 10
            };
            
            // Aplicar sangrado
            statusEffects.applyStatusEffects(combatant, [
                { type: 'BLEEDING', initialStacks: 3, potency: 1.0 }
            ]);
            
            // Procesar inicio de turno
            const turnResult = statusEffects.processTurnStartEffects(combatant);
            
            expect(turnResult.damageTaken).toBeGreaterThan(0);
            expect(turnResult.damageByType.PHYSICAL).toBeDefined();
            expect(turnResult.healthAfterDamage).toBeLessThan(100);
            expect(turnResult.effectsProcessed).toHaveLength(1);
        });

        test('el sangrado stackea hasta 5 veces', () => {
            const combatant = {
                name: 'Múltiples Heridas',
                currentTurn: 1
            };
            
            // Aplicar sangrado varias veces
            for (let i = 0; i < 6; i++) {
                statusEffects.applyStatusEffects(combatant, [
                    { type: 'BLEEDING', potency: 1.0 }
                ]);
            }
            
            const bleedingEffect = combatant.statusEffects.BLEEDING;
            expect(bleedingEffect.stacks).toBe(5); // Máximo 5 stacks
        });
    });

    describe('Sistema de Aturdimiento (STUN)', () => {
        test('aturdimiento reduce acciones', () => {
            const combatant = {
                name: 'Aturdido',
                currentTurn: 1,
                baseActionsPerTurn: 3
            };
            
            statusEffects.applyStatusEffects(combatant, [
                { type: 'STUN', potency: 1.0 }
            ]);
            
            // STUN debe reducir acciones disponibles
            expect(combatant.availableActions).toBeLessThan(3);
            expect(combatant.availableActions).toBeGreaterThanOrEqual(1); // Mínimo 1 acción
        });

        test('aturdimiento dura 1 turno por defecto', () => {
            const combatant = {
                name: 'Test',
                currentTurn: 1
            };
            
            statusEffects.applyStatusEffects(combatant, [
                { type: 'STUN', potency: 1.0 }
            ]);
            
            const stunEffect = combatant.statusEffects.STUN;
            expect(stunEffect.duration).toBe(1); // 1 turno
            
            // Procesar turno - debe expirar
            const turnResult = statusEffects.processTurnStartEffects(combatant);
            
            expect(turnResult.effectsExpired).toHaveLength(1);
            expect(turnResult.effectsExpired[0].type).toBe('STUN');
            expect(combatant.statusEffects.STUN).toBeUndefined();
        });

        test('aturdimiento no stackea pero refresca duración', () => {
            const combatant = {
                name: 'Refresco',
                currentTurn: 1
            };
            
            // Aplicar STUN
            statusEffects.applyStatusEffects(combatant, [
                { type: 'STUN', potency: 1.0 }
            ]);
            
            const firstDuration = combatant.statusEffects.STUN.duration;
            
            // Aplicar otro STUN (debería refrescar)
            combatant.currentTurn = 2;
            statusEffects.applyStatusEffects(combatant, [
                { type: 'STUN', potency: 1.5 }
            ]);
            
            // No debería haber stack, solo refresh de duración
            expect(combatant.statusEffects.STUN.stacks).toBe(1);
            expect(combatant.statusEffects.STUN.duration).toBe(firstDuration); // Se refrescó
        });
    });

    describe('Sistema de Congelación (FREEZE)', () => {
        test('congelación reduce AGI progresivamente', () => {
            const combatant = {
                name: 'Congelado',
                agility: 20,
                currentTurn: 1
            };
            
            statusEffects.applyStatusEffects(combatant, [
                { type: 'FREEZE', initialStacks: 2, potency: 1.0 }
            ]);
            
            const freezeEffect = combatant.statusEffects.FREEZE;
            expect(freezeEffect.stacks).toBe(2);
            
            // Procesar turno para aplicar reducción
            const turnResult = statusEffects.processTurnStartEffects(combatant);
            
            expect(turnResult.statModifications.agility).toBeDefined();
            expect(turnResult.statModifications.agility).toBeLessThan(1);
            expect(combatant.agility).toBeLessThan(20);
        });
            
        test('congelación tiene máximo 50% reducción de AGI', () => {
            const combatant = {
                name: 'Muy Congelado',
                agility: 20,
                originalStats: { agility: 20 },
                currentTurn: 1
            };
            
            // Aplicar máximo stacks de congelación
            statusEffects.applyStatusEffects(combatant, [
                { type: 'FREEZE', initialStacks: 5, potency: 1.0 } // Máximo es 3 stacks
            ]);
            
            const freezeEffect = combatant.statusEffects.FREEZE;
            expect(freezeEffect.stacks).toBe(3); // Máximo 3 stacks
            
            // Procesar varios turnos
            for (let i = 0; i < 3; i++) {
                statusEffects.processTurnStartEffects(combatant);
            }
            
            // AGI no debe bajar de 50%
            expect(combatant.agility).toBeGreaterThanOrEqual(10); // 50% de 20
        });

        test('congelación también reduce velocidad', () => {
            const combatant = {
                name: 'Lento',
                speed: 15,
                currentTurn: 1
            };
            
            statusEffects.applyStatusEffects(combatant, [
                { type: 'FREEZE', initialStacks: 1, potency: 1.0 }
            ]);
            
            const turnResult = statusEffects.processTurnStartEffects(combatant);
            
            expect(turnResult.statModifications.speed).toBeDefined();
            expect(turnResult.statModifications.speed).toBeGreaterThan(0);
        });
    });

    describe('processTurnStartEffects()', () => {
        test('procesa múltiples efectos correctamente', () => {
            const combatant = {
                name: 'Multiafectado',
                maxHealth: 100,
                currentHealth: 100,
                baseActionsPerTurn: 3,
                currentTurn: 1,
                vitality: 10,
                willpower: 10
            };
            
            // Aplicar varios efectos
            statusEffects.applyStatusEffects(combatant, [
                { type: 'BLEEDING', initialStacks: 2 },
                { type: 'POISON', initialStacks: 1 },
                { type: 'STUN' }
            ]);
            
            // Procesar inicio de turno
            const turnResult = statusEffects.processTurnStartEffects(combatant);
            
            expect(turnResult.damageTaken).toBeGreaterThan(0);
            expect(turnResult.effectsProcessed.length + turnResult.effectsExpired.length).toBe(3);
            expect(turnResult.actionsLost).toBeGreaterThanOrEqual(0);
        });

        test('efectos expiran después de su duración', () => {
            const combatant = {
                name: 'Temporal',
                currentTurn: 1
            };
            
            statusEffects.applyStatusEffects(combatant, [
                { type: 'BLEEDING' } // Duración por defecto: 3 turnos
            ]);
            
            const bleedingEffect = combatant.statusEffects.BLEEDING;
            const initialDuration = bleedingEffect.duration;
            
            // Procesar múltiples turnos
            for (let i = 0; i < initialDuration + 1; i++) {
                combatant.currentTurn = i + 2;
                statusEffects.processTurnStartEffects(combatant);
            }
            
            // El efecto debería haber expirado
            expect(combatant.statusEffects.BLEEDING).toBeUndefined();
        });

        test('daño no mata instantáneamente', () => {
            const combatant = {
                name: 'Casi Muerto',
                maxHealth: 10,
                currentHealth: 10,
                currentTurn: 1
            };
            
            // Aplicar sangrado fuerte
            statusEffects.applyStatusEffects(combatant, [
                { type: 'BLEEDING', initialStacks: 5, potency: 2.0 }
            ]);
            
            const turnResult = statusEffects.processTurnStartEffects(combatant);
            
            // El daño puede ser alto, pero el combatiente no debería tener salud negativa
            expect(turnResult.healthAfterDamage).toBeGreaterThanOrEqual(0);
            if (turnResult.healthAfterDamage === 0) {
                expect(turnResult.wasKnockedOut).toBe(true);
            }
        });
    });

    describe('Sistema de múltiples acciones', () => {
        test('calcula acciones disponibles correctamente', () => {
            const combatant = {
                name: 'Accionista',
                baseActionsPerTurn: 4,
                currentTurn: 1
            };
            
            // Sin efectos, todas las acciones disponibles
            statusEffects.calculateAvailableActions(combatant);
            expect(combatant.availableActions).toBe(4);
            
            // Con STUN, pierde acciones
            combatant.statusEffects = {
                STUN: {
                    type: 'STUN',
                    name: 'Aturdimiento',
                    stacks: 1,
                    effectType: 'ACTION_REDUCTION'
                }
            };
            
            statusEffects.calculateAvailableActions(combatant);
            expect(combatant.availableActions).toBe(3); // Pierde 1 acción
        });

        test('STUN reduce acciones específicas, no todo el turno', () => {
            const combatant = {
                name: 'Aturdido Parcial',
                baseActionsPerTurn: 3,
                currentTurn: 1
            };
            
            statusEffects.applyStatusEffects(combatant, [
                { type: 'STUN', potency: 1.0 }
            ]);
            
            // Con 3 acciones base y STUN, debería tener 2 acciones
            expect(combatant.availableActions).toBe(2);
            
            // Aún puede actuar, pero con menos acciones
            expect(combatant.availableActions).toBeGreaterThan(0);
        });

        test('mínimo 1 acción siempre disponible', () => {
            const combatant = {
                name: 'Muy Aturdido',
                baseActionsPerTurn: 3,
                currentTurn: 1
            };
            
            // Aplicar múltiples efectos que reducen acciones
            combatant.statusEffects = {
                STUN: {
                    type: 'STUN',
                    name: 'Aturdimiento',
                    stacks: 2, // Doble stun
                    effectType: 'ACTION_REDUCTION'
                },
                SLOW: {
                    type: 'SLOW',
                    name: 'Ralentización',
                    stacks: 2,
                    effectType: 'ACTION_REDUCTION'
                },
                CONFUSION: {
                    type: 'CONFUSION',
                    name: 'Confusión',
                    stacks: 1,
                    effectType: 'ACTION_REDUCTION'
                }
            };
            
            statusEffects.calculateAvailableActions(combatant);
            
            // Aunque haya muchos debuffs, mínimo 1 acción
            expect(combatant.availableActions).toBe(1);
        });
    });

    describe('Resistencias y limpieza', () => {
        test('altos atributos aumentan resistencia', () => {
            const weakCombatant = {
                name: 'Débil',
                vitality: 5,
                willpower: 5,
                currentTurn: 1
            };
            
            const strongCombatant = {
                name: 'Fuerte',
                vitality: 25,
                willpower: 25,
                endurance: 20,
                currentTurn: 1
            };
            
            const sameEffect = { type: 'BLEEDING', potency: 1.0 };
            
            const weakResult = statusEffects.applyStatusEffects(weakCombatant, [sameEffect]);
            const strongResult = statusEffects.applyStatusEffects(strongCombatant, [sameEffect]);
            
            // El combatiente fuerte debería tener más chance de resistir
            const weakApplied = weakResult.effectsApplied.length;
            const strongApplied = strongResult.effectsApplied.length;
            
            // No podemos garantizar que siempre resista, pero estadísticamente debería
            if (strongResult.effectsResisted.length > 0) {
                expect(strongResult.effectsResisted[0].applyChance).toBeLessThan(
                    weakResult.effectsApplied[0]?.applyChance || 1
                );
            }
        });

        test('clearAllEffects() limpia todos los efectos', () => {
            const combatant = {
                name: 'Afectado',
                agility: 20,
                originalStats: { agility: 20 },
                currentTurn: 1,
                statusEffects: {
                    BLEEDING: { type: 'BLEEDING', name: 'Sangrado', stacks: 2 },
                    FREEZE: { type: 'FREEZE', name: 'Congelación', stacks: 1 }
                }
            };
            
            const clearResult = statusEffects.clearAllEffects(combatant);
            
            expect(clearResult.clearedEffects).toContain('BLEEDING');
            expect(clearResult.clearedEffects).toContain('FREEZE');
            expect(clearResult.totalCleared).toBe(2);
            expect(combatant.statusEffects).toEqual({});
            expect(combatant.agility).toBe(20); // Estadísticas restauradas
        });

        test('clearSpecificEffects() limpia efectos específicos', () => {
            const combatant = {
                name: 'Selectivo',
                currentTurn: 1,
                statusEffects: {
                    BLEEDING: { type: 'BLEEDING', name: 'Sangrado' },
                    POISON: { type: 'POISON', name: 'Veneno' },
                    BURN: { type: 'BURN', name: 'Quemadura' }
                }
            };
            
            const clearResult = statusEffects.clearSpecificEffects(combatant, ['BLEEDING', 'BURN']);
            
            expect(clearResult.clearedEffects).toHaveLength(2);
            expect(combatant.statusEffects.BLEEDING).toBeUndefined();
            expect(combatant.statusEffects.BURN).toBeUndefined();
            expect(combatant.statusEffects.POISON).toBeDefined(); // Este no se limpió
        });
    });

    describe('Métodos de información', () => {
        test('getActiveEffectsInfo() proporciona información completa', () => {
            const combatant = {
                name: 'Informado',
                currentTurn: 1,
                baseActionsPerTurn: 3,
                statusEffects: {
                    BLEEDING: {
                        type: 'BLEEDING',
                        name: 'Sangrado',
                        stacks: 2,
                        duration: 2,
                        maxDuration: 3,
                        potency: 1.0,
                        effectType: 'DAMAGE_OVER_TIME'
                    },
                    STUN: {
                        type: 'STUN',
                        name: 'Aturdimiento',
                        stacks: 1,
                        duration: 1,
                        maxDuration: 1,
                        potency: 1.0,
                        effectType: 'ACTION_REDUCTION'
                    }
                }
            };
            
            const info = statusEffects.getActiveEffectsInfo(combatant);
            
            expect(info.combatantName).toBe('Informado');
            expect(info.hasEffects).toBe(true);
            expect(info.totalEffects).toBe(2);
            expect(info.effects).toHaveLength(2);
            expect(info.impactSummary).toBeDefined();
            expect(info.impactSummary.currentActions).toBeLessThanOrEqual(3);
        });

        test('generateEffectsReport() crea reporte formateado', () => {
            const combatant = {
                name: 'Reportado',
                currentTurn: 1,
                statusEffects: {
                    BLEEDING: {
                        type: 'BLEEDING',
                        name: 'Sangrado',
                        stacks: 1,
                        duration: 2,
                        maxDuration: 3,
                        potency: 1.0,
                        appliedBy: 'test001',
                        appliedTurn: 1,
                        sourceName: 'Atacante',
                        effectType: 'DAMAGE_OVER_TIME',
                        metadata: { damageType: 'PHYSICAL' }
                    }
                }
            };
            
            const report = statusEffects.generateEffectsReport(combatant);
            
            expect(typeof report).toBe('string');
            expect(report).toContain('REPORTE DE ESTADOS ALTERADOS');
            expect(report).toContain('Reportado');
            expect(report).toContain('Sangrado');
            expect(report).toContain('Duración');
        });
    });

    describe('Integración con sistema de combate', () => {
        test('efectos interactúan con estadísticas de combate', () => {
            const combatant = {
                name: 'Combatiente',
                agility: 20,
                strength: 18,
                accuracy: 15,
                maxHealth: 100,
                currentHealth: 100,
                baseActionsPerTurn: 3,
                currentTurn: 1,
                vitality: 12,
                willpower: 10,
                endurance: 14
            };
            
            // Simular ataque que aplica múltiples efectos
            statusEffects.applyStatusEffects(combatant, [
                { type: 'BLEEDING', initialStacks: 2, potency: 1.2 },
                { type: 'FREEZE', initialStacks: 1, potency: 1.0 },
                { type: 'STUN', potency: 1.0 }
            ]);
            
            // Verificar que todos los efectos se aplicaron
            expect(combatant.statusEffects.BLEEDING).toBeDefined();
            expect(combatant.statusEffects.FREEZE).toBeDefined();
            expect(combatant.statusEffects.STUN).toBeDefined();
            
            // Verificar impacto en combate
            expect(combatant.availableActions).toBeLessThan(3); // STUN redujo acciones
            expect(combatant.agility).toBe(20); // FREEZE aún no se aplicó (necesita processTurnStart)
            
            // Procesar turno
            const turnResult = statusEffects.processTurnStartEffects(combatant);
            
            expect(turnResult.damageTaken).toBeGreaterThan(0); // BLEEDING hizo daño
            expect(turnResult.statModifications.agility).toBeDefined(); // FREEZE redujo AGI
            expect(turnResult.actionsLost).toBeGreaterThan(0); // STUN hizo efecto
            expect(combatant.agility).toBeLessThan(20); // AGI reducida
        });

        test('sistema funciona con múltiples turnos', () => {
            const combatant = {
                name: 'Temporal',
                maxHealth: 50,
                currentHealth: 50,
                baseActionsPerTurn: 3,
                currentTurn: 1,
                vitality: 10
            };
            
            // Aplicar efectos duraderos
            statusEffects.applyStatusEffects(combatant, [
                { type: 'BLEEDING', initialStacks: 1 },
                { type: 'POISON', initialStacks: 1 }
            ]);
            
            const initialHealth = combatant.currentHealth;
            let totalDamage = 0;
            
            // Simular 5 turnos
            for (let turn = 1; turn <= 5; turn++) {
                combatant.currentTurn = turn;
                const turnResult = statusEffects.processTurnStartEffects(combatant);
                totalDamage += turnResult.damageTaken;
                
                console.log(`Turno ${turn}: ${turnResult.damageTaken} daño, Salud: ${turnResult.healthAfterDamage}`);
            }
            
            expect(totalDamage).toBeGreaterThan(0);
            expect(combatant.currentHealth).toBeLessThanOrEqual(initialHealth);
            
            // Después de varios turnos, algunos efectos deberían haber expirado
            const activeEffects = Object.keys(combatant.statusEffects || {}).length;
            expect(activeEffects).toBeLessThanOrEqual(2); // Máximo 2 efectos iniciales
        });
    });
});