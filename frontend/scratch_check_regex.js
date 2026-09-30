const fs = require('fs');

let c = fs.readFileSync('f:/phantichphanmem/frontend/src/pages/customer/ProductDetail.js', 'utf8');

// The block to replace is:
// <div className="flex flex-col lg:flex-row gap-6">
//   <div className="w-full lg:w-[80%] flex flex-col gap-6">
const regexOldLayout = /<div className="flex flex-col lg:flex-row gap-6">\s*<div className="w-full lg:w-\[80%\] flex flex-col gap-6">/;

if (regexOldLayout.test(c)) {
    c = c.replace(regexOldLayout, '<div className="max-w-7xl mx-auto mt-6 bg-white rounded-lg p-6 shadow-sm flex flex-col gap-10">');
}

// Ensure the RECOMMENDED block has the exact requested layout:
// <div className="max-w-7xl mx-auto mt-8 mb-12">
// <h2 className="text-lg font-bold uppercase text-gray-800 mb-4">ĐỀ XUẤT CHO BẠN</h2>
// <div className="grid grid-cols-4 md:grid-cols-5 gap-4">

const regexRecommended = /\{\/\* ĐỀ XUẤT CHO BẠN \*\/\}[\s\S]*?(?=\s*<\/div>\s*<\/div>\s*\);\s*\})/;

const newRecommended = `{/* ĐỀ XUẤT CHO BẠN */}
      {recommendedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto mt-8 mb-12 px-2 lg:px-0">
          <h2 className="text-lg font-bold uppercase text-gray-800 mb-4">Đề xuất cho bạn</h2>
          <div className="grid grid-cols-4 md:grid-cols-5 gap-4">
            {recommendedProducts.map(p => (
              <SmartProductCard key={p.id} product={p} onAddToCart={addToCart} />
            ))}
          </div>
        </div>
      )}`;

c = c.replace(regexRecommended, newRecommended + '\n');

// Wait, the new wrapper `<div className="max-w-7xl mx-auto mt-6 ...` is placed INSIDE `<div className="max-w-[1200px] mx-auto ...">`.
// But the prompt says "Chiếm toàn bộ bề ngang". This is fine because the outer wrapper is max-w-1200px, so 100% width is 1200px.
// But we also need to close it before Đề Xuất Cho Bạn, otherwise it's nested improperly.
// Let's check how many `</div>` are right before the Recommended block.
// The outer `max-w-[1200px]` wraps EVERYTHING. So it should be fine if we just replaced the two opening divs with ONE opening div, we need to REMOVE one closing div.

fs.writeFileSync('f:/phantichphanmem/frontend/scratch_transform_pd.js', c);
