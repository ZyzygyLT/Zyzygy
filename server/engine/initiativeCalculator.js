/**
 * Calculadora de Iniciativa
 * Sistema de turnos basado en la fórmula: (AGI × 2) + PER + 2d10
 */

const DiceRoller = require('./diceRoller');

class InitiativeCalculator {
    constructor() {
        this.diceRoller = new DiceRoller();
        this.INITIATIVE_FORMULA = {
            description: "(AGI × 2) + PER + 2d10",
            calculate: (agi, per) => (agi * 2) + per
        };
    }

    /**
     * Calcula la iniciativa para un combatiente
     * @param {Object} combatant - Objeto con atributos del combatiente
     * @param {boolean} rollDice - Si es true, incluye tirada de dados (por defecto true)
     * @returns {Object} Objeto con iniciativa calculada
     */
    calculateInitiative(combatant, rollDice = true) {
        if (!combatant || combatant.agi === undefined || combatant.per === undefined) {
            throw new Error('Combatiente inválido: se requieren atributos AGI y PER');
        }

        // Validar rangos de atributos
        if (combatant.agi < 1 || combatant.agi > 20) {
            console.warn(`Advertencia: AGI=${combatant.agi} fuera del rango común (1-20)`);
        }
        if (combatant.per < 1 || combatant.per > 20) {
            console.warn(`Advertencia: PER=${combatant.per} fuera del rango común (1-20)`);
        }

        const attributeBonus = this.INITIATIVE_FORMULA.calculate(combatant.agi, combatant.per);
        let diceResult = 0;
        let diceRoll = null;

        if (rollDice) {
            diceRoll = this.diceRoller.roll2d10();
            diceResult = diceRoll.total;
        }

        const totalInitiative = attributeBonus + diceResult;

        return {
            combatantId: combatant.id || null,
            combatantName: combatant.name || 'Sin nombre',
            agi: combatant.agi,
            per: combatant.per,
            attributeBonus: attributeBonus,
            diceRoll: diceRoll,
            diceResult: diceResult,
            totalInitiative: totalInitiative,
            timestamp: new Date().toISOString(),
            metadata: combatant.metadata || {}
        };
    }

    /**
     * Calcula iniciativa para múltiples combatientes
     * @param {Array} combatants - Array de combatientes
     * @param {boolean} rollDice - Si es true, incluye tirada de dados
     * @returns {Array} Array de resultados de iniciativa
     */
    calculateMultipleInitiatives(combatants, rollDice = true) {
        if (!Array.isArray(combatants)) {
            throw new Error('Se espera un array de combatientes');
        }

        return combatants.map(combatant => 
            this.calculateInitiative(combatant, rollDice)
        );
    }

    /**
     * Ordena combatientes por iniciativa (mayor a menor)
     * @param {Array} combatants - Array de combatientes con iniciativa calculada
     * @returns {Array} Combatientes ordenados por iniciativa
     */
    sortByInitiative(combatants) {
        if (!Array.isArray(combatants)) {
            throw new Error('Se espera un array de combatientes');
        }

        // Verificar que todos tienen iniciativa calculada
        const invalid = combatants.filter(c => c.totalInitiative === undefined);
        if (invalid.length > 0) {
            throw new Error(`Algunos combatientes no tienen iniciativa calculada: ${invalid.map(c => c.combatantName).join(', ')}`);
        }

        // Ordenar por iniciativa (mayor a menor)
        const sorted = [...combatants].sort((a, b) => {
            // Primero por iniciativa total
            if (b.totalInitiative !== a.totalInitiative) {
                return b.totalInitiative - a.totalInitiative;
            }
            
            // En caso de empate, por bonificación de atributos
            if (b.attributeBonus !== a.attributeBonus) {
                return b.attributeBonus - a.attributeBonus;
            }
            
            // Si persiste el empate, por AGI
            if (b.agi !== a.agi) {
                return b.agi - a.agi;
            }
            
            // Si todo empata, orden alfabético
            return a.combatantName.localeCompare(b.combatantName);
        });

        // Añadir posición en el orden
        return sorted.map((combatant, index) => ({
            ...combatant,
            turnOrder: index + 1,
            isFirst: index === 0,
            isLast: index === sorted.length - 1
        }));
    }

    /**
     * Calcula y ordena iniciativa para un grupo de combatientes
     * @param {Array} combatants - Array de combatientes
     * @returns {Object} Resultado completo de la ronda de iniciativa
     */
    calculateAndSortInitiative(combatants) {
        const initiatives = this.calculateMultipleInitiatives(combatants, true);
        const sorted = this.sortByInitiative(initiatives);
        
        // Calcular estadísticas de la ronda
        const stats = this.calculateRoundStatistics(sorted);
        
        return {
            roundId: this.generateRoundId(),
            timestamp: new Date().toISOString(),
            combatants: sorted,
            statistics: stats,
            turnOrder: sorted.map(c => ({
                order: c.turnOrder,
                name: c.combatantName,
                initiative: c.totalInitiative,
                agi: c.agi,
                per: c.per
            }))
        };
    }

    /**
     * Genera un ID único para la ronda
     * @returns {string} ID de ronda
     */
    generateRoundId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `round_${timestamp}_${random}`;
    }

    /**
     * Calcula estadísticas de una ronda de iniciativa
     * @param {Array} sortedCombatants - Combatientes ordenados
     * @returns {Object} Estadísticas de la ronda
     */
    calculateRoundStatistics(sortedCombatants) {
        if (sortedCombatants.length === 0) {
            return {};
        }

        const initiatives = sortedCombatants.map(c => c.totalInitiative);
        const attributeBonuses = sortedCombatants.map(c => c.attributeBonus);
        const diceResults = sortedCombatants.map(c => c.diceResult);

        const sum = (arr) => arr.reduce((a, b) => a + b, 0);
        const avg = (arr) => sum(arr) / arr.length;

        return {
            totalCombatants: sortedCombatants.length,
            initiativeRange: {
                highest: Math.max(...initiatives),
                lowest: Math.min(...initiatives),
                average: avg(initiatives).toFixed(2)
            },
            attributeBonusRange: {
                highest: Math.max(...attributeBonuses),
                lowest: Math.min(...attributeBonuses),
                average: avg(attributeBonuses).toFixed(2)
            },
            diceResultsRange: {
                highest: Math.max(...diceResults),
                lowest: Math.min(...diceResults),
                average: avg(diceResults).toFixed(2)
            },
            initiativeSpread: Math.max(...initiatives) - Math.min(...initiatives)
        };
    }
}

// Exportar la clase
module.exports = InitiativeCalculator;