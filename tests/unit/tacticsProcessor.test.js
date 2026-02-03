/**
 * Tests para el Procesador de Tácticas
 */

const TacticsProcessor = require('../../server/engine/tacticsProcessor');

describe('TacticsProcessor', () => {
    let processor;
    let mockContext;

    beforeEach(() => {
        processor = new TacticsProcessor();
        
        // Contexto de combate simulado
        mockContext = {
            self: {
                id: 'player1',
                name: 'Héroe',
                hp: 100,
                maxHp: 100,
                mana: 50,
                maxMana: 100,
                attack: 20,
                defense: 10,
                magicPower: 15,
                inventory: [
                    { name: 'potion', quantity: 2 },
                    { name: 'mana_potion', quantity: 1 }
                ]
            },
            allies: [
                {
                    id: 'ally1',
                    name: 'Compañero',
                    hp: 30,
                    maxHp: 80,
                    attack: 15,
                    defense: 8
                }
            ],
            enemies: [
                {
                    id: 'enemy1',
                    name: 'Goblin',
                    hp: 40,
                    maxHp: 60,
                    attack: 12,
                    defense: 5,
                    magicResist: 3
                },
                {
                    id: 'enemy2',
                    name: 'Orco',
                    hp: 15,
                    maxHp: 80,
                    attack: 25,
                    defense: 12,
                    magicResist: 5
                }
            ]
        };
    });

    describe('Configuración de reglas', () => {
        test('Agrega reglas correctamente', () => {
            processor.addRule({
                name: 'Regla de prueba',
                condition: 'self_hp_below_50',
                action: 'use_potion',
                priority: 5
            });

            expect(processor.rules).toHaveLength(1);
            expect(processor.rules[0].name).toBe('Regla de prueba');
        });

        test('Ordena reglas por prioridad descendente', () => {
            processor.addRule({
                name: 'Regla baja',
                condition: 'self_hp_below_50',
                action: 'use_potion',
                priority: 1
            });

            processor.addRule({
                name: 'Regla alta',
                condition: 'self_hp_below_20',
                action: 'use_potion',
                priority: 10
            });

            expect(processor.rules[0].name).toBe('Regla alta');
            expect(processor.rules[1].name).toBe('Regla baja');
        });
    });

    describe('Evaluación de condiciones', () => {
        test('Evalúa self_hp_below_30 cuando HP es bajo', () => {
            mockContext.self.hp = 25; // 25% HP
            
            const result = processor.evaluateCondition('self_hp_below_30', mockContext);
            expect(result).toBe(true);
        });

        test('Evalúa self_hp_below_30 cuando HP es alto', () => {
            mockContext.self.hp = 80; // 80% HP
            
            const result = processor.evaluateCondition('self_hp_below_30', mockContext);
            expect(result).toBe(false);
        });

        test('Evalúa enemy_hp_low cuando hay enemigo con poco HP', () => {
            // enemy2 tiene 15/80 HP (~19%)
            const result = processor.evaluateCondition('enemy_hp_low', mockContext);
            expect(result).toBe(true);
        });

        test('Evalúa ally_wounded cuando hay aliado herido', () => {
            // ally1 tiene 30/80 HP (~38%)
            const result = processor.evaluateCondition('ally_wounded', mockContext);
            expect(result).toBe(true);
        });

        test('Evalúa has_potion cuando tiene pociones', () => {
            const result = processor.evaluateCondition('has_potion', mockContext);
            expect(result).toBe(true);
        });

        test('Evalúa condición compuesta con parámetro', () => {
            mockContext.self.hp = 20; // 20% HP
            
            const result = processor.evaluateCondition('self_hp_below:25', mockContext);
            expect(result).toBe(true);
        });

        test('Evalúa condición negada', () => {
            mockContext.self.hp = 80; // 80% HP
            
            const result = processor.evaluateCondition('!self_hp_below_30', mockContext);
            expect(result).toBe(true);
        });
    });

    describe('Procesamiento de reglas', () => {
        test('Ejecuta la regla más prioritaria que cumple condiciones', () => {
            processor.addRule({
                name: 'Curarse si HP < 30%',
                condition: 'self_hp_below_30',
                action: 'use_potion',
                target: 'self',
                priority: 5
            });

            processor.addRule({
                name: 'Atacar enemigo débil',
                condition: 'enemy_hp_low',
                action: 'heavy_strike',
                target: 'lowest_hp_enemy',
                priority: 3
            });

            mockContext.self.hp = 25; // 25% HP, activa primera regla

            const result = processor.process(mockContext);
            expect(result).not.toBeNull();
            expect(result.rule).toBe('Curarse si HP < 30%');
            expect(result.action).toBe('use_item');
        });

        test('Ejecuta regla por defecto si ninguna se cumple', () => {
            processor.addRule({
                name: 'Regla que no se activa',
                condition: 'self_hp_below_10', // HP no es < 10%
                action: 'use_potion',
                priority: 5
            });

            processor.setDefaultRule('basic_attack', 'random_enemy');

            const result = processor.process(mockContext);
            expect(result).not.toBeNull();
            expect(result.rule).toBe('default');
            expect(result.action).toBe('basic_attack');
        });

        test('Maneja condiciones múltiples (AND implícito)', () => {
            processor.addRule({
                name: 'Atacar mágicamente si hay maná y múltiples enemigos',
                condition: ['has_mana', 'multiple_enemies'],
                action: 'cast_fireball',
                target: 'random_enemy',
                priority: 6
            });

            const result = processor.process(mockContext);
            expect(result).not.toBeNull();
            expect(result.rule).toBe('Atacar mágicamente si hay maná y múltiples enemigos');
        });
    });

    describe('Resolución de objetivos', () => {
        test('Resuelve lowest_hp_enemy correctamente', () => {
            const target = processor.resolveTarget('lowest_hp_enemy', mockContext);
            expect(target).not.toBeNull();
            expect(target.name).toBe('Orco'); // 15/80 HP es el más bajo
        });

        test('Resuelve wounded_ally correctamente', () => {
            const target = processor.resolveTarget('wounded_ally', mockContext);
            expect(target).not.toBeNull();
            expect(target.name).toBe('Compañero');
        });

        test('Resuelve random_enemy', () => {
            const target = processor.resolveTarget('random_enemy', mockContext);
            expect(target).not.toBeNull();
            expect(['Goblin', 'Orco']).toContain(target.name);
        });

        test('Resuelve objetivo por ID', () => {
            const target = processor.resolveTarget('enemy_enemy1', mockContext);
            expect(target).not.toBeNull();
            expect(target.name).toBe('Goblin');
        });
    });

    describe('Presets predefinidos', () => {
        test('Carga preset agresivo', () => {
            const success = processor.loadPreset('aggressive');
            expect(success).toBe(true);
            expect(processor.rules.length).toBeGreaterThan(0);
        });

        test('Carga preset defensivo', () => {
            const success = processor.loadPreset('defensive');
            expect(success).toBe(true);
        });

        test('Preset agresivo ataca enemigo débil primero', () => {
            processor.loadPreset('aggressive');
            
            // Enemigo con HP muy bajo
            mockContext.enemies[1].hp = 5;
            
            const result = processor.process(mockContext);
            expect(result.action).toBe('heavy_strike');
        });

        test('Preset sanador cura aliados críticos', () => {
            processor.loadPreset('healer');
            
            // Aliado con HP crítico
            mockContext.allies[0].hp = 10;
            
            const result = processor.process(mockContext);
            expect(result.action).toBe('heal');
            expect(result.target).toBe(mockContext.allies[0].id);
        });
    });

    describe('Escenarios complejos', () => {
        test('Escenario 1: Héroe herido con pociones', () => {
            processor.loadPreset('balanced');
            
            // Héroe críticamente herido
            mockContext.self.hp = 15;
            // Enemigo también débil
            mockContext.enemies[0].hp = 10;
            
            const result = processor.process(mockContext);
            
            // Debería usar poción en sí mismo (prioridad 10)
            expect(result.action).toBe('use_item');
            expect(result.item).toBe('potion');
        });

        test('Escenario 2: Grupo con aliado herido y maná disponible', () => {
            processor.loadPreset('balanced');
            
            // Aliado herido
            mockContext.allies[0].hp = 25;
            // Héroe con maná
            mockContext.self.mana = 80;
            
            const result = processor.process(mockContext);
            
            // Debería curar al aliado herido (prioridad 8)
            expect(result.action).toBe('heal');
        });

        test('Escenario 3: Sin reglas activas, usa ataque por defecto', () => {
            processor.clearRules();
            processor.setDefaultRule('basic_attack', 'random_enemy');
            
            // Héroe con HP alto, sin condiciones que activen reglas específicas
            mockContext.self.hp = 100;
            mockContext.self.mana = 0;
            mockContext.self.inventory = []; // Sin pociones
            
            const result = processor.process(mockContext);
            
            expect(result.rule).toBe('default');
            expect(result.action).toBe('basic_attack');
        });

        test('Escenario 4: Múltiples reglas aplicables, selecciona la más prioritaria', () => {
            processor.addRule({
                name: 'Regla prioridad baja',
                condition: 'self_hp_below_50',
                action: 'defend',
                priority: 3
            });

            processor.addRule({
                name: 'Regla prioridad alta',
                condition: 'self_hp_below_30',
                action: 'use_potion',
                priority: 9
            });

            processor.addRule({
                name: 'Regla prioridad media',
                condition: 'enemy_hp_low',
                action: 'heavy_strike',
                priority: 5
            });

            // HP bajo activa regla de prioridad 9
            mockContext.self.hp = 20;
            // También hay enemigo débil (activaría regla prioridad 5)

            const result = processor.process(mockContext);
            expect(result.rule).toBe('Regla prioridad alta');
            expect(result.action).toBe('use_item');
        });
    });

    describe('Validación de contexto', () => {
        test('Rechaza contexto inválido', () => {
            const invalidContext = { self: null };
            expect(() => processor.process(invalidContext)).toThrow();
        });

        test('Rechaza entidades sin estructura válida', () => {
            const invalidContext = {
                self: { name: 'Héroe' }, // Falta hp y maxHp
                enemies: []
            };
            
            expect(() => processor.process(invalidContext)).toThrow();
        });
    });
});