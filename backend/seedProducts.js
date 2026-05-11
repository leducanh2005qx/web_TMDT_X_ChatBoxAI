const db = require('./config/db');

const categories = [
  { name: 'Nội thất', keyword: 'furniture' },
  { name: 'Thời trang nam', keyword: 'menswear' },
  { name: 'Đồ ăn', keyword: 'food' },
  { name: 'Thiết bị điện tử', keyword: 'electronics' },
  { name: 'Phụ kiện điện thoại', keyword: 'smartphone' },
  { name: 'Thời trang nữ', keyword: 'womenswear' },
  { name: 'Máy ảnh', keyword: 'camera' },
  { name: 'Đồng hồ', keyword: 'watch' },
  { name: 'Giày dép nam', keyword: 'mens,shoes' },
  { name: 'Giày dép nữ', keyword: 'womens,shoes' }
];

const generateProducts = (categoryId, categoryName, keyword) => {
  const products = [];
  for (let i = 1; i <= 10; i++) {
    const originalPrice = 200000 + Math.floor(Math.random() * 2000000);
    const discount = 0.1 + Math.random() * 0.4; // 10% - 50%
    const price = Math.round((originalPrice * (1 - discount)) / 1000) * 1000;
    
    // Add a random parameter to the image URL so each product gets a different image
    const imageUrl = `https://loremflickr.com/400/400/${keyword}?random=${categoryId * 10 + i}`;

    products.push({
      name: `${categoryName} Cao Cấp Mẫu ${i} - Sang Trọng & Hiện Đại`,
      price: price,
      original_price: originalPrice,
      description: `Sản phẩm ${categoryName} thiết kế độc quyền, chất lượng siêu cấp, bảo hành 12 tháng. Phù hợp cho mọi nhu cầu của sếp Đức Anh.`,
      stock: 50 + Math.floor(Math.random() * 150),
      image: imageUrl,
      category_id: categoryId,
      status: 'active',
      manager_id: 1,
      display_type: 'general',
      specifications: JSON.stringify({ "Tình trạng": "Mới 100%", "Xuất xứ": "Chính hãng" })
    });
  }
  return products;
};

async function seed() {
  try {
    for (const cat of categories) {
      // Create category
      const catSql = `INSERT INTO categories (name) VALUES (?)`;
      const [catResult] = await db.promise().query(catSql, [cat.name]);
      const categoryId = catResult.insertId;

      // Generate 10 products for each category
      const products = generateProducts(categoryId, cat.name, cat.keyword);
      
      for (const p of products) {
        const prodSql = `
          INSERT INTO products (name, price, original_price, description, stock, image, category_id, status, manager_id, display_type, specifications)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await db.promise().query(prodSql, [
          p.name, p.price, p.original_price, p.description, p.stock, p.image, p.category_id, p.status, p.manager_id, p.display_type, p.specifications
        ]);
      }
      console.log(`✅ Đã thêm 10 sản phẩm cho danh mục: ${cat.name}`);
    }
    console.log('🎉 Hoàn tất thêm 100 sản phẩm với ảnh minh họa ngẫu nhiên!');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi seed data:', error);
    process.exit(1);
  }
}

seed();
