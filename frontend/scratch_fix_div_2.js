const fs = require('fs');
let c = fs.readFileSync('f:/phantichphanmem/frontend/src/pages/customer/ProductDetail.js', 'utf8');

c = c.replace(/<\/div>\s*\);\s*\}/, '  </div>\n    </div>\n  );\n}');

fs.writeFileSync('f:/phantichphanmem/frontend/src/pages/customer/ProductDetail.js', c);
