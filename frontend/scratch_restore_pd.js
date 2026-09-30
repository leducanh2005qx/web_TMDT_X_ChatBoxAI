const fs = require('fs');

let c = fs.readFileSync('f:/phantichphanmem/frontend/src/pages/customer/ProductDetail.js', 'utf8');

// 1. Import SmartProductCard
if (!c.includes('SmartProductCard')) {
    c = 'import SmartProductCard from "../../components/customer/SmartProductCard";\n' + c;
}

// 2. Import getProducts
if (!c.includes('getProducts,')) {
    c = c.replace('getProductReviews,', 'getProductReviews,\n  getProducts,');
}

// 3. Add addToCart prop
if (!c.includes('addToCart }')) {
    c = c.replace('function ProductDetail({ cart, setCart }) {', 'function ProductDetail({ cart, setCart, addToCart }) {');
}

// 4. Add recommendedProducts state
if (!c.includes('const [recommendedProducts')) {
    c = c.replace('const [qty, setQty] = useState(1);', 'const [qty, setQty] = useState(1);\n  const [recommendedProducts, setRecommendedProducts] = useState([]);');
}

// 5. Add useEffect for recommendedProducts
if (!c.includes('setRecommendedProducts(shuffled.slice(0, 5));')) {
    const recommendedEffect = `
  useEffect(() => {
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
    // Insert before handleAddToCart
    c = c.replace('const handleAddToCart = (isBuyNow = false) => {', recommendedEffect + '\n  const handleAddToCart = (isBuyNow = false) => {');
}

// 6. Move filteredReviews to the top
if (c.includes('const filteredReviews = useMemo')) {
    const regex = /const filteredReviews = useMemo\(\(\) => \{[\s\S]*?\}, \[reviews, reviewFilter\]\);\n\n/;
    c = c.replace(regex, ''); // Remove from bottom
    
    // Insert near the top, right after `const currentVariant`
    const insertAfter = 'const currentVariant = variants.find(v => v.color === selectedColor && v.size === selectedSize);';
    const hookStr = `

  const filteredReviews = useMemo(() => {
    if (reviewFilter === 'ALL') return reviews;
    if (reviewFilter === 'HAS_COMMENT') return reviews.filter(r => r.comment && r.comment.trim() !== '');
    return reviews.filter(r => r.rating === Number(reviewFilter));
  }, [reviews, reviewFilter]);`;
  
    c = c.replace(insertAfter, insertAfter + hookStr);
}

fs.writeFileSync('f:/phantichphanmem/frontend/src/pages/customer/ProductDetail.js', c);
console.log('Restored missing features and fixed hook position.');
