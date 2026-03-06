const { Server } = require("socket.io");
const db = require("./config/db");

const initSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: "*" },
    transports: ["websocket"],
  });

  // --- HÀM TRUY XUẤT TÊN TÁC NHÂN (USER) TỪ DATABASE ---
  const getUserName = async (userId) => {
    try {
      // Mỗi khi gọi, nó sẽ vào DB tìm đúng tên của ID đó
      const [rows] = await db
        .promise()
        .query("SELECT name FROM users WHERE id = ?", [userId]);
      return rows.length > 0 ? rows[0].name : "bạn";
    } catch (err) {
      return "bạn";
    }
  };

  // --- LOGIC PHẢN HỒI THÔNG MINH (Xử lý chữ thừa & Đa tác nhân) ---
  const getSmartAiResponse = async (userMessage, orderId, userName) => {
    const msg = userMessage.toLowerCase().trim();

    // 1. Nhận diện từ khóa Đơn hàng (Dù câu hỏi dài/thừa chữ)
    if (
      msg.includes("đơn hàng") ||
      msg.includes("trạng thái") ||
      msg.includes("kiểm tra")
    ) {
      if (!orderId) {
        return `Dạ ${userName}, để kiểm tra chính xác, bạn vui lòng chọn đơn hàng ở phía trên nhé! 🚚`;
      }
      try {
        const [order] = await db
          .promise()
          .query("SELECT status FROM orders WHERE id = ?", [orderId]);
        const statusMap = {
          pending: "chờ xử lý",
          shipping: "đang giao",
          completed: "hoàn tất",
        };
        return `Dạ ${userName}, đơn hàng #${orderId} của bạn hiện ${statusMap[order[0].status] || "đang xử lý"}. 📦`;
      } catch (e) {
        return `Dạ ${userName}, Tiger chưa lấy được dữ liệu đơn này.`;
      }
    }

    // 2. Nhận diện từ khóa Thanh toán
    if (
      msg.includes("thanh toán") ||
      msg.includes("ngân hàng") ||
      msg.includes("mb")
    ) {
      return `Dạ ${userName}, bạn có thể chuyển khoản qua MB Bank: 3616042005888 (LE DINH DUC ANH) ạ! 💳`;
    }

    // 3. Chào hỏi theo tên tác nhân
    if (
      msg.includes("xin chào") ||
      msg.includes("hi") ||
      msg.includes("hello")
    ) {
      return `Chào ${userName}! Tiger Shop rất vui được hỗ trợ bạn. ✨`;
    }

    // Phản hồi mặc định
    return `Cảm ơn ${userName}! Tiger đã nhận được yêu cầu. Shop sẽ phản hồi bạn sớm nhất nhé! 🐯`;
  };

  io.on("connection", (socket) => {
    socket.on("joinThread", (data) => {
      if (data.threadId) socket.join(String(data.threadId));
    });

    socket.on("send_message", async (data) => {
      const { threadId, senderRole, senderId, message, orderId, receiverId } =
        data;

      const sqlSave = `
        INSERT INTO chat_messages 
        (thread_id, sender_role, sender_id, message, order_id, receiver_id, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;

      db.query(
        sqlSave,
        [
          threadId,
          senderRole,
          senderId,
          message,
          orderId || null,
          receiverId || null,
        ],
        async (err, result) => {
          if (err) return;

          io.to(String(threadId)).emit("newMessage", {
            id: result.insertId,
            ...data,
            createdAt: new Date(),
          });

          // AI PHẢN HỒI DỰA TRÊN TÊN THẬT TRONG DB
          if (senderRole === "CUSTOMER" || senderRole === "USER") {
            // Bước này đảm bảo lấy tên mới nhất từ DB của người gửi hiện tại
            const currentUserName = await getUserName(senderId);
            const aiReply = await getSmartAiResponse(
              message,
              orderId,
              currentUserName,
            );

            setTimeout(() => {
              db.query(
                sqlSave,
                [threadId, "SYSTEM", 0, aiReply, orderId || null, senderId],
                (errAi, resAi) => {
                  io.to(String(threadId)).emit("newMessage", {
                    id: resAi.insertId,
                    threadId,
                    senderRole: "SYSTEM",
                    senderId: 0,
                    message: aiReply,
                    orderId: orderId || null,
                    createdAt: new Date(),
                  });
                },
              );
            }, 1000);
          }
        },
      );
    });
  });

  return io;
};

module.exports = { initSocket };
