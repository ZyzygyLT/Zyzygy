/**
 * Tests para el Generador de Loot
 */

const { LootGenerator, RARITY, ITEM_TYPES } = require('../../server/engine/lootGenerator');

describe('LootGenerator', () => {
    let generator;

    beforeEach(() => {
        generator = new LootGenerator();
        // Usar semilla para resultados reproducibles en tests
        generator.setSeed(12345);
    });

    describe('Generación de rareza', () => {
        test('Determina rareza según distribución esperada', () => {
            const iterations = 10000;
            const rarityCounts = {};
            
            // Inicializar contadores
            Object.values(RARITY).forEach(rarity => {
                rarityCounts[rarity.name] = 0;
            });
            
            // Generar muchas rarezas
            for (let i = 0; i < iterations; i++) {
                const rarity = generator.determineRarity(0);
                rarityCounts[rarity.name]++;
            }
            
            // Calcular porcentajes
            const percentages = {};
            Object.entries(rarityCounts).forEach(([rarity, count]) => {
                percentages[rarity] = (count / iterations * 100).toFixed(2);
            });
            
            // Verificar que se generaron todas las rarezas
            Object.values(RARITY).forEach(rarity => {
                expect(rarityCounts[rarity.name]).toBeGreaterThan(0);
            });
            
            // Común debería ser la más frecuente
            expect(rarityCounts['Común']).toBeGreaterThan(rarityCounts['Poco Común']);
            
            console.log('Distribución de rareza (0 luck):', percentages);
        });

        test('La suerte aumenta probabilidad de rarezas más altas', () => {
            const iterations = 5000;
            let highRarityWithLuck = 0;
            let highRarityWithoutLuck = 0;
            
            // Sin suerte
            for (let i = 0; i < iterations; i++) {
                const rarity = generator.determineRarity(0);
                if (rarity.name === 'Raro' || rarity.name === 'Épico' || rarity.name === 'Legendario') {
                    highRarityWithoutLuck++;
                }
            }
            
            // Con suerte (50)
            for (let i = 0; i < iterations; i++) {
                const rarity = generator.determineRarity(50);
                if (rarity.name === 'Raro' || rarity.name === 'Épico' || rarity.name === 'Legendario') {
                    highRarityWithLuck++;
                }
            }
            
            const percentWithout = (highRarityWithoutLuck / iterations * 100).toFixed(2);
            const percentWith = (highRarityWithLuck / iterations * 100).toFixed(2);
            
            console.log(`Rarezas altas sin suerte: ${percentWithout}%`);
            console.log(`Rarezas altas con suerte (50): ${percentWith}%`);
            
            // La suerte debería aumentar la probabilidad
            expect(parseFloat(percentWith)).toBeGreaterThan(parseFloat(percentWithout));
        });
    });

    describe('Generación de items', () => {
        test('Genera item con estructura válida', () => {
            const item = generator.generateTestItems(1, ITEM_TYPES.WEAPON)[0];
            
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('name');
            expect(item).toHaveProperty('type', 'weapon');
            expect(item).toHaveProperty('rarity');
            expect(item).toHaveProperty('stats');
            expect(item).toHaveProperty('value');
            expect(item).toHaveProperty('color');
            
            // Verificar que los stats sean números
            Object.values(item.stats).forEach(value => {
                expect(typeof value).toBe('number');
            });
        });

        test('Los items legendarios tienen stats más altos', () => {
            const items = generator.generateTestItems(1000, ITEM_TYPES.WEAPON);
            
            const legendaryItems = items.filter(item => item.rarity === 'Legendario');
            const commonItems = items.filter(item => item.rarity === 'Común');
            
            if (legendaryItems.length > 0 && commonItems.length > 0) {
                // Calcular promedio de ataque para cada rareza
                const avgLegendaryAttack = legendaryItems.reduce((sum, item) => sum + (item.stats.attack || 0), 0) / legendaryItems.length;
                const avgCommonAttack = commonItems.reduce((sum, item) => sum + (item.stats.attack || 0), 0) / commonItems.length;
                
                console.log(`Ataque promedio - Común: ${avgCommonAttack.toFixed(2)}, Legendario: ${avgLegendaryAttack.toFixed(2)}`);
                
                // Legendarios deberían tener stats más altos
                expect(avgLegendaryAttack).toBeGreaterThan(avgCommonAttack);
            }
        });

        test('Los items pueden tener prefijos y sufijos', () => {
            const items = generator.generateTestItems(100, ITEM_TYPES.WEAPON);
            
            let hasPrefix = false;
            let hasSuffix = false;
            
            for (const item of items) {
                if (item.prefix) hasPrefix = true;
                if (item.suffix) hasSuffix = true;
                if (hasPrefix && hasSuffix) break;
            }
            
            expect(hasPrefix).toBe(true);
            expect(hasSuffix).toBe(true);
            
            // Verificar que los nombres incluyan prefijos/sufijos
            const prefixedItem = items.find(item => item.prefix);
            if (prefixedItem) {
                expect(prefixedItem.name).toContain(prefixedItem.prefix);
            }
            
            const suffixedItem = items.find(item => item.suffix);
            if (suffixedItem) {
                expect(suffixedItem.name).toContain(suffixedItem.suffix);
            }
        });
    });

    describe('Generación de loot completo', () => {
        test('Genera loot desde tabla GOBLIN', () => {
            const loot = generator.generateLoot('GOBLIN', 0);
            
            expect(loot).toHaveProperty('table', 'GOBLIN');
            expect(loot).toHaveProperty('items');
            expect(loot).toHaveProperty('gold');
            expect(loot).toHaveProperty('luckUsed', 0);
            
            // Verificar que el oro está en el rango esperado
            expect(loot.gold).toBeGreaterThanOrEqual(1);
            expect(loot.gold).toBeLessThanOrEqual(5 * 1.25); // Con margen para aleatoriedad
            
            // Verificar cantidad de items
            expect(loot.items.length).toBeGreaterThanOrEqual(1);
            expect(loot.items.length).toBeLessThanOrEqual(2);
        });

        test('La suerte aumenta cantidad y calidad de loot', () => {
            const lootWithoutLuck = generator.generateLoot('CHEST_COMMON', 0);
            const lootWithLuck = generator.generateLoot('CHEST_COMMON', 100);
            
            // Resetear generador para comparación justa
            generator.setSeed(12345);
            const lootWithoutLuck2 = generator.generateLoot('CHEST_COMMON', 0);
            
            // Con suerte debería tener al menos tanto oro como sin suerte
            expect(lootWithLuck.gold).toBeGreaterThanOrEqual(lootWithoutLuck2.gold);
            
            // Con suerte podría tener más items (pero no garantizado)
            console.log(`Items sin suerte: ${lootWithoutLuck.items.length}, con suerte: ${lootWithLuck.items.length}`);
        });
    });

    describe('Distribución de rareza (1000 items)', () => {
        test('Genera 1000 items y verifica distribución', () => {
            const items = generator.generateTestItems(1000, ITEM_TYPES.WEAPON);
            
            expect(items).toHaveLength(1000);
            
            // Analizar distribución
            const distribution = generator.analyzeRarityDistribution(items);
            
            console.log('\n=== DISTRIBUCIÓN DE RAREZA (1000 items) ===');
            console.log('Total items:', distribution.total);
            console.log('\nPor rareza:');
            Object.entries(distribution.byRarity).forEach(([rarity, count]) => {
                console.log(`  ${rarity}: ${count} (${distribution.percentages[rarity]})`);
            });
            
            // Verificar que Común es la más frecuente
            expect(distribution.byRarity['Común']).toBeGreaterThan(distribution.byRarity['Poco Común']);
            expect(distribution.byRarity['Común']).toBeGreaterThan(distribution.byRarity['Raro']);
            
            // Verificar que Legendario es el más raro
            expect(distribution.byRarity['Legendario']).toBeLessThan(distribution.byRarity['Épico']);
            
            // Stats promedio deberían aumentar con rareza
            if (distribution.averageStats['Común'] && distribution.averageStats['Legendario']) {
                const commonAttack = distribution.averageStats['Común'].attack || 0;
                const legendaryAttack = distribution.averageStats['Legendario'].attack || 0;
                
                expect(legendaryAttack).toBeGreaterThan(commonAttack);
                console.log(`\nAtaque promedio - Común: ${commonAttack}, Legendario: ${legendaryAttack}`);
            }
        });

        test('Distribución con diferentes niveles de suerte', () => {
            const luckLevels = [0, 25, 50, 75, 100];
            const results = {};
            
            for (const luck of luckLevels) {
                generator.setSeed(12345 + luck); // Diferente semilla para cada test
                const items = generator.generateTestItems(500, ITEM_TYPES.WEAPON);
                const distribution = generator.analyzeRarityDistribution(items);
                
                results[luck] = {
                    common: distribution.percentages['Común'],
                    rarePlus: (
                        (distribution.byRarity['Raro'] + 
                         distribution.byRarity['Épico'] + 
                         distribution.byRarity['Legendario']) / 
                        distribution.total * 100
                    ).toFixed(2) + '%'
                };
            }
            
            console.log('\n=== DISTRIBUCIÓN POR SUERTE ===');
            Object.entries(results).forEach(([luck, data]) => {
                console.log(`Suerte ${luck}: Común ${data.common}, Raro+ ${data.rarePlus}`);
            });
            
            // Con más suerte, debería haber menos comunes y más raros
            const commonAt0 = parseFloat(results[0].common);
            const commonAt100 = parseFloat(results[100].common);
            expect(commonAt100).toBeLessThan(commonAt0);
        });
    });

    describe('Generación reproducible con semilla', () => {
        test('Misma semilla produce mismos resultados', () => {
            generator.setSeed(999);
            const loot1 = generator.generateLoot('GOBLIN', 0);
            
            // Reiniciar con misma semilla
            const generator2 = new LootGenerator();
            generator2.setSeed(999);
            const loot2 = generator2.generateLoot('GOBLIN', 0);
            
            // Deberían ser idénticos
            expect(loot1.gold).toBe(loot2.gold);
            expect(loot1.items.length).toBe(loot2.items.length);
            
            // Verificar que los items tienen los mismos nombres
            for (let i = 0; i < loot1.items.length; i++) {
                expect(loot1.items[i].name).toBe(loot2.items[i].name);
                expect(loot1.items[i].rarity).toBe(loot2.items[i].rarity);
            }
        });

        test('Diferente semilla produce diferentes resultados', () => {
            generator.setSeed(111);
            const loot1 = generator.generateLoot('GOBLIN', 0);
            
            generator.setSeed(222);
            const loot2 = generator.generateLoot('GOBLIN', 0);
            
            // Probablemente diferentes (no garantizado pero muy probable)
            expect(loot1.gold !== loot2.gold || loot1.items.length !== loot2.items.length).toBe(true);
        });
    });

    describe('Análisis de stats', () => {
        test('Calcula stats promedio correctamente', () => {
            const testItems = [
                {
                    name: 'Test 1',
                    rarity: 'Común',
                    stats: { attack: 10, defense: 5 }
                },
                {
                    name: 'Test 2',
                    rarity: 'Común',
                    stats: { attack: 20, defense: 10 }
                },
                {
                    name: 'Test 3',
                    rarity: 'Raro',
                    stats: { attack: 30, magic_power: 15 }
                }
            ];
            
            const commonItems = testItems.filter(item => item.rarity === 'Común');
            const averages = generator.calculateAverageStats(commonItems);
            
            expect(averages.attack).toBe(15); // (10 + 20) / 2
            expect(averages.defense).toBe(7.5); // (5 + 10) / 2
            expect(averages.magic_power).toBeUndefined();
        });
    });

    describe('Reporte de loot', () => {
        test('Genera reporte de distribución', () => {
            const report = generator.generateLootReport('GOBLIN', 100, [0, 50]);
            
            expect(report.tableId).toBe('GOBLIN');
            expect(report.iterations).toBe(100);
            expect(report.results).toHaveProperty('0');
            expect(report.results).toHaveProperty('50');
            
            // Verificar estructura del reporte
            const result0 = report.results[0];
            expect(result0).toHaveProperty('itemsGenerated');
            expect(result0).toHaveProperty('averageItemsPerDrop');
            expect(result0).toHaveProperty('averageGold');
            expect(result0).toHaveProperty('distribution');
            
            console.log('\n=== REPORTE DE LOOT ===');
            console.log(`Tabla: ${report.tableName}`);
            console.log(`Iteraciones: ${report.iterations}`);
            
            Object.entries(report.results).forEach(([luck, data]) => {
                console.log(`\nSuerte ${luck}:`);
                console.log(`  Items generados: ${data.itemsGenerated}`);
                console.log(`  Items por drop: ${data.averageItemsPerDrop}`);
                console.log(`  Oro promedio: ${data.averageGold}`);
            });
        });
    });
});