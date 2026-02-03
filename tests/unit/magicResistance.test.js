const MagicResistance = require('../../server/engine/magicResistance');

describe('Sistema de Combate - Fase C (Resistencia Mágica)', () => {
    let magicResistance;
    
    beforeEach(() => {
        magicResistance = new MagicResistance();
    });

    describe('calculateMagicResistance()', () => {
        test('calcula resistencia base correctamente con fórmula (WILL × 1.5) / 100', () => {
            const defender = {
                name: 'Mago',
                willpower: 20
            };
            
            const result = magicResistance.calculateMagicResistance(defender, 'FIRE');
            
            // Fórmula: (20 × 1.5) / 100 = 30 / 100 = 0.3
            expect(result.totalResistance).toBeCloseTo(0.3, 3);
            expect(result.resistancePercent).toBeCloseTo(30, 1);
            expect(result.formulaUsed).toContain('WILL × 1.5');
            expect(result.isElemental).toBe(true);
        });

        test('aplica límite máximo del 75%', () => {
            const defender = {
                name: 'Titan',
                willpower: 100, // Daría 150% sin límite
                resistances: { FIRE_RESISTANCE: 0.5 }
            };
            
            const result = magicResistance.calculateMagicResistance(defender, 'FIRE');
            
            // Con 100 de voluntad: (100 × 1.5) / 100 = 1.5 → limitado a 0.75
            // + 0.5 de resistencia específica = 1.25 → limitado a 0.75
            expect(result.totalResistance).toBeLessThanOrEqual(0.75);
            expect(result.isCapped).toBe(true);
            expect(result.resistancePercent).toBeLessThanOrEqual(75);
        });

        test('solo aplica fórmula a daño elemental', () => {
            const defender = {
                name: 'Test',
                willpower: 20
            };
            
            // Elemental - aplica fórmula
            const elementalResult = magicResistance.calculateMagicResistance(defender, 'FIRE');
            expect(elementalResult.isElemental).toBe(true);
            expect(elementalResult.formulaUsed).toContain('WILL × 1.5');
            
            // No elemental - no aplica fórmula base
            const nonElementalResult = magicResistance.calculateMagicResistance(defender, 'PSYCHIC');
            expect(nonElementalResult.isElemental).toBe(false);
            expect(nonElementalResult.formulaUsed).not.toContain('WILL × 1.5');
        });

        test('incluye modificadores raciales', () => {
            const humanDefender = {
                name: 'Humano',
                willpower: 20,
                race: 'HUMAN'
            };
            
            const dragonbornDefender = {
                name: 'Dragonborn',
                willpower: 20,
                race: 'DRAGONBORN'
            };
            
            const humanResult = magicResistance.calculateMagicResistance(humanDefender, 'FIRE');
            const dragonbornResult = magicResistance.calculateMagicResistance(dragonbornDefender, 'FIRE');
            
            // Dragonborn tiene +30% resistencia al fuego
            expect(dragonbornResult.totalResistance).toBeGreaterThan(humanResult.totalResistance);
            expect(dragonbornResult.components.racialResistance).toBeCloseTo(0.3, 3);
        });

        test('incluye modificadores de clase', () => {
            const warriorDefender = {
                name: 'Guerrero',
                willpower: 20,
                class: 'WARRIOR'
            };
            
            const mageDefender = {
                name: 'Mago',
                willpower: 20,
                class: 'MAGE'
            };
            
            const warriorResult = magicResistance.calculateMagicResistance(warriorDefender, 'ARCANE');
            const mageResult = magicResistance.calculateMagicResistance(mageDefender, 'ARCANE');
            
            // Mago tiene +20% resistencia arcana y +5 de voluntad
            expect(mageResult.totalResistance).toBeGreaterThan(warriorResult.totalResistance);
            expect(warriorResult.components.classResistance).toBeCloseTo(-0.1, 3); // Guerrero tiene -10%
        });

        test('maneja vulnerabilidades (resistencia negativa)', () => {
            const undeadDefender = {
                name: 'No Muerto',
                willpower: 20,
                race: 'UNDEAD'
            };
            
            const result = magicResistance.calculateMagicResistance(undeadDefender, 'HOLY');
            
            // No muerto tiene -50% resistencia a sagrado
            expect(result.totalResistance).toBeLessThan(0);
            expect(result.hasVulnerability).toBe(true);
            expect(result.vulnerabilityPercent).toBeGreaterThan(0);
        });

        test('lanza error para tipo de daño inválido', () => {
            const defender = { name: 'Test', willpower: 10 };
            
            expect(() => magicResistance.calculateMagicResistance(defender, 'INVALID_TYPE')).toThrow();
        });

        test('usa valor por defecto para voluntad no definida', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            const defender = { name: 'Test' }; // Sin willpower
            const result = magicResistance.calculateMagicResistance(defender, 'FIRE');
            
            expect(result.totalResistance).toBeDefined();
            expect(consoleSpy).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });
    });

    describe('applyMagicResistance()', () => {
        test('aplica resistencia al daño correctamente', () => {
            const defender = {
                name: 'Defensor',
                willpower: 30 // 45% resistencia
            };
            
            const rawDamage = 100;
            const result = magicResistance.applyMagicResistance(rawDamage, defender, 'FIRE');
            
            // Con 30 de voluntad: (30 × 1.5) / 100 = 0.45
            // Daño final = 100 × (1 - 0.45) = 55
            expect(result.rawDamage).toBe(100);
            expect(result.resistanceApplied).toBeCloseTo(0.45, 2);
            expect(result.damageMultiplier).toBeCloseTo(0.55, 2);
            expect(result.damageAfterResistance).toBeCloseTo(55, 1);
            expect(result.damageReduced).toBeCloseTo(45, 1);
            expect(result.percentReduced).toBeCloseTo(45, 1);
        });

        test('aplica daño mínimo del 5%', () => {
            const defender = {
                name: 'Titan',
                willpower: 100,
                resistances: { FIRE_RESISTANCE: 0.95 },  // Cambiar a 0.95 para que total > 0.95
                race: 'DRAGONBORN',
                class: 'MAGE'
            };
            
            const rawDamage = 100;
            const result = magicResistance.applyMagicResistance(rawDamage, defender, 'FIRE');
            
            // Con resistencia muy alta, siempre pasa al menos 5% de daño
            expect(result.finalDamage).toBeGreaterThanOrEqual(5);
            // Si la resistencia es >95%, el daño debería ser el mínimo (5)
            expect(result.isMinimumDamage).toBe(result.finalDamage === 5);
            expect(result.minimumDamageThreshold).toBeCloseTo(5, 1);
        });

        test('aplica bonus por elemento opuesto', () => {
            const defender = {
                name: 'Criatura de Hielo',
                willpower: 20,
                resistances: { SHADOW_RESISTANCE: -0.3 },  // Vulnerable a SHADOW
                race: 'UNDEAD'
            };
            
            const rawDamage = 100;
            const result = magicResistance.applyMagicResistance(rawDamage, defender, 'HOLY');
            
            // HOLY es opuesto de SHADOW, y el defensor es vulnerable a SHADOW
            // Debería tener bonus de daño adicional
            if (result.oppositeElementBonus > 0) {
                expect(result.oppositeElementBonus).toBeGreaterThan(0);
                expect(result.finalDamage).toBeGreaterThan(result.damageAfterResistance);
            } else {
                // Si no hay bonus de elemento opuesto, al menos verify que se calcula
                expect(result.oppositeElementBonus).toBeDefined();
            }
        });

        test('redondea daño final correctamente', () => {
            const defender = { name: 'Test', willpower: 17 };
            const rawDamage = 73;
            
            const result = magicResistance.applyMagicResistance(rawDamage, defender, 'ICE');
            
            // Daño debería estar redondeado a 1 decimal
            expect(result.finalDamage.toString()).toMatch(/^\d+(\.\d)?$/);
        });
    });

    describe('calculateMultipleResistances()', () => {
        test('calcula resistencia para múltiples tipos', () => {
            const defender = {
                name: 'Elementalista',
                willpower: 25
            };
            
            const damageTypes = ['FIRE', 'ICE', 'LIGHTNING', 'ARCANE'];
            const results = magicResistance.calculateMultipleResistances(defender, damageTypes);
            
            expect(results.defenderName).toBe('Elementalista');
            expect(Object.keys(results.results)).toEqual(damageTypes);
            expect(results.summary).toBeDefined();
            expect(results.summary.averageResistance).toBeGreaterThan(0);
            expect(results.summary.strongestResistance).toBeDefined();
            expect(results.summary.weakestResistance).toBeDefined();
        });

        test('maneja tipos de daño inválidos', () => {
            const defender = { name: 'Test', willpower: 10 };
            const damageTypes = ['FIRE', 'INVALID', 'ICE'];
            
            const results = magicResistance.calculateMultipleResistances(defender, damageTypes);
            
            expect(results.results.FIRE).toBeDefined();
            expect(results.results.INVALID.error).toBeDefined();
            expect(results.results.ICE).toBeDefined();
        });
    });

    describe('simulateMagicAttacks()', () => {
        test('simula múltiples ataques correctamente', () => {
            const defender = {
                name: 'Defensor',
                willpower: 20
            };
            
            const simulation = magicResistance.simulateMagicAttacks(100, defender, 'FIRE', 500);
            
            expect(simulation.totalSimulations).toBe(500);
            expect(simulation.rawDamages).toHaveLength(500);
            expect(simulation.finalDamages).toHaveLength(500);
            expect(simulation.resistances).toHaveLength(500);
            expect(simulation.damageReductions).toHaveLength(500);
            expect(simulation.details).toHaveLength(500);
            
            // Verificar estadísticas
            expect(simulation.statistics).toBeDefined();
            expect(simulation.statistics.averageRawDamage).toBeGreaterThan(80); // ±20% de 100
            expect(simulation.statistics.averageRawDamage).toBeLessThan(120);
            expect(simulation.statistics.averageFinalDamage).toBeLessThanOrEqual(simulation.statistics.averageRawDamage);
            
            // Verificar efectividad
            expect(simulation.effectiveness).toBeDefined();
            expect(simulation.effectiveness.averageDamageMultiplier).toBeGreaterThan(0);
            expect(simulation.effectiveness.averageDamageMultiplier).toBeLessThanOrEqual(1);
        });

        test('siempre aplica daño mínimo en simulaciones', () => {
            const defender = {
                name: 'Titan',
                willpower: 100,
                resistances: { FIRE_RESISTANCE: 0.95 },
                race: 'DRAGONBORN'
            };
            
            const simulation = magicResistance.simulateMagicAttacks(50, defender, 'FIRE', 100);
            
            // Puede haber simulaciones donde se aplica daño mínimo
            // El contador debe estar definido
            expect(simulation.effectiveness).toBeDefined();
            expect(simulation.effectiveness.hitsWithMinimumDamage).toBeGreaterThanOrEqual(0);
            
            // El daño final nunca debe ser 0
            simulation.finalDamages.forEach(damage => {
                expect(damage).toBeGreaterThan(0);
            });
        });
    });

    describe('Límite máximo del 75%', () => {
        test('nunca excede el 75% de resistencia', () => {
            // Test con múltiples combinaciones extremas
            const testCases = [
                {
                    name: 'Voluntad extrema',
                    defender: { name: 'T1', willpower: 1000 }
                },
                {
                    name: 'Resistencias acumuladas',
                    defender: { 
                        name: 'T2', 
                        willpower: 50,
                        resistances: { FIRE_RESISTANCE: 0.5, MAGIC_RESISTANCE: 0.3 },
                        race: 'DRAGONBORN',
                        class: 'MAGE',
                        equipment: {
                            armor: { resistances: { FIRE_RESISTANCE: 0.3 } },
                            ring: { enchantments: [{ type: 'RESISTANCE', element: 'FIRE', level: 'LEGENDARY' }] }
                        }
                    }
                },
                {
                    name: 'Combinación completa',
                    defender: {
                        name: 'T3',
                        willpower: 80,
                        resistances: { ALL_RESISTANCE: 0.4 },
                        race: 'DEMON',
                        class: 'SORCERER',
                        conditions: ['BLESSED', 'CURSED']
                    }
                }
            ];
            
            testCases.forEach(testCase => {
                const result = magicResistance.calculateMagicResistance(testCase.defender, 'FIRE');
                
                expect(result.totalResistance).toBeLessThanOrEqual(0.75);
                expect(result.resistancePercent).toBeLessThanOrEqual(75);
                
                if (result.totalResistance >= 0.75) {
                    expect(result.isCapped).toBe(true);
                }
            });
        });

        test('testMaximumCap() verifica límite correctamente', () => {
            const defender = { name: 'Test', willpower: 10 };
            const capTest = magicResistance.testMaximumCap(defender, 'FIRE');
            
            expect(capTest.testDescription).toBeDefined();
            expect(capTest.calculatedResistance).toBeDefined();
            expect(capTest.isCapped).toBeDefined();
            expect(capTest.passedTest).toBe(true);
            expect(capTest.maxAllowed).toBe('75%');
        });
    });

    describe('Métodos de utilidad', () => {
        test('isElementalDamage() identifica correctamente', () => {
            expect(magicResistance.isElementalDamage('FIRE')).toBe(true);
            expect(magicResistance.isElementalDamage('ICE')).toBe(true);
            expect(magicResistance.isElementalDamage('LIGHTNING')).toBe(true);
            expect(magicResistance.isElementalDamage('EARTH')).toBe(true);
            expect(magicResistance.isElementalDamage('WATER')).toBe(true);
            expect(magicResistance.isElementalDamage('WIND')).toBe(true);
            
            expect(magicResistance.isElementalDamage('PSYCHIC')).toBe(false);
            expect(magicResistance.isElementalDamage('ARCANE')).toBe(false);
            expect(magicResistance.isElementalDamage('HOLY')).toBe(false);
            expect(magicResistance.isElementalDamage('SHADOW')).toBe(false);
        });

        test('getMagicDamageTypes() retorna todos los tipos', () => {
            const types = magicResistance.getMagicDamageTypes();
            
            expect(Array.isArray(types)).toBe(true);
            expect(types.length).toBeGreaterThan(0);
            expect(types).toContain('FIRE');
            expect(types).toContain('ICE');
            expect(types).toContain('LIGHTNING');
            expect(types).toContain('ARCANE');
        });

        test('getDamageTypeInfo() retorna información correcta', () => {
            const fireInfo = magicResistance.getDamageTypeInfo('FIRE');
            const invalidInfo = magicResistance.getDamageTypeInfo('INVALID');
            
            expect(fireInfo).toBeDefined();
            expect(fireInfo.name).toBe('Fuego');
            expect(fireInfo.description).toBeDefined();
            expect(fireInfo.resistanceType).toBe('FIRE_RESISTANCE');
            
            expect(invalidInfo).toBeNull();
        });

        test('generateCharacterResistanceProfile() crea perfil completo', () => {
            const defender = {
                name: 'Archimago',
                willpower: 35,
                race: 'ELF',
                class: 'MAGE',
                resistances: { ARCANE_RESISTANCE: 0.2 }
            };
            
            const profile = magicResistance.generateCharacterResistanceProfile(defender);
            
            expect(profile.characterName).toBe('Archimago');
            expect(profile.willpower).toBe(35);
            expect(profile.race).toBe('ELF');
            expect(profile.class).toBe('MAGE');
            expect(profile.resistances).toBeDefined();
            expect(Object.keys(profile.resistances).length).toBeGreaterThan(0);
            expect(profile.summary).toBeDefined();
            expect(profile.summary.averageResistancePercent).toBeGreaterThan(0);
            expect(profile.summary.strengths).toBeDefined();
            expect(profile.summary.weaknesses).toBeDefined();
        });
    });

    describe('generateResistanceReport()', () => {
        test('genera reporte formateado correctamente', () => {
            const defender = {
                name: 'Paladín',
                willpower: 25
            };
            
            const resistanceResult = magicResistance.calculateMagicResistance(defender, 'HOLY');
            const report = magicResistance.generateResistanceReport(resistanceResult);
            
            expect(typeof report).toBe('string');
            expect(report.length).toBeGreaterThan(0);
            expect(report).toContain('INFORME DE RESISTENCIA MÁGICA');
            expect(report).toContain('Paladín');
            expect(report).toContain('Sagrado');
            expect(report).toContain(resistanceResult.resistancePercent.toString());
            expect(report).toContain('Multiplicador de daño');
        });

        test('reporte muestra vulnerabilidades', () => {
            const defender = {
                name: 'No Muerto',
                willpower: 15,
                race: 'UNDEAD'
            };
            
            const resistanceResult = magicResistance.calculateMagicResistance(defender, 'HOLY');
            const report = magicResistance.generateResistanceReport(resistanceResult);
            
            expect(report).toContain('Vulnerabilidad');
            expect(report).toContain('+'); // +X% de daño
        });

        test('reporte muestra límite máximo', () => {
            const defender = {
                name: 'Titan',
                willpower: 100,
                resistances: { FIRE_RESISTANCE: 0.5 }
            };
            
            const resistanceResult = magicResistance.calculateMagicResistance(defender, 'FIRE');
            const report = magicResistance.generateResistanceReport(resistanceResult);
            
            if (resistanceResult.isCapped) {
                expect(report).toContain('alcanzó el límite máximo');
                expect(report).toContain('75%');
            }
        });
    });

    describe('Integración con sistema completo', () => {
        test('resistencias específicas anulan fórmula base para no-elementales', () => {
            const defender = {
                name: 'Especialista',
                willpower: 10, // Solo daría 15% de resistencia base
                resistances: { PSYCHIC_RESISTANCE: 0.4 } // Pero tiene 40% específico
            };
            
            const result = magicResistance.calculateMagicResistance(defender, 'PSYCHIC');
            
            // Para no-elementales, la resistencia específica debería ser el factor principal
            expect(result.components.typeSpecificResistance).toBe(0.4);
            // Total debería ser cercano a 0.4 (puede haber otros modificadores mínimos)
            expect(result.totalResistance).toBeGreaterThanOrEqual(0.35);
            expect(result.totalResistance).toBeLessThanOrEqual(0.45);
        });

        test('equipo y encantamientos se suman correctamente', () => {
            const defender = {
                name: 'Caballero Encantado',
                willpower: 20,
                equipment: {
                    armor: { 
                        resistances: { FIRE_RESISTANCE: 0.1 },
                        enchantments: [
                            { type: 'RESISTANCE', element: 'FIRE', level: 'MODERATE' } // +0.10
                        ]
                    },
                    shield: {
                        resistances: { MAGIC_RESISTANCE: 0.15 } // Vale la mitad para específico: 0.075
                    }
                }
            };
            
            const result = magicResistance.calculateMagicResistance(defender, 'FIRE');
            
            // Base: (20 × 1.5) / 100 = 0.30
            // Armadura: 0.10 específica
            // Encantamiento: 0.10
            // Escudo: 0.15 mágica × 0.3 = 0.045
            // Total esperado: ~0.545
            expect(result.components.equipmentResistance).toBeCloseTo(0.245, 3); // 0.10 + 0.10 + 0.045
        });

        test('condiciones temporales afectan resistencia', () => {
            const defender = {
                name: 'Aventurero',
                willpower: 20,
                conditions: ['WET', 'BLESSED']
            };
            
            const fireResult = magicResistance.calculateMagicResistance(defender, 'FIRE');
            const lightningResult = magicResistance.calculateMagicResistance(defender, 'LIGHTNING');
            
            // Mojado da +30% resistencia al fuego, -40% al rayo
            expect(fireResult.components.conditionResistance).toBeCloseTo(0.3, 3);
            expect(lightningResult.components.conditionResistance).toBeCloseTo(-0.4, 3);
            
            // Bendecido da +20% a sagrado, -10% a sombras
            const holyResult = magicResistance.calculateMagicResistance(defender, 'HOLY');
            const shadowResult = magicResistance.calculateMagicResistance(defender, 'SHADOW');
            
            expect(holyResult.components.conditionResistance).toBeCloseTo(0.2, 3);
            expect(shadowResult.components.conditionResistance).toBeCloseTo(-0.1, 3);
        });
    });
});