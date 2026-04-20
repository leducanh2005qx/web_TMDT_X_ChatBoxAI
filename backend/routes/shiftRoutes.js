const express = require("express");
const router  = express.Router();
const db      = require("../config/db");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const canManage = roleMiddleware(["ADMIN", "MANAGER"]);
const canStaff  = roleMiddleware(["ADMIN", "MANAGER", "STAFF"]);

/* ── STAFF: Đăng ký ca mới ────────────────────────────── */
// POST /api/shifts/register
router.post("/register", authMiddleware, canStaff, (req, res) => {
  const { shift_date, start_time, end_time, note } = req.body;
  if (!shift_date || !start_time || !end_time)
    return res.status(400).json({ message: "Thiếu thông tin ca làm" });

  db.query(
    "INSERT INTO shift_registrations (staff_id, shift_date, start_time, end_time, note) VALUES (?,?,?,?,?)",
    [req.user.id, shift_date, start_time, end_time, note || null],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Lỗi DB: " + err.message });
      res.json({ success: true, id: result.insertId });
    }
  );
});

/* ── STAFF: Xem ca của mình ───────────────────────────── */
// GET /api/shifts/mine
router.get("/mine", authMiddleware, canStaff, (req, res) => {
  db.query(
    "SELECT * FROM shift_registrations WHERE staff_id = ? ORDER BY shift_date DESC, start_time",
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Lỗi DB: " + err.message });
      res.json(rows || []);
    }
  );
});

/* ── STAFF: Hủy ca (chỉ khi còn pending) ─────────────── */
// DELETE /api/shifts/:id
router.delete("/:id", authMiddleware, canStaff, (req, res) => {
  db.query(
    "DELETE FROM shift_registrations WHERE id = ? AND staff_id = ? AND status = 'pending'",
    [req.params.id, req.user.id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Lỗi DB: " + err.message });
      if (result.affectedRows === 0)
        return res.status(400).json({ message: "Không thể hủy ca này (đã duyệt hoặc không phải của bạn)" });
      res.json({ success: true });
    }
  );
});

/* ── MANAGER: Xem tất cả ca trong tuần ───────────────── */
// GET /api/shifts/all?week=YYYY-MM-DD
router.get("/all", authMiddleware, canManage, (req, res) => {
  const { week } = req.query;
  let sql, params;

  if (week) {
    const base = new Date(week);
    const day  = base.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const mon  = new Date(base); mon.setDate(base.getDate() + diff);
    const sun  = new Date(mon);  sun.setDate(mon.getDate() + 6);
    const startDate = mon.toISOString().slice(0, 10);
    const endDate   = sun.toISOString().slice(0, 10);

    sql = `SELECT sr.*, u.name AS staff_name, u.email AS staff_email
           FROM shift_registrations sr
           JOIN users u ON sr.staff_id = u.id
           WHERE sr.shift_date BETWEEN ? AND ?
           ORDER BY sr.shift_date, sr.start_time`;
    params = [startDate, endDate];
  } else {
    sql = `SELECT sr.*, u.name AS staff_name, u.email AS staff_email
           FROM shift_registrations sr
           JOIN users u ON sr.staff_id = u.id
           ORDER BY sr.shift_date DESC, sr.start_time`;
    params = [];
  }

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi DB: " + err.message });
    res.json(rows || []);
  });
});

/* ── ALL ROLES: Xem ai làm hôm nay ──────────────────── */
// GET /api/shifts/day?date=YYYY-MM-DD
router.get("/day", authMiddleware, canStaff, (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  db.query(
    `SELECT sr.*, u.name AS staff_name, u.email AS staff_email
     FROM shift_registrations sr
     JOIN users u ON sr.staff_id = u.id
     WHERE sr.shift_date = ? AND sr.status IN ('approved','pending')
     ORDER BY sr.start_time`,
    [date],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Lỗi DB: " + err.message });
      res.json(rows || []);
    }
  );
});

/* ── MANAGER: Duyệt / Từ chối ca ────────────────────── */
// PATCH /api/shifts/:id/status   body: { status: 'approved' | 'rejected' }
router.patch("/:id/status", authMiddleware, canManage, (req, res) => {
  const { status } = req.body;
  if (!["approved", "rejected", "pending"].includes(status))
    return res.status(400).json({ message: "Trạng thái không hợp lệ" });

  db.query(
    "UPDATE shift_registrations SET status = ?, manager_id = ? WHERE id = ?",
    [status, req.user.id, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ message: "Lỗi DB: " + err.message });
      res.json({ success: true });
    }
  );
});

/* ── MANAGER ONLY: Sửa giờ ca (Staff bị khóa hoàn toàn) ── */
// PUT /api/shifts/:id
router.put("/:id", authMiddleware, canManage, (req, res) => {
  const { start_time, end_time, shift_date, note } = req.body;
  db.query(
    "UPDATE shift_registrations SET start_time = ?, end_time = ?, shift_date = ?, note = ? WHERE id = ?",
    [start_time, end_time, shift_date, note || null, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ message: "Lỗi DB: " + err.message });
      res.json({ success: true });
    }
  );
});

module.exports = router;
