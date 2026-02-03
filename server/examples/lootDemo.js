/**
 * Demostración del Generador de Loot
 */

const { LootGenerator, RARITY, LOOT_TABLES } = require('../engine/lootGenerator');

function runDemo() {
    console.log('=== DEMO: GENERADOR DE LOOT ===\n');
    
    const generator = new LootGenerator();
    generator.setDebugMode(true);
    
    // Demo 1: Loot básico de goblin
    console.log('--- DEMO 1: Loot de Goblin (suerte 0) ---');
    const goblinLoot = generator.generateLoot('GOBLIN', 0);
    console.log(`Oro obtenido: ${goblinLoot.gold}`);
    console.log(`Items obtenidos: ${goblinLoot.items.length}`);
    
    goblinLoot.items.forEach((item, index) => {
        console.log(`\n  ${index + 1}. ${item.name} [${item.rarity}]`);
        console.log(`     Tipo: ${item.type}`);
        console.log(`     Valor: ${item.value} oro`);
        console.log(`     Stats:`, item.stats);
        if (item.prefix) console.log(`     Prefijo: ${item.prefix}`);
        if (item.suffix) console.log(`     Sufijo: ${item.suffix}`);
    });
    
    // Demo 2: Loot de jefe con suerte
    console.log('\n--- DEMO 2: Loot de Orc Chieftain (suerte 50) ---');
    const bossLoot = generator.generateLoot('ORC_CHIEFTAIN', 50);
    console.log(`Oro obtenido: ${bossLoot.gold}`);
    
    bossLoot.items.forEach((item, index) => {
        console.log(`\n  ${index + 1}. ${item.name}`);
        console.log(`     Rareza: ${item.rarity} (${item.color})`);
        console.log(`     Stats:`, item.stats);
    });
    
    // Demo 3: Generar 1000 items y analizar distribución
    console.log('\n--- DEMO 3: Análisis de 1000 items ---');
    generator.setSeed(987654321);
    const testItems = generator.generateTestItems(1000);
    const distribution = generator.analyzeRarityDistribution(testItems);
    
    console.log(`Total items generados: ${distribution.total}`);
    console.log('\nDistribución por rareza:');
    Object.entries(distribution.byRarity).forEach(([rarity, count]) => {
        console.log(`  ${rarity}: ${count} items (${distribution.percentages[rarity]})`);
    });
    
    // Demo 4: Comparar stats por rareza
    console.log('\n--- DEMO 4: Stats promedio por rareza ---');
    Object.entries(distribution.averageStats).forEach(([rarity, stats]) => {
        console.log(`\n${rarity}:`);
        Object.entries(stats).forEach(([stat, value]) => {
            console.log(`  ${stat}: ${value}`);
        });
    });
    
    // Demo 5: Efecto de la suerte en la distribución
    console.log('\n--- DEMO 5: Efecto de la suerte ---');
    const luckLevels = [0, 25, 50, 75, 100];
    
    luckLevels.forEach(luck => {
        generator.setSeed(55555 + luck);
        const items = generator.generateTestItems(200);
        const dist = generator.analyzeRarityDistribution(items);
        
        const rarePlus = (
            (dist.byRarity['Raro'] + 
             dist.byRarity['Épico'] + 
             dist.byRarity['Legendario']) / 
            dist.total * 100
        ).toFixed(2);
        
        console.log(`Suerte ${luck}: ${rarePlus}% de items raros o mejores`);
    });
    
    // Demo 6: Item legendario de ejemplo
    console.log('\n--- DEMO 6: Buscando un item legendario ---');
    let legendaryFound = false;
    let attempts = 0;
    
    while (!legendaryFound && attempts < 10000) {
        attempts++;
        generator.setSeed(Date.now() + attempts);
        const items = generator.generateTestItems(10);
        
        const legendary = items.find(item => item.rarity === 'Legendario');
        if (legendary) {
            legendaryFound = true;
            console.log(`¡Encontrado después de ${attempts * 10} items generados!`);
            console.log(`Item: ${legendary.name}`);
            console.log(`Tipo: ${legendary.type}`);
            console.log(`Stats:`, legendary.stats);
            console.log(`Valor: ${legendary.value} oro`);
            
            if (legendary.requirements) {
                console.log(`Requisitos:`, legendary.requirements);
            }
        }
    }
    
    if (!legendaryFound) {
        console.log(`No se encontró legendario después de ${attempts * 10} items`);
    }
    
    console.log('\n=== DEMO COMPLETADA ===');
}

// Ejecutar demo si es llamado directamente
if (require.main === module) {
    runDemo();
}

module.exports = { runDemo };