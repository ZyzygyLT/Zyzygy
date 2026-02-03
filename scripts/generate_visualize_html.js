const fs = require('fs');
const path = require('path');
const probabilityVisualizer = require('../server/engine/probabilityVisualizer');

(async function(){
  try{
    const report = probabilityVisualizer.generateFullReport();
    const svg = probabilityVisualizer.generateHistogramSVG(20000);
    const html = `<!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Visualizador 2d10 (offline)</title>
      <style>body{font-family:Inter,system-ui,sans-serif;background:#0f1720;color:#dbeafe;padding:20px}.container{max-width:1100px;margin:0 auto}.panel{background:#071022;padding:16px;border-radius:8px;margin-bottom:14px}pre{background:#071022;padding:12px;border-radius:6px;overflow:auto;font-family:monospace}</style>
    </head>
    <body>
      <div class="container">
        <h1>Visualizador de Probabilidades — 2d10 (generado localmente)</h1>
        <div class="panel">
          <h3>Histograma (SVG)</h3>
          ${svg}
        </div>
        <div class="panel">
          <h3>Reporte (texto)</h3>
          <pre>${report.replace(/</g,'&lt;')}</pre>
        </div>
      </div>
    </body>
    </html>`;

    const out = path.resolve(process.cwd(), 'visualize.html');
    fs.writeFileSync(out, html, 'utf8');
    console.log('WROTE', out);
  }catch(err){
    console.error('ERROR', err);
    process.exit(1);
  }
})();
