/**
 * Ejemplo de uso del Sistema de Dados 2d10 Gaussiano
 */

const diceRoller = require('./engine/diceRoller');
const probabilityVisualizer = require('./engine/probabilityVisualizer');

console.log('🎲 EJEMPLO DE USO - SISTEMA 2d10 GAUSSIANO 🎲\n');

// Ejemplo 1: Tiradas básicas
console.log('1. TIRADAS BÁSICAS:');
console.log('─'.repeat(40));
for (let i = 0; i < 5; i++) {
    const roll = diceRoller.roll2d10();
    console.log(`Tirada ${i + 1}: ${roll.die1} + ${roll.die2} = ${roll.total}`);
}
console.log();

// Ejemplo 2: Tiradas con modificadores
console.log('2. TIRADAS CON MODIFICADORES:');
console.log('─'.repeat(40));
const modifiers = [-2, 0, 3, 5, 8];
modifiers.forEach(mod => {
    const roll = diceRoller.roll2d10WithMods(mod);
    const criticalMsg = roll.isCriticalSuccess ? ' (CRÍTICO!)' : 
                       roll.isCriticalFailure ? ' (PIFIA!)' : '';
    console.log(`Modificador ${mod >= 0 ? '+' : ''}${mod}: ${roll.die1} + ${roll.die2} + ${mod} = ${roll.finalResult}${criticalMsg}`);
});
console.log();

// Ejemplo 3: Análisis estadístico rápido
console.log('3. ANÁLISIS ESTADÍSTICO RÁPIDO:');
console.log('─'.repeat(40));
const testRolls = diceRoller.massRoll(1000);
const stats = diceRoller.calculateStatistics(testRolls);
console.log(`• Total de tiradas: ${stats.totalRolls}`);
console.log(`• Media: ${stats.mean.toFixed(2)}`);
console.log(`• Desviación estándar: ${stats.standardDeviation.toFixed(2)}`);
console.log(`• Resultado más común: ${Object.keys(stats.frequency).reduce((a, b) => 
    stats.frequency[a] > stats.frequency[b] ? a : b
)} (${stats.frequency[11]} ocurrencias)`);
console.log();

// Ejemplo 4: Generar histograma
console.log('4. HISTOGRAMA DE DISTRIBUCIÓN:');
console.log('─'.repeat(40));
const histogram = probabilityVisualizer.generateHistogram(5000);
console.log(histogram);
console.log();

// Ejemplo 5: Reporte completo (opcional - descomentar para ver)
console.log('5. REPORTE COMPLETO (resumen):');
console.log('─'.repeat(40));
const report = probabilityVisualizer.generateFullReport();
console.log(report.substring(0, 800) + '...\n[Reporte completo disponible]');