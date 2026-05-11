require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("../config/db");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

async function vectorizeProducts() {
  try {
    console.log("🚀 Bắt đầu quá trình Vector hóa sản phẩm...");

    // 1. Lấy sản phẩm chưa có embedding
    const [products] = await db.promise().query(
      "SELECT id, name, description, category_id FROM products WHERE embedding IS NULL OR embedding = ''"
    );

    if (products.length === 0) {
      console.log("✅ Tất cả sản phẩm đã được vector hóa.");
      process.exit();
    }

    console.log(`📦 Tìm thấy ${products.length} sản phẩm cần xử lý.`);

    for (const product of products) {
      try {
        // Gom thông tin: Tên + Mô tả (có thể lấy thêm tên danh mục nếu cần)
        const textToEmbed = `Sản phẩm: ${product.name}. Mô tả: ${product.description || "Không có mô tả"}.`;
        
        console.log(`🔄 Đang xử lý: ${product.name} (ID: ${product.id})`);

        // 2. Gọi API Embedding
        const result = await model.embedContent(textToEmbed);
        const embedding = result.embedding.values;

        // 3. Lưu vào DB (Lưu dưới dạng chuỗi JSON)
        await db.promise().query(
          "UPDATE products SET embedding = ? WHERE id = ?",
          [JSON.stringify(embedding), product.id]
        );

        console.log(`✅ Đã lưu vector cho: ${product.name}`);
      } catch (innerError) {
        console.error(`❌ Lỗi khi xử lý sản phẩm ID ${product.id}:`, innerError.message);
      }
    }

    console.log("🏁 Hoàn thành quá trình Vector hóa.");
  } catch (error) {
    console.error("💥 Lỗi hệ thống:", error.message);
  } finally {
    process.exit();
  }
}

vectorizeProducts();
