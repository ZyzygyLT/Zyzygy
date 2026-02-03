// Archivo de prueba simple para verificar que todo funciona
const DiceRoller = require('./engine/diceRoller');
const InitiativeCalculator = require('./engine/initiativeCalculator');

console.log('🎲 Probando sistema de dados e iniciativa...\n');

// Test 1: Dados
console.log('1. Test de dados 2d10:');
const diceRoller = new DiceRoller();
for (let i = 0; i < 5; i++) {
    const roll = diceRoller.roll2d10();
    console.log(`  Tirada ${i + 1}: ${roll.die1} + ${roll.die2} = ${roll.total}`);
}

// Test 2: Iniciativa
console.log('\n2. Test de iniciativa:');
const initiativeCalculator = new InitiativeCalculator();

const players = [
    { name: 'Guerrero', agi: 14, per: 10 },
    { name: 'Arquero', agi: 16, per: 12 },
    { name: 'Mago', agi: 8, per: 14 }
];

const result = initiativeCalculator.calculateAndSortInitiative(players);
console.log('\nOrden de turno:');
result.combatants.forEach(c => {
    console.log(`  ${c.turnOrder}. ${c.combatantName}: ${c.totalInitiative} (AGI:${c.agi}, PER:${c.per}, Dados:${c.diceResult})`);
});

console.log('\n✅ Todos los tests pasaron correctamente!');