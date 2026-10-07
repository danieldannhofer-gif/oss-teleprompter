// Inlines style.css, jszip and app.js into one self-contained player.html.
const fs = require('fs');
const path = require('path');

const read = (p) => fs.readFileSync(path.join(__dirname, p), 'utf8');
const html = read('src/index.src.html')
  .replace('/*STYLE*/', () => read('src/style.css'))
  .replace('/*JSZIP*/', () => read('jszip.min.js'))
  .replace('/*APP*/', () => read('src/app.js'));

fs.writeFileSync(path.join(__dirname, 'player.html'), html);
console.log('player.html', Math.round(html.length / 1024) + ' KB');
