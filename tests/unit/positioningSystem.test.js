const PositioningSystem = require('../../server/engine/positioningSystem');

describe('Sistema de Posicionamiento (4 Zonas)', () => {
    let positioningSystem;
    
    beforeEach(() => {
        positioningSystem = new PositioningSystem();
    });

    describe('initializeFormation()', () => {
        test('inicializa formación correctamente', () => {
            const party = [
                { id: 'tank1', name: 'Thorak', role: 'TANK', currentHealth: 100, maxHealth: 100 },
                { id: 'dps1', name: 'Ragnar', role: 'MELEE_DPS', currentHealth: 80, maxHealth: 80 },
                { id: 'healer1', name: 'Lyra', role: 'SUPPORT', currentHealth: 60, maxHealth: 60 },
                { id: 'archer1', name: 'Legolas', role: 'RANGED_DPS', currentHealth: 70, maxHealth: 70 },
                { id: 'mage1', name: 'Merlin', role: 'MAGE', currentHealth: 50, maxHealth: 50 }
            ];
            
            const formation = positioningSystem.initializeFormation(party);
            
            expect(formation.partyId).toBeDefined();
            expect(formation.timestamp).toBeDefined();
            expect(formation.zones).toBeDefined();
            expect(formation.combatants).toBeDefined();
            expect(formation.agroTable).toBeDefined();
            
            // Verificar que todos los combatientes están en la formación
            expect(Object.keys(formation.combatants)).toHaveLength(5);
            
            // Verificar que están distribuidos en zonas
            let totalInZones = 0;
            Object.values(formation.zones).forEach(zone => totalInZones += zone.length);
            expect(totalInZones).toBe(5);
            
            // Verificar que el tanque está en FRONT
            const tankPosition = formation.combatants.tank1.position;
            expect(tankPosition).toBe('FRONT');
        });

        test('lanza error para party vacío', () => {
            expect(() => positioningSystem.initializeFormation([])).toThrow();
            expect(() => positioningSystem.initializeFormation(null)).toThrow();
        });

        test('lanza error si excede capacidad máxima', () => {
            const largeParty = Array(10).fill().map((_, i) => ({
                id: `char${i}`,
                name: `Char ${i}`,
                role: 'MELEE_DPS',
                currentHealth: 50,
                maxHealth: 50
            }));
            
            expect(() => positioningSystem.initializeFormation(largeParty)).toThrow();
        });
    });

    describe('selectTarget()', () => {
        let formation;
        
        beforeEach(() => {
            const party = [
                { id: 'tank', name: 'Tank', role: 'TANK', currentHealth: 100, maxHealth: 100 },
                { id: 'melee', name: 'Melee', role: 'MELEE_DPS', currentHealth: 80, maxHealth: 80 },
                { id: 'healer', name: 'Healer', role: 'SUPPORT', currentHealth: 60, maxHealth: 60 },
                { id: 'archer', name: 'Archer', role: 'RANGED_DPS', currentHealth: 70, maxHealth: 70 },
                { id: 'mage', name: 'Mage', role: 'MAGE', currentHealth: 50, maxHealth: 50 }
            ];
            
            formation = positioningSystem.initializeFormation(party);
        });

        test('selecciona objetivo correctamente sin atacante', () => {
            const selection = positioningSystem.selectTarget(formation);
            
            expect(selection.selected).toBeDefined();
            expect(selection.selected.id).toBeDefined();
            expect(selection.selected.name).toBeDefined();
            expect(selection.reachableTargets).toHaveLength(5); // Todos vivos
            expect(selection.selectionWeights).toBeDefined();
            expect(Object.keys(selection.selectionWeights)).toHaveLength(5);
            
            // Los pesos deben sumar aproximadamente 1
            const totalWeight = Object.values(selection.selectionWeights).reduce((a, b) => a + b, 0);
            expect(totalWeight).toBeCloseTo(1, 5);
        });

        test('considera rango de ataque cuando hay atacante', () => {
            const attacker = formation.combatants.melee;
            const attackerPosition = attacker.position; // Probablemente SIDES
            
            const selection = positioningSystem.selectTarget(formation, attacker, 'MELEE');
            
            expect(selection.attackerPosition).toBe(attackerPosition);
            expect(selection.reachableTargets.length).toBeLessThanOrEqual(5);
            
            // Verificar que todos los objetivos alcanzables están en rango
            selection.reachableTargets.forEach(target => {
                const targetPosition = target.position;
                const isInRange = positioningSystem.POSITION_CONSTANTS.ATTACK_RANGES.MELEE[
                    `from_${attackerPosition}`
                ].includes(targetPosition);
                expect(isInRange).toBe(true);
            });
        });

        test('maneja cuando no hay objetivos alcanzables', () => {
            // Crear un atacante en BACK intentando atacar con MELEE
            const backAttacker = { id: 'backAttacker', name: 'Back', role: 'MAGE', currentHealth: 50, maxHealth: 50 };
            formation.combatants.backAttacker = backAttacker;
            formation.zones.BACK.push({ id: 'backAttacker', name: 'Back' });
            backAttacker.position = 'BACK';
            
            // Desde BACK con MELEE solo puede alcanzar MID y BACK
            // Si todos en MID y BACK están muertos, no hay objetivos alcanzables
            formation.combatants.healer.currentHealth = 0;  // Matar healer en MID
            formation.combatants.archer.currentHealth = 0;  // Matar archer en BACK
            formation.combatants.mage.currentHealth = 0;    // Matar mage en BACK
            
            const selection = positioningSystem.selectTarget(formation, backAttacker, 'MELEE');
            
            expect(selection.selected).toBeNull();
            expect(selection.reason).toBe('No hay objetivos alcanzables');
        });
    });

    describe('Distribución de agro 65%/20%/10%/5%', () => {
        let formation;
        
        beforeEach(() => {
            // Crear formación con combatientes en todas las zonas
            const party = [
                { id: 'front1', name: 'Front 1', role: 'TANK', currentHealth: 100, maxHealth: 100 },
                { id: 'front2', name: 'Front 2', role: 'MELEE_DPS', currentHealth: 80, maxHealth: 80 },
                { id: 'side1', name: 'Side 1', role: 'MELEE_DPS', currentHealth: 75, maxHealth: 75 },
                { id: 'mid1', name: 'Mid 1', role: 'SUPPORT', currentHealth: 60, maxHealth: 60 },
                { id: 'back1', name: 'Back 1', role: 'MAGE', currentHealth: 50, maxHealth: 50 },
                { id: 'back2', name: 'Back 2', role: 'RANGED_DPS', currentHealth: 70, maxHealth: 70 }
            ];
            
            formation = positioningSystem.initializeFormation(party);
        });

        test('simulateTargetSelection() respeta distribución esperada', () => {
            const iterations = 10000;
            const stats = positioningSystem.simulateTargetSelection(formation, iterations);
            
            // Verificar estructura de resultados
            expect(stats.totalIterations).toBe(iterations);
            expect(stats.zoneDistribution).toBeDefined();
            expect(stats.sortedByFrequency).toBeDefined();
            expect(stats.agroStats).toBeDefined();
            
            // Verificar que hay selecciones en todas las zonas
            Object.keys(positioningSystem.POSITION_CONSTANTS.ZONES).forEach(zone => {
                expect(stats.zoneDistribution[zone]).toBeDefined();
                expect(stats.zoneDistribution[zone].selections).toBeGreaterThan(0);
            });
            
            // La distribución debería aproximarse a 65%/20%/10%/5%
            const expected = positioningSystem.POSITION_CONSTANTS.AGRO_SYSTEM.BASE_AGRO_WEIGHTS;
            const tolerance = 5; // 5% de tolerancia
            
            Object.keys(expected).forEach(zone => {
                const expectedPercent = expected[zone] * 100;
                const actualPercent = parseFloat(stats.zoneDistribution[zone].percentage);
                const diff = Math.abs(expectedPercent - actualPercent);
                
                // Registrar para debugging
                console.log(`${zone}: Esperado ${expectedPercent}%, Actual ${actualPercent}%, Diferencia ${diff}%`);
                
                // En 10000 iteraciones, debería estar dentro de 5%
                expect(diff).toBeLessThan(tolerance);
            });
            
            // Verificar que FRONT tiene la mayor selección (alrededor de 65%)
            const frontPercent = parseFloat(stats.zoneDistribution.FRONT.percentage);
            expect(frontPercent).toBeGreaterThan(60);
            expect(frontPercent).toBeLessThan(70);
            
            // Verificar que BACK tiene la menor selección (alrededor de 5%)
            const backPercent = parseFloat(stats.zoneDistribution.BACK.percentage);
            expect(backPercent).toBeGreaterThan(2);
            expect(backPercent).toBeLessThan(8);
        });

        test('la distribución se mantiene con diferentes tamaños de party', () => {
            const testCases = [
                { size: 3, description: 'Party pequeño' },
                { size: 5, description: 'Party medio' },
                { size: 7, description: 'Party completo' }
            ];
            
            testCases.forEach(testCase => {
                // Crear party del tamaño especificado
                const party = Array(testCase.size).fill().map((_, i) => ({
                    id: `char${i}`,
                    name: `Char ${i}`,
                    role: i === 0 ? 'TANK' : 'MELEE_DPS',
                    currentHealth: 50 + i * 10,
                    maxHealth: 50 + i * 10
                }));
                
                const smallFormation = positioningSystem.initializeFormation(party);
                const stats = positioningSystem.simulateTargetSelection(smallFormation, 5000);
                
                // Verificar que FRONT sigue siendo el más seleccionado
                const frontPercent = parseFloat(stats.zoneDistribution.FRONT.percentage);
                expect(frontPercent).toBeGreaterThan(50); // Al menos 50% en party pequeño
                
                console.log(`${testCase.description} (${testCase.size}): FRONT ${frontPercent}%`);
            });
        });
    });

    describe('calculatePositionModifiers()', () => {
        let formation;
        
        beforeEach(() => {
            const party = [
                { id: 'front', name: 'Front', role: 'TANK' },
                { id: 'sides', name: 'Sides', role: 'MELEE_DPS' },
                { id: 'mid', name: 'Mid', role: 'SUPPORT' },
                { id: 'back', name: 'Back', role: 'MAGE' }
            ];
            
            formation = positioningSystem.initializeFormation(party);
        });

        test('calcula modificadores correctamente para diferentes posiciones', () => {
            const attacker = formation.combatants.sides;
            const target = formation.combatants.front;
            
            const modifiers = positioningSystem.calculatePositionModifiers(
                formation, attacker, target, 'MELEE'
            );
            
            expect(modifiers).toBeDefined();
            expect(modifiers.accuracy).toBeDefined();
            expect(modifiers.damage).toBeDefined();
            expect(modifiers.critical).toBeDefined();
            expect(modifiers.defense).toBeDefined();
            expect(modifiers.total).toBeDefined();
            expect(modifiers.positionInfo).toBeDefined();
            
            // Desde SIDES contra FRONT debería tener bonificación por flanqueo
            expect(modifiers.positionInfo.attackerZone).toBe('SIDES');
            expect(modifiers.positionInfo.targetZone).toBe('FRONT');
            expect(modifiers.positionInfo.hasFlanking).toBe(true);
            
            // Con flanqueo, accuracy y critical deberían ser mayores
            expect(modifiers.accuracy).toBeGreaterThan(1.0);
            expect(modifiers.critical).toBeGreaterThan(1.0);
        });

        test('modificadores varían según tipo de ataque', () => {
            const attacker = formation.combatants.back;
            const target = formation.combatants.front;
            
            const meleeModifiers = positioningSystem.calculatePositionModifiers(
                formation, attacker, target, 'MELEE'
            );
            
            const rangedModifiers = positioningSystem.calculatePositionModifiers(
                formation, attacker, target, 'RANGED'
            );
            
            const magicModifiers = positioningSystem.calculatePositionModifiers(
                formation, attacker, target, 'MAGIC'
            );
            
            // Desde BACK, RANGED y MAGIC deberían tener mejor modificador que MELEE
            expect(rangedModifiers.damage).toBeGreaterThan(meleeModifiers.damage);
            expect(magicModifiers.damage).toBeGreaterThan(meleeModifiers.damage);
            
            // Desde BACK contra FRONT, RANGED debería tener buen bonus
            expect(rangedModifiers.attackTypeBonus).toBeGreaterThan(1.0);
        });

        test('devuelve modificadores neutros para posiciones inválidas', () => {
            const invalidAttacker = { id: 'invalid', name: 'Invalid' };
            const invalidTarget = { id: 'invalid2', name: 'Invalid2' };
            
            const modifiers = positioningSystem.calculatePositionModifiers(
                formation, invalidAttacker, invalidTarget, 'MELEE'
            );
            
            expect(modifiers.accuracy).toBe(1.0);
            expect(modifiers.damage).toBe(1.0);
            expect(modifiers.critical).toBe(1.0);
            expect(modifiers.defense).toBe(1.0);
            expect(modifiers.positionInfo.isValid).toBe(false);
        });
    });

    describe('distributeAgro()', () => {
        let formation;
        
        beforeEach(() => {
            const party = [
                { id: 'tank', name: 'Tank', role: 'TANK', currentHealth: 100, maxHealth: 100 },
                { id: 'dps', name: 'DPS', role: 'MELEE_DPS', currentHealth: 80, maxHealth: 80 },
                { id: 'healer', name: 'Healer', role: 'SUPPORT', currentHealth: 60, maxHealth: 60 }
            ];
            
            formation = positioningSystem.initializeFormation(party);
        });

        test('distribuye agro correctamente', () => {
            const agroEvent = {
                source: formation.combatants.dps,
                amount: 100,
                type: 'DAMAGE'
            };
            
            const distribution = positioningSystem.distributeAgro(formation, agroEvent);
            
            expect(distribution).toBeDefined();
            expect(distribution.sourceId).toBe('dps');
            expect(distribution.amount).toBe(100);
            expect(distribution.distribution).toBeDefined();
            expect(distribution.totalDistributed).toBeCloseTo(100, 2);
            expect(distribution.zoneBreakdown).toBeDefined();
            
            // Verificar que todos los combatientes recibieron agro
            expect(Object.keys(distribution.distribution)).toHaveLength(3);
            
            // El tanque debería recibir más agro (posición FRONT + rol TANK)
            const tankAgro = distribution.distribution.tank.amount;
            const healerAgro = distribution.distribution.healer.amount;
            expect(tankAgro).toBeGreaterThan(healerAgro);
        });

        test('considera tipos de evento de agro', () => {
            const dps = formation.combatants.dps;
            
            const damageEvent = {
                source: dps,
                amount: 100,
                type: 'DAMAGE'
            };
            
            const healEvent = {
                source: formation.combatants.healer,
                amount: 100,
                type: 'HEAL'
            };
            
            const tauntEvent = {
                source: formation.combatants.tank,
                amount: 100,
                type: 'TAUNT'
            };
            
            const damageDist = positioningSystem.distributeAgro(formation, damageEvent);
            const healDist = positioningSystem.distributeAgro(formation, healEvent);
            const tauntDist = positioningSystem.distributeAgro(formation, tauntEvent);
            
            // TAUNT debería dar más agro al tanque
            const tankTauntAgro = tauntDist.distribution.tank.amount;
            const tankDamageAgro = damageDist.distribution.tank.amount;
            
            // TAUNT tiene modificador 3.0 vs DAMAGE 1.5
            expect(tankTauntAgro).toBeGreaterThan(tankDamageAgro);
        });

        test('puede distribuir a targets específicos', () => {
            const agroEvent = {
                source: formation.combatants.dps,
                amount: 100,
                type: 'DAMAGE',
                targets: [formation.combatants.tank, formation.combatants.healer]
            };
            
            const distribution = positioningSystem.distributeAgro(formation, agroEvent);
            
            // Solo debería distribuir a los targets especificados
            expect(Object.keys(distribution.distribution)).toHaveLength(2);
            expect(distribution.distribution.tank).toBeDefined();
            expect(distribution.distribution.healer).toBeDefined();
            expect(distribution.distribution.dps).toBeUndefined();
        });
    });

    describe('moveCombatant()', () => {
        let formation;
        
        beforeEach(() => {
            const party = [
                { id: 'front1', name: 'Front 1', role: 'TANK' },
                { id: 'side1', name: 'Side 1', role: 'MELEE_DPS' },
                { id: 'mid1', name: 'Mid 1', role: 'SUPPORT' },
                { id: 'back1', name: 'Back 1', role: 'MAGE' }
            ];
            
            formation = positioningSystem.initializeFormation(party);
        });

        test('mueve combatiente correctamente', () => {
            const result = positioningSystem.moveCombatant(formation, 'side1', 'BACK');
            
            expect(result.success).toBe(true);
            expect(result.combatantId).toBe('side1');
            expect(result.fromZone).toBe('SIDES');
            expect(result.toZone).toBe('BACK');
            expect(result.movementCost).toBeGreaterThan(0);
            
            // Verificar que la posición se actualizó
            const combatant = formation.combatants.side1;
            expect(combatant.position).toBe('BACK');
            
            // Verificar que fue removido de SIDES
            const inSides = formation.zones.SIDES.find(c => c.id === 'side1');
            expect(inSides).toBeUndefined();
            
            // Verificar que fue añadido a BACK
            const inBack = formation.zones.BACK.find(c => c.id === 'side1');
            expect(inBack).toBeDefined();
        });

        test('impide movimiento a zona llena', () => {
            // Llenar la zona BACK
            const extraMage = { id: 'mage2', name: 'Mage 2', role: 'MAGE' };
            formation.combatants.mage2 = extraMage;
            formation.zones.BACK.push({ id: 'mage2', name: 'Mage 2' });
            extraMage.position = 'BACK';
            
            // Intentar mover otro combatiente a BACK
            const result = positioningSystem.moveCombatant(formation, 'side1', 'BACK');
            
            expect(result.success).toBe(false);
            expect(result.reason).toContain('llena');
            expect(formation.combatants.side1.position).toBe('SIDES'); // No cambió
        });

        test('maneja movimiento a SIDES con lado específico', () => {
            const result = positioningSystem.moveCombatant(formation, 'mid1', 'SIDES', 'right');
            
            expect(result.success).toBe(true);
            expect(result.side).toBe('right');
            
            const combatant = formation.combatants.mid1;
            expect(combatant.side).toBe('right');
        });
    });

    describe('Sistema de rangos de ataque', () => {
        test('getReachableTargets() respeta rangos', () => {
            const party = [
                { id: 'front', name: 'Front', role: 'TANK' },
                { id: 'sides', name: 'Sides', role: 'MELEE_DPS' },
                { id: 'mid', name: 'Mid', role: 'SUPPORT' },
                { id: 'back', name: 'Back', role: 'MAGE' }
            ];
            
            const formation = positioningSystem.initializeFormation(party);
            
            // Desde FRONT con MELEE
            const fromFrontMelee = positioningSystem.getReachableTargets(formation, 'FRONT', 'MELEE');
            const frontMeleeZones = fromFrontMelee.map(c => c.position);
            
            // Según las reglas, desde FRONT con MELEE puede alcanzar FRONT y SIDES
            expect(frontMeleeZones).toContain('FRONT');
            expect(frontMeleeZones).toContain('SIDES');
            expect(frontMeleeZones).not.toContain('MID');
            expect(frontMeleeZones).not.toContain('BACK');
            
            // Desde BACK con RANGED
            const fromBackRanged = positioningSystem.getReachableTargets(formation, 'BACK', 'RANGED');
            const backRangedZones = fromBackRanged.map(c => c.position);
            
            // Desde BACK con RANGED puede alcanzar todas las zonas
            expect(backRangedZones).toContain('FRONT');
            expect(backRangedZones).toContain('SIDES');
            expect(backRangedZones).toContain('MID');
            expect(backRangedZones).toContain('BACK');
        });

        test('isInRange() valida rangos correctamente', () => {
            // Desde FRONT a BACK con MELEE no debería estar en rango
            expect(positioningSystem.isInRange('FRONT', 'BACK', 'MELEE')).toBe(false);
            
            // Desde FRONT a SIDES con MELEE sí debería estar en rango
            expect(positioningSystem.isInRange('FRONT', 'SIDES', 'MELEE')).toBe(true);
            
            // Desde BACK a FRONT con RANGED sí debería estar en rango
            expect(positioningSystem.isInRange('BACK', 'FRONT', 'RANGED')).toBe(true);
            
            // Desde MID a BACK con MAGIC sí debería estar en rango
            expect(positioningSystem.isInRange('MID', 'BACK', 'MAGIC')).toBe(true);
        });
    });

    describe('Funciones de utilidad', () => {
        let formation;
        
        beforeEach(() => {
            const party = [
                { id: 'alive1', name: 'Alive 1', role: 'TANK', currentHealth: 100, maxHealth: 100 },
                { id: 'alive2', name: 'Alive 2', role: 'MELEE_DPS', currentHealth: 80, maxHealth: 80 },
                { id: 'dead', name: 'Dead', role: 'SUPPORT', currentHealth: 0, maxHealth: 60, isKnockedOut: true }
            ];
            
            formation = positioningSystem.initializeFormation(party);
        });

        test('getAliveCombatants() retorna solo combatientes vivos', () => {
            const alive = positioningSystem.getAliveCombatants(formation);
            
            expect(alive).toHaveLength(2);
            expect(alive.map(c => c.id)).toContain('alive1');
            expect(alive.map(c => c.id)).toContain('alive2');
            expect(alive.map(c => c.id)).not.toContain('dead');
        });

        test('getCombatantPosition() retorna posición correcta', () => {
            // Asignar posiciones manualmente para test
            formation.combatants.alive1.position = 'FRONT';
            formation.combatants.alive2.position = 'SIDES';
            
            expect(positioningSystem.getCombatantPosition(formation, 'alive1')).toBe('FRONT');
            expect(positioningSystem.getCombatantPosition(formation, 'alive2')).toBe('SIDES');
            expect(positioningSystem.getCombatantPosition(formation, 'nonexistent')).toBeNull();
        });

        test('isZoneFull() verifica capacidad correctamente', () => {
            // BACK tiene capacidad 2 por defecto
            formation.zones.BACK = [
                { id: 'back1', name: 'Back 1' },
                { id: 'back2', name: 'Back 2' }
            ];
            
            expect(positioningSystem.isZoneFull(formation, 'BACK')).toBe(true);
            expect(positioningSystem.isZoneFull(formation, 'MID')).toBe(false); // Capacidad 1, vacío
        });

        test('generateFormationReport() genera reporte válido', () => {
            const report = positioningSystem.generateFormationReport(formation);
            
            expect(typeof report).toBe('string');
            expect(report.length).toBeGreaterThan(0);
            expect(report).toContain('REPORTE DE FORMACIÓN TÁCTICA');
            expect(report).toContain('Alive 1');
            expect(report).toContain('FRONT');
            expect(report).toContain('AGRO');
        });
    });

    describe('Edge cases y casos límite', () => {
        test('maneja formación con un solo combatiente', () => {
            const soloParty = [
                { id: 'solo', name: 'Solo', role: 'TANK', currentHealth: 100, maxHealth: 100 }
            ];
            
            const formation = positioningSystem.initializeFormation(soloParty);
            
            // Selección de objetivo siempre debería seleccionar al único combatiente
            const selection = positioningSystem.selectTarget(formation);
            expect(selection.selected.id).toBe('solo');
            expect(selection.reachableTargets).toHaveLength(1);
            
            // Simulación debería mostrar 100% de selección
            const stats = positioningSystem.simulateTargetSelection(formation, 100);
            expect(stats.byCombatant.solo.percentage).toBe('100.00');
        });

        test('maneja combatientes muertos en selección', () => {
            const party = [
                { id: 'alive', name: 'Alive', role: 'TANK', currentHealth: 100, maxHealth: 100 },
                { id: 'dead1', name: 'Dead 1', role: 'MELEE_DPS', currentHealth: 0, maxHealth: 80, isKnockedOut: true },
                { id: 'dead2', name: 'Dead 2', role: 'SUPPORT', currentHealth: 0, maxHealth: 60, isKnockedOut: true }
            ];
            
            const formation = positioningSystem.initializeFormation(party);
            
            const selection = positioningSystem.selectTarget(formation);
            expect(selection.selected.id).toBe('alive');
            expect(selection.reachableTargets).toHaveLength(1);
            
            const stats = positioningSystem.simulateTargetSelection(formation, 100);
            expect(stats.byCombatant.alive.percentage).toBe('100.00');
            expect(stats.byCombatant.dead1.selections).toBe(0);
            expect(stats.byCombatant.dead2.selections).toBe(0);
        });

        test('weightedRandomSelection() maneja pesos cero o negativos', () => {
            const items = [
                { id: 'item1', name: 'Item 1' },
                { id: 'item2', name: 'Item 2' },
                { id: 'item3', name: 'Item 3' }
            ];
            
            const weights = {
                item1: 0,
                item2: -1,
                item3: 0.5
            };
            
            // Debería seleccionar item3 (único con peso positivo)
            // O en su defecto, algún item (fallback)
            const selected = positioningSystem.weightedRandomSelection(items, weights);
            expect(selected).toBeDefined();
            
            // Con todos pesos cero, debería seleccionar el último como fallback
            const zeroWeights = { item1: 0, item2: 0, item3: 0 };
            const zeroSelected = positioningSystem.weightedRandomSelection(items, zeroWeights);
            expect(zeroSelected.id).toBe('item3'); // Último item
        });
    });
});