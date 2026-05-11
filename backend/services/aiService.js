const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("../config/db");
const { cosineSimilarity } = require("../utils/vectorMath");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

/**
 * Tìm kiếm các sản phẩm phù hợp nhất với câu hỏi của khách hàng
 * Sử dụng Cosine Similarity để xếp hạng và chỉ trả về Top N sản phẩm liên quan nhất
 * 
 * @param {string} userQuery - Câu hỏi / yêu cầu của khách hàng
 * @param {number} limit - Số lượng sản phẩm tối đa muốn trả về (mặc định: 3)
 * @param {number} minScore - Điểm tương đồng tối thiểu để lọc sản phẩm rác (mặc định: 0.45)
 */
async function findTopProducts(userQuery, limit = 3, minScore = 0.45) {
  try {
    // 1. Chuyển câu hỏi của khách thành Vector
    const result = await model.embedContent(userQuery);
    const queryVector = result.embedding.values;

    // 2. Lấy tất cả sản phẩm có Vector từ DB (bao gồm cả hết hàng để AI có thể thông báo)
    const [products] = await db.promise().query(
      `SELECT p.id, p.name, p.price, p.description, p.stock, p.image, p.embedding,
              IFNULL(c.name, 'Chưa phân loại') AS category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.embedding IS NOT NULL AND p.embedding != '' 
         AND p.status = 'active' AND p.deleted_at IS NULL`
    );

    if (products.length === 0) return [];

    // 3. Tính điểm tương đồng cho từng sản phẩm
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
        stock: product.stock,
        image: product.image,
        category: product.category_name,
        similarity: similarity
      };
    });

    // 4. Sắp xếp theo điểm giảm dần, lọc theo ngưỡng tối thiểu, giới hạn số lượng
    const topProducts = scoredProducts
      .filter(p => p.similarity >= minScore)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    console.log(`🎯 Tiger tìm được ${topProducts.length}/${products.length} sản phẩm phù hợp (ngưỡng ≥ ${minScore})`);

    return topProducts;
  } catch (error) {
    console.error("❌ Lỗi findTopProducts:", error.message);
    return [];
  }
}

module.exports = { findTopProducts };
