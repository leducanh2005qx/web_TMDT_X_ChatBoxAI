const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const chatController = require("../controllers/chatController");

// BASE: /api/chat/admin
router.get(
  "/threads",
  authMiddleware,
  roleMiddleware(["ADMIN", "MANAGER"]),
  chatController.listThreadsAdmin
);
router.get(
  "/threads/:threadId/messages",
  authMiddleware,
  roleMiddleware(["ADMIN", "MANAGER"]),
  chatController.getThreadMessagesAdmin
);
router.post(
  "/threads/:threadId/messages",
  authMiddleware,
  roleMiddleware(["ADMIN", "MANAGER"]),
  chatController.sendMessageAdmin
);
router.get(
  "/users/:userId/orders",
  authMiddleware,
  roleMiddleware(["ADMIN", "MANAGER"]),
  chatController.getOrdersSummaryOfUserAdmin
);

module.exports = router;
