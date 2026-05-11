const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("../config/db");
const Chat = require("../models/Chat");

/**
 * Lấy gợi ý phản hồi nhanh cho nhân viên
 * 🔇 AI TẠM THỜI VÔ HIỆU HÓA - Trả về gợi ý tĩnh để tránh lỗi 404
 * Khi cần bật lại AI, uncomment code GoogleGenerativeAI bên dưới
 */
exports.getChatSuggestions = async (req, res) => {
  const { threadId } = req.params;

  try {
    // Lấy tin nhắn cuối cùng của khách để tạo gợi ý thông minh hơn
    Chat.getMessages(threadId, 3, (err, messages) => {
      if (err) return res.status(500).json({ message: "Lỗi lấy tin nhắn" });

      const lastCustomerMsg = messages && messages.length > 0
        ? messages.filter(m => m.sender_role === "CUSTOMER" || m.sender_role === "USER").pop()
        : null;

      // Gợi ý tĩnh thông minh dựa trên nội dung tin nhắn khách
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
 * Xử lý chat AI độc lập (Stateless)
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
    // GIAI ĐOẠN 2: Tìm kiếm ngữ nghĩa (RAG)
    console.log(`🔍 Tiger đang tìm kiếm sản phẩm phù hợp cho: "${message}"`);
    const topProducts = await findTopProducts(message, 5);
    
    let productListText = "";
    if (topProducts && topProducts.length > 0) {
      const productList = topProducts
        .map((p) => `- ${p.name}: Giá ${Number(p.price).toLocaleString()}đ. Mô tả: ${p.description || "Không có mô tả"}`)
        .join("\n");
      productListText = `\nSẢN PHẨM PHÙ HỢP NHẤT TRONG KHO (RAG):\n${productList}\n`;
    } else {
      productListText = "\n(Không tìm thấy sản phẩm nào khớp chính xác trong kho, hãy tư vấn chung chung hoặc hỏi thêm nhu cầu nhé)\n";
    }

    let orderInfo = "Không có đơn hàng đính kèm.";
    if (orderId) {
      const [orders] = await db.promise().query("SELECT id, total, status FROM orders WHERE id = ?", [orderId]);
      if (orders.length > 0) {
        const o = orders[0];
        orderInfo = `Đơn #${o.id}. Trạng thái: ${o.status}. Tổng: ${Number(o.total).toLocaleString()}đ.`;
      }
    }

    const systemInstructionText = `Vai trò: Bạn là 'Trợ lý Tiger', trợ lý ảo thông minh của cửa hàng Tiger Shop và hệ thống quản lý phòng trọ do sếp Đức Anh (MSSV 23010219) phát triển.
Phong cách: Luôn gọi người dùng là 'Sếp' hoặc 'Bạn' tùy vai trò. Ngôn ngữ vui vẻ, nhiệt tình, có sử dụng emoji con hổ (🐯).
Nhiệm vụ: Hỗ trợ kiểm tra đơn hàng, tư vấn sản phẩm, nhắc nhở lịch trực (cho nhân viên) và báo cáo doanh thu (cho Admin).
Giới hạn: Nếu không biết câu trả lời, hãy lịch sự báo là 'Tiger đang tìm hiểu thêm, sếp đợi em chút nhé!'.`;

    const fullPrompt = `${systemInstructionText}

Bạn là "Trợ lý Tiger" của Tiger Shop. Chat với khách: ${userName}.
Nhiệm vụ: Tư vấn thân thiện. QUAN TRỌNG: Phân tích hỏi đáp dựa trên Loại sản phẩm và Dữ liệu sản phẩm thực tế được cung cấp bên dưới.
BẮT BUỘC TRẢ VỀ ĐÚNG MỘT ĐỐI TƯỢNG JSON VỚI 2 TRƯỜNG:
{
  "reply": "Câu trả lời của bạn (không dùng Markdown)",
  "sentiment": "happy hoặc angry hoặc neutral"
}

${productListText}

ĐƠN HÀNG HIỆN TẠI:
${orderInfo}

Khách hỏi: "${message}"
JSON:`;

    // Đã nâng cấp lên model gemini-2.5-flash vì Google đã loại bỏ bản 1.5
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch(e) {
      parsed = { reply: text.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, ""), sentiment: "neutral" };
    }

    return res.json({ success: true, reply: parsed.reply });

  } catch (error) {
    console.error("AI CHAT ERROR:", error);
    return res.status(200).json({ success: false, error: "Tiger AI đang bảo trì, sếp hãy nhắn cho nhân viên ở phía dưới nhé!" });
  }
};
