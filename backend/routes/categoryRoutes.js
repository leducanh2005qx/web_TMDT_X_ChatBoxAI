const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// PUBLIC
router.get("/", categoryController.getAllCategories);

// ADMIN
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN", "MANAGER"]),
  categoryController.createCategory
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN", "MANAGER"]),
  categoryController.updateCategory
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN", "MANAGER"]),
  categoryController.deleteCategory
);

module.exports = router;
