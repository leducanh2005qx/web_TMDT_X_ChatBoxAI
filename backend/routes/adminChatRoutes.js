const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const chatController = require("../controllers/chatController");

// BASE: /api/chat/admin
router.get(
  "/threads",
  authMiddleware,
  roleMiddleware("admin"),
  chatController.listThreadsAdmin
);
router.get(
  "/threads/:threadId/messages",
  authMiddleware,
  roleMiddleware("admin"),
  chatController.getThreadMessagesAdmin
);
router.post(
  "/threads/:threadId/messages",
  authMiddleware,
  roleMiddleware("admin"),
  chatController.sendMessageAdmin
);
router.get(
  "/users/:userId/orders",
  authMiddleware,
  roleMiddleware("admin"),
  chatController.getOrdersSummaryOfUserAdmin
);

module.exports = router;
