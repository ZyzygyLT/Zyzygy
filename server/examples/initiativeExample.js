/**
 * Ejemplo de uso de la Calculadora de Iniciativa
 */

const initiativeCalculator = require('../engine/initiativeCalculator');

console.log('🎯 EJEMPLO DE USO - CALCULADORA DE INICIATIVA 🎯\n');

// 1. Definir combatientes
const party = [
    { 
        id: 'warrior001', 
        name: 'Thorak el Guerrero', 
        agi: 14, 
        per: 10, 
        metadata: { class: 'Warrior', level: 5 } 
    },
    { 
        id: 'archer002', 
        name: 'Lyra la Arquera', 
        agi: 16, 
        per: 12, 
        metadata: { class: 'Ranger', level: 5 } 
    },
    { 
        id: 'mage003', 
        name: 'Eldrin el Mago', 
        agi: 8, 
        per: 14, 
        metadata: { class: 'Wizard', level: 5 } 
    },
    { 
        id: 'rogue004', 
        name: 'Silas el Pícaro', 
        agi: 18, 
        per: 8, 
        metadata: { class: 'Rogue', level: 5 } 
    },
    { 
        id: 'cleric005', 
        name: 'Aria la Clériga', 
        agi: 10, 
        per: 12, 
        metadata: { class: 'Cleric', level: 5 } 
    }
];

console.log('1. COMBATIENTES:');
console.log('─'.repeat(40));
party.forEach((char, i) => {
    const bonus = (char.agi * 2) + char.per;
    console.log(`${i + 1}. ${char.name.padEnd(20)} | AGI: ${char.agi} | PER: ${char.per} | Bonificación: ${bonus}`);
});
console.log();

// 2. Calcular una ronda de iniciativa
console.log('2. RONDA DE INICIATIVA:');
console.log('─'.repeat(40));
const roundResult = initiativeCalculator.calculateAndSortInitiative(party);
console.log(initiativeCalculator.generateSummary(roundResult));

// 3. Simular múltiples rondas para análisis
console.log('3. SIMULACIÓN DE 1000 RONDAS:');
console.log('─'.repeat(40));
console.log('Simulando... (esto puede tomar un momento)\n');

const simulation = initiativeCalculator.simulateMultipleRounds(party, 1000);

console.log('📊 PROBABILIDAD DE GANAR INICIATIVA:');
console.log('─'.repeat(40));
Object.entries(simulation.winProbability).forEach(([id, probability]) => {
    const char = party.find(c => (c.id || c.name) === id);
    console.log(`• ${char.name.padEnd(20)}: ${probability} de ser primero`);
});

console.log('\n📈 POSICIÓN PROMEDIO:');
console.log('─'.repeat(40));
Object.entries(simulation.averagePosition).forEach(([id, avgPos]) => {
    const char = party.find(c => (c.id || c.name) === id);
    console.log(`• ${char.name.padEnd(20)}: ${avgPos}º posición promedio`);
});

console.log('\n🎲 CONSISTENCIA (Coeficiente de Variación):');
console.log('─'.repeat(40));
console.log('(Menor = más consistente, Mayor = más aleatorio)');
Object.entries(simulation.consistency).forEach(([id, stats]) => {
    const char = party.find(c => (c.id || c.name) === id);
    console.log(`• ${char.name.padEnd(20)}: Media=${stats.mean}, CV=${stats.cv}`);
});

// 4. Ejemplo de exportación
console.log('\n4. EXPORTACIÓN CSV:');
console.log('─'.repeat(40));
const csv = initiativeCalculator.exportToCSV(roundResult);
console.log('Primeras líneas del CSV:');
console.log(csv.split('\n').slice(0, 4).join('\n'));
console.log('...\n');

// 5. Casos especiales
console.log('5. CASOS ESPECIALES:');
console.log('─'.repeat(40));

// 5.1 Empate
console.log('\nEjemplo de empate:');
const tiedCombatants = [
    { name: 'Personaje A', agi: 12, per: 8 },
    { name: 'Personaje B', agi: 10, per: 12 },
    { name: 'Personaje C', agi: 10, per: 12 } // Mismos atributos que B
];

// Forzar dados específicos para demostrar empate
const originalRoller = initiativeCalculator.diceRoller;
initiativeCalculator.diceRoller = {
    roll2d10: () => ({ total: 10 }) // Todos obtienen 10 en dados
};

const tieResult = initiativeCalculator.calculateAndSortInitiative(tiedCombatants);
tieResult.combatants.forEach(c => {
    console.log(`${c.turnOrder}. ${c.combatantName}: Iniciativa=${c.totalInitiative}, Bonificación=${c.attributeBonus}, AGI=${c.agi}`);
});

if (tieResult.statistics.ties.hasTies) {
    console.log(`\n¡Empates detectados!`);
    Object.entries(tieResult.statistics.ties.tieGroups).forEach(([initiative, names]) => {
        console.log(`• Iniciativa ${initiative}: ${names.join(', ')}`);
    });
}

// Restaurar roller original
initiativeCalculator.diceRoller = originalRoller;

// 5.2 Sin dados (solo atributos)
console.log('\n\nOrden solo por atributos (sin aleatoriedad):');
const initiativesNoDice = initiativeCalculator.calculateMultipleInitiatives(party, false);
const sortedNoDice = initiativeCalculator.sortByInitiative(initiativesNoDice);

sortedNoDice.forEach((c, i) => {
    console.log(`${i + 1}. ${c.combatantName.padEnd(20)}: ${c.totalInitiative} (AGI:${c.agi}, PER:${c.per})`);
});

console.log('\n' + '═'.repeat(60));
console.log('✅ Sistema de Iniciativa listo para combate!');
console.log('═'.repeat(60));