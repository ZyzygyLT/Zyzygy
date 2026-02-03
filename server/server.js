require('dotenv').config();
const express = require('express');
const path = require('path');
const probabilityVisualizer = require('./engine/probabilityVisualizer');
const initiativeVisualizer = require('./engine/initiativeVisualizer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
	res.send('<h2>Echoes - Visualizador de Probabilidades</h2><p><a href="/visualize">/visualize</a> — Dados 2d10 | <a href="/initiative">/initiative</a> — Iniciativa</p>');
});

app.get('/visualize', (req, res) => {
	// generar reporte + SVG y devolver en HTML
	const report = probabilityVisualizer.generateFullReport();
	const svg = probabilityVisualizer.generateHistogramSVG(20000);
	const html = `<!doctype html>
	<html>
	<head>
		<meta charset="utf-8">
		<title>Visualizador 2d10</title>
		<style>
			body{font-family: Inter, system-ui, sans-serif; background:#0f1720; color:#dbeafe; padding:20px}
			.container{max-width:1100px;margin:0 auto}
			.panel{background:#071022;padding:16px;border-radius:8px;margin-bottom:14px}
			pre{background:#071022; padding:12px; border-radius:6px; overflow:auto; font-family: monospace}
			a{color:#7dd3fc}
		</style>
	</head>
	<body>
		<div class="container">
		<h1>Visualizador de Probabilidades — 2d10</h1>
		<div class="panel">
			<h3>Histograma (SVG)</h3>
			${svg}
		</div>
		<div class="panel">
			<h3>Reporte (texto)</h3>
			<pre>${report.replace(/</g, '&lt;')}</pre>
		</div>
		</div>
	</body>
	</html>`;
	res.send(html);
});

app.get('/initiative', (req, res) => {
	const html = initiativeVisualizer.generateInitiativeHTML();
	res.send(html);
});

app.listen(PORT, () => {
	console.log(`Servidor web escuchando en http://localhost:${PORT}`);
});

console.log('EOD Server iniciado');
