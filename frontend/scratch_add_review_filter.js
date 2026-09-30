const fs = require('fs');

let c = fs.readFileSync('f:/phantichphanmem/frontend/src/pages/customer/ProductDetail.js', 'utf8');

// 1. Add state
const stateToInsert = `  const [reviewFilter, setReviewFilter] = useState('ALL');\n`;
if (!c.includes('reviewFilter')) {
    c = c.replace('const [reviews, setReviews] = useState([]);', 'const [reviews, setReviews] = useState([]);\n' + stateToInsert);
}

// 2. Add derived state for filteredReviews
const derivedState = `  const filteredReviews = React.useMemo(() => {
    if (reviewFilter === 'ALL') return reviews;
    if (reviewFilter === 'HAS_COMMENT') return reviews.filter(r => r.comment && r.comment.trim() !== '');
    return reviews.filter(r => r.rating === Number(reviewFilter));
  }, [reviews, reviewFilter]);

  return (`

if (!c.includes('const filteredReviews =')) {
    // Also we need to ensure React is in scope, or we can use useMemo from react.
    // The top has `import { useEffect, useState } from "react";`. We can use `React.useMemo` if we import React, but let's just use `useMemo` and import it.
    if (!c.includes('useMemo,')) {
        c = c.replace('useEffect, useState', 'useEffect, useState, useMemo');
    }
    const derivedStateWithUseMemo = `  const filteredReviews = useMemo(() => {
    if (reviewFilter === 'ALL') return reviews;
    if (reviewFilter === 'HAS_COMMENT') return reviews.filter(r => r.comment && r.comment.trim() !== '');
    return reviews.filter(r => r.rating === Number(reviewFilter));
  }, [reviews, reviewFilter]);\n\n  return (`;
    c = c.replace('  return (', derivedStateWithUseMemo);
}

// 3. Replace the review filter buttons block
// Current block:
// <div className="flex flex-wrap gap-2 flex-1">
//    <button className="border border-[#FF7A00] text-[#FF7A00] bg-white px-4 py-1.5 text-sm font-bold rounded-[12px]">Tất Cả ({reviews.length})</button>
//    <button className="border border-gray-200 text-[#222] bg-white px-4 py-1.5 text-sm rounded-[12px]">5 Sao ({reviews.filter(r => r.rating === 5).length})</button>
//    ...
//    <button className="border border-gray-200 text-[#222] bg-white px-4 py-1.5 text-sm rounded-[12px]">Có Bình Luận ({reviews.filter(r => r.comment).length})</button>
// </div>

const regexButtons = /<div className="flex flex-wrap gap-2 flex-1">[\s\S]*?<\/div>/;

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
                  >Có Bình Luận ({reviews.filter(r => r.comment).length})</button>
               </div>`;

c = c.replace(regexButtons, newButtons);

// 4. Update rendering loop
// Replace `reviews.length === 0` with `filteredReviews.length === 0` inside the review block
// Replace `reviews.map(r => (` with `filteredReviews.map(r => (`

const blockStart = c.indexOf('<div className="flex flex-col">');
if (blockStart !== -1) {
    let block = c.substring(blockStart, c.indexOf('</div>\n          </div>\n</div>', blockStart));
    block = block.replace('reviews.length === 0', 'filteredReviews.length === 0');
    block = block.replace('reviews.map(r => (', 'filteredReviews.map(r => (');
    c = c.substring(0, blockStart) + block + c.substring(c.indexOf('</div>\n          </div>\n</div>', blockStart));
}

fs.writeFileSync('f:/phantichphanmem/frontend/src/pages/customer/ProductDetail.js', c);
