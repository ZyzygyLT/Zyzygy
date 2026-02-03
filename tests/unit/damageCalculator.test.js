const DamageCalculator = require('../../server/engine/damageCalculator');

describe('Sistema de Combate - Fase B (Mitigación Hiperbólica)', () => {
    let damageCalculator;
    
    beforeEach(() => {
        damageCalculator = new DamageCalculator();
    });

    describe('calculateMitigationCoefficient()', () => {
        test('calcula coeficiente correctamente con fórmula hiperbólica', () => {
            // Fórmula: Coef = 100 / (100 + (Armor × 0.5))
            
            // Caso 1: Sin armadura
            expect(damageCalculator.calculateMitigationCoefficient(0)).toBeCloseTo(1.0, 3);
            
            // Caso 2: Armadura 10
            // 100 / (100 + (10 × 0.5)) = 100 / (100 + 5) = 100/105 ≈ 0.9524
            expect(damageCalculator.calculateMitigationCoefficient(10)).toBeCloseTo(0.9524, 3);
            
            // Caso 3: Armadura 50
            // 100 / (100 + (50 × 0.5)) = 100 / (100 + 25) = 100/125 = 0.8
            expect(damageCalculator.calculateMitigationCoefficient(50)).toBeCloseTo(0.8, 3);
            
            // Caso 4: Armadura 100
            // 100 / (100 + (100 × 0.5)) = 100 / (100 + 50) = 100/150 ≈ 0.6667
            expect(damageCalculator.calculateMitigationCoefficient(100)).toBeCloseTo(0.6667, 3);
            
            // Caso 5: Armadura 200 (extrema)
            // 100 / (100 + (200 × 0.5)) = 100 / (100 + 100) = 100/200 = 0.5
            expect(damageCalculator.calculateMitigationCoefficient(200)).toBeCloseTo(0.5, 3);
        });

        test('nunca retorna 0, siempre pasa algo de daño', () => {
            // Incluso con armadura extremadamente alta
            expect(damageCalculator.calculateMitigationCoefficient(1000)).toBeGreaterThan(0);
            expect(damageCalculator.calculateMitigationCoefficient(10000)).toBeGreaterThan(0);
            expect(damageCalculator.calculateMitigationCoefficient(999999)).toBeGreaterThan(0);
            
            // Mínimo es 0.01
            expect(damageCalculator.calculateMitigationCoefficient(999999)).toBeCloseTo(0.01, 2);
        });

        test('maneja valores negativos (sin armadura)', () => {
            expect(damageCalculator.calculateMitigationCoefficient(-10)).toBe(1.0);
        });
    });

    describe('calculateRawDamage()', () => {
        test('calcula daño bruto correctamente', () => {
            const attacker = {
                name: 'Guerrero',
                strength: 16,
                dexterity: 12,
                skillLevel: 3
            };
            
            const weapon = {
                name: 'Espada Larga',
                baseDamage: 8,
                damageType: 'SLASHING',
                weight: 4,
                criticalMultiplier: 2.0
            };
            
            const result = damageCalculator.calculateRawDamage(weapon, attacker, 'SOLID_HIT');
            
            expect(result.weaponName).toBe('Espada Larga');
            expect(result.attackerName).toBe('Guerrero');
            expect(result.hitType).toBe('SOLID_HIT');
            expect(result.rawDamage).toBeGreaterThan(0);
            expect(result.components.baseDamage).toBe(8);
            expect(result.components.hitTypeMultiplier).toBe(1.0);
        });

        test('aplica multiplicador de crítico correctamente', () => {
            const attacker = { name: 'A', strength: 10 };
            const weapon = { name: 'W', baseDamage: 10, criticalMultiplier: 2.0 };
            
            const normalResult = damageCalculator.calculateRawDamage(weapon, attacker, 'SOLID_HIT');
            const criticalResult = damageCalculator.calculateRawDamage(weapon, attacker, 'CRITICAL');
            
            // El crítico debería ser aproximadamente el doble
            expect(criticalResult.rawDamage).toBeGreaterThan(normalResult.rawDamage);
            expect(criticalResult.components.hitTypeMultiplier).toBe(2.0);
        });

        test('calcula daño con dados correctamente', () => {
            const attacker = { name: 'A', strength: 10 };
            const weapon = {
                name: 'Daga',
                damageDice: '1d6+2',
                damageType: 'PIERCING'
            };
            
            const result = damageCalculator.calculateRawDamage(weapon, attacker);
            
            // 1d6+2 tiene promedio de 3.5+2 = 5.5
            // + bonus de fuerza (10 × 0.5 = 5)
            // Total esperado alrededor de 10.5 (pero con varianza: 1d6 = [1-6])
            // Mín: 1+2+5 = 8, Máx: 6+2+5 = 13, pero puede haber efectos aleatorios
            expect(result.rawDamage).toBeGreaterThan(7);
            expect(result.rawDamage).toBeLessThan(25);
        });

        test('lanza error para arma inválida', () => {
            const attacker = { name: 'A', strength: 10 };
            
            expect(() => damageCalculator.calculateRawDamage(null, attacker)).toThrow();
            expect(() => damageCalculator.calculateRawDamage({}, attacker)).toThrow();
            expect(() => damageCalculator.calculateRawDamage({ name: 'W' }, attacker)).toThrow();
        });
    });

    describe('calculateFinalDamage()', () => {
        test('aplica mitigación hiperbólica correctamente', () => {
            const rawDamageResult = {
                rawDamage: 100,
                weaponType: 'SLASHING',
                weaponName: 'Test'
            };
            
            const defender = { name: 'Defensor' };
            const armor = { defense: 50, name: 'Armadura de Prueba' };
            
            const result = damageCalculator.calculateFinalDamage(rawDamageResult, defender, armor);
            
            // Con 50 de armadura:
            // Coef = 100 / (100 + (50 × 0.5)) = 100 / (100 + 25) = 100/125 = 0.8
            // Daño mitigado = 100 × 0.8 = 80
            // Sin reducción plana: 80
            // Daño final debería ser 80 (redondeado)
            
            expect(result.rawDamage).toBe(100);
            expect(result.effectiveArmor).toBeCloseTo(50, 1);
            expect(result.mitigationCoefficient).toBeCloseTo(0.8, 3);
            expect(result.mitigatedDamage).toBeCloseTo(80, 1);
            expect(result.finalDamage).toBeGreaterThanOrEqual(damageCalculator.DAMAGE_CONSTANTS.MIN_DAMAGE);
        });

        test('aplica reducción plana después de la mitigación', () => {
            const rawDamageResult = { rawDamage: 50, weaponType: 'SLASHING', weaponName: 'Test' };
            const defender = { name: 'D' };
            const armor = { defense: 20, flatReduction: 10 };
            
            const result = damageCalculator.calculateFinalDamage(rawDamageResult, defender, armor);
            
            // Con 20 de armadura:
            // Coef = 100 / (100 + (20 × 0.5)) = 100 / (100 + 10) = 100/110 ≈ 0.909
            // Daño mitigado = 50 × 0.909 ≈ 45.45
            // Después de reducción plana: 45.45 - 10 = 35.45
            // Redondeado a 35
            
            expect(result.flatReduction).toBe(10);
            expect(result.afterFlatReduction).toBeCloseTo(35.45, 1);
        });

        test('nunca reduce a 0, aplica daño mínimo', () => {
            const rawDamageResult = { rawDamage: 10, weaponType: 'SLASHING', weaponName: 'Test' };
            const defender = { name: 'D' };
            const armor = { defense: 1000, flatReduction: 1000 }; // Armadura extrema
            
            const result = damageCalculator.calculateFinalDamage(rawDamageResult, defender, armor);
            
            // Aún con armadura extrema, debe hacer al menos 1 de daño
            expect(result.finalDamage).toBe(damageCalculator.DAMAGE_CONSTANTS.MIN_DAMAGE);
            expect(result.analysis.isMinimumDamage).toBe(true);
        });

        test('considera tipo de daño en la efectividad de armadura', () => {
            const rawSlashing = { rawDamage: 100, weaponType: 'SLASHING', weaponName: 'Test' };
            const rawPiercing = { rawDamage: 100, weaponType: 'PIERCING', weaponName: 'Test' };
            
            const defender = { name: 'D' };
            const armor = { defense: 50 };
            
            const resultSlashing = damageCalculator.calculateFinalDamage(rawSlashing, defender, armor);
            const resultPiercing = damageCalculator.calculateFinalDamage(rawPiercing, defender, armor);
            
            // El daño perforante debería ser más efectivo contra armadura
            // (tiene un multiplicador de 0.7 vs 1.0 para cortante)
            expect(resultPiercing.effectiveArmor).toBeLessThan(resultSlashing.effectiveArmor);
            expect(resultPiercing.finalDamage).toBeGreaterThan(resultSlashing.finalDamage);
        });
    });

    describe('resolveDamage()', () => {
        test('resuelve daño completo correctamente', () => {
            const attacker = { name: 'Atacante', strength: 14 };
            const weapon = { name: 'Hacha', baseDamage: 12, damageType: 'SLASHING' };
            const defender = { name: 'Defensor' };
            const armor = { name: 'Cota de Malla', defense: 8 };
            
            const result = damageCalculator.resolveDamage(attacker, weapon, defender, armor, 'SOLID_HIT');
            
            expect(result.damageId).toBeDefined();
            expect(result.attacker).toBe('Atacante');
            expect(result.defender).toBe('Defensor');
            expect(result.weapon).toBe('Hacha');
            expect(result.armor).toBe('Cota de Malla');
            expect(result.hitType).toBe('SOLID_HIT');
            
            expect(result.rawDamage).toBeDefined();
            expect(result.finalDamage).toBeDefined();
            expect(result.summary).toBeDefined();
            expect(result.detailedAnalysis).toBeDefined();
            
            // El daño final debe ser menor o igual al bruto
            expect(result.summary.finalDamage).toBeLessThanOrEqual(result.summary.rawDamage);
            expect(result.summary.finalDamage).toBeGreaterThanOrEqual(1);
        });
    });

    describe('generateMitigationGraphData()', () => {
        test('genera datos correctos para la gráfica', () => {
            const graphData = damageCalculator.generateMitigationGraphData(50, 10);
            
            expect(graphData.data).toBeDefined();
            expect(graphData.labels).toBeDefined();
            expect(graphData.keyPoints).toBeDefined();
            expect(graphData.formula).toBeDefined();
            expect(graphData.description).toBeDefined();
            
            // Verificar estructura de datos
            expect(graphData.data.length).toBeGreaterThan(0);
            graphData.data.forEach(point => {
                expect(point.armor).toBeDefined();
                expect(point.coefficient).toBeDefined();
                expect(point.damagePercent).toBeDefined();
                expect(point.reductionPercent).toBeDefined();
                expect(point.damageAtArmor).toBeDefined();
                
                // Coeficiente debe estar entre 0 y 1
                expect(point.coefficient).toBeGreaterThan(0);
                expect(point.coefficient).toBeLessThanOrEqual(1);
                
                // Porcentajes deben sumar 100
                expect(point.damagePercent + point.reductionPercent).toBeCloseTo(100, 1);
            });
            
            // Verificar puntos clave
            expect(graphData.keyPoints.length).toBeGreaterThan(0);
        });
    });

    describe('simulateDamage()', () => {
        test('simula múltiples ataques correctamente', () => {
            const attacker = { name: 'A', strength: 12 };
            const weapon = { name: 'W', baseDamage: 10 };
            const defender = { name: 'D' };
            const armor = { defense: 15 };
            
            const simulation = damageCalculator.simulateDamage(attacker, weapon, defender, armor, 100);
            
            expect(simulation.totalSimulations).toBe(100);
            expect(simulation.rawDamages).toHaveLength(100);
            expect(simulation.finalDamages).toHaveLength(100);
            expect(simulation.mitigations).toHaveLength(100);
            expect(simulation.damageReductions).toHaveLength(100);
            expect(simulation.details).toHaveLength(100);
            
            // Verificar estadísticas
            expect(simulation.statistics).toBeDefined();
            expect(simulation.statistics.averageRawDamage).toBeGreaterThan(0);
            expect(simulation.statistics.averageFinalDamage).toBeGreaterThan(0);
            expect(simulation.statistics.averageFinalDamage).toBeLessThanOrEqual(simulation.statistics.averageRawDamage);
            
            // Verificar análisis por tipo de golpe
            expect(simulation.byHitType).toBeDefined();
            expect(simulation.byHitType.CRITICAL).toBeDefined();
            expect(simulation.byHitType.SOLID_HIT).toBeDefined();
            expect(simulation.byHitType.GRAZE).toBeDefined();
            expect(simulation.byHitType.MISS).toBeDefined();
            
            // Verificar efectividad de armadura
            expect(simulation.armorEffectiveness).toBeDefined();
            expect(simulation.armorEffectiveness.totalDamagePrevented).toBeGreaterThan(0);
            expect(simulation.armorEffectiveness.percentDamagePrevented).toBeGreaterThan(0);
            expect(simulation.armorEffectiveness.percentDamagePrevented).toBeLessThan(100);
        });

        test('mantiene daño mínimo en todas las simulaciones', () => {
            const attacker = { name: 'A', strength: 10 };
            const weapon = { name: 'W', baseDamage: 5 };
            const defender = { name: 'D' };
            const armor = { defense: 100, flatReduction: 100 }; // Armadura extrema
            
            const simulation = damageCalculator.simulateDamage(attacker, weapon, defender, armor, 50);
            
            // Todas las simulaciones deben tener al menos daño mínimo
            simulation.finalDamages.forEach(damage => {
                expect(damage).toBeGreaterThanOrEqual(damageCalculator.DAMAGE_CONSTANTS.MIN_DAMAGE);
            });
            
            // Debería haber hits con daño mínimo
            expect(simulation.armorEffectiveness.hitsAtMinimumDamage).toBeGreaterThan(0);
        });
    });

    describe('Propiedades de la fórmula hiperbólica', () => {
        test('mitigación muestra rendimientos decrecientes', () => {
            // Con mitigación hiperbólica, cada punto adicional de armadura
            // es menos efectivo que el anterior
            
            const coeff10 = damageCalculator.calculateMitigationCoefficient(10);
            const coeff20 = damageCalculator.calculateMitigationCoefficient(20);
            const coeff30 = damageCalculator.calculateMitigationCoefficient(30);
            
            // Diferencia entre 10 y 20 vs 20 y 30
            const diff1 = 1 - coeff10; // Mitigación al pasar de 0 a 10
            const diff2 = coeff10 - coeff20; // Mitigación adicional al pasar de 10 a 20
            const diff3 = coeff20 - coeff30; // Mitigación adicional al pasar de 20 a 30
            
            // Cada incremento adicional debería dar menos mitigación
            expect(diff1).toBeGreaterThan(diff2);
            expect(diff2).toBeGreaterThan(diff3);
        });

        test('armadura nunca reduce daño a 0', () => {
            // Probar con valores extremos
            const extremeArmor = 10000;
            const rawDamage = 1000;
            
            const rawDamageResult = { rawDamage, weaponType: 'SLASHING', weaponName: 'Test' };
            const defender = { name: 'D' };
            const armor = { defense: extremeArmor, flatReduction: 1000 };
            
            const result = damageCalculator.calculateFinalDamage(rawDamageResult, defender, armor);
            
            expect(result.finalDamage).toBeGreaterThan(0);
            expect(result.finalDamage).toBe(damageCalculator.DAMAGE_CONSTANTS.MIN_DAMAGE);
        });

        test('la fórmula es simétrica respecto al tipo de daño', () => {
            // Para una armadura dada, diferentes tipos de daño
            // deberían tener diferentes coeficientes
            
            const armorValue = 50;
            
            // Obtener coeficientes para diferentes tipos
            const testTypes = ['SLASHING', 'PIERCING', 'BLUDGEONING', 'FIRE'];
            const coefficients = {};
            
            testTypes.forEach(type => {
                const rawDamageResult = { rawDamage: 100, weaponType: type, weaponName: 'Test' };
                const defender = { name: 'D' };
                const armor = { defense: armorValue };
                
                const result = damageCalculator.calculateFinalDamage(rawDamageResult, defender, armor);
                coefficients[type] = result.mitigationCoefficient;
            });
            
            // Verificar que son diferentes (cada tipo tiene diferente efectividad)
            expect(coefficients.SLASHING).not.toBe(coefficients.PIERCING);
            expect(coefficients.PIERCING).not.toBe(coefficients.BLUDGEONING);
            
            // El fuego tiene armorEffectiveness = 0.5, lo que reduce la armadura efectiva
            // Por lo tanto el coeficiente será diferente. Verificamos que son distintos:
            expect(Math.abs(coefficients.FIRE - coefficients.SLASHING)).toBeGreaterThan(0.01);
        });
    });

    describe('generateAsciiGraph()', () => {
        test('genera gráfica ASCII válida', () => {
            const graph = damageCalculator.generateAsciiGraph(100, 60, 20);
            
            expect(typeof graph).toBe('string');
            expect(graph.length).toBeGreaterThan(0);
            expect(graph).toContain('CURVA DE MITIGACIÓN HIPERBÓLICA');
            expect(graph).toContain('Coef = 100 / (100 + (Armor × 0.5))');
            expect(graph).toContain('PUNTOS CLAVE');
            expect(graph).toContain('█'); // Carácter de gráfica
        });
    });

    describe('generateDamageReport()', () => {
        test('genera reporte de daño válido', () => {
            // Crear un resultado de daño simulado
            const mockDamageResult = {
                damageId: 'test_123',
                attacker: 'Guerrero',
                defender: 'Orco',
                weapon: 'Espada',
                armor: 'Armadura de Cuero',
                hitType: 'SOLID_HIT',
                rawDamage: {
                    rawDamage: 45.5,
                    calculationDetails: 'Test details',
                    components: {
                        baseDamage: 20,
                        strengthBonus: 15.5,
                        dexterityBonus: 5,
                        skillBonus: 3,
                        diceDamage: 2,
                        hitTypeMultiplier: 1.0
                    }
                },
                finalDamage: {
                    effectiveArmor: 12.5,
                    mitigationCoefficient: 0.8,
                    flatReduction: 3,
                    mitigatedDamage: 36.4,
                    afterFlatReduction: 33.4,
                    finalDamage: 33,
                    positionModifier: 1.0,
                    conditionModifier: 1.0,
                    resistanceModifier: 1.0,
                    analysis: {
                        damagePrevented: 12.5,
                        armorEffectiveness: '80.0%',
                        isMinimumDamage: false
                    }
                },
                summary: {
                    rawDamage: 45.5,
                    finalDamage: 33,
                    damageReduction: 12.5,
                    reductionPercent: '27.5%'
                }
            };
            
            const report = damageCalculator.generateDamageReport(mockDamageResult);
            
            expect(report).toBeDefined();
            expect(typeof report).toBe('string');
            expect(report).toContain('INFORME DE DAÑO');
            expect(report).toContain('Guerrero');
            expect(report).toContain('Orco');
            expect(report).toContain('Espada');
            expect(report).toContain('45.5');
            expect(report).toContain('33');
            expect(report).toContain('80.0%');
        });
    });
});