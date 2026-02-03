/**
 * Demostración del Sistema de Daño - Mitigación Hiperbólica
 */

const DamageCalculator = require('../engine/damageCalculator');

console.log('💥 DEMOSTRACIÓN DEL SISTEMA DE DAÑO - MITIGACIÓN HIPERBÓLICA 💥\n');

// Crear instancia del calculador
const damageCalculator = new DamageCalculator();

// 1. Mostrar la fórmula y gráfica
console.log('1. FÓRMULA DE MITIGACIÓN HIPERBÓLICA:');
console.log('═'.repeat(60));
console.log('Fórmula: Coef = 100 / (100 + (Armor × 0.5))\n');
console.log('Cada punto de armadura adicional es menos efectivo que el anterior.');
console.log('Esto evita que la armadura sea demasiado poderosa en valores altos.\n');

// 2. Generar y mostrar gráfica ASCII
console.log('2. GRÁFICA DE MITIGACIÓN:');
console.log('═'.repeat(60));
const graph = damageCalculator.generateAsciiGraph(100, 60, 15);
console.log(graph);

// 3. Mostrar puntos clave
console.log('3. PUNTOS CLAVE DE MITIGACIÓN:');
console.log('═'.repeat(60));
const graphData = damageCalculator.generateMitigationGraphData(100, 10);

console.log('\n📊 MITIGACIÓN POR NIVEL DE ARMADURA:');
console.log('─'.repeat(50));
graphData.keyPoints.forEach(point => {
    console.log(`• ${point.armor.toString().padStart(3)} armadura: ${point.damagePercent.toString().padStart(5)}% daño - ${point.description}`);
});

// 4. Ejemplo de cálculo completo
console.log('\n\n4. EJEMPLO DE CÁLCULO COMPLETO:');
console.log('═'.repeat(60));

const attacker = {
    name: 'Sir Lancelot',
    strength: 18,
    dexterity: 14,
    skillLevel: 8,
    condition: 'NORMAL'
};

const weapon = {
    name: 'Espada de la Luz',
    baseDamage: 15,
    damageDice: '1d8+3',
    damageType: 'SLASHING',
    weight: 5,
    criticalMultiplier: 2.0,
    hands: 1
};

const defender = {
    name: 'Dragón Negro',
    condition: 'NORMAL',
    resistance: 0.1, // 10% resistencia general
    damageResistances: { FIRE: 0.5 } // 50% resistencia al fuego
};

const armor = {
    name: 'Escamas de Dragón',
    defense: 35,
    flatReduction: 8,
    material: 'SCALES',
    type: 'NATURAL'
};

console.log('\n⚔️ ESCENARIO:');
console.log('─'.repeat(40));
console.log(`Atacante: ${attacker.name} (FUE:${attacker.strength}, DES:${attacker.dexterity})`);
console.log(`Arma: ${weapon.name} (${weapon.baseDamage} base + ${weapon.damageDice})`);
console.log(`Defensor: ${defender.name}`);
console.log(`Armadura: ${armor.name} (${armor.defense} defensa, ${armor.flatReduction} reducción plana)`);

// Calcular daño para diferentes tipos de golpe
const hitTypes = ['CRITICAL', 'SOLID_HIT', 'GRAZE'];

hitTypes.forEach(hitType => {
    const damageResult = damageCalculator.resolveDamage(
        attacker, weapon, defender, armor, hitType
    );
    
    console.log(`\n🎯 ${hitType}:`);
    console.log(`  Daño bruto: ${damageResult.summary.rawDamage.toFixed(1)}`);
    console.log(`  Daño final: ${damageResult.summary.finalDamage}`);
    console.log(`  Reducción: ${damageResult.summary.reductionPercent} (${damageResult.summary.armorEffectiveness} efectividad)`);
});

// 5. Simulación de 1000 ataques
console.log('\n\n5. SIMULACIÓN DE 1000 ATAQUES:');
console.log('═'.repeat(60));
console.log('\nSimulando 1000 ataques del Guerrero contra el Dragón...\n');

const simulation = damageCalculator.simulateDamage(
    attacker, weapon, defender, armor, 1000
);

console.log('📈 ESTADÍSTICAS DE DAÑO:');
console.log('─'.repeat(40));
console.log(`• Daño bruto promedio: ${simulation.statistics.averageRawDamage.toFixed(1)}`);
console.log(`• Daño final promedio: ${simulation.statistics.averageFinalDamage.toFixed(1)}`);
console.log(`• Mitigación promedio: ${simulation.statistics.averageMitigation.toFixed(1)}%`);
console.log(`• Eficiencia de daño: ${simulation.statistics.damageEfficiency}%`);

console.log('\n🎯 DISTRIBUCIÓN POR TIPO DE GOLPE:');
console.log('─'.repeat(40));
Object.entries(simulation.byHitType).forEach(([type, data]) => {
    if (data.count > 0) {
        console.log(`• ${type.padEnd(12)}: ${data.count.toString().padStart(4)} hits (${(data.count/10).toFixed(1)}%)`);
        console.log(`  Promedio: ${data.averageFinal?.toFixed(1) || '0'} daño`);
    }
});

console.log('\n🛡️ EFECTIVIDAD DE LA ARMADURA:');
console.log('─'.repeat(40));
console.log(`• Daño total prevenido: ${simulation.armorEffectiveness.totalDamagePrevented.toFixed(0)}`);
console.log(`• Porcentaje prevenido: ${simulation.armorEffectiveness.percentDamagePrevented}%`);
console.log(`• Golpes con daño mínimo: ${simulation.armorEffectiveness.hitsAtMinimumDamage} (${simulation.armorEffectiveness.percentAtMinimumDamage}%)`);

// 6. Comparación de diferentes armaduras
console.log('\n\n6. COMPARACIÓN DE ARMADURAS:');
console.log('═'.repeat(60));

const armors = [
    { name: 'Sin armadura', defense: 0, flatReduction: 0 },
    { name: 'Cuero', defense: 8, flatReduction: 2 },
    { name: 'Cota de Malla', defense: 18, flatReduction: 5 },
    { name: 'Armadura de Placas', defense: 25, flatReduction: 8 },
    { name: 'Armadura Mítica', defense: 40, flatReduction: 12 }
];

console.log('\nDaño promedio contra diferentes armaduras (100 simulaciones cada una):\n');
console.log('Armadura'.padEnd(20) + 'Defensa'.padEnd(10) + 'Daño Avg'.padEnd(12) + 'Reducción'.padEnd(12) + 'Efectividad');

armors.forEach(armorType => {
    const sim = damageCalculator.simulateDamage(attacker, weapon, defender, armorType, 100);
    
    console.log(
        armorType.name.padEnd(20) +
        armorType.defense.toString().padEnd(10) +
        sim.statistics.averageFinalDamage.toFixed(1).padEnd(12) +
        sim.statistics.averageReduction.toFixed(1).padEnd(12) +
        sim.statistics.averageMitigation.toFixed(1) + '%'
    );
});

// 7. Demostración de rendimientos decrecientes
console.log('\n\n7. RENDIMIENTOS DECRECIENTES (DEMOSTRACIÓN):');
console.log('═'.repeat(60));

console.log('\nCada punto de armadura adicional da menos mitigación que el anterior:\n');
console.log('Armadura'.padEnd(12) + 'Coef'.padEnd(12) + 'Daño%'.padEnd(12) + 'Mitigación'.padEnd(12) + 'Mitig. adicional');

let previousCoeff = 1.0;
let previousMitigation = 0;

for (let armor = 0; armor <= 50; armor += 10) {
    const coeff = damageCalculator.calculateMitigationCoefficient(armor);
    const damagePercent = coeff * 100;
    const mitigation = 100 - damagePercent;
    const additionalMitigation = armor === 0 ? mitigation : mitigation - previousMitigation;
    
    console.log(
        armor.toString().padEnd(12) +
        coeff.toFixed(3).padEnd(12) +
        damagePercent.toFixed(1) + '%'.padEnd(8) +
        mitigation.toFixed(1) + '%'.padEnd(8) +
        (armor === 0 ? '-' : '+' + additionalMitigation.toFixed(1) + '%')
    );
    
    previousCoeff = coeff;
    previousMitigation = mitigation;
}

console.log('\n\n✅ DEMOSTRACIÓN COMPLETADA');
console.log('═'.repeat(60));
console.log('\nEl sistema de daño utiliza mitigación hiperbólica para:');
console.log('• Evitar que la armadura sea demasiado poderosa en valores altos');
console.log('• Garantizar que siempre pase algo de daño (nunca reduce a 0)');
console.log('• Simular rendimientos decrecientes (cada punto es menos efectivo)');
console.log('• Considerar tipo de daño, posición, condiciones y resistencias');
console.log('\nListo para integrar con Fase A (Precisión) y Fase C (Efectos)!');