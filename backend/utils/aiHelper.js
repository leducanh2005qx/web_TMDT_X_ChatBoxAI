const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("../config/db");

// Cấu hình Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

/**
 * Tự động Vector hóa sản phẩm theo ID
 * @param {number} productId 
 */
async function autoVectorize(productId) {
  try {
    // 1. Lấy thông tin sản phẩm
    const [products] = await db.promise().query(
      "SELECT id, name, description FROM products WHERE id = ?",
      [productId]
    );

    if (products.length === 0) return;
    const product = products[0];

    // 2. Gom thông tin văn bản: Tên + Mô tả
    const textToEmbed = `Sản phẩm: ${product.name}. Mô tả: ${product.description || "Không có mô tả"}.`;
    
    console.log(`🤖 AI Tiger đang tự động Vector hóa: ${product.name} (ID: ${productId})`);

    // 3. Gọi API Gemini để lấy Embedding
    const result = await model.embedContent(textToEmbed);
    const embedding = result.embedding.values;

    // 4. Cập nhật vào cột embedding trong database (Lưu dạng JSON string)
    await db.promise().query(
      "UPDATE products SET embedding = ? WHERE id = ?",
      [JSON.stringify(embedding), productId]
    );

    console.log(`✅ Vector hóa tự động thành công cho sản phẩm ID ${productId}`);
  } catch (error) {
    console.error(`❌ Lỗi autoVectorize cho sản phẩm ID ${productId}:`, error.message);
  }
}

module.exports = { autoVectorize };
