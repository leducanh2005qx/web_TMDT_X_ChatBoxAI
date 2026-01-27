const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const variantController = require("../controllers/variantController");

// ADMIN
router.post("/", authMiddleware, variantController.createVariant);
router.delete("/:id", authMiddleware, variantController.deleteVariant);

// PUBLIC
router.get("/product/:productId", variantController.getVariantsByProduct);

module.exports = router;
