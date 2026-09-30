const fs = require('fs');

let c = fs.readFileSync('f:/phantichphanmem/frontend/src/pages/customer/ProductDetail.js', 'utf8');

c = c.replace(/<div className="flex flex-col lg:flex-row gap-6">\s*<div className="w-full lg:w-\[80%\] flex flex-col gap-6">/g, 
  '<div className="max-w-7xl mx-auto mt-6 bg-white rounded-lg p-6 shadow-sm flex flex-col gap-10">');

c = c.replace(/\{\/\* ĐỀ XUẤT CHO BẠN \*\/\}[\s\S]*?(?=\s*<\/div>\s*<\/div>\s*\);\s*\})/g, 
  `</div>\n{/* ĐỀ XUẤT CHO BẠN */}
      {recommendedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto mt-8 mb-12 px-2 lg:px-0">
          <h2 className="text-lg font-bold uppercase text-gray-800 mb-4">Đề xuất cho bạn</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recommendedProducts.map(p => (
              <SmartProductCard key={p.id} product={p} onAddToCart={addToCart} />
            ))}
          </div>
        </div>
      )}\n`);

fs.writeFileSync('f:/phantichphanmem/frontend/src/pages/customer/ProductDetail.js', c);
console.log("Product detail replaced!");
