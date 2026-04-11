const { Server } = require("socket.io");
const db = require("./config/db");
// ✅ ĐÃ SỬA: Dùng đúng thư viện chính thức của Google
const { GoogleGenerativeAI } = require("@google/generative-ai");

const initSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: "*" },
    transports: ["websocket"],
  });

  const messageCounts = {}; // { ip: { count: N, resetTime: T } }
  const LIMIT_MS = 60 * 1000;
  const LIMIT_MAX = 5;

  const getUserName = async (userId) => {
    try {
      const [rows] = await db.promise().query("SELECT name FROM users WHERE id = ?", [userId]);
      return rows.length > 0 ? rows[0].name : "bạn";
    } catch (err) { return "bạn"; }
  };

  const isUserActive = async (userId) => {
    try {
      const [rows] = await db.promise().query("SELECT status FROM users WHERE id = ? LIMIT 1", [userId]);
      if (!rows.length) return false;
      return rows[0].status === "active";
    } catch (err) { return false; }
  };

  // --- LOGIC PHẢN HỒI THÔNG MINH ---
  const getSmartAiResponse = async (userMessage, orderId, userName) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return { reply: `Dạ chào ${userName}. Hiện tại Trợ lý Tiger đang tạm nghỉ. 🐯`, sentiment: "neutral" };

      const genAI = new GoogleGenerativeAI(apiKey);

      // Lấy danh sách sản phẩm có kèm display_type
      const [products] = await db.promise().query("SELECT name, price, stock, display_type FROM products LIMIT 20");
      const productList = products
        .map((p) => `- ${p.name} (Loại: ${p.display_type || 'general'}): Giá ${Number(p.price).toLocaleString()}đ, Kho: ${p.stock}`)
        .join("\n");

      let orderInfo = "Không có đơn hàng đính kèm.";
      if (orderId) {
        const [orders] = await db.promise().query("SELECT id, total, status FROM orders WHERE id = ?", [orderId]);
        if (orders.length > 0) {
          const o = orders[0];
          orderInfo = `Đơn #${o.id}. Trạng thái: ${o.status}. Tổng: ${Number(o.total).toLocaleString()}đ.`;
        }
      }

      const prompt = `Bạn là "Trợ lý Tiger" của Tiger Shop. Chat với khách: ${userName}.
Nhiệm vụ: Tư vấn thân thiện. QUAN TRỌNG: Phân tích hỏi đáp dựa trên Loại sản phẩm. Nếu khách hỏi Điện tử (electronics) thì tư vấn rành rọt về thông số/cấu hình. Nếu hỏi Thời trang (fashion) thì tư vấn về size, màu sắc.
BẮT BUỘC TRẢ VỀ ĐÚNG MỘT ĐỐI TƯỢNG JSON VỚI 2 TRƯỜNG:
{
  "reply": "Câu trả lời của bạn (không dùng Markdown)",
  "sentiment": "happy hoặc angry hoặc neutral" // Phân tích cảm xúc của khách ở câu hỏi dưới đây
}

SẢN PHẨM:
${productList}

ĐƠN HÀNG HIỆN TẠI:
${orderInfo}

Khách hỏi: "${userMessage}"
JSON:`;

      const currentModel = "gemini-1.5-flash";
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const model = genAI.getGenerativeModel({ 
            model: currentModel,
            generationConfig: { responseMimeType: "application/json" }
          });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          
          let parsed;
          try {
            parsed = JSON.parse(text);
          } catch(e) {
            parsed = { reply: text.replace(/```json/g, "").replace(/```/g, ""), sentiment: "neutral" };
          }
          console.log(`✅ AI phản hồi thành công ở lần thử ${attempt}`);
          return parsed;
        } catch (e) {
          const code = e?.status || 0;
          if (code === 429 && attempt < 3) {
            console.warn(`⚠️ Model ${currentModel} lỗi 429 (Giới hạn requests), đang thử lại sau 2s...`);
            await new Promise((r) => setTimeout(r, 2000));
          } else if (attempt === 3) {
            throw e;
          }
        }
      }
    } catch (error) {
      console.error("Lỗi gọi Gemini AI:", error.message);
      return { reply: `Dạ ${userName}, Tiger đang bận một chút, nhân viên sẽ hỗ trợ bạn ngay! 🐯`, sentiment: "neutral" };
    }
  };

  io.on("connection", (socket) => {
    socket.on("join_thread", (data) => {
      const threadId = data?.threadId || data;
      if (threadId) socket.join(String(threadId));
    });

    socket.on("send_message", async (data) => {
      const ip = socket.handshake.address;
      const now = Date.now();

      if (!messageCounts[ip] || now > messageCounts[ip].resetTime) {
        messageCounts[ip] = { count: 1, resetTime: now + LIMIT_MS };
      } else {
        messageCounts[ip].count++;
      }

      const { threadId, senderRole, senderId, message, orderId, receiverId } = data;

      if (messageCounts[ip].count > LIMIT_MAX && (senderRole === "CUSTOMER" || senderRole === "USER")) {
        const limitMsg = {
          threadId,
          senderRole: "SYSTEM",
          senderId: 0,
          message: "Bạn chat nhanh quá, Tiger xử lý không kịp, đợi 1 lát nhé! 🐯",
          createdAt: new Date(),
        };
        socket.emit("newMessage", limitMsg);
        return;
      }

      const sqlSave = `INSERT INTO chat_messages (thread_id, sender_role, sender_id, message, order_id, receiver_id, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())`;

      db.query(sqlSave, [threadId, senderRole, senderId, message, orderId || null, receiverId || null], async (err, result) => {
        if (err) return;

        const msgPayload = { id: result.insertId, ...data, createdAt: new Date() };
        io.to(String(threadId)).emit("newMessage", msgPayload);

        // AI PHẢN HỒI TỰ ĐỘNG
        if (senderRole === "CUSTOMER" || senderRole === "USER") {
          const activeSender = await isUserActive(senderId);
          if (!activeSender) return;

          const currentUserName = await getUserName(senderId);
          const aiData = await getSmartAiResponse(message, orderId, currentUserName);
          
          const aiReply = aiData?.reply || "Dạ Tiger nghe đây ạ!";
          const customerSentiment = aiData?.sentiment || "neutral";

          // Cập nhật sentiment cho khách hàng vào tin nhắn vừa được lưu
          db.query("UPDATE chat_messages SET sentiment = ? WHERE id = ?", [customerSentiment, result.insertId]);

          // Tạo hiệu ứng trễ để trông thật hơn
          setTimeout(() => {
            db.query(sqlSave, [threadId, "SYSTEM", 0, aiReply, orderId || null, senderId], (errAi, resAi) => {
              if (errAi) return;
              const aiMsgPayload = {
                id: resAi.insertId,
                threadId,
                senderRole: "SYSTEM",
                senderId: 0,
                message: aiReply,
                orderId: orderId || null,
                createdAt: new Date(),
              };
              io.to(String(threadId)).emit("newMessage", aiMsgPayload);
            });
          }, 1500);
        }
      });
    });
  });

  return io;
};

module.exports = { initSocket };