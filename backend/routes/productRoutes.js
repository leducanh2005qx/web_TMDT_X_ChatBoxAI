const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const optionalAuth = require("../middlewares/optionalAuth");

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

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
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
  limits: { fileSize: 5 * 1024 * 1024 },
});

/* ================= ROUTES ================= */

// ⚠️ QUAN TRỌNG: Static routes phải đứng TRƯỚC dynamic /:id routes

/**
 * @route   GET /api/products
 * @access  Public (nhưng Admin/Manager nhận thêm sản phẩm pending)
 */
router.get("/", optionalAuth, productController.getAllProducts);

/**
 * @route   GET /api/products/inventory-alert
 * @access  Private (Admin, Manager)
 */
router.get("/inventory-alert", authMiddleware, productController.getInventoryAlert);

/**
 * @route   GET /api/products/pending
 * @access  Private (Admin)
 */
router.get("/pending", authMiddleware, roleMiddleware(["ADMIN", "MANAGER"]), productController.getPendingProducts);

/**
 * @route   GET /api/products/decided
 * @desc    Lịch sử sản phẩm đã duyệt / từ chối
 * @access  Private (Admin, Manager)
 */
router.get("/decided", authMiddleware, roleMiddleware(["ADMIN", "MANAGER"]), productController.getDecidedProducts);

/**
 * @route   POST /api/products
 * @access  Private (Admin, Manager)
 */
router.post("/", authMiddleware, upload.single("image"), productController.createProduct);

/* ================= DYNAMIC /:id ROUTES (phải sau static routes) ================= */

router.get("/:id/reviews", productController.getProductReviews);

/**
 * @route   GET /api/products/:id
 * @access  Public
 */
router.get("/:id", productController.getProductById);

/**
 * @route   PUT /api/products/:id
 * @access  Private (Admin, Manager)
 */
router.put("/:id", authMiddleware, upload.single("image"), productController.updateProduct);

/**
 * @route   DELETE /api/products/:id
 * @access  Private (Admin)
 */
router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN", "MANAGER"]), productController.deleteProduct);
router.patch("/:id/restore", authMiddleware, roleMiddleware(["ADMIN", "MANAGER"]), productController.restoreProduct);
router.patch("/:id/restore-pending", authMiddleware, roleMiddleware(["ADMIN", "MANAGER"]), productController.restoreProductToPending);
router.post("/:id/reviews", authMiddleware, upload.single("image"), productController.createOrUpdateProductReview);
router.patch("/:id/decision", authMiddleware, roleMiddleware(["ADMIN", "MANAGER"]), productController.decideProduct);

module.exports = router;
