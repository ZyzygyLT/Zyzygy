const fs = require('fs');
const path = require('path');
const initiativeVisualizer = require('../server/engine/initiativeVisualizer');

(async function(){
  try{
    const html = initiativeVisualizer.generateInitiativeHTML();
    const out = path.resolve(process.cwd(), 'initiative.html');
    fs.writeFileSync(out, html, 'utf8');
    console.log('WROTE', out, 'length:', html.length);
  }catch(err){
    console.error('ERROR', err.message);
    console.error(err);
    process.exit(1);
  }
})();
