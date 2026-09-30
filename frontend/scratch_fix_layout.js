const fs = require('fs');

let c = fs.readFileSync('f:/phantichphanmem/frontend/src/pages/customer/ProductDetail.js', 'utf8');

// 1. Remove SHOP INFO block
const shopInfoRegex = /\{\/\*\s*SHOP INFO\s*\*\/\}[\s\S]*?(?=<div className="flex flex-col lg:flex-row gap-6">)/;
c = c.replace(shopInfoRegex, '');

// 2. Replace wrappers
const oldWrappers = /<div className="flex flex-col lg:flex-row gap-6">\s*<div className="w-full lg:w-\[80%\] flex flex-col gap-6">/;
const newWrapper = '<div className="max-w-7xl mx-auto mt-6 bg-white rounded-lg p-6 shadow-sm flex flex-col gap-10">';
c = c.replace(oldWrappers, newWrapper);

fs.writeFileSync('f:/phantichphanmem/frontend/src/pages/customer/ProductDetail.js', c);
console.log('Layout fixed successfully!');
