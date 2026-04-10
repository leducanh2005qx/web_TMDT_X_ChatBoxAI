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
      if (!apiKey) return `Dạ chào ${userName}. Hiện tại Trợ lý Tiger đang tạm nghỉ. 🐯`;

      const genAI = new GoogleGenerativeAI(apiKey);

      // Lấy sản phẩm (Giới hạn lại để tránh lỗi quá tải Token/429)
      const [products] = await db.promise().query("SELECT name, price, stock FROM products LIMIT 20");
      const productList = products
        .map((p) => `- ${p.name}: Giá ${Number(p.price).toLocaleString()}đ, Kho: ${p.stock}`)
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
Nhiệm vụ: tư vấn bán hàng ngắn gọn, thân thiện, không dùng Markdown.
SẢN PHẨM:
${productList}
ĐƠN HÀNG HIỆN TẠI:
${orderInfo}
Khách hỏi: "${userMessage}"
Trả lời:`;

      // ✅ ĐÃ SỬA: Danh sách model chuẩn nhất hiện tại
      const FALLBACK_MODELS = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.0-pro"];
      
      for (let i = 0; i < FALLBACK_MODELS.length; i++) {
        try {
          const model = genAI.getGenerativeModel({ model: FALLBACK_MODELS[i] });
          const result = await model.generateContent(prompt);
          // ✅ ĐÃ SỬA: Cách lấy text đúng từ kết quả API
          const response = await result.response;
          const text = response.text();
          console.log(`✅ AI phản hồi qua ${FALLBACK_MODELS[i]}`);
          return text;
        } catch (e) {
          const code = e?.status || 0;
          if ((code === 429 || code === 503 || code === 404) && i < FALLBACK_MODELS.length - 1) {
            console.warn(`⚠️ Model ${FALLBACK_MODELS[i]} bận, đang chuyển sang model tiếp theo...`);
            await new Promise((r) => setTimeout(r, 2000));
          } else {
            throw e;
          }
        }
      }
      return `Dạ ${userName}, Tiger đang bận một chút, nhân viên sẽ hỗ trợ bạn ngay! 🐯`;
    } catch (error) {
      console.error("Lỗi gọi Gemini AI:", error.message);
      return `Dạ ${userName}, Tiger đang bận một chút, nhân viên sẽ hỗ trợ bạn ngay! 🐯`;
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
          const aiReply = await getSmartAiResponse(message, orderId, currentUserName);

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