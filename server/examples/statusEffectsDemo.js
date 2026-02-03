/**
 * Demostración del Sistema de Estados Alterados
 */

const StatusEffects = require('../engine/statusEffects');

console.log('🎭 DEMOSTRACIÓN DEL SISTEMA DE ESTADOS ALTERADOS 🎭\n');

// Crear instancia del sistema
const statusSystem = new StatusEffects();

// 1. Crear combatientes de ejemplo
const combatants = {
    warrior: {
        id: 'war001',
        name: 'Thorak el Indomable',
        maxHealth: 120,
        currentHealth: 120,
        baseActionsPerTurn: 3,
        agility: 16,
        strength: 20,
        vitality: 18,
        willpower: 12,
        endurance: 15,
        currentTurn: 1,
        equipment: {
            armor: { statusEffectResistance: 0.1 }
        }
    },
    
    mage: {
        id: 'mage001',
        name: 'Lyra la Tejecorazones',
        maxHealth: 80,
        currentHealth: 80,
        baseActionsPerTurn: 3,
        agility: 14,
        strength: 8,
        vitality: 10,
        willpower: 22,
        endurance: 9,
        currentTurn: 1,
        equipment: {
            robe: { statusEffectResistance: 0.05 }
        }
    },
    
    rogue: {
        id: 'rog001',
        name: 'Silas Sombras',
        maxHealth: 90,
        currentHealth: 90,
        baseActionsPerTurn: 4, // Pícaro tiene más acciones
        agility: 22,
        strength: 14,
        vitality: 12,
        willpower: 10,
        endurance: 11,
        currentTurn: 1
    }
};

// Fuente de efectos (por ejemplo, un hechizo o ataque especial)
const fireMage = {
    id: 'enemy001',
    name: 'Ignatius el Pirotécnico',
    statusEffectBonus: 0.2,
    statusEffectDurationBonus: 0.3
};

// 2. Demostración: Aplicar efectos complejos
console.log('1. APLICACIÓN DE EFECTOS COMPLEJOS:');
console.log('═'.repeat(60));

console.log('\n🔥 Ignatius ataca a Thorak con fuego mágico:');
console.log('Aplicando Quemadura, Ralentización y Debilidad...\n');

const attackEffects = [
    { type: 'BURN', initialStacks: 2, potency: 1.3 },
    { type: 'SLOW', initialStacks: 1, potency: 1.0 },
    { type: 'WEAKNESS', initialStacks: 1, potency: 1.0 }
];

const applicationResult = statusSystem.applyStatusEffects(
    combatants.warrior,
    attackEffects,
    fireMage
);

console.log('📊 RESULTADO DE LA APLICACIÓN:');
console.log('─'.repeat(40));
console.log(`• Efectos aplicados: ${applicationResult.summary.totalApplied}`);
console.log(`• Efectos resistidos: ${applicationResult.summary.totalResisted}`);
console.log(`• Efectos nuevos: ${applicationResult.summary.totalNew}`);

applicationResult.effectsApplied.forEach(effect => {
    console.log(`  ✅ ${effect.name}: ${effect.wasStacked ? `Stack ${effect.newStacks}` : 'Aplicado'}`);
});

applicationResult.effectsResisted.forEach(effect => {
    console.log(`  ❌ ${effect.name}: Resistido (${(effect.applyChance * 100).toFixed(0)}% chance)`);
});

// 3. Demostración: Procesar inicio de turno
console.log('\n\n2. PROCESAMIENTO DE INICIO DE TURNO:');
console.log('═'.repeat(60));

console.log('\n⏰ Comienza el turno de Thorak...\n');

combatants.warrior.currentTurn = 2;
const turnResult = statusSystem.processTurnStartEffects(combatants.warrior);

console.log('📈 RESULTADO DEL TURNO:');
console.log('─'.repeat(40));
console.log(`• Daño recibido: ${turnResult.damageTaken.toFixed(1)}`);

Object.entries(turnResult.damageByType).forEach(([type, damage]) => {
    console.log(`  - ${type}: ${damage.toFixed(1)} daño`);
});

console.log(`• Acciones perdidas: ${turnResult.actionsLost}`);
console.log(`• Efectos procesados: ${turnResult.effectsProcessed.length}`);
console.log(`• Efectos expirados: ${turnResult.effectsExpired.length}`);

if (Object.keys(turnResult.statModifications).length > 0) {
    console.log('\n📉 MODIFICACIONES DE ESTADÍSTICAS:');
    Object.entries(turnResult.statModifications).forEach(([stat, reduction]) => {
        console.log(`  - ${stat}: ${(reduction * 100).toFixed(1)}% reducción`);
    });
}

console.log(`\n💪 Salud después del daño: ${turnResult.healthAfterDamage}/${combatants.warrior.maxHealth}`);
console.log(`🎯 Acciones disponibles: ${turnResult.actionsAfterProcessing}/${combatants.warrior.baseActionsPerTurn}`);

// 4. Demostración: Sistema de múltiples acciones
console.log('\n\n3. SISTEMA DE MÚLTIPLES ACCIONES:');
console.log('═'.repeat(60));

console.log('\nComparando cómo diferentes efectos afectan las acciones:\n');

const actionTestCases = [
    {
        name: 'Guerrero normal',
        combatant: { ...combatants.warrior, statusEffects: {} },
        description: 'Sin efectos'
    },
    {
        name: 'Guerrero aturdido',
        combatant: { 
            ...combatants.warrior, 
            statusEffects: { STUN: { type: 'STUN', name: 'Aturdimiento', stacks: 1, effectType: 'ACTION_REDUCTION' } }
        },
        description: 'Con STUN (pierde 1 acción)'
    },
    {
        name: 'Pícaro ralentizado',
        combatant: { 
            ...combatants.rogue,
            statusEffects: { 
                SLOW: { type: 'SLOW', name: 'Ralentización', stacks: 2, effectType: 'ACTION_REDUCTION' },
                STUN: { type: 'STUN', name: 'Aturdimiento', stacks: 1, effectType: 'ACTION_REDUCTION' }
            }
        },
        description: 'Con SLOW x2 + STUN'
    }
];

actionTestCases.forEach(testCase => {
    statusSystem.calculateAvailableActions(testCase.combatant);
    
    console.log(`• ${testCase.name.padEnd(25)}: ${testCase.combatant.availableActions} acciones (${testCase.description})`);
});

// 5. Demostración: Sangrado progresivo
console.log('\n\n4. SANGRADO PROGRESIVO:');
console.log('═'.repeat(60));

const bleedingTarget = {
    ...combatants.mage,
    name: 'Lyra (Sangrando)',
    currentHealth: 60,
    statusEffects: {}
};

console.log('\n🩸 Lyra es atacada múltiples veces con armas cortantes:\n');

// Aplicar sangrado progresivamente
for (let i = 1; i <= 4; i++) {
    bleedingTarget.currentTurn = i;
    const result = statusSystem.applyStatusEffects(bleedingTarget, [
        { type: 'BLEEDING', potency: 1.0 + (i * 0.1) }
    ], { name: `Atacante ${i}` });
    
    const bleedingEffect = bleedingTarget.statusEffects.BLEEDING;
    console.log(`Ataque ${i}: Sangrado ${bleedingEffect ? `stack ${bleedingEffect.stacks}` : 'resistido'}`);
}

console.log('\n📊 Evolución del sangrado en 3 turnos:');
console.log('─'.repeat(40));

let totalBleedingDamage = 0;
for (let turn = 1; turn <= 3; turn++) {
    bleedingTarget.currentTurn = turn + 4;
    const turnResult = statusSystem.processTurnStartEffects(bleedingTarget);
    
    totalBleedingDamage += turnResult.damageTaken;
    console.log(`Turno ${turn}: ${turnResult.damageTaken.toFixed(1)} daño, Salud: ${turnResult.healthAfterDamage}`);
}

console.log(`\n💀 Daño total por sangrado: ${totalBleedingDamage.toFixed(1)}`);
console.log(`🩸 Stacks finales: ${bleedingTarget.statusEffects.BLEEDING?.stacks || 0}`);

// 6. Demostración: Congelación y reducción de AGI
console.log('\n\n5. CONGELACIÓN Y REDUCCIÓN DE AGI:');
console.log('═'.repeat(60));

const frozenTarget = {
    ...combatants.rogue,
    name: 'Silas (Congelado)',
    agility: 22,
    originalStats: { agility: 22 },
    statusEffects: {}
};

console.log('\n❄️ Silas es afectado por hechizo de congelación:\n');

// Aplicar congelación máxima
frozenTarget.currentTurn = 1;
statusSystem.applyStatusEffects(frozenTarget, [
    { type: 'FREEZE', initialStacks: 3, potency: 1.5 }
], { name: 'Hechicero de Hielo' });

console.log('📉 Reducción de AGI por turno:');
console.log('─'.repeat(40));

for (let turn = 1; turn <= 4; turn++) {
    frozenTarget.currentTurn = turn + 1;
    const beforeAgi = frozenTarget.agility;
    const turnResult = statusSystem.processTurnStartEffects(frozenTarget);
    const afterAgi = frozenTarget.agility;
    
    console.log(`Turno ${turn}: AGI ${beforeAgi} → ${afterAgi} (${((beforeAgi - afterAgi) / beforeAgi * 100).toFixed(0)}% reducción)`);
    
    if (turnResult.effectsExpired.some(e => e.type === 'FREEZE')) {
        console.log('  ⚠️ Efecto de congelación expiró');
    }
}

// 7. Demostración: Reporte completo
console.log('\n\n6. REPORTE COMPLETO DE EFECTOS:');
console.log('═'.repeat(60));

const reportTarget = {
    ...combatants.warrior,
    name: 'Thorak (Multiafectado)',
    currentHealth: 85,
    statusEffects: {
        BLEEDING: {
            type: 'BLEEDING',
            name: 'Sangrado',
            stacks: 3,
            duration: 2,
            maxDuration: 3,
            potency: 1.2,
            appliedBy: 'assassin001',
            appliedTurn: 1,
            sourceName: 'Asesino',
            effectType: 'DAMAGE_OVER_TIME',
            metadata: { damageType: 'PHYSICAL' }
        },
        POISON: {
            type: 'POISON',
            name: 'Veneno',
            stacks: 2,
            duration: 3,
            maxDuration: 4,
            potency: 1.0,
            appliedBy: 'alchemist001',
            appliedTurn: 1,
            sourceName: 'Alquimista',
            effectType: 'DAMAGE_OVER_TIME',
            metadata: { damageType: 'MAGICAL' }
        },
        STUN: {
            type: 'STUN',
            name: 'Aturdimiento',
            stacks: 1,
            duration: 1,
            maxDuration: 1,
            potency: 1.0,
            appliedBy: 'warrior002',
            appliedTurn: 2,
            sourceName: 'Guerrero Enemigo',
            effectType: 'ACTION_REDUCTION'
        }
    }
};

const effectsReport = statusSystem.generateEffectsReport(reportTarget);
console.log(effectsReport);

// 8. Demostración: Limpieza de efectos
console.log('\n\n7. LIMPIEZA DE EFECTOS:');
console.log('═'.repeat(60));

const clensingTarget = {
    ...combatants.mage,
    name: 'Lyra (Purificada)',
    currentHealth: 40,
    statusEffects: {
        BURN: { type: 'BURN', name: 'Quemadura', stacks: 2 },
        SLOW: { type: 'SLOW', name: 'Ralentización', stacks: 1 },
        FEAR: { type: 'FEAR', name: 'Miedo', stacks: 1 }
    }
};

console.log('\n✨ Lyra usa habilidad de purificación:\n');

const clearResult = statusSystem.clearAllEffects(clensingTarget);

console.log('✅ EFECTOS LIMPIADOS:');
clearResult.clearedEffects.forEach(effect => {
    console.log(`  • ${effect}`);
});

console.log(`\n📊 Resumen: ${clearResult.totalCleared} efectos limpiados`);
console.log(`🎯 Acciones recuperadas: ${clearResult.actionsAfterClearing}`);

// 9. Conclusiones del sistema
console.log('\n\n8. CONCLUSIONES DEL SISTEMA:');
console.log('═'.repeat(60));

console.log('\n🎯 CARACTERÍSTICAS IMPLEMENTADAS:');
console.log('─'.repeat(40));
console.log('✅ Sistema de múltiples acciones por turno');
console.log('✅ Sangrado progresivo (stacks hasta 5)');
console.log('✅ Aturdimiento que reduce acciones, no turnos completos');
console.log('✅ Congelación que reduce AGI progresivamente (máx 50%)');
console.log('✅ Sistema de resistencias basado en atributos');
console.log('✅ Efectos de duración variable');
console.log('✅ Stacking inteligente (intensidad vs duración)');
console.log('✅ Daño mínimo garantizado de 1 por efecto DoT');
console.log('✅ Reportes detallados y herramientas de análisis');
console.log('✅ Métodos de limpieza y purificación');

console.log('\n⚖️ BALANCE Y DISEÑO:');
console.log('─'.repeat(40));
console.log('• STUN reduce acciones, no inmoviliza completamente');
console.log('• FREEZE reduce AGI gradualmente, no congela totalmente');
console.log('• BLEEDING ignora armadura pero hace daño moderado');
console.log('• Altos atributos = mayor resistencia a efectos');
console.log('• Equipo puede otorgar resistencia adicional');
console.log('• Efectos expiran naturalmente después de su duración');
console.log('• Mínimo 1 acción siempre disponible');

console.log('\n🎮 INTEGRACIÓN CON SISTEMA DE COMBATE:');
console.log('─'.repeat(40));
console.log('1. Fase A (Precisión): Determina si el ataque acierta');
console.log('2. Fase B (Daño): Calcula daño base del ataque');
console.log('3. Fase C (Efectos): Aplica estados alterados basados en el ataque');
console.log('4. Sistema de Turnos: Procesa efectos al inicio de cada turno');
console.log('5. Sistema de Acciones: Efectos modifican acciones disponibles');

console.log('\n✨ DEMOSTRACIÓN COMPLETADA');
console.log('═'.repeat(60));
console.log('\nEl sistema de estados alterados está listo para:');
console.log('• Añadir profundidad táctica al combate');
console.log('• Crear sinergias entre diferentes tipos de ataques');
console.log('• Permitir estrategias de control y desgaste');
console.log('• Integrarse perfectamente con el sistema de múltiples acciones');
console.log('\n¡Sistema listo para producción! 🚀');