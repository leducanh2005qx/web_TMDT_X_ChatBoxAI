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
//  🛡️ ANTI-EXPLOIT — Kiểm tra điều kiện kích cầu AI
// ============================================================

/**
 * 4 lớp bảo vệ chống gian lận:
 *  1. Trần ngân sách: giỏ hàng >= 300.000đ
 *  2. Rate limit: 1 lần/tháng/user
 *  3. Phân tầng theo giá trị giỏ hàng
 */
async function checkBargainEligibility(userId, cartValue) {
  // Lớp 1: Trần ngân sách tối thiểu
  if (cartValue < 300000) {
    return {
      eligible: false,
      reason: `Giỏ hàng chưa đạt mức tối thiểu 300.000đ để nhận ưu đãi (hiện tại: ${Number(cartValue).toLocaleString("vi-VN")}đ)`
    };
  }

  // Lớp 2: Rate limit — 1 lần/tháng/user
  const [usages] = await db.promise().query(
    `SELECT COUNT(*) AS cnt FROM voucher_usages
     WHERE user_id = ? AND used_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)`,
    [userId]
  );
  if (usages[0].cnt > 0) {
    return {
      eligible: false,
      reason: "Sếp đã nhận ưu đãi từ Tiger AI trong tháng này rồi ạ! Tháng sau em gửi tiếp nhé 🐯"
    };
  }

  // Lớp 3: Phân tầng ưu đãi theo giá trị
  if (cartValue >= 500000) {
    return { eligible: true, tier: "gift_flag" };  // Quà tặng kèm đơn (xử lý lúc checkout)
  } else {
    return { eligible: true, tier: "freeship" };   // Mã Freeship 20k hết hạn 15 phút
  }
}

/**
 * Tạo mã voucher AI thực tế trong DB và gán vào ví user.
 * Mã chỉ dùng 1 lần, hết hạn 15 phút, chỉ target_user_id đó dùng được.
 */
async function generateAIVoucher(userId, tier) {
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  const code = tier === "freeship" ? `AI_SHIP_${random}` : `AI_GIFT_${random}`;

  const [result] = await db.promise().query(
    `INSERT INTO vouchers
       (code, type, value, min_order_value, max_discount, quantity, used,
        start_date, end_date, status, apply_scope, target_user_id, source_type, source)
     VALUES
       (?, 'free_ship', 20000, 0, NULL, 1, 0,
        NOW(), DATE_ADD(NOW(), INTERVAL 15 MINUTE),
        'active', 'all', ?, 'ai_auto', 'SYSTEM')`,
    [code, userId]
  );
  const voucherId = result.insertId;

  // Gán vào ví của user ngay
  await db.promise().query(
    "INSERT INTO user_vouchers (user_id, voucher_id, used) VALUES (?, ?, 0)",
    [userId, voucherId]
  );

  // Ghi nhận vào voucher_usages để chặn gian lận lần sau
  await db.promise().query(
    "INSERT INTO voucher_usages (voucher_id, user_id, source) VALUES (?, ?, ?)",
    [voucherId, userId, tier === "freeship" ? "ai_freeship" : "ai_gift_flag"]
  );

  console.log(`🎁 AI Voucher: ${code} | User #${userId} | Tier: ${tier} | Expires: +15min`);
  return { code, voucherId };
}

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
 *  Bước 6: Anti-exploit check → Tạo voucher thực nếu đủ điều kiện
 *  Bước 7: Trả response về client
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

      for (const msg of recentMessages) {
        conversationHistory.push({
          role: msg.role === "USER" ? "user" : "model",
          parts: [{ text: msg.message }]
        });
      }

      // Gemini yêu cầu history không bắt đầu bằng 'model'
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

    // ── BƯỚC 4: System Instruction nghiêm ngặt ──
    const systemInstruction = `Bạn là "Tiger AI 🐯" – Trợ lý bán hàng chuyên nghiệp của Tiger Shop (Yên Nghĩa, Hà Đông).
Khách hàng đang chat với bạn tên là: ${userName}.

═══════════════════════════════════════
📦 DANH SÁCH SẢN PHẨM HIỆN CÓ TRONG KHO (CÒN HÀNG):
═══════════════════════════════════════
${productCatalogText}
═══════════════════════════════════════

QUY TẮC BẮT BUỘC – VI PHẠM LÀ SAI:

1. CHỈ ĐƯỢC GỢI Ý sản phẩm có trong danh sách trên. TUYỆT ĐỐI không tự bịa ra tên sản phẩm, giá bán, mã sản phẩm nào khác.

2. LỌC GIÁ CHÍNH XÁC: Khi khách nêu ngân sách (ví dụ "300k", "500 nghìn", "dưới 1 triệu"), chỉ gợi ý sản phẩm có giá ≤ ngân sách đó.

3. KHÔNG BỊA CHÍNH SÁCH: Chỉ nói về chính sách thực tế của Tiger Shop (Đổi trả 7 ngày, Giao hàng nội thành Hà Đông).

4. TRÌNH BÀY SÚC TÍCH: Tối đa 200 từ. Gọi khách là "Sếp".

5. QUY TẮC ƯU ĐÃI – TUYỆT ĐỐI TUÂN THỦ:
   - KHÔNG bao giờ tự bịa ra mã giảm giá hay hứa hẹn mã giảm giá.
   - Nếu khách chê đắt: Nhẹ nhàng hỏi nhu cầu hoặc gợi ý sản phẩm rẻ hơn trong danh sách.
   - Chỉ khi response từ hệ thống có kèm field "voucher" thì mới thông báo mã đó cho khách.

6. CHÀO HỎI: Thân thiện, nhiệt tình với emoji 🐯.${orderInfo}`;

    // ── BƯỚC 5: Gọi Gemini API ──
    console.log(`🐯 Tiger AI | User: ${userName} | History: ${conversationHistory.length} turns | Products: ${inStockProducts.length}`);

    const chatModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction,
    });

    const chat = chatModel.startChat({ history: conversationHistory });
    const result = await chat.sendMessage(message.trim());
    const aiReply = result.response.text().trim();

    // ── BƯỚC 6: Lưu lịch sử vào DB ──
    if (userId && sessionId) {
      try {
        await saveMessage(sessionId, "USER", message.trim(), null);
        await saveMessage(sessionId, "AI",   aiReply, null);
      } catch (saveErr) {
        console.error("⚠️ Save AI history error:", saveErr.message);
      }
    }

    // ── BƯỚC 7: Anti-exploit check → Kích cầu thực tế ──
    // Phát hiện ý định mặc cả từ khách
    const lowerMsg = message.toLowerCase();
    const isBargainIntent = (
      lowerMsg.includes("đắt")    || lowerMsg.includes("mắc")      ||
      lowerMsg.includes("chê")    || lowerMsg.includes("suy nghĩ") ||
      lowerMsg.includes("nghĩ thêm") || lowerMsg.includes("giảm giá") ||
      lowerMsg.includes("có mã không") || lowerMsg.includes("discount")
    );

    let voucherCode    = null;
    let incentiveType  = null;
    let incentiveDenied = null;

    if (isBargainIntent && userId) {
      const cartValue = req.body.cartValue ? Number(req.body.cartValue) : 0;
      if (cartValue > 0) {
        try {
          const eligibility = await checkBargainEligibility(userId, cartValue);
          if (eligibility.eligible) {
            if (eligibility.tier === "freeship") {
              const generated = await generateAIVoucher(userId, "freeship");
              voucherCode   = generated.code;
              incentiveType = "freeship";
            } else {
              // gift_flag: quà tặng được tự động thêm lúc checkout, không cần mã
              incentiveType = "gift_flag";
            }
          } else {
            incentiveDenied = eligibility.reason;
          }
        } catch (e) {
          console.error("⚠️ AI incentive error:", e.message);
        }
      }
    }

    return res.json({
      success: true,
      reply: aiReply,
      voucher: voucherCode,         // null hoặc mã Freeship thật (tồn tại trong DB)
      incentiveType,                // 'freeship' | 'gift_flag' | null
      incentiveDenied               // lý do từ chối nếu không đủ điều kiện
    });

  } catch (error) {
    console.error("❌ AI CHAT ERROR:", error.message || error);
    return res.status(200).json({
      success: false,
      error: "Tiger AI đang bảo trì, sếp hãy nhắn cho nhân viên ở phía dưới nhé!"
    });
  }
};

