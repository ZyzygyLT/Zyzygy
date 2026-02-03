const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'coverage', 'lcov-report', 'positioningSystem.js.html');
const outPath = path.join(__dirname, '..', 'server', 'engine', 'positioningSystem.js');

let html = fs.readFileSync(htmlPath, 'utf8');

const startTag = '<pre class="prettyprint lang-js">';
const endTag = '</pre>';

const start = html.indexOf(startTag);
if (start === -1) {
    console.error('startTag not found');
    process.exit(1);
}
const end = html.indexOf(endTag, start);
if (end === -1) {
    console.error('endTag not found');
    process.exit(1);
}
let code = html.substring(start + startTag.length, end);

// Remove all HTML tags
code = code.replace(/<[^>]+>/g, '');

// Decode basic HTML entities
code = code.replace(/&gt;/g, '>');
code = code.replace(/&lt;/g, '<');
code = code.replace(/&amp;/g, '&');
code = code.replace(/&nbsp;/g, '');

// Trim possible leading unicode BOM
if (code.charCodeAt(0) === 65279) {
    code = code.slice(1);
}

fs.writeFileSync(outPath, code, 'utf8');
console.log('Written', outPath);
