/**
 * Visualizador de Iniciativa
 * Genera gráficos y análisis del sistema de iniciativa: (AGI × 2) + PER + 2d10
 */

const InitiativeCalculator = require('./initiativeCalculator');

class InitiativeVisualizer {
    constructor() {
        this.calculator = new InitiativeCalculator();
        this.BAR_WIDTH = 40;
    }

    /**
     * Genera un histograma SVG de la distribución de iniciativa
     * @param {Array} combatants - Array de combatientes con agi y per
     * @param {number} samples - Número de simulaciones por combatiente
     * @returns {string} SVG markup
     */
    generateInitiativeHistogramSVG(combatants, samples = 1000) {
        if (!combatants || combatants.length === 0) {
            combatants = [
                { name: 'Guerrero', agi: 12, per: 10 },
                { name: 'Ladrón', agi: 16, per: 14 },
                { name: 'Mago', agi: 8, per: 15 },
                { name: 'Paladín', agi: 10, per: 12 }
            ];
        }

        const results = [];
        combatants.forEach(comb => {
            let total = 0;
            for (let i = 0; i < samples; i++) {
                const init = this.calculator.calculateInitiative(comb, true);
                total += init.totalInitiative;
            }
            const avg = total / samples;
            results.push({ name: comb.name, agi: comb.agi, per: comb.per, avgInit: avg });
        });

        const width = 800;
        const height = 400;
        const padding = 60;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        const maxInit = Math.max(...results.map(r => r.avgInit), 50);
        const barWidth = Math.floor(chartWidth / results.length) - 8;

        let svg = `<?xml version="1.0" encoding="UTF-8"?>`;
        svg += `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
        svg += `<rect width="100%" height="100%" fill="#071022"/>`;

        // Title
        svg += `<text x="${padding}" y="25" fill="#dbeafe" font-family="sans-serif" font-size="16" font-weight="bold">Initiative Distribution (AGI×2 + PER + 2d10)</text>`;

        // Bars
        results.forEach((r, idx) => {
            const x = padding + idx * (barWidth + 8);
            const barHeight = Math.round((r.avgInit / maxInit) * chartHeight);
            const y = padding + (chartHeight - barHeight);
            
            // Color gradient by class
            const colors = ['#fbbf24', '#ec4899', '#a78bfa', '#34d399'];
            const color = colors[idx % colors.length];
            
            svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}"/>`;
            svg += `<text x="${x + barWidth / 2}" y="${height - padding + 20}" fill="#cbd5e1" font-size="12" font-family="sans-serif" text-anchor="middle" font-weight="bold">${r.name}</text>`;
            svg += `<text x="${x + barWidth / 2}" y="${y - 8}" fill="#dbeafe" font-size="11" font-family="sans-serif" text-anchor="middle">${r.avgInit.toFixed(1)}</text>`;
        });

        // Y axis labels
        const steps = 5;
        for (let i = 0; i <= steps; i++) {
            const yv = padding + (chartHeight * i) / steps;
            const val = Math.round(((steps - i) / steps) * maxInit);
            svg += `<text x="45" y="${yv + 4}" fill="#94a3b8" font-size="11" font-family="sans-serif" text-anchor="end">${val}</text>`;
            svg += `<line x1="50" y1="${yv}" x2="${width - padding}" y2="${yv}" stroke="#1e293b" stroke-width="0.5"/>`;
        }

        // Y axis line
        svg += `<line x1="${padding}" y1="${padding}" x2="${padding}" y2="${padding + chartHeight}" stroke="#64748b" stroke-width="2"/>`;
        // X axis line
        svg += `<line x1="${padding}" y1="${padding + chartHeight}" x2="${width - padding}" y2="${padding + chartHeight}" stroke="#64748b" stroke-width="2"/>`;

        svg += `</svg>`;
        return svg;
    }

    /**
     * Genera un reporte de análisis de iniciativa
     * @param {Array} combatants - Array de combatientes
     * @returns {string} Reporte formateado
     */
    generateInitiativeReport(combatants) {
        if (!combatants || combatants.length === 0) {
            combatants = [
                { name: 'Guerrero', agi: 12, per: 10 },
                { name: 'Ladrón', agi: 16, per: 14 },
                { name: 'Mago', agi: 8, per: 15 },
                { name: 'Paladín', agi: 10, per: 12 }
            ];
        }

        let report = '═'.repeat(70) + '\n';
        report += 'ANÁLISIS DE INICIATIVA - SISTEMA D&D 5e\n';
        report += '═'.repeat(70) + '\n\n';

        report += '🎲 FÓRMULA: (AGI × 2) + PER + 2d10\n';
        report += '─'.repeat(70) + '\n\n';

        report += 'COMBATIENTES:\n';
        report += '─'.repeat(70) + '\n';
        report += 'Nombre        | AGI | PER | Base  | Promedio (1000 tiradas)\n';
        report += '──────────────┼─────┼─────┼───────┼────────────────────────\n';

        combatants.forEach(comb => {
            const base = (comb.agi * 2) + comb.per;
            let total = 0;
            for (let i = 0; i < 1000; i++) {
                const init = this.calculator.calculateInitiative(comb, true);
                total += init.totalInitiative;
            }
            const avg = total / 1000;
            
            report += `${comb.name.padEnd(13)} | ${comb.agi.toString().padStart(3)} | ${comb.per.toString().padStart(3)} | ${base.toString().padStart(5)} | ${avg.toFixed(2).padStart(10)}\n`;
        });

        report += '\n' + '═'.repeat(70) + '\n';
        report += 'EXPLICACIÓN:\n';
        report += '─'.repeat(70) + '\n';
        report += '• AGI (Agilidad): determina la velocidad base del combatiente\n';
        report += '• PER (Percepción): añade reactividad adicional\n';
        report += '• 2d10: dado de probabilidad gaussiana para variación cada ronda\n';
        report += '• Base: (AGI × 2) + PER — iniciativa mínima sin dados\n';
        report += '• Promedio: media de la distribución incluyendo 2d10\n';
        report += '═'.repeat(70) + '\n';

        return report;
    }

    /**
     * Genera un reporte HTML completo de iniciativa
     * @param {Array} combatants - Array de combatientes (opcional)
     * @returns {string} HTML markup
     */
    generateInitiativeHTML(combatants) {
        const svg = this.generateInitiativeHistogramSVG(combatants);
        const report = this.generateInitiativeReport(combatants);

        const html = `<!doctype html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Visualizador de Iniciativa</title>
        <style>
            body{font-family:Inter,system-ui,sans-serif;background:#0f1720;color:#dbeafe;padding:20px}
            .container{max-width:1200px;margin:0 auto}
            .panel{background:#071022;padding:16px;border-radius:8px;margin-bottom:14px;border-left:4px solid #7dd3fc}
            pre{background:#071022;padding:12px;border-radius:6px;overflow:auto;font-family:monospace;font-size:12px}
            h1{margin-top:0;color:#fbbf24}
            h3{color:#7dd3fc;margin-top:0}
            .info{background:#1e293b;padding:10px;border-radius:4px;margin:10px 0;font-size:13px}
        </style>
    </head>
    <body>
        <div class="container">
        <h1>⚔️ Visualizador de Iniciativa</h1>
        <div class="panel">
            <h3>Comparativa de Iniciativa Promedio (1000 simulaciones por combatiente)</h3>
            ${svg}
            <div class="info">
                <strong>Fórmula:</strong> Iniciativa = (AGI × 2) + PER + 2d10
                <br><strong>Distribución 2d10:</strong> Media ≈ 11, Desv. Est. ≈ 4.06
            </div>
        </div>
        <div class="panel">
            <h3>Reporte de Análisis</h3>
            <pre>${report.replace(/</g,'&lt;')}</pre>
        </div>
        </div>
    </body>
    </html>`;

        return html;
    }
}

module.exports = new InitiativeVisualizer();
