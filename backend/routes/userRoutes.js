const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middlewares/authMiddleware");

// GET MY PROFILE
router.get("/me", authMiddleware, (req, res) => {
  db.query(
    "SELECT id, name, email, phone FROM users WHERE id = ?",
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error" });
      res.json(rows[0]);
    },
  );
});

// UPDATE MY PROFILE
router.put("/me", authMiddleware, (req, res) => {
  const { name, phone } = req.body;

  db.query(
    "UPDATE users SET name = ?, phone = ? WHERE id = ?",
    [name, phone, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ message: "Update failed" });
      res.json({ success: true });
    },
  );
});

module.exports = router;
