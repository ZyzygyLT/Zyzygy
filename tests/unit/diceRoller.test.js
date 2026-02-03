const DiceRoller = require('../../server/engine/diceRoller');
const diceRoller = new DiceRoller();

describe('Sistema de Dados 2d10 Gaussiano', () => {
    describe('roll1d10()', () => {
        test('debe devolver un número entre 1 y 10', () => {
            for (let i = 0; i < 100; i++) {
                const result = diceRoller.roll1d10();
                expect(result).toBeGreaterThanOrEqual(1);
                expect(result).toBeLessThanOrEqual(10);
            }
        });
    });

    describe('roll2d10()', () => {
        test('debe devolver un objeto con las propiedades correctas', () => {
            const result = diceRoller.roll2d10();
            
            expect(result).toHaveProperty('die1');
            expect(result).toHaveProperty('die2');
            expect(result).toHaveProperty('total');
            expect(result).toHaveProperty('timestamp');
            
            expect(result.die1).toBeGreaterThanOrEqual(1);
            expect(result.die1).toBeLessThanOrEqual(10);
            expect(result.die2).toBeGreaterThanOrEqual(1);
            expect(result.die2).toBeLessThanOrEqual(10);
            expect(result.total).toBeGreaterThanOrEqual(2);
            expect(result.total).toBeLessThanOrEqual(20);
        });

        test('el total debe ser la suma de ambos dados', () => {
            for (let i = 0; i < 50; i++) {
                const result = diceRoller.roll2d10();
                expect(result.total).toBe(result.die1 + result.die2);
            }
        });
    });

    describe('roll2d10WithMods()', () => {
        test('debe aplicar correctamente el modificador base', () => {
            const baseMod = 5;
            const result = diceRoller.roll2d10WithMods(baseMod);
            
            expect(result).toHaveProperty('baseMod', baseMod);
            expect(result).toHaveProperty('finalResult');
            expect(result.finalResult).toBe(result.total + baseMod);
        });

        test('debe manejar modificadores adicionales', () => {
            const baseMod = 3;
            const additionalMods = [2, -1, 4];
            const result = diceRoller.roll2d10WithMods(baseMod, additionalMods);
            
            const expectedTotalMod = baseMod + additionalMods.reduce((a, b) => a + b, 0);
            expect(result.totalModifier).toBe(expectedTotalMod);
            expect(result.finalResult).toBe(result.total + expectedTotalMod);
        });

        test('debe identificar críticos correctamente', () => {
            // Mock para probar críticos
            const originalRoll1d10 = diceRoller.roll1d10;
            
            // Test éxito crítico
            diceRoller.roll1d10 = () => 10;
            let result = diceRoller.roll2d10WithMods(0);
            expect(result.isCriticalSuccess).toBe(true);
            expect(result.isCriticalFailure).toBe(false);
            
            // Test fracaso crítico
            diceRoller.roll1d10 = () => 1;
            result = diceRoller.roll2d10WithMods(0);
            expect(result.isCriticalSuccess).toBe(false);
            expect(result.isCriticalFailure).toBe(true);
            
            // Restaurar función original
            diceRoller.roll1d10 = originalRoll1d10;
        });
    });

    describe('Distribución Gaussiana', () => {
        test('la distribución debe aproximarse a una curva normal', () => {
            const numberOfRolls = 10000;
            const rolls = diceRoller.massRoll(numberOfRolls);
            const stats = diceRoller.calculateStatistics(rolls);
            
            // La media debe estar cerca de 11 (media teórica de 2d10)
            expect(stats.mean).toBeGreaterThan(10.5);
            expect(stats.mean).toBeLessThan(11.5);
            
            // La desviación estándar teórica para la suma de dos d10 es ~4.06
            expect(stats.standardDeviation).toBeGreaterThan(3.8);
            expect(stats.standardDeviation).toBeLessThan(4.3);
            
            // Verificar que todos los resultados posibles están presentes
            for (let i = 2; i <= 20; i++) {
                expect(stats.frequency[i]).toBeDefined();
                expect(stats.frequency[i]).toBeGreaterThan(0);
            }
        });

        test('la probabilidad de cada resultado debe ser coherente', () => {
            const numberOfRolls = 5000;
            const rolls = diceRoller.massRoll(numberOfRolls);
            const stats = diceRoller.calculateStatistics(rolls);
            
            // Resultado 7 (probabilidad teórica: 6/100 = 6%)
            expect(stats.probabilityDistribution[7]).toBeGreaterThan(5);
            expect(stats.probabilityDistribution[7]).toBeLessThan(7);
            
            // Resultado 11 (probabilidad teórica: 10/100 = 10%)
            expect(stats.probabilityDistribution[11]).toBeGreaterThan(9);
            expect(stats.probabilityDistribution[11]).toBeLessThan(11);
        });
    });

    describe('calculateStatistics()', () => {
        test('debe calcular correctamente las estadísticas', () => {
            const testRolls = [7, 11, 15, 10, 12, 8, 14, 9, 13, 11];
            const stats = diceRoller.calculateStatistics(testRolls);
            
            expect(stats.totalRolls).toBe(10);
            expect(stats.mean).toBeCloseTo(11, 1);
            expect(stats.min).toBe(7);
            expect(stats.max).toBe(15);
            expect(stats.frequency[11]).toBe(2);
        });
    });
});