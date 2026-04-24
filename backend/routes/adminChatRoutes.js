const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const chatController = require("../controllers/chatController");
const aiChatController = require("../controllers/aiChatController");

const canSupport = roleMiddleware(["ADMIN", "MANAGER", "STAFF"]);

// BASE: /api/chat/admin
router.get("/threads", authMiddleware, canSupport, chatController.listThreadsAdmin);
router.get("/threads/:threadId/messages", authMiddleware, canSupport, chatController.getThreadMessagesAdmin);
router.post("/threads/:threadId/messages", authMiddleware, canSupport, chatController.sendMessageAdmin);
router.get("/threads/:threadId/suggestions", authMiddleware, canSupport, aiChatController.getChatSuggestions);
router.get("/users/:userId/orders", authMiddleware, canSupport, chatController.getOrdersSummaryOfUserAdmin);

module.exports = router;
