const { GoogleGenerativeAI } = require("@google/generative-ai");
const Chat = require("../models/Chat");

/**
 * Lấy gợi ý phản hồi nhanh cho nhân viên dựa trên ngữ cảnh chat
 */
exports.getChatSuggestions = async (req, res) => {
  const { threadId } = req.params;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.json(["Chào bạn, Tiger Shop có thể giúp gì?", "Bạn cần tư vấn sản phẩm nào?", "Đơn hàng của bạn đang được xử lý."]);
  }

  try {
    // 1. Lấy 5 tin nhắn gần nhất
    Chat.getMessages(threadId, 5, async (err, messages) => {
      if (err) return res.status(500).json({ message: "Lỗi lấy tin nhắn" });

      // Nếu không có tin nhắn, dùng prompt mặc định
      const context = messages && messages.length > 0 
        ? messages.map(m => `${m.sender_role}: ${m.message}`).join("\n")
        : "Khách hàng vừa tham gia chat.";
      
      const genAI = new GoogleGenerativeAI(apiKey);
      // Dùng gemini-pro để đảm bảo độ tương thích cao nhất
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `Bạn là cố vấn cho nhân viên chăm sóc khách hàng của Tiger Shop.
Dựa trên hội thoại dưới đây, hãy gợi ý 3 câu trả lời ngắn gọn (dưới 15 từ mỗi câu) để nhân viên có thể gửi nhanh cho khách.
Trả về định dạng:
1. Câu 1
2. Câu 2
3. Câu 3

HỘI THOẠI:
${context}`;

      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Trích xuất các câu trả lời (giả định định dạng 1. ..., 2. ...)
        const lines = text.split("\n").filter(l => l.match(/^\d\./));
        const suggestions = lines.map(l => l.replace(/^\d\.\s*/, "").trim());

        if (suggestions.length > 0) {
          res.json(suggestions);
        } else {
          throw new Error("No suggestions found");
        }
      } catch (e) {
        console.error("AI GENERATE ERR:", e.message);
        res.json(["Dạ Tiger Shop xin chào ạ!", "Cảm ơn bạn đã quan tâm sản phẩm.", "Bạn đợi chút nhân viên kiểm tra nhé!"]);
      }
    });
  } catch (error) {
    console.error("Lỗi AI Suggestions:", error);
    res.status(500).json({ message: "Lỗi AI" });
  }
};
