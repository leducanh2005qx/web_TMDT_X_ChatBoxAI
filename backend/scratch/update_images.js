const db = require('../config/db');

const sql = `
  UPDATE products 
  SET image = CONCAT('https://picsum.photos/400/400?random=', id)
  WHERE image LIKE '%loremflickr.com%'
`;

db.query(sql, (err, result) => {
  if (err) {
    console.error("❌ Lỗi cập nhật ảnh sản phẩm:", err);
    process.exit(1);
  }
  console.log(`✅ Đã cập nhật thành công ${result.affectedRows} ảnh sản phẩm sang Picsum Photos!`);
  process.exit(0);
});
