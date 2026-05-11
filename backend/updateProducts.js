const db = require('./config/db');

// Hàm lấy keyword cho ảnh dựa vào tên danh mục
function getKeyword(categoryName) {
  const name = categoryName.toLowerCase();
  if (name.includes('nam') && (name.includes('áo') || name.includes('quần') || name.includes('thời trang'))) return 'menswear';
  if (name.includes('nữ') && (name.includes('áo') || name.includes('quần') || name.includes('thời trang'))) return 'womenswear';
  if (name.includes('phụ kiện') && !name.includes('điện thoại')) return 'accessories';
  if (name.includes('giày') && name.includes('nam')) return 'mens,shoes';
  if (name.includes('giày') && name.includes('nữ')) return 'womens,shoes';
  if (name.includes('giày')) return 'shoes';
  if (name.includes('nội thất')) return 'furniture';
  if (name.includes('đồ ăn')) return 'food';
  if (name.includes('điện tử')) return 'electronics';
  if (name.includes('điện thoại')) return 'smartphone';
  if (name.includes('máy ảnh')) return 'camera';
  if (name.includes('đồng hồ')) return 'watch';
  if (name.includes('khoác')) return 'jacket';
  
  // Default keyword
  return 'product';
}

const generateProducts = (categoryId, categoryName, count, startIndex) => {
  const products = [];
  const keyword = getKeyword(categoryName);

  for (let i = 1; i <= count; i++) {
    const originalPrice = 200000 + Math.floor(Math.random() * 2000000);
    const discount = 0.1 + Math.random() * 0.4;
    const price = Math.round((originalPrice * (1 - discount)) / 1000) * 1000;
    
    // Tạo image URL ngẫu nhiên tránh trùng lặp
    const imageUrl = `https://loremflickr.com/400/400/${keyword}?random=${categoryId * 100 + startIndex + i}`;

    products.push({
      name: `${categoryName} Cao Cấp Mẫu Bổ Sung ${startIndex + i}`,
      price: price,
      original_price: originalPrice,
      description: `Sản phẩm bổ sung tự động cho danh mục ${categoryName}. Thiết kế độc quyền chuẩn xịn.`,
      stock: 50 + Math.floor(Math.random() * 150),
      image: imageUrl,
      category_id: categoryId,
      status: 'active',
      manager_id: 1,
      display_type: 'general',
      specifications: JSON.stringify({ "Tình trạng": "Mới 100%" })
    });
  }
  return products;
};

async function fixAndFillProducts() {
  try {
    // 1. Lấy tất cả danh mục
    const [categories] = await db.promise().query('SELECT * FROM categories');
    
    for (const cat of categories) {
      const keyword = getKeyword(cat.name);

      // Cập nhật các sản phẩm thuộc danh mục này mà đang bị thiếu ảnh
      const updateSql = `
        UPDATE products 
        SET image = CONCAT(?, id)
        WHERE category_id = ? AND (image IS NULL OR image = '')
      `;
      const baseUrl = `https://loremflickr.com/400/400/${keyword}?random=`;
      await db.promise().query(updateSql, [baseUrl, cat.id]);

      // Đếm số lượng sản phẩm của danh mục này
      const [countResult] = await db.promise().query('SELECT COUNT(*) as total FROM products WHERE category_id = ?', [cat.id]);
      const currentCount = countResult[0].total;

      // Nếu ít hơn 10 sản phẩm, chèn thêm cho đủ
      if (currentCount < 10) {
        const needed = 10 - currentCount;
        const newProducts = generateProducts(cat.id, cat.name, needed, currentCount);

        for (const p of newProducts) {
          const prodSql = `
            INSERT INTO products (name, price, original_price, description, stock, image, category_id, status, manager_id, display_type, specifications)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          await db.promise().query(prodSql, [
            p.name, p.price, p.original_price, p.description, p.stock, p.image, p.category_id, p.status, p.manager_id, p.display_type, p.specifications
          ]);
        }
        console.log(`✅ Đã thêm ${needed} sản phẩm mới cho danh mục: ${cat.name}`);
      } else {
        console.log(`✨ Danh mục ${cat.name} đã đủ ${currentCount} sản phẩm.`);
      }
    }
    
    console.log('🎉 Đã cập nhật xong toàn bộ ảnh bị thiếu và đảm bảo mọi danh mục đều có ít nhất 10 sản phẩm!');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi fix và bổ sung data:', error);
    process.exit(1);
  }
}

fixAndFillProducts();
