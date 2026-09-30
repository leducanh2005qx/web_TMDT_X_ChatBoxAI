const fs = require('fs');

const path = 'f:/phantichphanmem/frontend/src/pages/customer/ProductDetail.js';
let c = fs.readFileSync(path, 'utf8');

// The file was duplicated because `indexOf` returned -1. 
// At line 487 in the file, it has `import SmartProductCard from ...` which means the file restarted there!
const splitString = 'import SmartProductCard from "../../components/customer/SmartProductCard";';
const firstOccurrence = c.indexOf(splitString);
const secondOccurrence = c.indexOf(splitString, firstOccurrence + 1);

if (secondOccurrence !== -1) {
    console.log("Found duplicate!");
    // Wait, the block was inserted and then c.substring(-1) added the WHOLE FILE at the end.
    // Let's just find the first `import SmartProductCard` and the SECOND `import SmartProductCard`, and slice at the second one?
    // Actually, I can just grab the second occurrence and see if it's the start of the whole file. 
    // Yes! The bug was: c = c.substring(0, blockStart) + block + c.substring(-1); (since indexOf returned -1).
    // So the file is: `Original up to blockStart` + `Modified block` + `Entire original file`.
    // Let's just do it manually. I will write a simple regex or substring to extract just the first valid component up to `export default ProductDetail;`.
}

const match = c.match(/export default ProductDetail;/g);
console.log(`Found ${match ? match.length : 0} exports`);

// We want everything up to the FIRST `export default ProductDetail;` + 1.
let cleanC = c.substring(0, c.indexOf('export default ProductDetail;') + 'export default ProductDetail;'.length) + '\n';
fs.writeFileSync(path, cleanC);
