/**
 * Demostración del Sistema de Combate - Fase A (Precisión)
 */

const CombatResolver = require('../engine/combatResolver');

console.log('⚔️ DEMOSTRACIÓN DEL SISTEMA DE COMBATE - FASE A (PRECISIÓN) ⚔️\n');

// Crear instancia del resolver
const combatResolver = new CombatResolver();

// 1. Definir personajes de ejemplo
const characters = {
    elara: {
        id: 'elara001',
        name: 'Elara la Arquera',
        dexterity: 16,
        perception: 14,
        agility: 15,
        experienceLevel: 6,
        exhaustionLevel: 0,
        woundLevel: 0,
        metadata: { class: 'Ranger', faction: 'Guardianes del Bosque' }
    },
    
    gromm: {
        id: 'gromm001',
        name: 'Gromm el Guerrero',
        dexterity: 12,
        perception: 10,
        agility: 13,
        experienceLevel: 5,
        exhaustionLevel: 1,
        woundLevel: 0,
        metadata: { class: 'Warrior', faction: 'Clan Montaña' }
    },
    
    zarek: {
        id: 'zarek001',
        name: 'Zarek el Mago',
        dexterity: 8,
        perception: 18,
        agility: 9,
        experienceLevel: 7,
        exhaustionLevel: 0,
        woundLevel: 1,
        metadata: { class: 'Wizard', faction: 'Academia Arcana' }
    }
};

// 2. Definir armas y armaduras
const equipment = {
    weapons: {
        longbow: {
            name: 'Arco Largo Élfico',
            type: 'Ranged',
            accuracyBonus: 4,
            weight: 3,
            damage: '1d8+3',
            special: 'Precisión a distancia'
        },
        
        greatsword: {
            name: 'Espadón de Acero',
            type: 'Two-Handed',
            accuracyBonus: 2,
            weight: 8,
            damage: '2d6+4',
            special: 'Corte pesado'
        },
        
        staff: {
            name: 'Báculo Arcano',
            type: 'Magic',
            accuracyBonus: 1,
            weight: 4,
            damage: '1d6+2',
            special: 'Canalización mágica'
        }
    },
    
    armors: {
        leather: {
            name: 'Armadura de Cuero Reforzado',
            type: 'Light',
            defenseBonus: 3,
            weight: 10,
            absorption: 2,
            special: 'Movilidad mejorada'
        },
        
        chainmail: {
            name: 'Cota de Malla',
            type: 'Medium',
            defenseBonus: 5,
            weight: 20,
            absorption: 4,
            special: 'Protección balanceada'
        },
        
        robes: {
            name: 'Túnicas Encantadas',
            type: 'Cloth',
            defenseBonus: 1,
            weight: 2,
            absorption: 1,
            special: 'Resistencia mágica'
        }
    }
};

console.log('1. PERSONAJES Y EQUIPO:');
console.log('═'.repeat(60));

Object.values(characters).forEach(char => {
    console.log(`\n${char.name}`);
    console.log(`  DEX: ${char.dexterity} | PER: ${char.perception} | AGI: ${char.agility}`);
    console.log(`  Clase: ${char.metadata.class} | Nivel: ${char.experienceLevel}`);
});

console.log('\n\n2. SIMULACIÓN DE COMBATE INDIVIDUAL:');
console.log('═'.repeat(60));

// Elara ataca a Gromm
console.log('\n🎯 Elara (con Arco Largo) ataca a Gromm (con Armadura de Cuero):');
const combatResult = combatResolver.resolveAttack(
    characters.elara,
    equipment.weapons.longbow,
    characters.gromm,
    equipment.armors.leather
);

console.log(combatResolver.generateCombatReport(combatResult));

// 3. Simulación masiva de 1000 ataques
console.log('\n\n3. SIMULACIÓN MASIVA (1000 ATAQUES):');
console.log('═'.repeat(60));

console.log('\n📊 Simulando 1000 combates entre Elara y Gromm...');
const simulation = combatResolver.simulateAttacks(
    characters.elara,
    equipment.weapons.longbow,
    characters.gromm,
    equipment.armors.leather,
    1000
);

console.log('\n📈 RESULTADOS ESTADÍSTICOS:');
console.log('─'.repeat(40));
console.log(`• Total de simulaciones: ${simulation.totalSimulations}`);
console.log(`• Tasa de acierto: ${simulation.statistics.hitRate}%`);
console.log(`• Tasa de críticos: ${simulation.statistics.criticalRate}%`);
console.log(`• Tasa de golpes leves: ${simulation.statistics.grazeRate}%`);
console.log(`• Tasa de fallos: ${simulation.statistics.missRate}%`);

console.log('\n📊 DISTRIBUCIÓN DE RESULTADOS:');
console.log('─'.repeat(40));
console.log(`• Críticos: ${simulation.distribution.critical} (${simulation.statistics.criticalRate}%)`);
console.log(`• Golpes sólidos: ${simulation.distribution.solidHit} (${(simulation.hits - simulation.criticals - simulation.grazes) / simulation.totalSimulations * 100}%)`);
console.log(`• Golpes leves: ${simulation.distribution.graze} (${simulation.statistics.grazeRate}%)`);
console.log(`• Fallos: ${simulation.distribution.miss} (${simulation.statistics.missRate}%)`);

console.log('\n📐 ESTADÍSTICAS DETALLADAS:');
console.log('─'.repeat(40));
console.log(`• Ataque promedio: ${simulation.statistics.averageAttackRoll.toFixed(2)}`);
console.log(`• Defensa promedio: ${simulation.statistics.averageDefenseRoll.toFixed(2)}`);
console.log(`• Diferencia promedio: ${simulation.statistics.averageDifference.toFixed(2)}`);
console.log(`• Ataque mínimo/máximo: ${simulation.statistics.minAttackRoll.toFixed(1)} / ${simulation.statistics.maxAttackRoll.toFixed(1)}`);
console.log(`• Defensa mínima/máxima: ${simulation.statistics.minDefenseRoll.toFixed(1)} / ${simulation.statistics.maxDefenseRoll.toFixed(1)}`);

console.log('\n🎲 ANÁLISIS DE PROBABILIDAD:');
console.log('─'.repeat(40));
console.log(`• Intervalo de confianza (95%): ${simulation.probabilityAnalysis.confidenceInterval95}`);
console.log(`• Margen de error: ${simulation.probabilityAnalysis.marginOfError}`);
console.log(`• Potencia estadística: ${simulation.probabilityAnalysis.statisticalPower}`);
console.log(`• Tamaño de muestra recomendado: ${simulation.probabilityAnalysis.recommendedSampleSize}`);

// 4. Comparación de diferentes escenarios
console.log('\n\n4. COMPARACIÓN DE ESCENARIOS:');
console.log('═'.repeat(60));

const scenarios = [
    { name: 'Elara vs Gromm', attacker: characters.elara, defender: characters.gromm, weapon: equipment.weapons.longbow, armor: equipment.armors.leather },
    { name: 'Gromm vs Zarek', attacker: characters.gromm, defender: characters.zarek, weapon: equipment.weapons.greatsword, armor: equipment.armors.robes },
    { name: 'Zarek vs Elara', attacker: characters.zarek, defender: characters.elara, weapon: equipment.weapons.staff, armor: equipment.armors.leather }
];

console.log('\nSimulando 500 ataques por escenario...\n');

scenarios.forEach((scenario, index) => {
    const sim = combatResolver.simulateAttacks(
        scenario.attacker,
        scenario.weapon,
        scenario.defender,
        scenario.armor,
        500
    );
    
    console.log(`⚔️ ${scenario.name}:`);
    console.log(`  ${scenario.attacker.name} (${scenario.weapon.name})`);
    console.log(`  vs ${scenario.defender.name} (${scenario.armor.name})`);
    console.log(`  Acierto: ${sim.statistics.hitRate}% | Críticos: ${sim.statistics.criticalRate}%`);
    console.log(`  Ataque prom: ${sim.statistics.averageAttackRoll.toFixed(1)}`);
    console.log(`  Defensa prom: ${sim.statistics.averageDefenseRoll.toFixed(1)}`);
    console.log();
});

// 5. Análisis de sensibilidad
console.log('\n\n5. ANÁLISIS DE SENSIBILIDAD (Impacto de atributos):');
console.log('═'.repeat(60));

console.log('\nVariando DEX del atacante (misma arma, mismo defensor):');
const baseAttacker = { ...characters.elara, name: 'Base' };
const defender = characters.gromm;
const weapon = equipment.weapons.longbow;
const armor = equipment.armors.leather;

for (let dex = 10; dex <= 20; dex += 2) {
    const testAttacker = { ...baseAttacker, dexterity: dex, name: `DEX ${dex}` };
    const sim = combatResolver.simulateAttacks(testAttacker, weapon, defender, armor, 300);
    
    console.log(`  DEX ${dex}: ${sim.statistics.hitRate}% de acierto | Ataque prom: ${sim.statistics.averageAttackRoll.toFixed(1)}`);
}

console.log('\n\n✅ DEMOSTRACIÓN COMPLETADA');
console.log('═'.repeat(60));
console.log('\nEl sistema de combate calcula precisión usando:');
console.log('• Ataque: (DEX × 0.8) + (PER × 0.4) + Bono_Arma + 2d10 - (Peso × 0.1)');
console.log('• Defensa: (AGI × 1.0) + (PER × 0.2) + 2d10');
console.log('• Resultado: Hit si Atk > Def, Critical si diferencia ≥ 15');
console.log('\nListo para integrar con Fase B (Daño) y Fase C (Efectos)!');