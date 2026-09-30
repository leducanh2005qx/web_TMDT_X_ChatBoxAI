const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("../config/db");
const Chat = require("../models/Chat");
const { getInStockProducts } = require("../services/aiService");

// ===========================================================
//  🗃️ AI CHAT HISTORY HELPERS
// ===========================================================

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
    `SELECT role, message FROM (\
       SELECT role, message, created_at\
       FROM ai_chat_messages\
       WHERE session_id = ?\
       ORDER BY created_at DESC\
       LIMIT ?\
     ) AS recent\
     ORDER BY created_at ASC`,
    [sessionId, limit]
  );
  return rows;
}

// ===========================================================
//  📖 GET AI HISTORY – Lấy toàn bộ lịch sử chat AI
// ===========================================================
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
      `SELECT id, role, message, voucher, created_at\
       FROM ai_chat_messages\
       WHERE session_id = ?\
       ORDER BY created_at ASC\
       LIMIT 100`,
      [sessionId]
    );
    res.json(messages);
  } catch (err) {
    console.error("getAiHistory error:", err);
    res.status(500).json({ error: "Lỗi lấy lịch sử chat" });
  }
};

// ===========================================================
//  🗑️ CLEAR AI HISTORY – Xoá lịch sử chat AI
// ===========================================================
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

// ===========================================================
//  💡 GET CHAT SUGGESTIONS – Gợi ý phản hồi nhanh cho nhân viên
// ===========================================================
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

// ===========================================================
//  🛡️ ANTI-EXPLOIT — Kiểm tra điều kiện kích cầu AI
// ===========================================================
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
    `SELECT COUNT(*) AS cnt FROM voucher_usages\
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
    return { eligible: true, tier: "percent" };  // Giảm 5% tối đa 100k
  } else {
    return { eligible: true, tier: "freeship" }; // Mã Freeship 20k
  }
}

/**
 * Tạo mã voucher AI thực tế trong DB và gán vào ví user.
 * Tier "freeship" : Giỏ 300k–499k → Freeship 20k, hết hạn 15 phút
 * Tier "percent"  : Giỏ ≥ 500k    → Giảm 5% tối đa 100k, hết hạn 15 phút
 */
async function generateAIVoucher(userId, tier) {
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();

  let code, insertSQL, insertParams;

  if (tier === "percent") {
    // Giảm 5% tối đa 100k
    code = `AI_5PCT_${random}`;
    insertSQL = `INSERT INTO vouchers
       (code, type, value, min_order_value, max_discount, quantity, used,
        start_date, end_date, status, apply_scope, target_user_id, source_type, source)
     VALUES
       (?, 'percent', 5, 500000, 100000, 1, 0,
        NOW(), DATE_ADD(NOW(), INTERVAL 15 MINUTE),
        'active', 'all', ?, 'ai_auto', 'SYSTEM')`;
    insertParams = [code, userId];
  } else {
    // Freeship 20k (tier = "freeship")
    code = `AI_SHIP_${random}`;
    insertSQL = `INSERT INTO vouchers
       (code, type, value, min_order_value, max_discount, quantity, used,
        start_date, end_date, status, apply_scope, target_user_id, source_type, source)
     VALUES
       (?, 'free_ship', 20000, 0, NULL, 1, 0,
        NOW(), DATE_ADD(NOW(), INTERVAL 15 MINUTE),
        'active', 'all', ?, 'ai_auto', 'SYSTEM')`;
    insertParams = [code, userId];
  }

  const [result] = await db.promise().query(insertSQL, insertParams);
  const voucherId = result.insertId;

  await db.promise().query(
    "INSERT INTO user_vouchers (user_id, voucher_id, used) VALUES (?, ?, 0)",
    [userId, voucherId]
  );

  await db.promise().query(
    "INSERT INTO voucher_usages (voucher_id, user_id, source) VALUES (?, ?, ?)",
    [voucherId, userId, tier === "percent" ? "ai_percent" : "ai_freeship"]
  );

  const label = tier === "percent" ? "Giảm 5% tối đa 100k" : "Freeship 20k";
  console.log(`🎁 AI Voucher [${label}]: ${code} | User #${userId} | Expires: +15min`);
  return { code, voucherId, tier };
}


// ===========================================================
//  🔍 SEARCH HELPER – Tìm sản phẩm theo từ khóa trong DB
// ===========================================================
/**
 * Tìm kiếm sản phẩm theo keyword trong DB (tên hoặc danh mục).
 * Trả về danh sách sản phẩm còn hàng khớp với keyword (hoặc [] nếu không có).
 */
async function searchProductInDatabase(keyword) {
  if (!keyword || !keyword.trim()) return [];
  const kw = `%${keyword.trim()}%`;
  const [rows] = await db.promise().query(
    `SELECT p.id, p.name, p.price, p.stock, p.image,
            IFNULL(c.name, 'Chưa phân loại') AS category
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE (p.name LIKE ? OR c.name LIKE ?)
       AND p.stock > 0
       AND p.status = 'active'
       AND p.deleted_at IS NULL
     ORDER BY CASE WHEN p.name LIKE ? THEN 0 ELSE 1 END, p.name ASC
     LIMIT 5`,
    [kw, kw, kw]
  );
  return rows;
}


// ===========================================================
//  🤖 MASTER INTENT ROUTER – Unified chat endpoint
// ===========================================================
/**
 * POST /api/chat/message – Unified endpoint for AI chat.
 * Payload: { message: string, imageBase64: string|null, attachedProductId: number|null, cartValue: number }
 * Returns JSON with responseType and appropriate data.
 */
exports.unifiedChatMessage = async (req, res) => {
  const { message, imageBase64 = null, attachedProductId = null, cartValue = 0 } = req.body;
  const userId = req.user ? req.user.id : null;
  const userName = req.user ? req.user.name : "bạn";

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, error: "Tin nhắn không được để trống." });
  }

  // -------------------------------------------------------
  // 0️⃣ [LOCAL] Intent pre-detector – chạy TRƯỚC Gemini và keyword extractor
  //    Nếu phát hiện chắc chắn PROMO hoặc SUPPORT → skip Gemini + skip keyword
  // -------------------------------------------------------
  function detectIntentLocal(text) {
    const t = text.toLowerCase();

    const PROMO_SIGNALS = [
      "voucher", "mã giảm", "khuyến mãi", "giảm giá", "discount", "coupon", "deal",
      "ưu đãi", "có ưu đãi", "giá cao", "đắt quá", "mắc quá", "đắt vậy",
      "tài chính", "budget", "hạn chế", "giá tốt hơn", "rẻ hơn không",
      "giảm không", "có mã không", "code giảm", "chê đắt",
    ];
    const SUPPORT_SIGNALS = [
      "lỗi", "hỏng", "bảo hành", "đổi trả", "hoàn tiền", "bị hỏng",
      "không hoạt động", "sự cố", "phàn nàn", "khiếu nại", "trả hàng",
      "hàng lỗi", "bị vỡ", "không dùng được",
    ];

    if (PROMO_SIGNALS.some(k => t.includes(k)))   return "PROMO";
    if (SUPPORT_SIGNALS.some(k => t.includes(k))) return "SUPPORT";
    return null; // không chắc → để Gemini quyết định
  }

  // -------------------------------------------------------
  // 1️⃣ [LOCAL] Keyword extractor – chạy TRƯỚC khi gọi Gemini
  //    để đảm bảo luôn có keyword dù Gemini lỗi/timeout
  // -------------------------------------------------------
  /**
   * Trích xuất từ khóa sản phẩm từ câu tiếng Việt bằng regex.
   * VD: "tôi muốn xem đồng hồ" → "đồng hồ"
   *     "có mẫu quần áo không" → "quần áo"
   */
  function extractKeywordLocal(text) {
    const t = text.toLowerCase().trim();

    // Terminator: từ kết câu phổ biến (chuẩn + viết tắt/slang)
    const TERM = String.raw`(?:\s+(?:không|ko|k|hông|ha|hả|nha|nhé|ạ|vậy|thôi|đi|ơi|nhỉ|hen|nè|á)|$|\?)`;

    const patterns = [
      // "có X k/không/ko", "bán X không"
      new RegExp(`(?:có|bán|có\\s+bán)\\s+([a-zA-ZÀ-ỹ\\s]{2,30}?)${TERM}`),
      // "tham khảo mẫu X", "xem mẫu X", "tìm mẫu X"
      new RegExp(`(?:tham\\s+khảo|xem|tìm)\\s+mẫu\\s+([a-zA-ZÀ-ỹ\\s]{2,30}?)${TERM}`),
      // "muốn mua X", "muốn xem X", "cần X"
      new RegExp(`(?:muốn|cần)\\s+(?:mua|xem|tìm|đặt)\\s+([a-zA-ZÀ-ỹ\\s]{2,30}?)${TERM}`),
      // "tìm X", "xem X", "mua X" đầu câu
      new RegExp(`^(?:tìm|xem|mua)\\s+([a-zA-ZÀ-ỹ\\s]{2,30}?)${TERM}`),
      // "cho xem X", "cho t xem X"
      new RegExp(`cho(?:\\s+\\S+)?\\s+xem\\s+([a-zA-ZÀ-ỹ\\s]{2,30}?)${TERM}`),
      // "X thì sao", "X của shop", "X giá bao nhiêu"
      /^([a-zA-ZÀ-ỹ\s]{2,25}?)\s+(?:thì\s+sao|của\s+shop|bao\s+nhiêu|giá|có\s+không|có\s+k\b)/,
    ];

    // Strip noise/slang ở CUỐI keyword bị lọt qua regex
    const TRAILING_NOISE = /\s+(?:k|ko|không|ha|hả|nha|nhé|ạ|thôi|vậy|đi|ơi|nhỉ|hen|nè|á)$/i;

    const STOPWORDS = new Set(["em", "mình", "tôi", "bạn", "shop", "sản phẩm", "hàng", "gì", "cái", "loại", "mẫu"]);

    for (const pattern of patterns) {
      const m = t.match(pattern);
      if (m && m[1]) {
        let kw = m[1].trim().replace(/\s+/g, " ");
        kw = kw.replace(TRAILING_NOISE, "").trim();
        if (kw.length >= 2 && !STOPWORDS.has(kw)) {
          return kw;
        }
      }
    }
    return null;
  }

  // -------------------------------------------------------
  // 2️⃣ Intent + specificProduct via Gemini (+ local fallback)
  //    Intent classifier dùng GEMINI_API_KEY_SALE (key tư vấn bán hàng)
  //    Fallback về GEMINI_API_KEY nếu key chuyên dụng chưa có
  // -------------------------------------------------------
  const keySale    = process.env.GEMINI_API_KEY_SALE    || process.env.GEMINI_API_KEY;
  const keyReturn  = process.env.GEMINI_API_KEY_RETURN  || process.env.GEMINI_API_KEY;
  const keyVoucher = process.env.GEMINI_API_KEY_VOUCHER || process.env.GEMINI_API_KEY;

  if (!keySale) {
    return res.status(200).json({ success: false, error: "Tiger AI đang bảo trì, sếp hãy nhắn cho nhân viên ở phía dưới nhé!" });
  }

  // Helper tạo model với key riêng
  const makeModel = (apiKey, modelName, systemInstruction) =>
    new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: modelName, systemInstruction });

  let intent = "SALE";
  let specificProduct = null;
  let isContextReference = false;

  // ── Bước 1: Kiểm tra local trước (không tốn API call)
  const preIntent = detectIntentLocal(message);

  if (preIntent) {
    // Phát hiện chắc chắn PROMO/SUPPORT → skip Gemini hoàn toàn
    intent = preIntent;
    console.log(`[LocalIntent] Detected: ${intent} from: "${message}"`);
  } else {
    // Cần Gemini để phân loại (câu mơ hồ, có thể là SALE)
    const intentSystemPrompt = `Bạn là bộ phân tích ý định của Tiger Shop. Phân tích câu nói của khách và trả về JSON duy nhất theo cấu trúc:
{
  "intent": "SALE" | "SUPPORT" | "PROMO",
  "specificProduct": "<từ khóa sản phẩm cụ thể nếu khách nhắc đích danh, ví dụ 'đồng hồ', 'giày sneaker', 'quần áo', hoặc null nếu câu mập mờ/tham chiếu như 'cái này' 'đôi này' 'sản phẩm đó'>",
  "isContextReference": <true nếu khách đang nói về sản phẩm đang xem ('cái này', 'đôi này', 'sản phẩm này'), false nếu khách nhắc đích danh loại hàng hoặc không rõ>
}
Chỉ trả về JSON, không thêm bất cứ gì.`;

    const intentChat = makeModel(keySale, "gemini-2.5-flash", intentSystemPrompt).startChat();

    try {
      const intentResult = await intentChat.sendMessage(message.trim());
      const intentText = intentResult.response.text().trim().replace(/```json\s*|```/g, "").trim();
      try {
        const parsed = JSON.parse(intentText);
        intent = (parsed.intent || "SALE").toUpperCase();
        specificProduct = parsed.specificProduct || null;
        isContextReference = !!parsed.isContextReference;
      } catch (_) {
        // JSON parse thất bại → keyword matching
        const lower = message.toLowerCase();
        if (lower.includes("giảm giá") || lower.includes("voucher") || lower.includes("khuyến mãi")) intent = "PROMO";
        else if (lower.includes("lỗi") || lower.includes("bảo hành") || lower.includes("hỏng")) intent = "SUPPORT";
        else intent = "SALE";
      }
    } catch (err) {
      console.error("Intent classification error:", err);
      intent = "SALE";
    }
  }

  // 🔧 FALLBACK: nếu Gemini không trả được specificProduct VÀ intent là SALE, dùng extractor local
  if (intent === "SALE" && !specificProduct && !isContextReference) {
    specificProduct = extractKeywordLocal(message);
    console.log(`[LocalKW] Extracted keyword: "${specificProduct}" from: "${message}"`);
  }

  // -------------------------------------------------------
  // 3️⃣ Switch handling based on intent – mỗi intent dùng key riêng
  // -------------------------------------------------------

  try {

    // ── SALE INTENT ──────────────────────────────────────
    if (intent === "SALE") {
      const inStockProducts = await getInStockProducts();
      let suggestedProduct = null;
      let didSearch = false; // Đã thực hiện search chưa?

      // Rule A: Khách nhắc đích danh sản phẩm CỤ THỂ → tìm trong DB theo keyword
      if (specificProduct && !isContextReference) {
        didSearch = true;
        const searchResults = await searchProductInDatabase(specificProduct);

        if (searchResults.length === 0) {
          // Không tìm thấy → xin lỗi khéo, KHÔNG trả checkout_card
          const apologyMsg = `Dạ, hiện tại Tiger Shop em chưa kinh doanh mặt hàng "${specificProduct}" ạ 😅. Sếp có muốn xem các sản phẩm bên em đang có không ạ? 🐯`;
          if (userId) {
            const sessionId = await getOrCreateSession(userId);
            await saveMessage(sessionId, "USER", message.trim(), null);
            await saveMessage(sessionId, "AI", apologyMsg, null);
          }
          return res.json({ responseType: "text", reply: apologyMsg });
        }

        // Có kết quả → lấy sản phẩm khớp nhất
        suggestedProduct = searchResults[0];

      // Rule B: Câu tham chiếu ("cái này", "đôi này") + có attachedProductId
      } else if (isContextReference && attachedProductId) {
        suggestedProduct = inStockProducts.find(p => p.id === parseInt(attachedProductId)) || null;

        if (!suggestedProduct) {
          const notFoundMsg = `Dạ sản phẩm này hiện tại bên em không còn hàng hoặc không tìm thấy sếp ơi 😅. Sếp muốn xem sản phẩm khác không ạ? 🐯`;
          if (userId) {
            const sessionId = await getOrCreateSession(userId);
            await saveMessage(sessionId, "USER", message.trim(), null);
            await saveMessage(sessionId, "AI", notFoundMsg, null);
          }
          return res.json({ responseType: "text", reply: notFoundMsg });
        }

      // Rule C: Câu mập mờ + có attachedProductId → dùng sản phẩm đang xem
      } else if (attachedProductId && !specificProduct) {
        suggestedProduct = inStockProducts.find(p => p.id === parseInt(attachedProductId)) || null;
      }

      // Rule D: Không xác định được sản phẩm → hiện catalog CHUNG (không có keyword cụ thể)
      if (!suggestedProduct && !didSearch) {
        const catalogText = inStockProducts.length > 0
          ? inStockProducts.slice(0, 5).map(p =>
              `• ${p.name} – ${Number(p.price).toLocaleString("vi-VN")}đ`
            ).join("\n")
          : "(Hiện tại shop chưa có sản phẩm nào đang bán)";

        const advisoryMsg = `Dạ Tiger Shop em đang có các sản phẩm sau đây, sếp tham khảo nhé:\n\n${catalogText}\n\nSếp muốn tìm loại hàng cụ thể nào ạ? 🐯`;
        if (userId) {
          const sessionId = await getOrCreateSession(userId);
          await saveMessage(sessionId, "USER", message.trim(), null);
          await saveMessage(sessionId, "AI", advisoryMsg, null);
        }
        return res.json({ responseType: "text", reply: advisoryMsg });
      }



      // ✅ Đã xác định chính xác sản phẩm → trả checkout_card
      const data = {
        productId: suggestedProduct.id,
        productName: suggestedProduct.name,
        productPrice: suggestedProduct.price,
        productImage: suggestedProduct.images || null,
        suggestedSize: null,
      };

      if (userId) {
        const sessionId = await getOrCreateSession(userId);
        await saveMessage(sessionId, "USER", message.trim(), null);
        await saveMessage(sessionId, "AI", "[checkout_card]", null);
      }

      return res.json({ responseType: "checkout_card", data });
    }

    // ── SUPPORT INTENT ────────────────────────────────────
    if (intent === "SUPPORT") {
      const responseMessage = "Dạ, để thay đổi địa chỉ, hủy đơn hay bảo hành, sếp chọn đơn hàng bên dưới để Tiger hỗ trợ xử lý nhé! 🐯";
      if (userId) {
        const sessionId = await getOrCreateSession(userId);
        await saveMessage(sessionId, "USER", message.trim(), null);
        await saveMessage(sessionId, "AI", responseMessage, null);
      }
      return res.json({ responseType: "return_card", message: responseMessage });
    }

    // ── PROMO INTENT ──────────────────────────────────────
    if (intent === "PROMO") {
      if (!userId) {
        return res.json({ responseType: "text", reply: "Bạn cần đăng nhập để nhận voucher." });
      }
      const eligibility = await checkBargainEligibility(userId, Number(cartValue));
      if (!eligibility.eligible) {
        return res.json({ responseType: "text", reply: eligibility.reason });
      }
      let voucherData = null;
      if (eligibility.tier === "freeship") {
        const generated = await generateAIVoucher(userId, "freeship");
        voucherData = {
          voucherCode: generated.code,
          discount: 20000,
          discountLabel: "Miễn phí vận chuyển",
          expiresIn: 15,
        };
      } else if (eligibility.tier === "percent") {
        const generated = await generateAIVoucher(userId, "percent");
        voucherData = {
          voucherCode: generated.code,
          discount: 5,
          discountLabel: "Giảm 5% tối đa 100.000đ",
          expiresIn: 15,
        };
      }

      if (userId) {
        const sessionId = await getOrCreateSession(userId);
        await saveMessage(sessionId, "USER", message.trim(), null);
        await saveMessage(sessionId, "AI", "[voucher_card]", voucherData?.voucherCode || null);
      }
      return res.json({ responseType: "voucher_card", data: voucherData });
    }

    // Default fallback
    return res.json({ responseType: "text", reply: "Xin lỗi, không hiểu yêu cầu của sếp. Vui lòng thử lại." });

  } catch (err) {
    console.error("Unified chat error:", err);
    return res.status(200).json({ success: false, error: "Tiger AI đang bảo trì, sếp hãy nhắn cho nhân viên ở phía dưới nhé!" });
  }
};



// Existing AI chat endpoint retained for backward compatibility
/**
 * POST /ai/talk – Xử lý chat với Tiger AI (legacy)
 */
exports.chatWithAi = async (req, res) => {
  const { message, orderId } = req.body;
  const userId = req.user ? req.user.id : null;
  const userName = req.user ? req.user.name : "bạn";

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, error: "Tin nhắn không được để trống." });
  }

  // legacy chatWithAi dùng key SALE (key tư vấn bán hàng)
  const apiKey = process.env.GEMINI_API_KEY_SALE || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ success: false, error: "Tiger AI đang bảo trì, sếp hãy nhắn cho nhân viên ở phía dưới nhé!" });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // Bước 1: Lấy session + lịch sử hội thoại gần nhất
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

      if (conversationHistory.length > 0 && conversationHistory[0].role === "model") {
        conversationHistory.shift();
      }
    }

    // Bước 2: Query catalog sản phẩm còn hàng
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

    // Bước 3: Thông tin đơn hàng (nếu có)
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

    // Bước 4: System Instruction nghiêm ngặt
    const systemInstruction = `Bạn là "Tiger AI 🐯" – Trợ lý bán hàng chuyên nghiệp của Tiger Shop (Yên Nghĩa, Hà Đông).\nKhách hàng đang chat với bạn tên là: ${userName}.\n\n════════════════════\n📦 DANH SÁCH SẢN PHẨM HIỆN CÓ TRONG KHO (CÒN HÀNG):\n════════════════════\n${productCatalogText}\n═══════════════════\n\nQUY TẮC BẮT BUỘC – VI PHẠM LÀ SAI:\n\n1. CHỈ ĐƯỢC GỢI Ý sản phẩm có trong danh sách trên. TUYỆT ĐỐI không tự bịa ra tên sản phẩm, giá bán, mã sản phẩm nào khác.\n\n2. LỌC GIÁ CHÍNH XÁC: Khi khách nêu ngân sách (ví dụ "300k", "500 nghìn", "dưới 1 triệu"), chỉ gợi ý sản phẩm có giá ≤ ngân sách đó.\n\n3. KHÔNG BỊA CHÍNH SÁCH: Chỉ nói về chính sách thực tế của Tiger Shop (Đổi trả 7 ngày, Giao hàng nội thành Hà Đông).\n\n4. TRÌNH BÀY SÚC TÍCH: Tối đa 200 từ. Gọi khách là "Sếp".\n\n5. QUY TẮC ƯU ĐÃI – TUYỆT ĐỐI TUÂN THỦ:\n   - KHÔNG bao giờ tự bịa ra mã giảm giá hay hứa hẹn mã giảm giá.\n   - Nếu khách chê đắt: Nhẹ nhàng hỏi nhu cầu hoặc gợi ý sản phẩm rẻ hơn trong danh sách.\n   - Chỉ khi response từ hệ thống có kèm field "voucher" thì mới thông báo mã đó cho khách.\n\n6. CHÀO HỎI: Thân thiện, nhiệt tình với emoji 🐯.${orderInfo}`;

    const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction });
    const chat = chatModel.startChat({ history: conversationHistory });
    const result = await chat.sendMessage(message.trim());
    const aiReply = result.response.text().trim();

    // Lưu lịch sử
    if (userId && sessionId) {
      try {
        await saveMessage(sessionId, "USER", message.trim(), null);
        await saveMessage(sessionId, "AI", aiReply, null);
      } catch (saveErr) {
        console.error("⚠️ Save AI history error:", saveErr.message);
      }
    }

    // Anti‑exploit check – bargain logic (kept for legacy)
    const lowerMsg = message.toLowerCase();
    const isBargainIntent = (
      lowerMsg.includes("đắt") || lowerMsg.includes("mắc") ||
      lowerMsg.includes("chê") || lowerMsg.includes("suy nghĩ") ||
      lowerMsg.includes("nghĩ thêm") || lowerMsg.includes("giảm giá") ||
      lowerMsg.includes("có mã không") || lowerMsg.includes("discount")
    );

    let voucherCode = null;
    let incentiveType = null;
    let incentiveDenied = null;
    if (isBargainIntent && userId) {
      const cartValue = req.body.cartValue ? Number(req.body.cartValue) : 0;
      if (cartValue > 0) {
        try {
          const eligibility = await checkBargainEligibility(userId, cartValue);
          if (eligibility.eligible) {
            if (eligibility.tier === "freeship") {
              const generated = await generateAIVoucher(userId, "freeship");
              voucherCode = generated.code;
              incentiveType = "freeship";
            } else {
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
      voucher: voucherCode,
      incentiveType,
      incentiveDenied
    });
  } catch (error) {
    console.error("❌ AI CHAT ERROR:", error.message || error);
    return res.status(200).json({
      success: false,
      error: "Tiger AI đang bảo trì, sếp hãy nhắn cho nhân viên ở phía dưới nhé!"
    });
  }
};
