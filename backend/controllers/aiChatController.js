const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("../config/db");
const Chat = require("../models/Chat");
const { getInStockProducts } = require("../services/aiService");

// ============================================================
//  🗃️ AI CHAT HISTORY HELPERS
// ============================================================

/**
 * Lấy hoặc tạo mới session AI chat cho user
 */
async function getOrCreateSession(userId) {
  const [rows] = await db.promise().query(
    "SELECT id FROM ai_chat_sessions WHERE user_id = ?",
    [userId]
  );
  if (rows.length > 0) return rows[0].id;

  const [result] = await db.promise().query(
    "INSERT INTO ai_chat_sessions (user_id) VALUES (?)",
    [userId]
  );
  return result.insertId;
}

/**
 * Lưu một tin nhắn vào lịch sử
 */
async function saveMessage(sessionId, role, message, voucher = null) {
  await db.promise().query(
    "INSERT INTO ai_chat_messages (session_id, role, message, voucher) VALUES (?, ?, ?, ?)",
    [sessionId, role, message, voucher]
  );
}

/**
 * Lấy N tin nhắn gần nhất của session để nạp vào history Gemini
 * Trả về theo thứ tự ASC (cũ → mới) để Gemini hiểu đúng thứ tự hội thoại
 */
async function getRecentMessages(sessionId, limit = 10) {
  const [rows] = await db.promise().query(
    `SELECT role, message FROM (
       SELECT role, message, created_at
       FROM ai_chat_messages
       WHERE session_id = ?
       ORDER BY created_at DESC
       LIMIT ?
     ) AS recent
     ORDER BY created_at ASC`,
    [sessionId, limit]
  );
  return rows;
}

// ============================================================
//  📖 GET AI HISTORY – Lấy toàn bộ lịch sử chat AI
// ============================================================

/**
 * GET /ai/history – Lấy toàn bộ lịch sử chat AI của user hiện tại
 */
exports.getAiHistory = async (req, res) => {
  const userId = req.user.id;
  try {
    const [sessions] = await db.promise().query(
      "SELECT id FROM ai_chat_sessions WHERE user_id = ?",
      [userId]
    );
    if (sessions.length === 0) return res.json([]);

    const sessionId = sessions[0].id;
    const [messages] = await db.promise().query(
      `SELECT id, role, message, voucher, created_at
       FROM ai_chat_messages
       WHERE session_id = ?
       ORDER BY created_at ASC
       LIMIT 100`,
      [sessionId]
    );
    res.json(messages);
  } catch (err) {
    console.error("getAiHistory error:", err);
    res.status(500).json({ error: "Lỗi lấy lịch sử chat" });
  }
};

// ============================================================
//  🗑️ CLEAR AI HISTORY – Xoá lịch sử chat AI
// ============================================================

/**
 * DELETE /ai/history – Xoá toàn bộ lịch sử chat AI của user
 */
exports.clearAiHistory = async (req, res) => {
  const userId = req.user.id;
  try {
    const [sessions] = await db.promise().query(
      "SELECT id FROM ai_chat_sessions WHERE user_id = ?",
      [userId]
    );
    if (sessions.length === 0) return res.json({ success: true });

    await db.promise().query(
      "DELETE FROM ai_chat_messages WHERE session_id = ?",
      [sessions[0].id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("clearAiHistory error:", err);
    res.status(500).json({ error: "Lỗi xoá lịch sử" });
  }
};

// ============================================================
//  💡 GET CHAT SUGGESTIONS – Gợi ý phản hồi nhanh cho nhân viên
// ============================================================

/**
 * Lấy gợi ý phản hồi nhanh cho nhân viên (human chat panel)
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

// ============================================================
//  🤖 CHAT WITH AI – Core handler (Multi-turn + Grounding)
// ============================================================

/**
 * POST /ai/talk – Xử lý chat với Tiger AI
 *
 * Luồng xử lý:
 *  Bước 1: Lấy session + 10 tin nhắn gần nhất → build history[]
 *  Bước 2: Query catalog sản phẩm còn hàng (stock > 0) → grounding data
 *  Bước 3: Thiết lập systemInstruction nghiêm ngặt với catalog thực tế
 *  Bước 4: Gọi Gemini multi-turn chat với history đầy đủ
 *  Bước 5: Lưu USER message + AI reply vào DB
 *  Bước 6: Trả response về client
 */
exports.chatWithAi = async (req, res) => {
  const { message, orderId } = req.body;
  const userId   = req.user ? req.user.id   : null;
  const userName = req.user ? req.user.name : "bạn";

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, error: "Tin nhắn không được để trống." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ success: false, error: "Tiger AI đang bảo trì, sếp hãy nhắn cho nhân viên ở phía dưới nhé!" });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // ── BƯỚC 1: Lấy session + lịch sử hội thoại gần nhất ──
    let sessionId = null;
    let conversationHistory = [];

    if (userId) {
      sessionId = await getOrCreateSession(userId);
      const recentMessages = await getRecentMessages(sessionId, 10);

      // Chuyển đổi sang định dạng Gemini multi-turn history
      // Lưu ý: Gemini yêu cầu history phải bắt đầu bằng role 'user'
      // và phải xen kẽ user/model. Ta lọc để đảm bảo tính hợp lệ.
      for (const msg of recentMessages) {
        conversationHistory.push({
          role: msg.role === "USER" ? "user" : "model",
          parts: [{ text: msg.message }]
        });
      }

      // Đảm bảo history hợp lệ: không bắt đầu bằng 'model'
      if (conversationHistory.length > 0 && conversationHistory[0].role === "model") {
        conversationHistory.shift();
      }
    }

    // ── BƯỚC 2: Query catalog sản phẩm còn hàng ──
    const inStockProducts = await getInStockProducts();

    let productCatalogText = "(Hiện tại kho hàng chưa có sản phẩm nào. Hãy thông báo cho khách hàng.)";
    if (inStockProducts.length > 0) {
      const catalogLines = inStockProducts.map(p => {
        const priceFormatted = Number(p.price).toLocaleString("vi-VN");
        const desc = p.description ? p.description.substring(0, 60).replace(/\n/g, " ") : "";
        return `• [ID:${p.id}] ${p.name} | Giá: ${priceFormatted}đ | Tồn kho: ${p.stock} | Danh mục: ${p.category}${desc ? ` | Mô tả: ${desc}` : ""}`;
      });
      productCatalogText = catalogLines.join("\n");
    }

    // ── BƯỚC 3: Thông tin đơn hàng (nếu có) ──
    let orderInfo = "";
    if (orderId) {
      const [orders] = await db.promise().query(
        "SELECT id, total, status FROM orders WHERE id = ?",
        [orderId]
      );
      if (orders.length > 0) {
        const o = orders[0];
        orderInfo = `\n\nĐƠN HÀNG ĐÍNH KÈM: Đơn #${o.id} | Trạng thái: ${o.status} | Tổng: ${Number(o.total).toLocaleString("vi-VN")}đ`;
      }
    }

    // ── BƯỚC 4: Xây dựng System Instruction nghiêm ngặt ──
    const systemInstruction = `Bạn là "Tiger AI 🐯" – Trợ lý bán hàng chuyên nghiệp của Tiger Shop (Yên Nghĩa, Hà Đông).
Khách hàng đang chat với bạn tên là: ${userName}.

═══════════════════════════════════════
📦 DANH SÁCH SẢN PHẨM HIỆN CÓ TRONG KHO (CÒN HÀNG):
═══════════════════════════════════════
${productCatalogText}
═══════════════════════════════════════

QUY TẮC BẮT BUỘC – VI PHẠM LÀ SAI:

1. CHỈ ĐƯỢC GỢI Ý sản phẩm có trong danh sách trên. TUYỆT ĐỐI không tự bịa ra tên sản phẩm, giá bán, mã sản phẩm nào khác.

2. LỌC GIÁ CHÍNH XÁC: Khi khách nêu ngân sách (ví dụ "300k", "500 nghìn", "dưới 1 triệu"), chỉ gợi ý sản phẩm có giá ≤ ngân sách đó. Nếu không có sản phẩm nào phù hợp, thông báo lịch sự và gợi ý sản phẩm gần nhất.

3. KHÔNG BỊA CHÍNH SÁCH: Chỉ nói về chính sách thực tế của Tiger Shop (Đổi trả 7 ngày, Giao hàng nội thành Hà Đông). KHÔNG được tự thêm chính sách bảo hành vô lý (ví dụ thực phẩm/đồ ăn không có bảo hành 12 tháng).

4. TRÌNH BÀY SÚC TÍCH: Trả lời ngắn gọn, rõ ràng, xuống dòng từng ý. Tối đa 200 từ mỗi câu trả lời. Gọi khách là "Sếp".

5. KHI KHÁCH PHÂN VÂN / CHÊ ĐẮT: Nhẹ nhàng hỏi thêm nhu cầu hoặc gợi ý sản phẩm tương tự rẻ hơn trong danh sách.

6. CHÀO HỎI: Trả lời thân thiện, nhiệt tình với emoji 🐯. Hỏi khách cần hỗ trợ gì khi mới bắt đầu hội thoại.${orderInfo}`;

    // ── BƯỚC 5: Gọi Gemini API với multi-turn history ──
    console.log(`🐯 Tiger AI | User: ${userName} | History: ${conversationHistory.length} turns | Products: ${inStockProducts.length}`);

    const chatModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction,
    });

    const chat = chatModel.startChat({
      history: conversationHistory,
    });

    const result = await chat.sendMessage(message.trim());
    const response = await result.response;
    const aiReply = response.text().trim();

    // ── BƯỚC 6: Lưu USER message + AI reply vào DB ──
    if (userId && sessionId) {
      try {
        await saveMessage(sessionId, "USER", message.trim(), null);
        await saveMessage(sessionId, "AI",   aiReply, null);
      } catch (saveErr) {
        // Không block response nếu lưu lỗi
        console.error("⚠️ Save AI history error:", saveErr.message);
      }
    }

    // ── Kiểm tra có nên tặng voucher không (dựa trên từ khoá) ──
    const lowerReply = aiReply.toLowerCase();
    const lowerMsg   = message.toLowerCase();
    const shouldOfferVoucher = (
      lowerMsg.includes("đắt") ||
      lowerMsg.includes("mắc") ||
      lowerMsg.includes("chê") ||
      lowerMsg.includes("suy nghĩ") ||
      lowerMsg.includes("nghĩ thêm") ||
      lowerReply.includes("ưu đãi") ||
      lowerReply.includes("khuyến mãi")
    );
    const voucher = shouldOfferVoucher ? "TIGER_PROMO_10" : null;

    return res.json({
      success: true,
      reply: aiReply,
      voucher: voucher
    });

  } catch (error) {
    console.error("❌ AI CHAT ERROR:", error.message || error);
    return res.status(200).json({
      success: false,
      error: "Tiger AI đang bảo trì, sếp hãy nhắn cho nhân viên ở phía dưới nhé!"
    });
  }
};
