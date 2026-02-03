/**
 * Demostración del Procesador de Tácticas
 */

const TacticsProcessor = require('../engine/tacticsProcessor');

function runDemo() {
    console.log('=== DEMO: PROCESADOR DE TÁCTICAS ===\n');
    
    // Crear procesador
    const processor = new TacticsProcessor();
    processor.setDebugMode(true);
    
    // Cargar preset balanceado
    processor.loadPreset('balanced');
    
    // Escenario 1: Héroe herido, aliado crítico
    console.log('\n--- ESCENARIO 1: Héroe herido, aliado crítico ---');
    const scenario1 = {
        self: {
            id: 'hero',
            name: 'Guerrero',
            hp: 35,
            maxHp: 120,
            mana: 40,
            maxMana: 80,
            attack: 25,
            defense: 15,
            magicPower: 10,
            inventory: [{ name: 'potion', quantity: 1 }]
        },
        allies: [
            {
                id: 'mage',
                name: 'Mago',
                hp: 10,
                maxHp: 60,
                attack: 8,
                defense: 5
            }
        ],
        enemies: [
            {
                id: 'goblin1',
                name: 'Goblin Líder',
                hp: 50,
                maxHp: 70,
                attack: 18,
                defense: 8,
                magicResist: 4
            }
        ]
    };
    
    const result1 = processor.process(scenario1);
    console.log('Decisión:', result1.message);
    
    // Escenario 2: Grupo de enemigos, héroe con maná
    console.log('\n--- ESCENARIO 2: Múltiples enemigos, héroe con maná ---');
    const scenario2 = {
        self: {
            id: 'hero',
            name: 'Guerrero',
            hp: 90,
            maxHp: 120,
            mana: 60,
            maxMana: 80,
            attack: 25,
            defense: 15,
            magicPower: 10,
            inventory: []
        },
        allies: [],
        enemies: [
            {
                id: 'goblin1',
                name: 'Goblin',
                hp: 40,
                maxHp: 40,
                attack: 12,
                defense: 5,
                magicResist: 2
            },
            {
                id: 'goblin2',
                name: 'Goblin',
                hp: 35,
                maxHp: 40,
                attack: 12,
                defense: 5,
                magicResist: 2
            },
            {
                id: 'hobgoblin',
                name: 'Hobgoblin',
                hp: 80,
                maxHp: 100,
                attack: 22,
                defense: 12,
                magicResist: 6
            }
        ]
    };
    
    const result2 = processor.process(scenario2);
    console.log('Decisión:', result2.message);
    
    // Escenario 3: Sin opciones obvias
    console.log('\n--- ESCENARIO 3: Situación equilibrada ---');
    const scenario3 = {
        self: {
            id: 'hero',
            name: 'Guerrero',
            hp: 80,
            maxHp: 120,
            mana: 10,
            maxMana: 80,
            attack: 25,
            defense: 15,
            magicPower: 10,
            inventory: [{ name: 'potion', quantity: 1 }]
        },
        allies: [
            {
                id: 'archer',
                name: 'Arquero',
                hp: 65,
                maxHp: 80,
                attack: 20,
                defense: 8
            }
        ],
        enemies: [
            {
                id: 'orc',
                name: 'Orc',
                hp: 70,
                maxHp: 100,
                attack: 28,
                defense: 15,
                magicResist: 8
            }
        ]
    };
    
    const result3 = processor.process(scenario3);
    console.log('Decisión:', result3.message);
    
    // Mostrar reglas cargadas
    console.log('\n--- REGLAS CARGADAS ---');
    processor.rules.forEach((rule, index) => {
        console.log(`${index + 1}. ${rule.name} (Pri: ${rule.priority})`);
        console.log(`   Si: ${Array.isArray(rule.condition) ? rule.condition.join(' Y ') : rule.condition}`);
        console.log(`   Entonces: ${rule.action} -> ${rule.target || 'default'}`);
    });
    
    console.log('\n=== DEMO COMPLETADO ===');
}

// Ejecutar demo si es llamado directamente
if (require.main === module) {
    runDemo();
}

module.exports = { runDemo };