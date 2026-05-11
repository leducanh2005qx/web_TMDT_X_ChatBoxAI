/**
 * 🐯 Script tạo biến thể tự động cho sản phẩm theo danh mục
 * Mỗi danh mục sẽ có loại biến thể riêng phù hợp
 */
require("dotenv").config();
const db = require("../config/db");

// ===== ĐỊNH NGHĨA BIẾN THỂ THEO LOẠI DANH MỤC =====
const VARIANT_MAP = {
  // Quần áo nam/nữ → Size
  clothing: {
    keywords: ["thời trang", "áo", "quần", "áo khoác"],
    variants: [
      { name: "Size S", priceAdjust: 0 },
      { name: "Size M", priceAdjust: 0 },
      { name: "Size L", priceAdjust: 10000 },
      { name: "Size XL", priceAdjust: 20000 },
      { name: "Size XXL", priceAdjust: 30000 },
    ],
    stockPerVariant: (baseStock) => Math.max(Math.floor(baseStock / 5), 2),
  },

  // Giày dép → Size giày
  shoes: {
    keywords: ["giày", "dép"],
    variants: [
      { name: "Size 38", priceAdjust: 0 },
      { name: "Size 39", priceAdjust: 0 },
      { name: "Size 40", priceAdjust: 0 },
      { name: "Size 41", priceAdjust: 0 },
      { name: "Size 42", priceAdjust: 10000 },
      { name: "Size 43", priceAdjust: 20000 },
    ],
    stockPerVariant: (baseStock) => Math.max(Math.floor(baseStock / 6), 1),
  },

  // Thiết bị điện tử / Điện thoại → Dung lượng / Màu sắc
  electronics: {
    keywords: ["thiết bị điện tử", "điện thoại", "phụ kiện điện thoại"],
    variants: [
      { name: "Đen", priceAdjust: 0 },
      { name: "Trắng", priceAdjust: 0 },
      { name: "Xanh Navy", priceAdjust: 50000 },
    ],
    stockPerVariant: (baseStock) => Math.max(Math.floor(baseStock / 3), 2),
  },

  // Máy ảnh → Phiên bản
  camera: {
    keywords: ["máy ảnh"],
    variants: [
      { name: "Body Only", priceAdjust: 0 },
      { name: "Kit Lens 18-55mm", priceAdjust: 2000000 },
    ],
    stockPerVariant: (baseStock) => Math.max(Math.floor(baseStock / 2), 1),
  },

  // Đồng hồ → Chất liệu dây
  watch: {
    keywords: ["đồng hồ"],
    variants: [
      { name: "Dây da", priceAdjust: 0 },
      { name: "Dây kim loại", priceAdjust: 200000 },
      { name: "Dây cao su", priceAdjust: -100000 },
    ],
    stockPerVariant: (baseStock) => Math.max(Math.floor(baseStock / 3), 1),
  },

  // Nội thất → Kích thước
  furniture: {
    keywords: ["nội thất"],
    variants: [
      { name: "Nhỏ", priceAdjust: 0 },
      { name: "Vừa", priceAdjust: 500000 },
      { name: "Lớn", priceAdjust: 1000000 },
    ],
    stockPerVariant: (baseStock) => Math.max(Math.floor(baseStock / 3), 1),
  },

  // Phụ kiện → Màu sắc
  accessory: {
    keywords: ["phụ kiện"],
    variants: [
      { name: "Đen", priceAdjust: 0 },
      { name: "Nâu", priceAdjust: 0 },
      { name: "Bạc", priceAdjust: 50000 },
    ],
    stockPerVariant: (baseStock) => Math.max(Math.floor(baseStock / 3), 1),
  },
};

// Đồ ăn → KHÔNG có biến thể (bán nguyên sản phẩm)
const SKIP_KEYWORDS = ["đồ ăn"];

/**
 * Xác định loại biến thể dựa trên tên danh mục
 */
function getVariantType(categoryName) {
  const name = categoryName.toLowerCase().trim();

  // Kiểm tra xem có nên bỏ qua không
  if (SKIP_KEYWORDS.some(k => name.includes(k))) return null;

  for (const [type, config] of Object.entries(VARIANT_MAP)) {
    if (config.keywords.some(k => name.includes(k))) {
      return { type, ...config };
    }
  }
  return null;
}

async function generateVariants() {
  try {
    console.log("🐯 Bắt đầu tạo biến thể tự động cho sản phẩm...\n");

    // 1. Lấy tất cả sản phẩm CHƯA CÓ biến thể
    const [products] = await db.promise().query(`
      SELECT p.id, p.name, p.price, p.stock, p.category_id, 
             IFNULL(c.name, '') AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.deleted_at IS NULL AND p.status = 'active'
        AND p.id NOT IN (SELECT DISTINCT product_id FROM product_variants)
      ORDER BY p.category_id, p.id
    `);

    if (products.length === 0) {
      console.log("✅ Tất cả sản phẩm đã có biến thể.");
      process.exit();
    }

    console.log(`📦 Tìm thấy ${products.length} sản phẩm chưa có biến thể.\n`);

    let totalCreated = 0;
    let skippedCount = 0;

    for (const product of products) {
      const variantConfig = getVariantType(product.category_name);

      if (!variantConfig) {
        skippedCount++;
        continue;
      }

      const basePrice = Number(product.price);
      const baseStock = Number(product.stock) || 10; // Mặc định 10 nếu stock = 0

      for (const variant of variantConfig.variants) {
        const variantPrice = Math.max(basePrice + variant.priceAdjust, 1000);
        const variantStock = variantConfig.stockPerVariant(baseStock);

        await db.promise().query(
          "INSERT INTO product_variants (product_id, variant_name, price, stock) VALUES (?, ?, ?, ?)",
          [product.id, variant.name, variantPrice, variantStock]
        );
      }

      totalCreated += variantConfig.variants.length;
      console.log(`✅ ${product.name} (${product.category_name}) → ${variantConfig.variants.length} biến thể [${variantConfig.type}]`);
    }

    console.log(`\n🏁 Hoàn thành! Đã tạo ${totalCreated} biến thể. Bỏ qua ${skippedCount} sản phẩm (Đồ ăn / Không xác định).`);
  } catch (error) {
    console.error("💥 Lỗi:", error.message);
  } finally {
    process.exit();
  }
}

generateVariants();
