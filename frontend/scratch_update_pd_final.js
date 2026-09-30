const fs = require('fs');

let c = fs.readFileSync('f:/phantichphanmem/frontend/src/pages/customer/ProductDetail.js', 'utf8');

// 1. Imports
if (!c.includes('useMemo,')) {
    c = c.replace('useEffect, useState', 'useEffect, useState, useMemo');
}

// 2. State definition
if (!c.includes('const [reviewFilter, setReviewFilter]')) {
    c = c.replace('const [reviews, setReviews] = useState([]);', "const [reviews, setReviews] = useState([]);\n  const [reviewFilter, setReviewFilter] = useState('ALL');");
}

// 3. Derived state before return
if (!c.includes('const filteredReviews = useMemo')) {
    const derivedState = `
  const filteredReviews = useMemo(() => {
    if (reviewFilter === 'ALL') return reviews;
    if (reviewFilter === 'HAS_COMMENT') return reviews.filter(r => r.comment && r.comment.trim() !== '');
    return reviews.filter(r => r.rating === Number(reviewFilter));
  }, [reviews, reviewFilter]);

  return (`;
    c = c.replace('  return (', derivedState);
}

// 4. Remove SHOP INFO block completely
const shopInfoStr = `{/* SHOP INFO */}
      <div className="bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-4 lg:p-6 mb-6 flex items-center gap-6">
         <div className="w-20 h-20 rounded-full border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center bg-gray-50 text-3xl">
           🐯
         </div>
         <div className="flex flex-col gap-1 border-r border-gray-200 pr-8">
            <h3 className="font-bold text-base text-[#222]">Tiger Shop Official</h3>
            <span className="text-xs text-gray-500">Online 5 phút trước</span>
            <div className="flex gap-2 mt-2">
               <button className="border border-[#FF7A00] text-[#FF7A00] bg-[#fffbf8] px-3 py-1.5 rounded-[12px] text-xs font-bold flex items-center gap-1 hover:bg-[#ffeee0]"><ShoppingCart size={14}/> Xem Shop</button>
            </div>
         </div>
         <div className="flex-1 grid grid-cols-3 gap-y-4 px-8 text-sm text-[#757575]">
            <div className="flex justify-between w-32"><label>Đánh Giá</label><span className="text-[#FF7A00] font-bold">15,4k</span></div>
            <div className="flex justify-between w-32"><label>Sản Phẩm</label><span className="text-[#FF7A00] font-bold">243</span></div>
            <div className="flex justify-between w-32"><label>Tỉ Lệ Phản Hồi</label><span className="text-[#FF7A00] font-bold">99%</span></div>
            <div className="flex justify-between w-32"><label>Tham Gia</label><span className="text-[#FF7A00] font-bold">3 Năm</span></div>
            <div className="flex justify-between w-32"><label>Người Theo Dõi</label><span className="text-[#FF7A00] font-bold">12,1k</span></div>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-[80%] flex flex-col gap-6">`;

c = c.replace(shopInfoStr, '<div className="max-w-7xl mx-auto mt-6 bg-white rounded-lg p-6 shadow-sm flex flex-col gap-10">');


// Remove inner background styles for DESCRIPTION and REVIEWS
const innerBgRegex = /className="bg-white rounded-\[12px\] shadow-\[0_4px_20px_rgba\(0,0,0,0\.05\)\] p-6"/g;
c = c.replace(innerBgRegex, 'className=""');

// 6. Update the review buttons with interactive logic
const oldButtonsStr = `<div className="flex flex-wrap gap-2 flex-1">
                  <button className="border border-[#FF7A00] text-[#FF7A00] bg-white px-4 py-1.5 text-sm font-bold rounded-[12px]">Tất Cả ({reviews.length})</button>
                  <button className="border border-gray-200 text-[#222] bg-white px-4 py-1.5 text-sm rounded-[12px]">5 Sao ({reviews.filter(r => r.rating === 5).length})</button>
                  <button className="border border-gray-200 text-[#222] bg-white px-4 py-1.5 text-sm rounded-[12px]">4 Sao ({reviews.filter(r => r.rating === 4).length})</button>
                  <button className="border border-gray-200 text-[#222] bg-white px-4 py-1.5 text-sm rounded-[12px]">3 Sao ({reviews.filter(r => r.rating === 3).length})</button>
                  <button className="border border-gray-200 text-[#222] bg-white px-4 py-1.5 text-sm rounded-[12px]">2 Sao ({reviews.filter(r => r.rating === 2).length})</button>
                  <button className="border border-gray-200 text-[#222] bg-white px-4 py-1.5 text-sm rounded-[12px]">1 Sao ({reviews.filter(r => r.rating === 1).length})</button>
                  <button className="border border-gray-200 text-[#222] bg-white px-4 py-1.5 text-sm rounded-[12px]">Có Bình Luận ({reviews.filter(r => r.comment).length})</button>
               </div>`;

const newButtons = `<div className="flex flex-wrap gap-2 flex-1">
                  <button 
                    onClick={() => setReviewFilter('ALL')}
                    className={\`border px-4 py-1.5 text-sm rounded-[12px] \${reviewFilter === 'ALL' ? 'border-[#FF7A00] text-[#FF7A00] bg-white font-bold' : 'border-gray-200 text-[#222] bg-white hover:border-[#FF7A00] hover:text-[#FF7A00] transition-colors'}\`}
                  >Tất Cả ({reviews.length})</button>
                  <button 
                    onClick={() => setReviewFilter('5')}
                    className={\`border px-4 py-1.5 text-sm rounded-[12px] \${reviewFilter === '5' ? 'border-[#FF7A00] text-[#FF7A00] bg-white font-bold' : 'border-gray-200 text-[#222] bg-white hover:border-[#FF7A00] hover:text-[#FF7A00] transition-colors'}\`}
                  >5 Sao ({reviews.filter(r => r.rating === 5).length})</button>
                  <button 
                    onClick={() => setReviewFilter('4')}
                    className={\`border px-4 py-1.5 text-sm rounded-[12px] \${reviewFilter === '4' ? 'border-[#FF7A00] text-[#FF7A00] bg-white font-bold' : 'border-gray-200 text-[#222] bg-white hover:border-[#FF7A00] hover:text-[#FF7A00] transition-colors'}\`}
                  >4 Sao ({reviews.filter(r => r.rating === 4).length})</button>
                  <button 
                    onClick={() => setReviewFilter('3')}
                    className={\`border px-4 py-1.5 text-sm rounded-[12px] \${reviewFilter === '3' ? 'border-[#FF7A00] text-[#FF7A00] bg-white font-bold' : 'border-gray-200 text-[#222] bg-white hover:border-[#FF7A00] hover:text-[#FF7A00] transition-colors'}\`}
                  >3 Sao ({reviews.filter(r => r.rating === 3).length})</button>
                  <button 
                    onClick={() => setReviewFilter('2')}
                    className={\`border px-4 py-1.5 text-sm rounded-[12px] \${reviewFilter === '2' ? 'border-[#FF7A00] text-[#FF7A00] bg-white font-bold' : 'border-gray-200 text-[#222] bg-white hover:border-[#FF7A00] hover:text-[#FF7A00] transition-colors'}\`}
                  >2 Sao ({reviews.filter(r => r.rating === 2).length})</button>
                  <button 
                    onClick={() => setReviewFilter('1')}
                    className={\`border px-4 py-1.5 text-sm rounded-[12px] \${reviewFilter === '1' ? 'border-[#FF7A00] text-[#FF7A00] bg-white font-bold' : 'border-gray-200 text-[#222] bg-white hover:border-[#FF7A00] hover:text-[#FF7A00] transition-colors'}\`}
                  >1 Sao ({reviews.filter(r => r.rating === 1).length})</button>
                  <button 
                    onClick={() => setReviewFilter('HAS_COMMENT')}
                    className={\`border px-4 py-1.5 text-sm rounded-[12px] \${reviewFilter === 'HAS_COMMENT' ? 'border-[#FF7A00] text-[#FF7A00] bg-white font-bold' : 'border-gray-200 text-[#222] bg-white hover:border-[#FF7A00] hover:text-[#FF7A00] transition-colors'}\`}
                  >Có Bình Luận ({reviews.filter(r => r.comment && r.comment.trim() !== '').length})</button>
               </div>`;

c = c.replace(oldButtonsStr, newButtons);

// 7. Update mapping logic to use filteredReviews instead of reviews
c = c.replace('{reviews.length === 0 ? (', '{filteredReviews.length === 0 ? (');
c = c.replace('reviews.map(r => (', 'filteredReviews.map(r => (');

// 8. End of file corrections (add Đề Xuất Cho Bạn and fix closing divs)
// Currently it ends with:
//                      </div>
//                    </div>
//                  ))
//                )}
//             </div>
//           </div>
//         </div>
//
//       </div>
//     </div>
//   );
// }

const oldEndStr = `         </div>
        </div>

      </div>
    </div>
  );
}`;

const newEndStr = `         </div>
        </div>

        {/* ĐỀ XUẤT CHO BẠN */}
        {recommendedProducts.length > 0 && (
          <div className="max-w-7xl mx-auto mt-8 mb-12 px-2 lg:px-0">
            <h2 className="text-lg font-bold uppercase text-gray-800 mb-4">Đề xuất cho bạn</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {recommendedProducts.map(p => (
                <SmartProductCard key={p.id} product={p} onAddToCart={addToCart} />
              ))}
            </div>
          </div>
        )}
        
      </div>
  );
}`;

if (c.includes(oldEndStr)) {
    c = c.replace(oldEndStr, newEndStr);
} else {
    console.log("Could not find the exact old end string! Checking regex instead.");
    // Wait, the new wrapper `<div className="max-w-7xl mx-auto mt-6 bg-white rounded-lg p-6 shadow-sm flex flex-col gap-10">` opens ONE div.
    // The previous code had TWO inner wrappers.
    // Let's just remove one `</div>` from the end manually, and insert Recommended.
    const endRegex = /<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}/;
    const newEnd = `</div>
        </div>

        {/* ĐỀ XUẤT CHO BẠN */}
        {recommendedProducts.length > 0 && (
          <div className="max-w-7xl mx-auto mt-8 mb-12 px-2 lg:px-0">
            <h2 className="text-lg font-bold uppercase text-gray-800 mb-4">Đề xuất cho bạn</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {recommendedProducts.map(p => (
                <SmartProductCard key={p.id} product={p} onAddToCart={addToCart} />
              ))}
            </div>
          </div>
        )}
        
    </div>
  );
}`;
    c = c.replace(endRegex, newEnd);
}

fs.writeFileSync('f:/phantichphanmem/frontend/src/pages/customer/ProductDetail.js', c);
console.log('Update successful!');
