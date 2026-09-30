const fs = require('fs');
const path = 'f:/phantichphanmem/frontend/src/pages/customer/Shop.js';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/\\`/g, '`');
c = c.replace(/\\\$/g, '$');

fs.writeFileSync(path, c);
console.log("Fixed Shop.js");
