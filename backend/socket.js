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


  io.on("connection", (socket) => {
    socket.on("join_thread", (data) => {
      const threadId = data?.threadId || data;
      if (threadId) {
        socket.join(String(threadId));
        console.log(`📡 Socket ${socket.id} joined thread ${threadId}`);
      }
    });

    socket.on("joinUserRoom", (userId) => {
      if (userId) {
        socket.join(String(userId));
        console.log(`📡 Socket ${socket.id} joined user room ${userId} for notifications`);
      }
    });

    // 🙋‍♂️ KHÁCH HÀNG YÊU CẦU NHÂN VIÊN
    socket.on("request_staff", async (data) => {
      const { threadId } = data;
      if (!threadId) return;

      db.query("UPDATE threads SET status = 'staff_needed' WHERE id = ?", [threadId], (err) => {
        if (err) return;
        
        // Gửi tin nhắn hệ thống thông báo cho cả 2 bên
        const sysMsg = {
          threadId,
          senderRole: "SYSTEM",
          senderId: 0,
          message: "⚠️ Đã gửi yêu cầu đến nhân viên. Vui lòng đợi trong giây lát... 🐅",
          createdAt: new Date(),
        };
        io.to(String(threadId)).emit("newMessage", sysMsg);
        
        // Thông báo cho toàn bộ nhân viên đang online (room specific or broadcast)
        io.emit("staff_notification", { type: "JOIN_REQUEST", threadId });
      });
    });

    // 👨‍💼 NHÂN VIÊN NHẢY VÀO CHAT
    socket.on("staff_join", async (data) => {
      const { threadId, staffId } = data;
      if (!threadId) return;

      db.query("UPDATE threads SET status = 'staff_active', is_ai_muted = 1 WHERE id = ?", [threadId], (err) => {
        if (err) return;

        const sysMsg = {
          threadId,
          senderRole: "SYSTEM",
          senderId: 0,
          message: "👨‍💼 Nhân viên đã tham gia cuộc hội thoại. AI sẽ tạm nghỉ để sếp tư vấn ạ!",
          createdAt: new Date(),
        };
        io.to(String(threadId)).emit("newMessage", sysMsg);
        io.to(String(threadId)).emit("thread_status_updated", { threadId, status: "staff_active", isAiMuted: 1 });
      });
    });

    // 🔄 NHÂN VIÊN BẬT/TẮT AI (TOGGLE AI)
    socket.on("staff_toggle_ai", async (data) => {
      const { threadId, isAiMuted } = data;
      if (!threadId) return;

      db.query("UPDATE threads SET is_ai_muted = ? WHERE id = ?", [isAiMuted ? 1 : 0, threadId], (err) => {
        if (err) return;
        
        const sysMsg = {
          threadId,
          senderRole: "SYSTEM",
          senderId: 0,
          message: isAiMuted 
            ? "⚠️ Nhân viên đã TẮT AI Tiger. Sếp sẽ trực tiếp tư vấn." 
            : "✅ Nhân viên đã BẬT lại AI Tiger để hỗ trợ trả lời khách.",
          createdAt: new Date(),
        };
        io.to(String(threadId)).emit("newMessage", sysMsg);
        io.to(String(threadId)).emit("thread_status_updated", { threadId, isAiMuted: isAiMuted ? 1 : 0 });
      });
    });

    socket.on("send_message", async (data, callback) => {
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

      console.log("Saving message:", { threadId, senderRole, senderId, message });

      db.query(sqlSave, [threadId, senderRole, senderId, message, orderId || null, receiverId || null], async (err, result) => {
        if (err) {
          console.error("Lỗi khi lưu tin nhắn:", err);
          if (typeof callback === "function") callback({ success: false });
          return;
        }
        
        console.log("Đã lưu tin nhắn, emit receive_message tới thread", String(threadId));
        if (typeof callback === "function") callback({ success: true });

        const msgPayload = { id: result.insertId, ...data, createdAt: new Date(), created_at: new Date() };
        io.to(String(threadId)).emit("receive_message", msgPayload);
        io.to(String(threadId)).emit("newMessage", msgPayload);

        // 🔔 Badge: Gửi notification count đến user room của người nhận
        if (receiverId) {
          io.to(String(receiverId)).emit("new_notification_count", 1);
        }

        // ============================================================
        // 🔇 AI TẠM THỜI VÔ HIỆU HÓA HOÀN TOÀN
        // Toàn bộ logic gọi Gemini AI đã được comment để tránh
        // lỗi 404/429 làm gián đoạn luồng Socket thời gian thực.
        // Khi cần bật lại, uncomment khối code bên dưới.
        // ============================================================

        /*
        if (senderRole === "CUSTOMER" || senderRole === "USER") {
          (async () => {
            try {
              const [threadRows] = await db.promise().query("SELECT is_ai_muted, is_human_needed FROM threads WHERE id = ?", [threadId]);
              if (threadRows.length > 0) {
                if (threadRows[0].is_ai_muted === 1) return;
                if (threadRows[0].is_human_needed === 1) return;
              }
              const activeSender = await isUserActive(senderId);
              if (!activeSender) return;
              const currentUserName = await getUserName(senderId);
              let aiReply = "";
              let customerSentiment = "neutral";
              try {
                const aiData = await getSmartAiResponse(message, orderId, currentUserName);
                aiReply = aiData?.reply || "Dạ Tiger nghe đây ạ!";
                customerSentiment = aiData?.sentiment || "neutral";
              } catch (error) {
                if (error.status === 429) {
                  aiReply = "Trợ lý Tiger đang bận một chút, sếp đợi em 30 giây nhé!";
                } else {
                  aiReply = `Dạ ${currentUserName}, Tiger đang bận một chút, nhân viên sẽ hỗ trợ bạn ngay! 🐯`;
                }
              }
              db.query("UPDATE chat_messages SET sentiment = ? WHERE id = ?", [customerSentiment, result.insertId]);
              db.query(sqlSave, [threadId, "SYSTEM", 0, aiReply, orderId || null, senderId], (errAi, resAi) => {
                if (errAi) return;
                const aiMsgPayload = {
                  id: resAi.insertId, threadId, senderRole: "SYSTEM", sender_role: "SYSTEM",
                  senderId: 0, message: aiReply, orderId: orderId || null,
                  createdAt: new Date(), created_at: new Date(),
                };
                io.to(String(threadId)).emit("receive_message", aiMsgPayload);
                io.to(String(threadId)).emit("newMessage", aiMsgPayload);
              });
            } catch (errAsync) {
              console.error("Lỗi AI ngầm:", errAsync);
            }
          })();
        }
        */
      });
    });
  });

  return io;
};

module.exports = { initSocket };