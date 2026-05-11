const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("../config/db");
const Chat = require("../models/Chat");

/**
 * Lấy gợi ý phản hồi nhanh cho nhân viên
 */
exports.getChatSuggestions = async (req, res) => {
  const { threadId } = req.params;

  try {
    Chat.getMessages(threadId, 3, (err, messages) => {
      if (err) return res.status(500).json({ message: "Lỗi lấy tin nhắn" });

      const lastCustomerMsg = messages && messages.length > 0
        ? messages.filter(m => m.sender_role === "CUSTOMER" || m.sender_role === "USER").pop()
        : null;

      let suggestions = [
        "Dạ chào sếp, Tiger Shop xin phục vụ ạ! 🐯",
        "Sếp cần em hỗ trợ thêm thông tin gì không ạ?",
        "Dạ Tiger đang kiểm tra ngay cho sếp nhé! 🐯"
      ];

      if (lastCustomerMsg) {
        const msg = lastCustomerMsg.message.toLowerCase();
        if (msg.includes("đơn") || msg.includes("giao") || msg.includes("ship")) {
          suggestions = [
            "Dạ để em kiểm tra trạng thái đơn hàng cho sếp ngay ạ! 🐯",
            "Đơn hàng của sếp đang được xử lý, sếp yên tâm nhé!",
            "Sếp cho em xin mã đơn hàng để kiểm tra nhanh hơn ạ!"
          ];
        } else if (msg.includes("giá") || msg.includes("mua") || msg.includes("sản phẩm")) {
          suggestions = [
            "Dạ sản phẩm này đang có giá ưu đãi lắm sếp ơi! 🐯",
            "Sếp muốn em tư vấn thêm về sản phẩm nào ạ?",
            "Em gửi sếp bảng giá chi tiết ngay nhé!"
          ];
        } else if (msg.includes("lỗi") || msg.includes("hỏng") || msg.includes("bảo hành")) {
          suggestions = [
            "Dạ em rất xin lỗi về sự bất tiện, để em xử lý ngay ạ! 🐯",
            "Sếp gửi ảnh sản phẩm lỗi cho em kiểm tra nhé!",
            "Em sẽ chuyển yêu cầu bảo hành lên bộ phận kỹ thuật ngay ạ!"
          ];
        }
      }

      res.json(suggestions);
    });
  } catch (error) {
    console.error("Lỗi AI Suggestions:", error);
    res.json([
      "Dạ Tiger Shop xin chào ạ! 🐯",
      "Sếp cần em hỗ trợ gì không ạ?",
      "Em đang sẵn sàng phục vụ sếp đây!"
    ]);
  }
};

const { findTopProducts } = require("../services/aiService");

/**
 * Phân loại ý định của khách hàng để quyết định cách xử lý
 */
function classifyIntent(message) {
  const msg = message.toLowerCase();

  // Câu chào hỏi / xã giao
  const greetings = ["xin chào", "hello", "hi", "chào", "alo", "hey", "có ai", "bot", "tiger"];
  if (greetings.some(g => msg.includes(g)) && msg.length < 30) {
    return "greeting";
  }

  // Hỏi về đơn hàng
  const orderKeywords = ["đơn hàng", "đơn", "giao hàng", "ship", "vận chuyển", "theo dõi", "trạng thái đơn"];
  if (orderKeywords.some(k => msg.includes(k))) {
    return "order_inquiry";
  }

  // Hỏi về chính sách
  const policyKeywords = ["bảo hành", "đổi trả", "hoàn tiền", "chính sách", "khiếu nại"];
  if (policyKeywords.some(k => msg.includes(k))) {
    return "policy_inquiry";
  }

  // Tìm sản phẩm / mua hàng → cần RAG
  return "product_search";
}

/**
 * Xử lý chat AI độc lập (Stateless) – Nâng cấp RAG thông minh
 */
exports.chatWithAi = async (req, res) => {
  const { message, orderId } = req.body;
  const userName = req.user ? req.user.name : "bạn";

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ success: false, error: "Tiger AI đang bảo trì, sếp hãy nhắn cho nhân viên ở phía dưới nhé!" });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const intent = classifyIntent(message);
    console.log(`🧠 Tiger phân loại ý định: "${message}" → [${intent}]`);

    // ====== XÂY DỰNG CONTEXT SẢN PHẨM (chỉ khi cần) ======
    let productListText = "";

    if (intent === "product_search") {
      console.log(`🔍 Tiger đang tìm kiếm sản phẩm phù hợp cho: "${message}"`);
      const topProducts = await findTopProducts(message, 3, 0.45);

      if (topProducts && topProducts.length > 0) {
        const productList = topProducts
          .map((p, i) => {
            const priceFormatted = Number(p.price).toLocaleString();
            const stockStatus = p.stock <= 0 ? "⚠️ TẠM HẾT HÀNG" : p.stock <= 10 ? `Chỉ còn ${p.stock} sản phẩm` : "Còn hàng";
            return `${i + 1}. ${p.name} (${p.category})\n   💰 Giá: ${priceFormatted}đ | 📦 ${stockStatus}\n   📝 ${(p.description || "").substring(0, 80)}`;
          })
          .join("\n");
        productListText = `\n🎯 TOP ${topProducts.length} SẢN PHẨM PHÙ HỢP NHẤT (điểm tương đồng cao nhất):\n${productList}\n\nLƯU Ý: Chỉ giới thiệu TỐI ĐA 3 sản phẩm trên. KHÔNG tự bịa sản phẩm. Nếu sản phẩm TẠM HẾT HÀNG, hãy thông báo cho khách và gợi ý liên hệ để đặt trước hoặc xem sản phẩm tương tự.\n`;
      } else {
        productListText = "\n(Không tìm thấy sản phẩm nào phù hợp trong kho. Hãy hỏi thêm nhu cầu cụ thể hơn, VD: loại sản phẩm, mức giá, thương hiệu.)\n";
      }
    } else if (intent === "greeting") {
      productListText = "\n(Khách đang chào hỏi. KHÔNG cần tìm sản phẩm. Hãy chào lại thân thiện và hỏi khách cần hỗ trợ gì.)\n";
    } else if (intent === "order_inquiry") {
      productListText = "\n(Khách hỏi về đơn hàng. Hãy hỏi mã đơn hàng nếu chưa có, hoặc cung cấp thông tin đơn hàng bên dưới.)\n";
    } else if (intent === "policy_inquiry") {
      productListText = "\n(Khách hỏi chính sách. Tiger Shop có: Đổi trả 7 ngày, Bảo hành theo hãng, Giao hàng hỏa tốc nội thành Hà Đông. Liên hệ Hotline nếu cần thêm.)\n";
    }

    // ====== THÔNG TIN ĐƠN HÀNG (nếu có) ======
    let orderInfo = "Không có đơn hàng đính kèm.";
    if (orderId) {
      const [orders] = await db.promise().query("SELECT id, total, status FROM orders WHERE id = ?", [orderId]);
      if (orders.length > 0) {
        const o = orders[0];
        orderInfo = `Đơn #${o.id}. Trạng thái: ${o.status}. Tổng: ${Number(o.total).toLocaleString()}đ.`;
      }
    }

    // ====== SYSTEM PROMPT CHUYÊN NGHIỆP ======
    const fullPrompt = `Vai trò: Bạn là 'Trợ lý Tiger 🐯', trợ lý ảo thông minh của cửa hàng Tiger Shop (Yên Nghĩa, Hà Đông).
Phong cách: Luôn gọi người dùng là 'Sếp'. Ngôn ngữ vui vẻ, nhiệt tình, chuyên nghiệp. Có emoji 🐯.
QUY TẮC VÀNG:
- Chỉ giới thiệu TỐI ĐA 3 sản phẩm mỗi lần tư vấn. Ưu tiên sản phẩm phù hợp NHẤT.
- KHÔNG BAO GIỜ tự bịa sản phẩm hoặc giá cả. Chỉ dùng dữ liệu được cung cấp.
- Nếu khách chưa nêu rõ nhu cầu, hỏi thêm: loại sản phẩm, mức giá, mục đích sử dụng.
- Nếu nhận thấy khách phân vân, chê đắt, ngập ngừng → cung cấp mã voucher 'TIGER_PROMO_10'. Nếu không → null.
- Câu trả lời ngắn gọn, dễ đọc (max 150 từ), KHÔNG dùng Markdown.

Khách hàng: ${userName}
${productListText}
ĐƠN HÀNG: ${orderInfo}

Khách hỏi: "${message}"

BẮT BUỘC TRẢ VỀ ĐÚNG MỘT ĐỐI TƯỢNG JSON:
{
  "reply": "Câu trả lời ngắn gọn, thân thiện",
  "sentiment": "happy hoặc angry hoặc neutral",
  "voucher": "TIGER_PROMO_10 hoặc null"
}
JSON:`;

    const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await chatModel.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    let parsed;
    try {
      // Xử lý trường hợp Gemini trả về JSON bọc trong markdown
      const cleanText = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(cleanText);
    } catch(e) {
      parsed = { reply: text.replace(/```json/g, "").replace(/```/g, "").trim(), sentiment: "neutral", voucher: null };
    }

    return res.json({ success: true, reply: parsed.reply, voucher: parsed.voucher });

  } catch (error) {
    console.error("AI CHAT ERROR:", error);
    return res.status(200).json({ success: false, error: "Tiger AI đang bảo trì, sếp hãy nhắn cho nhân viên ở phía dưới nhé!" });
  }
};
