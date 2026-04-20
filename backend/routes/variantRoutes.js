const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const variantController = require("../controllers/variantController");

// ADMIN / MANAGER
router.post("/", authMiddleware, variantController.createVariant);
router.delete("/:id", authMiddleware, variantController.deleteVariant);

// ✅ Cập nhật stock hàng loạt cho nhiều variant (Manager)
router.put("/bulk-stock", authMiddleware, roleMiddleware(["ADMIN", "MANAGER"]), variantController.bulkUpdateVariantStock);

// PUBLIC
router.get("/product/:productId", variantController.getVariantsByProduct);

module.exports = router;
