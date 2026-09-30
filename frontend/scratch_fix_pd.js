const fs = require('fs');

let c = fs.readFileSync('f:/phantichphanmem/frontend/src/pages/customer/ProductDetail.js', 'utf8');

// 1. Remove SHOP INFO
const shopInfoStart = c.indexOf('{/* SHOP INFO */}');
const shopInfoEnd = c.indexOf('<div className="flex flex-col lg:flex-row gap-6">');
if (shopInfoStart !== -1 && shopInfoEnd !== -1) {
  const shopInfoCode = c.substring(shopInfoStart, shopInfoEnd);
  c = c.replace(shopInfoCode, '');
}

// 2. Restructure DETAILS and REVIEWS
// We want to replace `<div className="flex flex-col lg:flex-row gap-6">\n        <div className="w-full lg:w-[80%] flex flex-col gap-6">`
// with `<div className="max-w-7xl mx-auto mt-6 bg-white rounded-lg p-6 shadow-sm flex flex-col gap-8">`
// Note: We need to also remove the inner wrappers that gave them individual white backgrounds, OR keep them but remove their white background.
// The prompt says: "Khối CHI TIẾT SẢN PHẨM và ĐÁNH GIÁ SẢN PHẨM: Đặt trong một container lớn (max-w-7xl mx-auto mt-6 bg-white rounded-lg p-6 shadow-sm). Chiếm toàn bộ bề ngang".
// I will just replace the exact wrappers.
const detailsStart = c.indexOf('<div className="flex flex-col lg:flex-row gap-6">');
const recommendedStart = c.indexOf('{/* ĐỀ XUẤT CHO BẠN */}');

if (detailsStart !== -1 && recommendedStart !== -1) {
  let detailsCode = c.substring(detailsStart, recommendedStart);
  
  // Replace the outermost wrapper
  detailsCode = detailsCode.replace(
    '<div className="flex flex-col lg:flex-row gap-6">\n        <div className="w-full lg:w-[80%] flex flex-col gap-6">',
    '<div className="max-w-7xl mx-auto mt-6 bg-white rounded-lg p-6 shadow-sm flex flex-col gap-10">'
  );
  
  // Remove background and shadow from the inner DESCRIPTION block to let the parent handle it
  detailsCode = detailsCode.replace(
    '<div className="bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6">',
    '<div className="">'
  );
  
  // Remove background and shadow from the inner REVIEWS block
  detailsCode = detailsCode.replace(
    '<div className="bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6">',
    '<div className="">'
  );

  // Strip out the two closing `</div>` tags from the old `lg:flex-row` and `lg:w-[80%]` which are right before `ĐỀ XUẤT CHO BẠN`
  detailsCode = detailsCode.replace(/<\/div>\s*<\/div>\s*$/, '</div>\n');

  c = c.substring(0, detailsStart) + detailsCode + c.substring(recommendedStart);
}

// 3. Rebuild RECOMMENDED
const recommendedRegex = /\{\/\* ĐỀ XUẤT CHO BẠN \*\/\}[\s\S]*?\}\)/;
const newRecommendedCode = `{/* ĐỀ XUẤT CHO BẠN */}
        {recommendedProducts.length > 0 && (
          <div className="max-w-7xl mx-auto mt-8 mb-12">
            <h2 className="text-lg font-bold uppercase text-gray-800 mb-4">Đề xuất cho bạn</h2>
            <div className="grid grid-cols-4 md:grid-cols-5 gap-4">
              {recommendedProducts.map(p => (
                <SmartProductCard key={p.id} product={p} onAddToCart={addToCart} />
              ))}
            </div>
          </div>
        )}`;

c = c.replace(recommendedRegex, newRecommendedCode);

fs.writeFileSync('f:/phantichphanmem/frontend/src/pages/customer/ProductDetail.js', c);
console.log('ProductDetail.js restructured successfully.');
