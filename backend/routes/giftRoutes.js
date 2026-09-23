const express = require('express');
const router = express.Router();
const giftController = require('../controllers/giftController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Public: kiểm tra quà tặng đủ điều kiện
router.get('/eligible', giftController.getEligibleGiftAPI);

// Admin/Manager: quản lý quà
router.get('/', authMiddleware, roleMiddleware(['ADMIN','MANAGER']), giftController.getAllGiftsAdmin);
router.put('/:id', authMiddleware, roleMiddleware(['ADMIN','MANAGER']), giftController.updateGift);

module.exports = router;
