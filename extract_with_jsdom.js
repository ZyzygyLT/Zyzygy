const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');

const htmlFile = path.join(__dirname, 'coverage', 'lcov-report', 'positioningSystem.js.html');
const outFile = path.join(__dirname, 'server', 'engine', 'positioningSystem.js');

try {
    const html = fs.readFileSync(htmlFile, 'utf8');
    const dom = new JSDOM(html);
    const preElement = dom.window.document.querySelector('pre.prettyprint.lang-js');
    
    if (!preElement) {
        console.error('Pre element not found');
        process.exit(1);
    }
    
    // Get text content, which strips all HTML
    let code = preElement.textContent;
    
    // Cleanup any unicode artifacts
    code = code.replace(/\u200B/g, '');  // Zero-width space
    code = code.replace(/\u00A0/g, ' '); // Non-breaking space
    
    fs.writeFileSync(outFile, code, 'utf8');
    console.log('Written', outFile);
} catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
}
