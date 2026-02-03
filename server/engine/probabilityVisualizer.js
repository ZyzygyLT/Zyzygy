/**
 * Visualizador de Probabilidades para Sistema 2d10
 * Genera gráficos ASCII y estadísticas de distribución
 */

const DiceRoller = require('./diceRoller');

class ProbabilityVisualizer {
    constructor() {
        // diceRoller may export a class or an instance — handle both
        this.diceRoller = (typeof DiceRoller === 'function') ? new DiceRoller() : DiceRoller;
        this.BAR_WIDTH = 40;
    }

    /**
     * Genera un histograma ASCII de la distribución
     * @param {number} sampleSize - Tamaño de la muestra
     * @returns {string} Histograma en formato ASCII
     */
    generateHistogram(sampleSize = 10000) {
        const rolls = this.diceRoller.massRoll(sampleSize);
        const stats = this.diceRoller.calculateStatistics(rolls);
        
        let histogram = '═'.repeat(60) + '\n';
        histogram += `HISTOGRAMA DE DISTRIBUCIÓN 2d10 (${sampleSize} tiradas)\n`;
        histogram += '═'.repeat(60) + '\n\n';
        histogram += `Media: ${stats.mean.toFixed(2)} | `;
        histogram += `Desv. Estándar: ${stats.standardDeviation.toFixed(2)} | `;
        histogram += `Rango: ${stats.min}-${stats.max}\n\n`;
        
        // Encontrar la frecuencia máxima para escalar
        const maxFreq = Math.max(...Object.values(stats.frequency));
        
        // Generar barras para cada resultado posible
        for (let i = 2; i <= 20; i++) {
            const freq = stats.frequency[i] || 0;
            const percentage = ((freq / sampleSize) * 100).toFixed(1);
            const barLength = Math.round((freq / maxFreq) * this.BAR_WIDTH);
            const bar = '█'.repeat(barLength);
            
            // Formatear número con padding
            const resultLabel = i.toString().padStart(2, ' ');
            const freqLabel = freq.toString().padStart(5, ' ');
            const percLabel = percentage.padStart(5, ' ');
            
            histogram += `${resultLabel}: ${bar} ${freqLabel} (${percLabel}%)\n`;
        }
        
        histogram += '\n' + '═'.repeat(60) + '\n';
        histogram += 'LEYENDA: █ = Frecuencia relativa\n';
        histogram += '═'.repeat(60);
        
        return histogram;
    }

    /**
     * Genera un histograma en formato SVG y devuelve el string SVG
     * @param {number} sampleSize
     * @returns {string} SVG markup
     */
    generateHistogramSVG(sampleSize = 20000) {
        const rolls = this.diceRoller.massRoll(sampleSize);
        const stats = this.diceRoller.calculateStatistics(rolls);

        const results = [];
        for (let i = 2; i <= 20; i++) {
            results.push({ value: i, freq: stats.frequency[i] || 0 });
        }

        const width = 800;
        const height = 360;
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        const maxFreq = Math.max(...results.map(r => r.freq), 1);
        const barWidth = Math.floor(chartWidth / results.length) - 4;

        let svg = `<?xml version="1.0" encoding="UTF-8"?>`;
        svg += `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
        svg += `<rect width="100%" height="100%" fill="#071022"/>`;

        // Title
        svg += `<text x="${padding}" y="20" fill="#dbeafe" font-family="sans-serif" font-size="14">2d10 Distribution (n=${sampleSize}) — Mean: ${stats.mean.toFixed(2)}</text>`;

        // Bars
        results.forEach((r, idx) => {
            const x = padding + idx * (barWidth + 4);
            const barHeight = Math.round((r.freq / maxFreq) * chartHeight);
            const y = padding + (chartHeight - barHeight);
            svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="#7dd3fc"/>`;
            svg += `<text x="${x + barWidth / 2}" y="${height - padding + 14}" fill="#cbd5e1" font-size="11" font-family="sans-serif" text-anchor="middle">${r.value}</text>`;
        });

        // Y axis labels (simple)
        for (let i = 0; i <= 4; i++) {
            const yv = padding + (chartHeight * i) / 4;
            const val = Math.round(((4 - i) / 4) * maxFreq);
            svg += `<text x="8" y="${yv + 4}" fill="#94a3b8" font-size="11" font-family="sans-serif">${val}</text>`;
        }

        svg += `</svg>`;
        return svg;
    }

    /**
     * Genera un análisis detallado de probabilidades
     * @returns {Object} Análisis de probabilidades
     */
    generateProbabilityAnalysis(sampleSize = 100000) {
        const rolls = this.diceRoller.massRoll(sampleSize);
        const stats = this.diceRoller.calculateStatistics(rolls);
        
        // Calcular probabilidades acumulativas
        const cumulativeProb = {};
        let cumulative = 0;
        for (let i = 2; i <= 20; i++) {
            cumulative += stats.probabilityDistribution[i];
            cumulativeProb[i] = cumulative;
        }
        
        // Calcular probabilidades de éxito con diferentes dificultades
        const difficultyLevels = {
            'Muy Fácil': 6,
            'Fácil': 9,
            'Moderado': 12,
            'Difícil': 15,
            'Muy Difícil': 18,
            'Casi Imposible': 20
        };
        
        const successProbabilities = {};
        Object.entries(difficultyLevels).forEach(([level, target]) => {
            let successRate = 0;
            for (let i = target; i <= 20; i++) {
                successRate += stats.probabilityDistribution[i];
            }
            successProbabilities[level] = successRate.toFixed(2);
        });
        
        // Calcular probabilidad de críticos
        const criticalSuccessProb = (stats.frequency[20] / sampleSize * 100).toFixed(4);
        const criticalFailureProb = (stats.frequency[2] / sampleSize * 100).toFixed(4);
        
        return {
            sampleSize: sampleSize,
            basicStats: {
                mean: stats.mean.toFixed(3),
                median: this.calculateMedian(rolls).toFixed(3),
                mode: this.calculateMode(stats.frequency),
                standardDeviation: stats.standardDeviation.toFixed(3),
                variance: stats.variance.toFixed(3)
            },
            distribution: stats.probabilityDistribution,
            cumulativeProbabilities: cumulativeProb,
            successProbabilities: successProbabilities,
            criticalProbabilities: {
                criticalSuccess: criticalSuccessProb,
                criticalFailure: criticalFailureProb
            },
            distributionShape: this.analyzeDistributionShape(stats)
        };
    }

    /**
     * Calcula la mediana de los resultados
     * @param {Array} rolls - Array de resultados
     * @returns {number} Mediana
     */
    calculateMedian(rolls) {
        const sorted = [...rolls].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        
        if (sorted.length % 2 === 0) {
            return (sorted[mid - 1] + sorted[mid]) / 2;
        }
        return sorted[mid];
    }

    /**
     * Calcula la moda de los resultados
     * @param {Object} frequency - Objeto de frecuencias
     * @returns {number} Moda
     */
    calculateMode(frequency) {
        let maxFreq = 0;
        let mode = null;
        
        for (const [result, freq] of Object.entries(frequency)) {
            if (freq > maxFreq) {
                maxFreq = freq;
                mode = parseInt(result);
            }
        }
        
        return mode;
    }

    /**
     * Analiza la forma de la distribución
     * @param {Object} stats - Estadísticas
     * @returns {string} Descripción de la forma
     */
    analyzeDistributionShape(stats) {
        const skewness = this.calculateSkewness(stats);
        
        if (skewness < -0.5) return 'Sesgada a la izquierda';
        if (skewness > 0.5) return 'Sesgada a la derecha';
        if (Math.abs(skewness) < 0.5) return 'Simétrica (normal)';
        return 'Distribución uniforme';
    }

    /**
     * Calcula el sesgo de la distribución
     * @param {Object} stats - Estadísticas
     * @returns {number} Coeficiente de sesgo
     */
    calculateSkewness(stats) {
        // Implementación simplificada del coeficiente de sesgo
        const n = stats.totalRolls;
        let sumCubedDeviations = 0;
        
        for (const [result, freq] of Object.entries(stats.frequency)) {
            const deviation = parseInt(result) - stats.mean;
            sumCubedDeviations += freq * Math.pow(deviation, 3);
        }
        
        return sumCubedDeviations / (n * Math.pow(stats.standardDeviation, 3));
    }

    /**
     * Genera un reporte completo en formato legible
     * @returns {string} Reporte formateado
     */
    generateFullReport() {
        const analysis = this.generateProbabilityAnalysis(50000);
        const histogram = this.generateHistogram(10000);
        
        let report = '═'.repeat(70) + '\n';
        report += 'ANÁLISIS COMPLETO DE PROBABILIDADES - SISTEMA 2d10 GAUSSIANO\n';
        report += '═'.repeat(70) + '\n\n';
        
        report += '📊 ESTADÍSTICAS BÁSICAS:\n';
        report += '─'.repeat(40) + '\n';
        report += `• Muestra analizada: ${analysis.sampleSize.toLocaleString()} tiradas\n`;
        report += `• Media: ${analysis.basicStats.mean}\n`;
        report += `• Mediana: ${analysis.basicStats.median}\n`;
        report += `• Moda: ${analysis.basicStats.mode}\n`;
        report += `• Desviación estándar: ${analysis.basicStats.standardDeviation}\n`;
        report += `• Forma: ${analysis.distributionShape}\n\n`;
        
        report += '🎯 PROBABILIDADES DE ÉXITO:\n';
        report += '─'.repeat(40) + '\n';
        Object.entries(analysis.successProbabilities).forEach(([level, prob]) => {
            report += `• ${level.padEnd(15)}: ${prob}% de éxito\n`;
        });
        
        report += '\n⚡ PROBABILIDADES CRÍTICAS:\n';
        report += '─'.repeat(40) + '\n';
        report += `• Éxito crítico (20): ${analysis.criticalProbabilities.criticalSuccess}%\n`;
        report += `• Fracaso crítico (2): ${analysis.criticalProbabilities.criticalFailure}%\n\n`;
        
        report += '📈 DISTRIBUCIÓN DE PROBABILIDADES:\n';
        report += '─'.repeat(40) + '\n';
        report += 'Resultado | Probabilidad | Acumulativo\n';
        report += '──────────┼──────────────┼────────────\n';
        
        for (let i = 2; i <= 20; i++) {
            const prob = analysis.distribution[i].toFixed(2);
            const cumProb = analysis.cumulativeProbabilities[i].toFixed(2);
            report += `    ${i.toString().padStart(2)}    |    ${prob.padStart(5)}%    |    ${cumProb.padStart(5)}%\n`;
        }
        
        report += '\n' + histogram;
        
        return report;
    }
}

// Exportar una instancia singleton
module.exports = new ProbabilityVisualizer();