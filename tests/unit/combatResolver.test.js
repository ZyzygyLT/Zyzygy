const CombatResolver = require('../../server/engine/combatResolver');

describe('Sistema de Combate - Fase A (Precisión)', () => {
    let combatResolver;
    
    beforeEach(() => {
        combatResolver = new CombatResolver();
    });

    describe('calculateAttackRoll()', () => {
        test('calcula roll de ataque correctamente con fórmula completa', () => {
            const attacker = {
                id: 1,
                name: 'Guerrero',
                dexterity: 14,
                perception: 12
            };
            
            const weapon = {
                name: 'Espada Larga',
                accuracyBonus: 3,
                weight: 5
            };
            
            // Mock de dados para resultado predecible
            const originalRoller = combatResolver.diceRoller;
            combatResolver.diceRoller = {
                roll2d10: () => ({ total: 11, die1: 5, die2: 6 })
            };
            
            const result = combatResolver.calculateAttackRoll(attacker, weapon);
            
            // Verificar cálculos
            // DEX: 14 × 0.8 = 11.2
            // PER: 12 × 0.4 = 4.8
            // Arma: +3
            // Dados: 11
            // Peso: 5 × 0.1 = 0.5
            // Total esperado: 11.2 + 4.8 + 3 + 11 - 0.5 = 29.5
            
            expect(result.attackerName).toBe('Guerrero');
            expect(result.weaponName).toBe('Espada Larga');
            expect(result.components.dexBonus).toBeCloseTo(11.2, 1);
            expect(result.components.perBonus).toBeCloseTo(4.8, 1);
            expect(result.components.weaponBonus).toBe(3);
            expect(result.components.diceRoll).toBe(11);
            expect(result.components.weightPenalty).toBeCloseTo(0.5, 1);
            expect(result.finalTotal).toBeCloseTo(29.5, 1);
            
            // Restaurar roller original
            combatResolver.diceRoller = originalRoller;
        });

        test('incluye penalizaciones por fatiga y heridas', () => {
            const attacker = {
                name: 'Herido',
                dexterity: 10,
                perception: 10,
                exhaustionLevel: 2, // 20% de penalización
                woundLevel: 1       // 15% de penalización
            };
            
            const weapon = {
                name: 'Daga',
                accuracyBonus: 1,
                weight: 1
            };
            
            // Mock de dados
            combatResolver.diceRoller = {
                roll2d10: () => ({ total: 10 })
            };
            
            const result = combatResolver.calculateAttackRoll(attacker, weapon);
            
            // Penalizaciones esperadas:
            // Fatiga: 2 × 0.1 = 0.2
            // Herida: 1 × 0.15 = 0.15
            // Penalización total: 0.35
            
            expect(result.components.exhaustionPenalty).toBeCloseTo(0.2, 1);
            expect(result.components.woundPenalty).toBeCloseTo(0.15, 1);
            expect(result.finalTotal).toBeLessThan(result.baseTotal);
        });

        test('lanza error para atacante inválido', () => {
            const weapon = { name: 'Arma', weight: 1 };
            
            expect(() => combatResolver.calculateAttackRoll(null, weapon)).toThrow();
            expect(() => combatResolver.calculateAttackRoll({}, weapon)).toThrow();
            expect(() => combatResolver.calculateAttackRoll({ name: 'Test' }, weapon)).toThrow();
        });

        test('lanza error para arma inválida', () => {
            const attacker = { dexterity: 10, perception: 10 };
            
            expect(() => combatResolver.calculateAttackRoll(attacker, null)).toThrow();
            expect(() => combatResolver.calculateAttackRoll(attacker, {})).toThrow();
        });
    });

    describe('calculateDefenseRoll()', () => {
        test('calcula roll de defensa correctamente con fórmula completa', () => {
            const defender = {
                id: 2,
                name: 'Defensor',
                agility: 16,
                perception: 10
            };
            
            const armor = {
                name: 'Armadura de Cuero',
                defenseBonus: 2,
                weight: 8
            };
            
            // Mock de dados
            const originalRoller = combatResolver.diceRoller;
            combatResolver.diceRoller = {
                roll2d10: () => ({ total: 12, die1: 6, die2: 6 })
            };
            
            const result = combatResolver.calculateDefenseRoll(defender, armor);
            
            // Verificar cálculos
            // AGI: 16 × 1.0 = 16
            // PER: 10 × 0.2 = 2
            // Armadura: +2
            // Dados: 12
            // Penalización peso: 8 × 0.05 = 0.4
            // Total esperado: 16 + 2 + 2 + 12 - 0.4 = 31.6
            
            expect(result.defenderName).toBe('Defensor');
            expect(result.armorName).toBe('Armadura de Cuero');
            expect(result.components.agiBonus).toBeCloseTo(16, 1);
            expect(result.components.perBonus).toBeCloseTo(2, 1);
            expect(result.components.armorBonus).toBe(2);
            expect(result.components.diceRoll).toBe(12);
            expect(result.components.armorWeightPenalty).toBeCloseTo(0.4, 1);
            expect(result.finalTotal).toBeCloseTo(31.6, 1);
            
            combatResolver.diceRoller = originalRoller;
        });

        test('usa valores por defecto cuando no hay armadura', () => {
            const defender = {
                name: 'Sin Armadura',
                agility: 12,
                perception: 8
            };
            
            const result = combatResolver.calculateDefenseRoll(defender);
            
            expect(result.armorName).toBe('Sin armadura');
            expect(result.components.armorBonus).toBe(0);
            expect(result.components.armorWeightPenalty).toBe(0);
        });

        test('lanza error para defensor inválido', () => {
            expect(() => combatResolver.calculateDefenseRoll(null)).toThrow();
            expect(() => combatResolver.calculateDefenseRoll({})).toThrow();
            expect(() => combatResolver.calculateDefenseRoll({ name: 'Test' })).toThrow();
        });
    });

    describe('resolveAttack()', () => {
        test('resuelve ataque completo y determina resultado correcto', () => {
            const attacker = {
                name: 'Atacante',
                dexterity: 15,
                perception: 12
            };
            
            const weapon = {
                name: 'Hacha',
                accuracyBonus: 2,
                weight: 6
            };
            
            const defender = {
                name: 'Defensor',
                agility: 14,
                perception: 10
            };
            
            const armor = {
                name: 'Cota de Malla',
                defenseBonus: 4,
                weight: 12
            };
            
            // Mock para resultados predecibles
            let attackRollCount = 0;
            let defenseRollCount = 0;
            
            combatResolver.diceRoller = {
                roll2d10: () => {
                    // Primera llamada: ataque
                    if (attackRollCount === 0) {
                        attackRollCount++;
                        return { total: 18, die1: 9, die2: 9 };
                    }
                    // Segunda llamada: defensa
                    defenseRollCount++;
                    return { total: 8, die1: 4, die2: 4 };
                }
            };
            
            const result = combatResolver.resolveAttack(attacker, weapon, defender, armor);
            
            // Verificar estructura del resultado
            expect(result.combatId).toBeDefined();
            expect(result.timestamp).toBeDefined();
            expect(result.attackRoll).toBeDefined();
            expect(result.defenseRoll).toBeDefined();
            expect(result.attackTotal).toBeDefined();
            expect(result.defenseTotal).toBeDefined();
            expect(result.difference).toBeDefined();
            expect(result.result).toBeDefined();
            
            // Verificar que la diferencia se calcula correctamente
            expect(result.difference).toBeCloseTo(result.attackTotal - result.defenseTotal, 1);
            
            // Verificar que hay modificadores
            expect(result.modifiers.position).toBeDefined();
            expect(result.modifiers.environment).toBeDefined();
            
            // Verificar análisis
            expect(result.analysis.attackerAdvantage).toBeDefined();
            expect(result.analysis.hitChance).toBeGreaterThan(0);
            expect(result.analysis.hitChance).toBeLessThan(100);
        });

        test('identifica correctamente CRITICAL_HIT cuando diferencia >= 15', () => {
            // Configurar para diferencia exactamente 15
            combatResolver.diceRoller = {
                roll2d10: () => ({ total: 20, die1: 10, die2: 10 }) // Ataque alto
            };
            
            const attacker = { dexterity: 20, perception: 20, name: 'A' };
            const weapon = { name: 'W', accuracyBonus: 5, weight: 0 };
            const defender = { agility: 1, perception: 1, name: 'D' };
            
            const result = combatResolver.resolveAttack(attacker, weapon, defender);
            
            expect(result.result.isCritical).toBe(true);
            expect(result.result.type).toBe('CRITICAL_HIT');
            expect(result.result.isHit).toBe(true);
        });

        test('identifica correctamente GRAZE cuando 0 < diferencia < 5', () => {
            // Configurar para diferencia pequeña
            combatResolver.diceRoller = {
                roll2d10: () => ({ total: 12 }) // Ataque y defensa similares
            };
            
            const attacker = { dexterity: 12, perception: 10, name: 'A' };
            const weapon = { name: 'W', accuracyBonus: 0, weight: 0 };
            const defender = { agility: 11, perception: 9, name: 'D' };
            
            const result = combatResolver.resolveAttack(attacker, weapon, defender);
            
            if (result.difference > 0 && result.difference < 5) {
                expect(result.result.isGraze).toBe(true);
                expect(result.result.type).toBe('GRAZE');
                expect(result.result.isHit).toBe(true);
            }
        });

        test('identifica correctamente MISS cuando diferencia <= 0', () => {
            // Configurar para ataque más bajo que defensa
            combatResolver.diceRoller = {
                roll2d10: () => ({ total: 5 }) // Ataque bajo
            };
            
            const attacker = { dexterity: 10, perception: 10, name: 'A' };
            const weapon = { name: 'W', accuracyBonus: 0, weight: 5 };
            const defender = { agility: 15, perception: 15, name: 'D' };
            
            const result = combatResolver.resolveAttack(attacker, weapon, defender);
            
            if (result.difference <= 0) {
                expect(result.result.isHit).toBe(false);
                expect(result.result.type).toBe('MISS');
            }
        });
    });

    describe('simulateAttacks()', () => {
        test('simula múltiples ataques y calcula estadísticas correctamente', () => {
            const attacker = {
                name: 'Simulador',
                dexterity: 14,
                perception: 12
            };
            
            const weapon = {
                name: 'Arma de Prueba',
                accuracyBonus: 2,
                weight: 3
            };
            
            const defender = {
                name: 'Objetivo',
                agility: 12,
                perception: 10
            };
            
            const iterations = 100;
            const simulation = combatResolver.simulateAttacks(attacker, weapon, defender, {}, iterations);
            
            // Verificar estructura
            expect(simulation.totalSimulations).toBe(iterations);
            expect(simulation.hits).toBeGreaterThanOrEqual(0);
            expect(simulation.hits).toBeLessThanOrEqual(iterations);
            expect(simulation.misses).toBe(iterations - simulation.hits);
            expect(simulation.attackRolls).toHaveLength(iterations);
            expect(simulation.defenseRolls).toHaveLength(iterations);
            expect(simulation.differences).toHaveLength(iterations);
            expect(simulation.hitResults).toHaveLength(iterations);
            
            // Verificar estadísticas
            expect(simulation.statistics.hitRate).toBeDefined();
            expect(simulation.statistics.criticalRate).toBeDefined();
            expect(simulation.statistics.grazeRate).toBeDefined();
            expect(simulation.statistics.missRate).toBeDefined();
            
            // Las tasas deben sumar aproximadamente 100%
            const totalRate = simulation.statistics.hitRate + 
                            simulation.statistics.missRate;
            expect(totalRate).toBeCloseTo(100, 1);
            
            // Verificar promedios
            expect(simulation.statistics.averageAttackRoll).toBeGreaterThan(0);
            expect(simulation.statistics.averageDefenseRoll).toBeGreaterThan(0);
            expect(simulation.statistics.averageDifference).toBeDefined();
            
            // Verificar valores mínimos y máximos
            expect(simulation.statistics.minAttackRoll).toBeLessThanOrEqual(simulation.statistics.maxAttackRoll);
            expect(simulation.statistics.minDefenseRoll).toBeLessThanOrEqual(simulation.statistics.maxDefenseRoll);
            
            // Verificar desviaciones estándar
            expect(simulation.statistics.attackRollStdDev).toBeGreaterThan(0);
            expect(simulation.statistics.defenseRollStdDev).toBeGreaterThan(0);
            
            // Verificar distribución
            expect(simulation.distribution.critical).toBe(simulation.criticals);
            expect(simulation.distribution.solidHit).toBe(simulation.hits - simulation.criticals - simulation.grazes);
            expect(simulation.distribution.graze).toBe(simulation.grazes);
            expect(simulation.distribution.miss).toBe(simulation.misses);
            
            // Verificar análisis de probabilidad
            expect(simulation.probabilityAnalysis.confidenceInterval95).toBeDefined();
            expect(simulation.probabilityAnalysis.marginOfError).toBeDefined();
            expect(simulation.probabilityAnalysis.statisticalPower).toBeDefined();
            expect(simulation.probabilityAnalysis.recommendedSampleSize).toBeGreaterThan(0);
        });

        test('advertencia con menos de 100 iteraciones', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            const attacker = { dexterity: 10, perception: 10, name: 'A' };
            const weapon = { name: 'W', accuracyBonus: 0, weight: 0 };
            const defender = { agility: 10, perception: 10, name: 'D' };
            
            combatResolver.simulateAttacks(attacker, weapon, defender, {}, 50);
            
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('verificar que hitRate se calcula correctamente', () => {
            // Mock para controlar resultados
            let hitCount = 0;
            const originalResolve = combatResolver.resolveAttack.bind(combatResolver);
            
            combatResolver.resolveAttack = () => {
                hitCount++;
                return {
                    attackTotal: 20,
                    defenseTotal: hitCount <= 70 ? 10 : 30, // 70 hits, 30 misses
                    difference: hitCount <= 70 ? 10 : -10,
                    result: {
                        isHit: hitCount <= 70,
                        type: hitCount <= 70 ? 'SOLID_HIT' : 'MISS'
                    }
                };
            };
            
            const attacker = { dexterity: 10, perception: 10, name: 'A' };
            const weapon = { name: 'W', accuracyBonus: 0, weight: 0 };
            const defender = { agility: 10, perception: 10, name: 'D' };
            
            const simulation = combatResolver.simulateAttacks(attacker, weapon, defender, {}, 100);
            
            expect(simulation.statistics.hitRate).toBe(70);
            expect(simulation.statistics.missRate).toBe(30);
            
            // Restaurar método original
            combatResolver.resolveAttack = originalResolve;
        });
    });

    describe('Métodos de apoyo', () => {
        test('calculateAdvantage() calcula ventaja táctica', () => {
            const attacker = { dexterity: 15, perception: 12, experienceLevel: 5 };
            const defender = { agility: 12, perception: 10, experienceLevel: 3 };
            
            const advantage = combatResolver.calculateAdvantage(attacker, defender);
            
            // Cálculo esperado:
            // DEX diff: (15-12) × 0.5 = 1.5
            // PER diff: (12-10) × 0.3 = 0.6
            // EXP diff: (5-3) × 0.2 = 0.4
            // Total: 2.5
            
            expect(advantage).toBeCloseTo(2.5, 1);
            expect(advantage).toBeGreaterThanOrEqual(-10);
            expect(advantage).toBeLessThanOrEqual(10);
        });

        test('estimateHitChance() estima probabilidad razonable', () => {
            const attacker = { dexterity: 14, perception: 12, name: 'A' };
            const weapon = { accuracyBonus: 3, weight: 5 };
            const defender = { agility: 12, perception: 10, name: 'D' };
            const armor = { defenseBonus: 2, weight: 8 };
            
            const hitChance = combatResolver.estimateHitChance(attacker, weapon, defender, armor);
            
            expect(hitChance).toBeGreaterThan(0);
            expect(hitChance).toBeLessThan(100);
            expect(hitChance).toBeGreaterThanOrEqual(1);
            expect(hitChance).toBeLessThanOrEqual(99);
        });

        test('calculateStandardDeviation() calcula correctamente', () => {
            const values = [2, 4, 4, 4, 5, 5, 7, 9];
            // Media: 5
            // Varianza: (9+1+1+1+0+0+4+16)/8 = 32/8 = 4
            // Desviación estándar: √4 = 2
            
            const stdDev = combatResolver.calculateStandardDeviation(values);
            
            expect(stdDev).toBeCloseTo(2, 1);
        });

               test('generateCombatReport() crea reporte formateado', () => {
            const mockResult = {
                combatId: 'test_123',
                attackRoll: {
                    attackerName: 'Guerrero',
                    weaponName: 'Espada',
                    calculationDetails: 'Test details'
                },
                defenseRoll: {
                    defenderName: 'Orco',
                    armorName: 'Armadura',
                    calculationDetails: 'Defense details'
                },
                attackTotal: 25.5,
                defenseTotal: 18.3,
                difference: 7.2,
                result: {
                    type: 'SOLID_HIT',
                    description: 'Golpe sólido',
                    isHit: true,
                    isCritical: false
                },
                analysis: {
                    attackerAdvantage: 2.5,
                    hitChance: 65.5,
                    expectedDamage: { netDamage: 12.3 }
                }
            };
            
            const report = combatResolver.generateCombatReport(mockResult);
            
            expect(report).toBeDefined();
            expect(typeof report).toBe('string');
            expect(report).toContain('INFORME DE COMBATE');
            expect(report).toContain('Guerrero');
            expect(report).toContain('Orco');
            expect(report).toContain('Espada');
            expect(report).toContain('25.50');
            expect(report).toContain('18.30');
            expect(report).toContain('7.20');
            expect(report).toContain('SOLID_HIT');
            expect(report).toContain('65.5%');
        });

        test('generateCombatReport() maneja datos incompletos', () => {
            const incompleteResult = {
                combatId: 'test_456'
                // Falta attackRoll, defenseRoll, etc.
            };
            
            const report = combatResolver.generateCombatReport(incompleteResult);
            
            expect(report).toBeDefined();
            expect(report).toContain('INFORME DE COMBATE');
            expect(report).toContain('N/A'); // Debe mostrar N/A para datos faltantes
            expect(report).toContain('Desconocido'); // Para nombres faltantes
        });

        test('generateCombatReport() maneja resultado nulo', () => {
            const report = combatResolver.generateCombatReport(null);
            
            expect(report).toBeDefined();
            expect(report).toContain('Error');
            expect(report).toContain('inválido');
        });
    });

    describe('Validación de fórmulas', () => {
        test('fórmula de ataque: (DEX × 0.8) + (PER × 0.4) + Bono_Arma + 2d10 - (Peso × 0.1)', () => {
            const attacker = { dexterity: 10, perception: 10, name: 'T' };
            const weapon = { name: 'T', accuracyBonus: 5, weight: 10 };
            
            // Mock dados
            combatResolver.diceRoller = { roll2d10: () => ({ total: 11 }) };
            
            const result = combatResolver.calculateAttackRoll(attacker, weapon);
            
            // Cálculo manual:
            // DEX: 10 × 0.8 = 8
            // PER: 10 × 0.4 = 4
            // Arma: +5
            // Dados: 11
            // Peso: 10 × 0.1 = 1
            // Total: 8 + 4 + 5 + 11 - 1 = 27
            
            expect(result.finalTotal).toBeCloseTo(27, 1);
        });

        test('fórmula de defensa: (AGI × 1.0) + (PER × 0.2) + 2d10', () => {
            const defender = { agility: 15, perception: 10, name: 'T' };
            
            // Mock dados
            combatResolver.diceRoller = { roll2d10: () => ({ total: 12 }) };
            
            const result = combatResolver.calculateDefenseRoll(defender);
            
            // Cálculo manual:
            // AGI: 15 × 1.0 = 15
            // PER: 10 × 0.2 = 2
            // Dados: 12
            // Total: 15 + 2 + 12 = 29
            
            expect(result.finalTotal).toBeCloseTo(29, 1);
        });

        test('lógica Hit/Miss/Critical funciona correctamente', () => {
            // Test de cada caso
            
            // Caso 1: CRITICAL_HIT (diferencia >= 15)
            let result = combatResolver.resolveAttack(
                { dexterity: 20, perception: 20, name: 'A' },
                { name: 'W', accuracyBonus: 10, weight: 0 },
                { agility: 1, perception: 1, name: 'D' }
            );
            
            if (result.difference >= 15) {
                expect(result.result.type).toBe('CRITICAL_HIT');
            }
            
            // Caso 2: GRAZE (0 < diferencia < 5)
            result = combatResolver.resolveAttack(
                { dexterity: 11, perception: 10, name: 'A' },
                { name: 'W', accuracyBonus: 0, weight: 0 },
                { agility: 10, perception: 10, name: 'D' }
            );
            
            if (result.difference > 0 && result.difference < 5) {
                expect(result.result.type).toBe('GRAZE');
            }
            
            // Caso 3: MISS (diferencia <= 0)
            result = combatResolver.resolveAttack(
                { dexterity: 5, perception: 5, name: 'A' },
                { name: 'W', accuracyBonus: 0, weight: 10 },
                { agility: 15, perception: 15, name: 'D' }
            );
            
            if (result.difference <= 0) {
                expect(result.result.type).toBe('MISS');
            }
        });
    });
});