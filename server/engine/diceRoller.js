/**
 * Sistema de Dados Gaussiano 2d10
 * Este módulo implementa un sistema de tirada de dados con distribución gaussiana
 * usando dos dados de 10 caras (2d10).
 */

class DiceRoller {
    constructor() {
        this.MIN_RESULT = 2;
        this.MAX_RESULT = 20;
        this.DIE_SIDES = 10;
    }

    /**
     * Lanza un solo dado de 10 caras (1d10)
     * @returns {number} Resultado entre 1 y 10
     */
    roll1d10() {
        return Math.floor(Math.random() * this.DIE_SIDES) + 1;
    }

    /**
     * Lanza dos dados de 10 caras (2d10)
     * @returns {Object} Objeto con los resultados individuales y el total
     */
    roll2d10() {
        const die1 = this.roll1d10();
        const die2 = this.roll1d10();
        const total = die1 + die2;
        
        return {
            die1: die1,
            die2: die2,
            total: total,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Lanza 2d10 con modificadores aplicados
     * @param {number} baseMod - Modificador base a aplicar al resultado
     * @param {Array} additionalMods - Array de modificadores adicionales (opcional)
     * @returns {Object} Objeto con resultados y modificadores aplicados
     */
    roll2d10WithMods(baseMod = 0, additionalMods = []) {
        const roll = this.roll2d10();
        const additionalModsTotal = additionalMods.reduce((sum, mod) => sum + mod, 0);
        const totalMod = baseMod + additionalModsTotal;
        const finalResult = roll.total + totalMod;
        
        return {
            ...roll,
            baseMod: baseMod,
            additionalMods: additionalMods,
            totalModifier: totalMod,
            finalResult: finalResult,
            isCriticalSuccess: this.isCriticalSuccess(roll.die1, roll.die2),
            isCriticalFailure: this.isCriticalFailure(roll.die1, roll.die2)
        };
    }

    /**
     * Verifica si es un éxito crítico (ambos dados son 10)
     * @param {number} die1 - Valor del primer dado
     * @param {number} die2 - Valor del segundo dado
     * @returns {boolean}
     */
    isCriticalSuccess(die1, die2) {
        return die1 === 10 && die2 === 10;
    }

    /**
     * Verifica si es un fracaso crítico (ambos dados son 1)
     * @param {number} die1 - Valor del primer dado
     * @param {number} die2 - Valor del segundo dado
     * @returns {boolean}
     */
    isCriticalFailure(die1, die2) {
        return die1 === 1 && die2 === 1;
    }

    /**
     * Realiza múltiples tiradas para análisis estadístico
     * @param {number} numberOfRolls - Número de tiradas a realizar
     * @returns {Array} Array con los resultados de todas las tiradas
     */
    massRoll(numberOfRolls = 1000) {
        const results = [];
        for (let i = 0; i < numberOfRolls; i++) {
            results.push(this.roll2d10().total);
        }
        return results;
    }

    /**
     * Calcula estadísticas de una serie de tiradas
     * @param {Array} rolls - Array de resultados de tiradas
     * @returns {Object} Objeto con estadísticas
     */
    calculateStatistics(rolls) {
        const sum = rolls.reduce((acc, val) => acc + val, 0);
        const mean = sum / rolls.length;
        
        const squaredDiffs = rolls.map(val => Math.pow(val - mean, 2));
        const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / rolls.length;
        const stdDev = Math.sqrt(variance);
        
        // Calcular distribución de frecuencias
        const frequency = {};
        for (let i = this.MIN_RESULT; i <= this.MAX_RESULT; i++) {
            frequency[i] = 0;
        }
        
        rolls.forEach(roll => {
            frequency[roll] = (frequency[roll] || 0) + 1;
        });
        
        return {
            totalRolls: rolls.length,
            mean: mean,
            variance: variance,
            standardDeviation: stdDev,
            min: Math.min(...rolls),
            max: Math.max(...rolls),
            frequency: frequency,
            probabilityDistribution: Object.keys(frequency).reduce((acc, key) => {
                acc[key] = (frequency[key] / rolls.length) * 100;
                return acc;
            }, {})
        };
    }
}

// Exportar la clase
module.exports = DiceRoller;