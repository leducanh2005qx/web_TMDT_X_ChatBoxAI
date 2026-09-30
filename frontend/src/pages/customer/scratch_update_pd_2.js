const fs = require('fs');

let c = fs.readFileSync('f:/phantichphanmem/frontend/src/pages/customer/ProductDetail.js', 'utf8');

if (!c.includes('getProducts')) {
  c = c.replace('getProductReviews,', 'getProductReviews,\n  getProducts,');
}
if (!c.includes('SmartProductCard')) {
  c = c.replace('import {', 'import SmartProductCard from "../../components/customer/SmartProductCard";\nimport {');
}

if (c.includes('function ProductDetail({ cart, setCart })')) {
  c = c.replace('function ProductDetail({ cart, setCart })', 'function ProductDetail({ cart, setCart, addToCart })');
}

if (!c.includes('recommendedProducts')) {
  c = c.replace('const [qty, setQty] = useState(1);', 'const [qty, setQty] = useState(1);\n  const [recommendedProducts, setRecommendedProducts] = useState([]);');
}

const fetchEffect = `  useEffect(() => {
    if (!product?.category_id) return;
    getProducts().then(data => {
      if (Array.isArray(data)) {
        const filtered = data.filter(p => p.category_id === product.category_id && String(p.id) !== String(product.id));
        const shuffled = filtered.sort(() => 0.5 - Math.random());
        setRecommendedProducts(shuffled.slice(0, 5));
      }
    }).catch(console.error);
  }, [product?.category_id, product?.id]);
`;
if (!c.includes('setRecommendedProducts(')) {
  c = c.replace('  const handleAddToCart', fetchEffect + '\n  const handleAddToCart');
}

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
`;

if (!c.includes('ĐỀ XUẤT CHO BẠN')) {
  c = c.replace('      </div>\n    </div>\n  );\n}', recommendSection + '      </div>\n    </div>\n  );\n}');
}

fs.writeFileSync('f:/phantichphanmem/frontend/src/pages/customer/ProductDetail.js', c);
console.log('ProductDetail updated with Recommended section!');
