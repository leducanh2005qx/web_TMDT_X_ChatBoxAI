const fs = require('fs');
let c = fs.readFileSync('f:/phantichphanmem/frontend/src/pages/customer/Shop.js', 'utf8');

// 1. Extract SHOP HEADER block
const headerStart = c.indexOf('{/* SHOP HEADER */}');
const headerEnd = c.indexOf('      <div className="flex flex-col lg:flex-row gap-6 items-start">');
if (headerStart !== -1 && headerEnd !== -1) {
  const headerCode = c.slice(headerStart, headerEnd);
  
  // Remove the header from its original position
  c = c.replace(headerCode, '');

  // Insert it into the right column (before PRODUCT GRID)
  const productGridStart = c.indexOf('{/* PRODUCT GRID */}');
  if (productGridStart !== -1) {
    c = c.replace(
      '<div className="flex-1 w-full">\n          {loading ? (',
      `<div className="flex-1 w-full flex flex-col gap-6">\n          ${headerCode}\n          {loading ? (`
    );
  }
}

// 2. Make sure Sidebar is ALWAYS visible on Desktop
c = c.replace(
  'transition-opacity duration-300 ${isFilterOpen ? "opacity-100 visible" : "opacity-0 invisible lg:opacity-100 lg:visible"}',
  'transition-opacity duration-300 ${isFilterOpen ? "opacity-100 visible" : "opacity-0 invisible lg:opacity-100 lg:visible block"}'
);

fs.writeFileSync('f:/phantichphanmem/frontend/src/pages/customer/Shop.js', c);
console.log('Shop.js Layout Updated');
