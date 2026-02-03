#!/usr/bin/env python3
import re
from pathlib import Path
import html

html_file = Path('/') / 'Users' / 'agonz' / 'Downloads' / 'LOCAL_DEV' / 'claude' / 'WoD_Claude' / 'coverage' / 'lcov-report' / 'positioningSystem.js.html'
out_file = Path('/') / 'Users' / 'agonz' / 'Downloads' / 'LOCAL_DEV' / 'claude' / 'WoD_Claude' / 'server' / 'engine' / 'positioningSystem.js'

with open(html_file, encoding='utf-8') as f:
    content = f.read()

# Find the code block
start = content.find('<pre class="prettyprint lang-js">')
if start == -1:
    print('start tag not found')
    exit(1)

start += len('<pre class="prettyprint lang-js">')
end = content.find('</pre>', start)
if end == -1:
    print('end tag not found')
    exit(1)

code = content[start:end]

# Remove HTML tags
code = re.sub(r'<[^>]+>', '', code)

# Decode HTML entities
code = html.unescape(code)

# Remove coverage markers (lines starting with span class info)
code = re.sub(r'\n\s*', '\n', code)

with open(out_file, 'w', encoding='utf-8') as f:
    f.write(code)

print(f'Written {out_file}')
