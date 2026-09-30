const fs = require('fs');

let c = fs.readFileSync('f:/phantichphanmem/frontend/src/pages/customer/ProductDetail.js', 'utf8');

const oldButtonsRegex = /<div className="flex flex-wrap gap-2 flex-1">[\s\S]*?<\/div>/;

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

// WARNING: earlier this regex matched the COLOR SELECTOR instead of REVIEWS block.
// I will use exact string replacement for safety!

const exactOldButtons = `<div className="flex flex-wrap gap-2 flex-1">
                  <button className="border border-[#FF7A00] text-[#FF7A00] bg-white px-4 py-1.5 text-sm font-bold rounded-[12px]">Tất Cả ({reviews.length})</button>
                  <button className="border border-gray-200 text-[#222] bg-white px-4 py-1.5 text-sm rounded-[12px]">5 Sao ({reviews.filter(r => r.rating === 5).length})</button>
                  <button className="border border-gray-200 text-[#222] bg-white px-4 py-1.5 text-sm rounded-[12px]">4 Sao ({reviews.filter(r => r.rating === 4).length})</button>
                  <button className="border border-gray-200 text-[#222] bg-white px-4 py-1.5 text-sm rounded-[12px]">3 Sao ({reviews.filter(r => r.rating === 3).length})</button>
                  <button className="border border-gray-200 text-[#222] bg-white px-4 py-1.5 text-sm rounded-[12px]">2 Sao ({reviews.filter(r => r.rating === 2).length})</button>
                  <button className="border border-gray-200 text-[#222] bg-white px-4 py-1.5 text-sm rounded-[12px]">1 Sao ({reviews.filter(r => r.rating === 1).length})</button>
                  <button className="border border-gray-200 text-[#222] bg-white px-4 py-1.5 text-sm rounded-[12px]">Có Bình Luận ({reviews.filter(r => r.comment).length})</button>
               </div>`;

if (c.includes(exactOldButtons)) {
    c = c.replace(exactOldButtons, newButtons);
    
    // Also we need to make sure the loop uses filteredReviews
    // In my previous script I didn't replace the map because it was lost too.
    c = c.replace('{reviews.length === 0 ? (', '{filteredReviews.length === 0 ? (');
    c = c.replace('reviews.map(r => (', 'filteredReviews.map(r => (');
    
    fs.writeFileSync('f:/phantichphanmem/frontend/src/pages/customer/ProductDetail.js', c);
    console.log("Updated buttons successfully");
} else {
    console.log("Could not find the exact old buttons string!");
}
