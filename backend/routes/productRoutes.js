const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const authMiddleware = require("../middlewares/authMiddleware");

const multer = require("multer");
const path = require("path");

/* ================= MULTER CONFIG ================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage });

/* ================= ROUTES ================= */

// ===== PUBLIC – CUSTOMER =====

// 🔹 LẤY DANH SÁCH SẢN PHẨM
router.get("/", productController.getAllProducts);

// 🔹 LẤY CHI TIẾT 1 SẢN PHẨM (QUAN TRỌNG)
router.get("/:id", productController.getProductById);

// ===== ADMIN =====

// ADMIN – CREATE (CÓ ẢNH)
router.post(
  "/",
  authMiddleware,
  upload.single("image"),
  productController.createProduct
);

// ADMIN – UPDATE (CÓ ẢNH)
router.put(
  "/:id",
  authMiddleware,
  upload.single("image"),
  productController.updateProduct
);

// ADMIN – DELETE
router.delete("/:id", authMiddleware, productController.deleteProduct);

module.exports = router;
