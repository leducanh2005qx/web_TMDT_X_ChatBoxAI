const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("../config/db");
const { cosineSimilarity } = require("../utils/vectorMath");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

/**
 * Tìm kiếm các sản phẩm phù hợp nhất với câu hỏi của khách hàng
 * @param {string} userQuery Câu hỏi của khách
 * @param {number} limit Số lượng sản phẩm muốn lấy
 */
async function findTopProducts(userQuery, limit = 5) {
  try {
    // 1. Chuyển câu hỏi của khách thành Vector
    const result = await model.embedContent(userQuery);
    const queryVector = result.embedding.values;

    // 2. Lấy tất cả sản phẩm có Vector từ DB
    const [products] = await db.promise().query(
      "SELECT id, name, price, description, embedding FROM products WHERE embedding IS NOT NULL AND embedding != '' AND status = 'active' AND deleted_at IS NULL"
    );

    if (products.length === 0) return [];

    // 3. Tính điểm tương đồng
    const scoredProducts = products.map(product => {
      let productVector;
      try {
        productVector = JSON.parse(product.embedding);
      } catch (e) {
        productVector = [];
      }

      const similarity = cosineSimilarity(queryVector, productVector);
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        description: product.description,
        similarity: similarity
      };
    });

    // 4. Sắp xếp theo điểm giảm dần và lấy top N
    const topProducts = scoredProducts
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .filter(p => p.similarity > 0.3); // Ngưỡng tối thiểu để tránh rác

    return topProducts;
  } catch (error) {
    console.error("❌ Lỗi findTopProducts:", error.message);
    return [];
  }
}

module.exports = { findTopProducts };
