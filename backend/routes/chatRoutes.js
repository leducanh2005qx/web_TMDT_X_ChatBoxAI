const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const chatController = require("../controllers/chatController");

// USER
router.get("/messages", auth, chatController.getMyMessages);
router.get("/orders-summary", auth, chatController.getMyOrdersSummary);
router.post("/messages", auth, chatController.sendMyMessage);

// ADMIN
router.get("/admin/threads", auth, chatController.listThreadsAdmin);
router.get(
  "/admin/messages/:threadId",
  auth,
  chatController.getThreadMessagesAdmin
);
router.post("/admin/messages/:threadId", auth, chatController.sendMessageAdmin);
router.get(
  "/admin/orders/:userId",
  auth,
  chatController.getOrdersSummaryOfUserAdmin
);

module.exports = router;
