const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'server', 'engine', 'positioningSystem.js');
let code = fs.readFileSync(file, 'utf8');

// Replace common artifacts from coverage HTML
code = code.replace(/\bIif\b/g, 'if');
code = code.replace(/\bEif\b/g, 'if');
code = code.replace(/\bCspan\b/g, '');
code = code.replace(/\bspan class=\"[^\"]*\"\b/g, '');

// Remove stray unicode NO-BREAK spaces
code = code.replace(/\u00A0/g, ' ');

// Fix sequences like "<span...>" remnants
code = code.replace(/<[^>]*>/g, '');

fs.writeFileSync(file, code, 'utf8');
console.log('Cleaned', file);
