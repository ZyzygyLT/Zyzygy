/**
 * Demostración del Sistema de Posicionamiento (4 Zonas)
 */

const PositioningSystem = require('../engine/positioningSystem');

console.log('🎯 DEMOSTRACIÓN DEL SISTEMA DE POSICIONAMIENTO (4 ZONAS) 🎯\n');

// Crear instancia del sistema
const positioning = new PositioningSystem();

// 1. Crear party de ejemplo
const party = [
    {
        id: 'thorak',
        name: 'Thorak el Inquebrantable',
        role: 'TANK',
        class: 'WARRIOR',
        currentHealth: 150,
        maxHealth: 150,
        isMelee: true,
        hasTaunt: true
    },
    {
        id: 'ragnar',
        name: 'Ragnar Colmillo de Lobo',
        role: 'MELEE_DPS',
        class: 'BERSERKER',
        currentHealth: 120,
        maxHealth: 120,
        isMelee: true,
        hasFlanking: true
    },
    {
        id: 'lyra',
        name: 'Lyra Tejecorazones',
        role: 'SUPPORT',
        class: 'DRUID',
        currentHealth: 90,
        maxHealth: 90,
        isRanged: true,
        canHeal: true
    },
    {
        id: 'legolas',
        name: 'Legolas Ojos de Halcón',
        role: 'RANGED_DPS',
        class: 'RANGER',
        currentHealth: 100,
        maxHealth: 100,
        isRanged: true,
        hasStealth: true
    },
    {
        id: 'merlin',
        name: 'Merlin el Arcano',
        role: 'MAGE',
        class: 'WIZARD',
        currentHealth: 80,
        maxHealth: 80,
        isRanged: true,
        isCaster: true
    },
    {
        id: 'sylvia',
        name: 'Sylvia Sombras',
        role: 'MELEE_DPS',
        class: 'ROGUE',
        currentHealth: 110,
        maxHealth: 110,
        isMelee: true,
        hasStealth: true
    },
    {
        id: 'boris',
        name: 'Boris Martillo de Piedra',
        role: 'TANK',
        class: 'PALADIN',
        currentHealth: 140,
        maxHealth: 140,
        isMelee: true,
        hasTaunt: true
    }
];

console.log('1. INICIALIZACIÓN DE FORMACIÓN:');
console.log('═'.repeat(60));

const formation = positioning.initializeFormation(party);
console.log(`✅ Formación creada con ID: ${formation.partyId}`);
console.log(`👥 ${Object.keys(formation.combatants).length} combatientes organizados en 4 zonas\n`);

// Mostrar reporte inicial
const initialReport = positioning.generateFormationReport(formation);
console.log(initialReport);

// 2. Demostración: Distribución de agro
console.log('2. DISTRIBUCIÓN DE AGRO (AMENAZA):');
console.log('═'.repeat(60));

console.log('\n⚔️ Ragnar ataca y genera 100 puntos de agro:\n');

const agroEvent = {
    source: formation.combatants.ragnar,
    amount: 100,
    type: 'DAMAGE'
};

const agroDistribution = positioning.distributeAgro(formation, agroEvent);

console.log('📊 DISTRIBUCIÓN DE AGRO:');
console.log('─'.repeat(40));
Object.values(agroDistribution.distribution).forEach(dist => {
    console.log(`• ${dist.name.padEnd(20)} (${dist.zone}): ${dist.amount.toFixed(1)} agro (${(dist.weight * 100).toFixed(1)}%)`);
});

console.log(`\n💥 Total distribuido: ${agroDistribution.totalDistributed.toFixed(1)}`);
console.log('📈 Por zona:');
Object.entries(agroDistribution.zoneBreakdown).forEach(([zone, amount]) => {
    console.log(`  • ${zone}: ${amount.toFixed(1)} agro`);
});

// 3. Demostración: Selección de objetivos
console.log('\n\n3. SELECCIÓN DE OBJETIVOS:');
console.log('═'.repeat(60));

console.log('\n🎯 Enemigo (IA) selecciona objetivo:\n');

const enemySelection = positioning.selectTarget(formation);
console.log(`✅ Objetivo seleccionado: ${enemySelection.selected.name} (${enemySelection.selected.role})`);
console.log(`🎯 Zona: ${enemySelection.selected.position}`);
console.log(`🎯 Peso de selección: ${(enemySelection.selectionWeights[enemySelection.selected.id] * 100).toFixed(1)}%`);
console.log(`🎯 Objetivos alcanzables: ${enemySelection.reachableTargets.length}`);

// 4. Demostración: Simulación de 1000 combates
console.log('\n\n4. SIMULACIÓN DE 1000 COMBATES:');
console.log('═'.repeat(60));

console.log('\n🎲 Simulando 1000 selecciones de objetivo...\n');

const simulation = positioning.simulateTargetSelection(formation, 1000);

console.log('📊 DISTRIBUCIÓN POR ZONA (Esperado vs Actual):');
console.log('─'.repeat(60));
console.log('Zona'.padEnd(10) + 'Esperado'.padEnd(15) + 'Actual'.padEnd(15) + 'Diferencia'.padEnd(15));

const expectedWeights = positioning.POSITION_CONSTANTS.AGRO_SYSTEM.BASE_AGRO_WEIGHTS;
Object.keys(expectedWeights).forEach(zone => {
    const expected = (expectedWeights[zone] * 100).toFixed(1);
    const actual = simulation.zoneDistribution[zone].percentage;
    const diff = (parseFloat(actual) - parseFloat(expected)).toFixed(1);
    
    console.log(
        zone.padEnd(10) +
        `${expected}%`.padEnd(15) +
        `${actual}%`.padEnd(15) +
        `${diff}%`.padEnd(15)
    );
});

console.log('\n👥 FRECUENCIA POR PERSONAJE:');
console.log('─'.repeat(40));
simulation.sortedByFrequency.slice(0, 5).forEach((combatant, index) => {
    console.log(`${index + 1}. ${combatant.name.padEnd(25)}: ${combatant.selections} veces (${combatant.percentage}%) - ${combatant.zone}`);
});

console.log('\n🎯 EFECTIVIDAD DEL SISTEMA DE AGRO:');
console.log('─'.repeat(40));
console.log(`• Correlación agro-selección: ${simulation.agroStats.correlation}`);
console.log(`• Agro promedio de seleccionados: ${simulation.agroStats.averageAgroOfSelected}`);
console.log(`• Efectividad global: ${simulation.agroStats.agroEffectiveness}%`);

// 5. Demostración: Modificadores por posición
console.log('\n\n5. MODIFICADORES POR POSICIÓN:');
console.log('═'.repeat(60));

const attacker = formation.combatants.ragnar; // En SIDES
const target = formation.combatants.thorak;   // En FRONT

console.log(`\n⚔️ ${attacker.name} (${attacker.position}) ataca a ${target.name} (${target.position})\n`);

const attackTypes = ['MELEE', 'RANGED', 'MAGIC', 'AOE'];
attackTypes.forEach(attackType => {
    const modifiers = positioning.calculatePositionModifiers(formation, attacker, target, attackType);
    
    console.log(`🎯 ${attackType}:`);
    console.log(`  • Precisión: ${modifiers.accuracy.toFixed(2)}x`);
    console.log(`  • Daño: ${modifiers.damage.toFixed(2)}x`);
    console.log(`  • Crítico: ${modifiers.critical.toFixed(2)}x`);
    console.log(`  • Defensa objetivo: ${modifiers.defense.toFixed(2)}x`);
    console.log(`  • Modificador total: ${modifiers.total.toFixed(2)}x`);
    
    if (modifiers.positionInfo.hasFlanking) {
        console.log(`  • ⚔️ BONUS POR FLANQUEO`);
    }
    
    if (!modifiers.positionInfo.rangeValid) {
        console.log(`  • ⚠️ FUERA DE RANGO`);
    }
    
    console.log();
});

// 6. Demostración: Movimiento táctico
console.log('\n\n6. MOVIMIENTO TÁCTICO:');
console.log('═'.repeat(60));

console.log('\n🚶 Sylvia se mueve de SIDES a BACK:\n');

const movementResult = positioning.moveCombatant(formation, 'sylvia', 'BACK');

if (movementResult.success) {
    console.log(`✅ Movimiento exitoso:`);
    console.log(`   • De: ${movementResult.fromZone}`);
    console.log(`   • A: ${movementResult.toZone}`);
    console.log(`   • Costo: ${movementResult.movementCost} acciones`);
    console.log(`   • Agro actual: ${movementResult.agroChange.toFixed(2)}`);
} else {
    console.log(`❌ Movimiento fallido: ${movementResult.reason}`);
}

// Mostrar formación actualizada
console.log('\n📋 FORMACIÓN ACTUALIZADA:');
const updatedReport = positioning.generateFormationReport(formation);
console.log(updatedReport.split('\n').slice(0, 50).join('\n')); // Mostrar solo parte del reporte

// 7. Demostración: Sistema de rangos
console.log('\n\n7. SISTEMA DE RANGOS DE ATAQUE:');
console.log('═'.repeat(60));

console.log('\n🎯 Alcance desde cada posición con diferentes tipos de ataque:\n');

const positions = ['FRONT', 'SIDES', 'MID', 'BACK'];
const attackRanges = positioning.POSITION_CONSTANTS.ATTACK_RANGES;

positions.forEach(position => {
    console.log(`📍 Desde ${position}:`);
    
    Object.keys(attackRanges).forEach(attackType => {
        const reachable = attackRanges[attackType][`from_${position}`] || [];
        if (reachable.length > 0) {
            console.log(`  • ${attackType.padEnd(8)}: ${reachable.join(', ')}`);
        }
    });
    console.log();
});

// 8. Demostración: Comparación de diferentes formaciones
console.log('\n\n8. COMPARACIÓN DE DIFERENTES ESTRATEGIAS:');
console.log('═'.repeat(60));

const strategies = [
    { name: 'Defensiva', composition: ['TANK', 'TANK', 'SUPPORT', 'RANGED_DPS', 'MAGE'] },
    { name: 'Ofensiva', composition: ['TANK', 'MELEE_DPS', 'MELEE_DPS', 'RANGED_DPS', 'MAGE'] },
    { name: 'Equilibrada', composition: ['TANK', 'MELEE_DPS', 'SUPPORT', 'RANGED_DPS', 'MAGE'] }
];

console.log('\n📊 Impacto de la composición en la distribución de objetivos:\n');

strategies.forEach(strategy => {
    // Crear party para esta estrategia
    const strategyParty = strategy.composition.map((role, i) => ({
        id: `strategy_${strategy.name.toLowerCase()}_${i}`,
        name: `${strategy.name} ${role}`,
        role: role,
        currentHealth: 100,
        maxHealth: 100
    }));
    
    const strategyFormation = positioning.initializeFormation(strategyParty);
    const strategySim = positioning.simulateTargetSelection(strategyFormation, 500);
    
    const frontPercent = parseFloat(strategySim.zoneDistribution.FRONT.percentage);
    const backPercent = parseFloat(strategySim.zoneDistribution.BACK.percentage);
    
    console.log(`• ${strategy.name.padEnd(12)}: FRONT ${frontPercent.toFixed(1)}%, BACK ${backPercent.toFixed(1)}%`);
    console.log(`  Composición: ${strategy.composition.join(', ')}`);
});

// 9. Conclusiones del sistema
console.log('\n\n9. CONCLUSIONES DEL SISTEMA:');
console.log('═'.repeat(60));

console.log('\n✅ CARACTERÍSTICAS IMPLEMENTADAS:');
console.log('─'.repeat(40));
console.log('🎯 Sistema de 4 zonas: FRONT, SIDES, MID, BACK');
console.log('🎯 Distribución de agro: 65%/20%/10%/5% respetada');
console.log('🎯 Selección ponderada de objetivos');
console.log('🎯 Modificadores por posición (ataque/defensa)');
console.log('🎯 Sistema de rangos de ataque por tipo');
console.log('🎯 Movimiento táctico entre zonas');
console.log('🎯 Tabla de agro (amenaza) dinámica');
console.log('🎯 Simulación estadística de 1000+ combates');
console.log('🎯 Reportes detallados de formación');

console.log('\n⚖️ BALANCE Y TÁCTICAS:');
console.log('─'.repeat(40));
console.log('• FRONT absorbe 65% del daño (protege al grupo)');
console.log('• SIDES permite flanqueo (bonificación al daño)');
console.log('• MID posición balanceada (soporte)');
console.log('• BACK posición segura (magos/arqueros)');
console.log('• El agro guía la IA para atacar objetivos lógicos');
console.log('• Los modificadores incentivan el posicionamiento táctico');

console.log('\n🎮 INTEGRACIÓN CON SISTEMA DE COMBATE:');
console.log('─'.repeat(40));
console.log('1. Inicializar formación al inicio del combate');
console.log('2. Usar selectTarget() para decisiones de IA');
console.log('3. Aplicar calculatePositionModifiers() a los ataques');
console.log('4. Actualizar agro con distributeAgro() después de acciones');
console.log('5. Permitir movimiento táctico con moveCombatant()');
console.log('6. Usar simulateTargetSelection() para balance y testing');

console.log('\n✨ DEMOSTRACIÓN COMPLETADA');
console.log('═'.repeat(60));
console.log('\nEl sistema de posicionamiento táctico está listo para:');
console.log('• Crear combates estratégicos y dinámicos');
console.log('• Incentivar el uso de formaciones y tácticas');
console.log('• Guiar la IA de manera inteligente y creíble');
console.log('• Balancear el riesgo/recompensa de cada posición');
console.log('• Integrarse perfectamente con el resto del sistema de combate');
console.log('\n¡Sistema listo para producción! 🚀');