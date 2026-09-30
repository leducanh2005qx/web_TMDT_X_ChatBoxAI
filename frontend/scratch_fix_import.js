const fs = require('fs');
const path = 'f:/phantichphanmem/frontend/src/pages/customer/ProductDetail.js';
let c = fs.readFileSync(path, 'utf8');

if (!c.startsWith('import SmartProductCard')) {
    c = 'import SmartProductCard from "../../components/customer/SmartProductCard";\n' + c;
    fs.writeFileSync(path, c);
    console.log("Import added!");
} else {
    console.log("Import already exists at the start.");
}
