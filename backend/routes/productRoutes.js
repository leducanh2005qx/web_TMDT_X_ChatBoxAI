const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const authMiddleware = require("../middlewares/authMiddleware");

const multer = require("multer");
const path = require("path");

/* ================= MULTER CONFIG ================= */
// Cấu hình lưu trữ ảnh chuyên nghiệp
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // Đặt tên file theo timestamp để tránh trùng lặp
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

// Kiểm tra định dạng file để bảo mật (chỉ cho phép ảnh)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận định dạng ảnh (jpg, png, webp)!"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
});

/* ================= ROUTES ================= */

/**
 * @route   GET /api/products
 * @desc    Lấy danh sách sản phẩm (Kèm theo mảng variants/size)
 * @access  Public
 */
router.get("/", productController.getAllProducts);
router.get("/:id/reviews", productController.getProductReviews);

/**
 * @route   GET /api/products/:id
 * @desc    Lấy chi tiết 1 sản phẩm (Kèm theo mảng variants/size)
 * @access  Public
 */
router.get("/:id", productController.getProductById);

/* ================= ADMIN / MANAGER ================= */
router.get("/inventory-alert", authMiddleware, productController.getInventoryAlert);

/* ================= ADMIN ONLY ================= */

/**
 * @route   POST /api/products
 * @desc    Tạo sản phẩm mới
 * @access  Private (Admin)
 */
router.post(
  "/",
  authMiddleware,
  upload.single("image"),
  productController.createProduct,
);

/**
 * @route   PUT /api/products/:id
 * @desc    Cập nhật thông tin sản phẩm
 * @access  Private (Admin)
 */
router.put(
  "/:id",
  authMiddleware,
  upload.single("image"),
  productController.updateProduct,
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Xóa sản phẩm
 * @access  Private (Admin)
 */
router.delete("/:id", authMiddleware, productController.deleteProduct);
router.patch("/:id/restore", authMiddleware, productController.restoreProduct);
router.post(
  "/:id/reviews",
  authMiddleware,
  upload.single("image"),
  productController.createOrUpdateProductReview,
);

module.exports = router;
