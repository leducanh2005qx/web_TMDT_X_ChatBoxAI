const db = require('../config/db');

const getEligibleGift = (subtotal, callback) => {
    const query = 'SELECT * FROM gifts WHERE min_order_value <= ? AND stock > 0 AND is_active = 1 ORDER BY min_order_value DESC LIMIT 1';
    db.query(query, [subtotal], (err, results) => {
        if (err) return callback(err, null);
        if (results.length > 0) {
            return callback(null, results[0]);
        }
        return callback(null, null);
    });
};

const getEligibleGiftAPI = (req, res) => {
    const subtotal = parseFloat(req.query.subtotal) || 0;
    getEligibleGift(subtotal, (err, gift) => {
        if (err) {
            console.error('Lỗi lấy quà tặng:', err);
            return res.status(500).json({ message: 'Lỗi server khi lấy quà tặng' });
        }
        res.json({ gift: gift || null });
    });
};

const getAllGiftsAdmin = (req, res) => {
    const query = 'SELECT * FROM gifts ORDER BY min_order_value ASC';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Lỗi lấy danh sách quà:', err);
            return res.status(500).json({ message: 'Lỗi server khi lấy danh sách quà' });
        }
        res.json(results);
    });
};

const updateGift = (req, res) => {
    const giftId = req.params.id;
    const { gift_name, min_order_value, stock, is_active } = req.body;
    
    const query = 'UPDATE gifts SET gift_name = ?, min_order_value = ?, stock = ?, is_active = ? WHERE id = ?';
    db.query(query, [gift_name, min_order_value, stock, is_active, giftId], (err, result) => {
        if (err) {
            console.error('Lỗi cập nhật quà tặng:', err);
            return res.status(500).json({ message: 'Lỗi server khi cập nhật quà tặng' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy quà tặng' });
        }
        res.json({ message: 'Cập nhật quà tặng thành công' });
    });
};

module.exports = {
    getEligibleGift,
    getEligibleGiftAPI,
    getAllGiftsAdmin,
    updateGift
};
