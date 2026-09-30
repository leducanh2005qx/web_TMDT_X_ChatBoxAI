const fs = require('fs');
let c = fs.readFileSync('f:/phantichphanmem/frontend/src/pages/customer/ProductDetail.js', 'utf8');

const recommendSection = `
        {/* ĐỀ XUẤT CHO BẠN */}
        {recommendedProducts.length > 0 && (
          <div className="mt-16 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-black text-gray-800 mb-6 uppercase tracking-wider text-center">Đề xuất cho bạn</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {recommendedProducts.map(p => (
                <SmartProductCard key={p.id} product={p} onAddToCart={addToCart} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}`;

c = c.replace(/\s*<\/div>\s*<\/div>\s*\);\s*\}/, recommendSection);
fs.writeFileSync('f:/phantichphanmem/frontend/src/pages/customer/ProductDetail.js', c);
