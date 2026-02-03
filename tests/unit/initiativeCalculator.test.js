const InitiativeCalculator = require('../../server/engine/initiativeCalculator');

describe('Calculadora de Iniciativa', () => {
    let initiativeCalculator;
    
    beforeEach(() => {
        initiativeCalculator = new InitiativeCalculator();
    });

    describe('calculateInitiative()', () => {
        test('calcula iniciativa correctamente para un combatiente', () => {
            const combatant = {
                id: 1,
                name: 'Jugador 1',
                agi: 10,
                per: 8
            };

            const result = initiativeCalculator.calculateInitiative(combatant, false);
            
            expect(result.combatantId).toBe(1);
            expect(result.combatantName).toBe('Jugador 1');
            expect(result.agi).toBe(10);
            expect(result.per).toBe(8);
            expect(result.attributeBonus).toBe(28); // (10×2) + 8 = 28
            expect(result.diceResult).toBe(0);
            expect(result.totalInitiative).toBe(28);
            expect(result.timestamp).toBeDefined();
        });

        test('incluye tirada de dados cuando rollDice es true', () => {
            const combatant = {
                name: 'Test',
                agi: 5,
                per: 5
            };

            const result = initiativeCalculator.calculateInitiative(combatant, true);
            
            expect(result.diceRoll).toBeDefined();
            expect(result.diceRoll.die1).toBeGreaterThanOrEqual(1);
            expect(result.diceRoll.die1).toBeLessThanOrEqual(10);
            expect(result.diceResult).toBeGreaterThanOrEqual(2);
            expect(result.diceResult).toBeLessThanOrEqual(20);
            expect(result.totalInitiative).toBe(result.attributeBonus + result.diceResult);
        });

        test('lanza error para combatiente inválido', () => {
            expect(() => initiativeCalculator.calculateInitiative(null)).toThrow();
            expect(() => initiativeCalculator.calculateInitiative({})).toThrow();
            expect(() => initiativeCalculator.calculateInitiative({ name: 'Test' })).toThrow();
        });
    });

    describe('calculateMultipleInitiatives()', () => {
        test('calcula iniciativa para múltiples combatientes', () => {
            const combatants = [
                { id: 1, name: 'A', agi: 10, per: 8 },
                { id: 2, name: 'B', agi: 12, per: 6 },
                { id: 3, name: 'C', agi: 8, per: 10 }
            ];

            const results = initiativeCalculator.calculateMultipleInitiatives(combatants, false);
            
            expect(results).toHaveLength(3);
            expect(results[0].attributeBonus).toBe(28); // A: (10×2) + 8
            expect(results[1].attributeBonus).toBe(30); // B: (12×2) + 6
            expect(results[2].attributeBonus).toBe(26); // C: (8×2) + 10
        });

        test('lanza error si no se pasa un array', () => {
            expect(() => initiativeCalculator.calculateMultipleInitiatives(null)).toThrow();
            expect(() => initiativeCalculator.calculateMultipleInitiatives({})).toThrow();
        });
    });

    describe('sortByInitiative()', () => {
        test('ordena combatientes por iniciativa (mayor a menor)', () => {
            const combatants = [
                { combatantName: 'A', totalInitiative: 15, attributeBonus: 10, agi: 5 },
                { combatantName: 'B', totalInitiative: 25, attributeBonus: 15, agi: 8 },
                { combatantName: 'C', totalInitiative: 20, attributeBonus: 12, agi: 6 }
            ];

            const sorted = initiativeCalculator.sortByInitiative(combatants);
            
            expect(sorted).toHaveLength(3);
            expect(sorted[0].combatantName).toBe('B'); // Mayor iniciativa (25)
            expect(sorted[1].combatantName).toBe('C'); // Segunda (20)
            expect(sorted[2].combatantName).toBe('A'); // Menor (15)
            
            // Verificar propiedades añadidas
            expect(sorted[0].turnOrder).toBe(1);
            expect(sorted[0].isFirst).toBe(true);
            expect(sorted[2].isLast).toBe(true);
        });

        test('resuelve empates por bonificación de atributos', () => {
            const combatants = [
                { combatantName: 'A', totalInitiative: 25, attributeBonus: 15, agi: 8 },
                { combatantName: 'B', totalInitiative: 25, attributeBonus: 18, agi: 9 },
                { combatantName: 'C', totalInitiative: 25, attributeBonus: 12, agi: 6 }
            ];

            const sorted = initiativeCalculator.sortByInitiative(combatants);
            
            expect(sorted[0].combatantName).toBe('B'); // Mayor bonificación (18)
            expect(sorted[1].combatantName).toBe('A'); // Segunda bonificación (15)
            expect(sorted[2].combatantName).toBe('C'); // Menor bonificación (12)
        });

        test('resuelve empates múltiples por AGI', () => {
            const combatants = [
                { combatantName: 'A', totalInitiative: 20, attributeBonus: 15, agi: 7 },
                { combatantName: 'B', totalInitiative: 20, attributeBonus: 15, agi: 9 },
                { combatantName: 'C', totalInitiative: 20, attributeBonus: 15, agi: 5 }
            ];

            const sorted = initiativeCalculator.sortByInitiative(combatants);
            
            expect(sorted[0].combatantName).toBe('B'); // Mayor AGI (9)
            expect(sorted[1].combatantName).toBe('A'); // Segunda AGI (7)
            expect(sorted[2].combatantName).toBe('C'); // Menor AGI (5)
        });

        test('resuelve empates completos por orden alfabético', () => {
            const combatants = [
                { combatantName: 'Carlos', totalInitiative: 18, attributeBonus: 12, agi: 6 },
                { combatantName: 'Ana', totalInitiative: 18, attributeBonus: 12, agi: 6 },
                { combatantName: 'Bruno', totalInitiative: 18, attributeBonus: 12, agi: 6 }
            ];

            const sorted = initiativeCalculator.sortByInitiative(combatants);
            
            expect(sorted[0].combatantName).toBe('Ana');
            expect(sorted[1].combatantName).toBe('Bruno');
            expect(sorted[2].combatantName).toBe('Carlos');
        });

        test('lanza error si falta iniciativa calculada', () => {
            const combatants = [
                { name: 'A', totalInitiative: 10 },
                { name: 'B' }, // Falta totalInitiative
                { name: 'C', totalInitiative: 15 }
            ];

            expect(() => initiativeCalculator.sortByInitiative(combatants)).toThrow();
        });
    });

    describe('calculateAndSortInitiative()', () => {
        test('calcula y ordena iniciativa completa', () => {
            const combatants = [
                { id: 1, name: 'Guerrero', agi: 14, per: 10 },
                { id: 2, name: 'Arquero', agi: 16, per: 12 },
                { id: 3, name: 'Mago', agi: 8, per: 14 }
            ];

            const result = initiativeCalculator.calculateAndSortInitiative(combatants);
            
            expect(result.roundId).toBeDefined();
            expect(result.timestamp).toBeDefined();
            expect(result.combatants).toHaveLength(3);
            expect(result.turnOrder).toHaveLength(3);
            expect(result.statistics).toBeDefined();
            
            // Verificar que están ordenados
            for (let i = 0; i < result.combatants.length - 1; i++) {
                expect(result.combatants[i].totalInitiative).toBeGreaterThanOrEqual(
                    result.combatants[i + 1].totalInitiative
                );
            }
        });

        test('estadísticas de ronda son correctas', () => {
            const combatants = [
                { name: 'A', agi: 10, per: 10 },
                { name: 'B', agi: 12, per: 8 },
                { name: 'C', agi: 8, per: 12 }
            ];

            const result = initiativeCalculator.calculateAndSortInitiative(combatants);
            const stats = result.statistics;
            
            expect(stats.totalCombatants).toBe(3);
            expect(stats.initiativeRange.highest).toBeGreaterThanOrEqual(stats.initiativeRange.lowest);
            expect(stats.initiativeRange.average).toBeDefined();
            expect(stats.attributeBonusRange).toBeDefined();
            expect(stats.diceResultsRange).toBeDefined();
            expect(stats.initiativeSpread).toBe(
                stats.initiativeRange.highest - stats.initiativeRange.lowest
            );
        });
    });

    describe('Fórmula específica: (AGI × 2) + PER + 2d10', () => {
        test('fórmula se aplica correctamente', () => {
            const testCases = [
                { agi: 5, per: 5, diceResult: 10, expected: (5*2) + 5 + 10 },
                { agi: 10, per: 0, diceResult: 20, expected: (10*2) + 0 + 20 },
                { agi: 0, per: 10, diceResult: 2, expected: (0*2) + 10 + 2 },
                { agi: 20, per: 20, diceResult: 20, expected: (20*2) + 20 + 20 }
            ];

            testCases.forEach(({ agi, per, diceResult, expected }) => {
                // Mock del diceRoller para controlar el resultado
                const mockRoller = { 
                    roll2d10: () => ({ 
                        die1: Math.floor(diceResult/2), 
                        die2: Math.ceil(diceResult/2), 
                        total: diceResult 
                    }) 
                };
                
                initiativeCalculator.diceRoller = mockRoller;
                const combatant = { name: 'Test', agi, per };
                const result = initiativeCalculator.calculateInitiative(combatant, true);
                
                expect(result.totalInitiative).toBe(expected);
                expect(result.attributeBonus).toBe((agi * 2) + per);
                expect(result.diceResult).toBe(diceResult);
            });
        });
    });
});