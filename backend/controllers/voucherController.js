const db = require('../config/db');

// 1. Lấy tất cả voucher (Admin/Manager)
exports.getAll = (req, res) => {
    const query = `
        SELECT 
            v.*, 
            GROUP_CONCAT(DISTINCT vc.category_id) as category_ids,
            GROUP_CONCAT(DISTINCT vp.product_id) as product_ids,
            CASE 
                WHEN v.status = 'inactive' THEN 'inactive'
                WHEN v.used >= v.quantity THEN 'exhausted'
                WHEN v.end_date IS NOT NULL AND v.end_date < NOW() THEN 'expired'
                WHEN v.status = 'active' AND v.start_date IS NOT NULL AND v.start_date > NOW() THEN 'upcoming'
                ELSE 'active_running'
            END as computed_status
        FROM vouchers v
        LEFT JOIN voucher_categories vc ON v.voucher_id = vc.voucher_id
        LEFT JOIN voucher_products vp ON v.voucher_id = vp.voucher_id
        GROUP BY v.voucher_id
        ORDER BY v.created_at DESC
    `;

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi database', details: err.message });
        
        // Parse product_ids và category_ids thành mảng
        const vouchers = results.map(v => ({
            ...v,
            product_ids: v.product_ids ? v.product_ids.split(',').map(Number) : [],
            category_ids: v.category_ids ? v.category_ids.split(',').map(Number) : []
        }));
        
        res.json(vouchers);
    });
};

// 2. Tạo voucher mới (Admin/Manager)
exports.create = (req, res) => {
    const { 
        code, type, value, min_order_value, max_discount, quantity, 
        start_date, end_date, status, apply_scope, category_ids, product_ids 
    } = req.body;

    // Validate cơ bản
    if (!code || !type) {
        return res.status(400).json({ error: 'Thiếu thông tin bắt buộc (code, type)' });
    }
    if (type !== 'free_ship' && (!value || value <= 0)) {
        return res.status(400).json({ error: 'Value phải > 0 (trừ loại free_ship)' });
    }
    if (!quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Quantity phải > 0' });
    }

    const query = `
        INSERT INTO vouchers 
        (code, type, value, min_order_value, max_discount, quantity, start_date, end_date, status, apply_scope, category_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        code, type, value, min_order_value || 0, max_discount, quantity, 
        start_date || null, end_date || null, status || 'active', apply_scope || 'all', null
    ];

    db.query(query, values, (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi tạo voucher', details: err.message });
        
        const newVoucherId = result.insertId;

        // Xử lý category_ids nếu scope là category hoặc custom
        if ((apply_scope === 'category' || apply_scope === 'custom') && category_ids && category_ids.length > 0) {
            const vcValues = category_ids.map(cId => [newVoucherId, cId]);
            db.query('INSERT INTO voucher_categories (voucher_id, category_id) VALUES ?', [vcValues], (errVc) => {
                if (errVc) console.error('Lỗi insert voucher_categories:', errVc);
            });
        }

        // Xử lý product_ids nếu scope là specific hoặc custom
        if ((apply_scope === 'specific' || apply_scope === 'custom') && product_ids && product_ids.length > 0) {
            const vpValues = product_ids.map(pId => [newVoucherId, pId]);
            db.query('INSERT INTO voucher_products (voucher_id, product_id) VALUES ?', [vpValues], (errVp) => {
                if (errVp) console.error('Lỗi insert voucher_products:', errVp);
            });
        }

        // Ghi log hoạt động
        const managerId = req.user ? req.user.id : null; 
        if (managerId) {
            db.query('INSERT INTO user_activity_logs (user_id, action, details) VALUES (?, ?, ?)',
                [managerId, 'CREATE_VOUCHER', `Tạo voucher ${code}`]
            );
        }

        res.json({ success: true });
    });
};

// 3. Cập nhật voucher (Admin/Manager)
exports.update = (req, res) => {
    const id = req.params.id;
    const { 
        code, type, value, min_order_value, max_discount, quantity, 
        start_date, end_date, status, apply_scope, category_ids, product_ids 
    } = req.body;

    const query = `
        UPDATE vouchers 
        SET code=?, type=?, value=?, min_order_value=?, max_discount=?, quantity=?, 
            start_date=?, end_date=?, status=?, apply_scope=?, category_id=?
        WHERE voucher_id=?
    `;
    const values = [
        code, type, value, min_order_value || 0, max_discount, quantity, 
        start_date || null, end_date || null, status, apply_scope, null, id
    ];

    db.query(query, values, (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi cập nhật voucher', details: err.message });
        
        // Xóa (reset) các voucher_categories cũ
        db.query('DELETE FROM voucher_categories WHERE voucher_id = ?', [id], (errDelVc) => {
            if (errDelVc) console.error('Lỗi delete voucher_categories:', errDelVc);
            
            // Insert lại nếu scope là category hoặc custom
            if ((apply_scope === 'category' || apply_scope === 'custom') && category_ids && category_ids.length > 0) {
                const vcValues = category_ids.map(cId => [id, cId]);
                db.query('INSERT INTO voucher_categories (voucher_id, category_id) VALUES ?', [vcValues], (errVc) => {
                    if (errVc) console.error('Lỗi insert lại voucher_categories:', errVc);
                });
            }
        });

        // Xóa (reset) các voucher_products cũ
        db.query('DELETE FROM voucher_products WHERE voucher_id = ?', [id], (errDel) => {
            if (errDel) console.error('Lỗi delete voucher_products:', errDel);
            
            // Insert lại nếu scope là specific hoặc custom
            if ((apply_scope === 'specific' || apply_scope === 'custom') && product_ids && product_ids.length > 0) {
                const vpValues = product_ids.map(pId => [id, pId]);
                db.query('INSERT INTO voucher_products (voucher_id, product_id) VALUES ?', [vpValues], (errVp) => {
                    if (errVp) console.error('Lỗi insert lại voucher_products:', errVp);
                });
            }
        });

        // Ghi log hoạt động
        const managerId = req.user ? req.user.id : null; 
        if (managerId) {
            db.query('INSERT INTO user_activity_logs (user_id, action, details) VALUES (?, ?, ?)',
                [managerId, 'UPDATE_VOUCHER', `Cập nhật voucher ${id}`]
            );
        }

        res.json({ success: true });
    });
};

// 4. Toggle trạng thái voucher (bật/tắt)
exports.toggle = (req, res) => {
    const id = req.params.id;
    
    db.query('SELECT status FROM vouchers WHERE voucher_id = ?', [id], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ error: 'Không tìm thấy voucher' });
        
        const newStatus = results[0].status === 'active' ? 'inactive' : 'active';
        
        db.query('UPDATE vouchers SET status = ? WHERE voucher_id = ?', [newStatus, id], (errUp) => {
            if (errUp) return res.status(500).json({ error: 'Lỗi cập nhật trạng thái' });
            
            // Ghi log
            const managerId = req.user ? req.user.id : null; 
            if (managerId) {
                db.query('INSERT INTO user_activity_logs (user_id, action, details) VALUES (?, ?, ?)',
                    [managerId, 'TOGGLE_VOUCHER', `Đổi trạng thái voucher ${id} thành ${newStatus}`]
                );
            }
            
            res.json({ success: true, newStatus });
        });
    });
};

// 5. Lấy danh sách voucher khả dụng (Customer)
exports.getAvailable = (req, res) => {
    const query = `
        SELECT 
            v.*, 
            GROUP_CONCAT(DISTINCT vc.category_id) as category_ids,
            GROUP_CONCAT(DISTINCT vp.product_id) as product_ids
        FROM vouchers v
        LEFT JOIN voucher_categories vc ON v.voucher_id = vc.voucher_id
        LEFT JOIN voucher_products vp ON v.voucher_id = vp.voucher_id
        WHERE v.status = 'active'
          AND (v.start_date IS NULL OR v.start_date <= NOW())
          AND (v.end_date IS NULL OR v.end_date >= NOW())
          AND v.used < v.quantity
          AND v.target_user_id IS NULL
        GROUP BY v.voucher_id
        ORDER BY v.created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi database', details: err.message });
        
        // Parse product_ids và category_ids thành mảng
        const vouchers = results.map(v => ({
            ...v,
            product_ids: v.product_ids ? v.product_ids.split(',').map(Number) : [],
            category_ids: v.category_ids ? v.category_ids.split(',').map(Number) : []
        }));
        
        res.json(vouchers);
    });
};

// 6. Áp dụng voucher
exports.apply = (req, res) => {
    const { code, total, items } = req.body;
    
    if (!code || !items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
    }

    const query = `
        SELECT v.*, 
            GROUP_CONCAT(DISTINCT vp.product_id) as product_ids,
            GROUP_CONCAT(DISTINCT vc.category_id) as category_ids
        FROM vouchers v
        LEFT JOIN voucher_products vp ON v.voucher_id = vp.voucher_id
        LEFT JOIN voucher_categories vc ON v.voucher_id = vc.voucher_id
        WHERE v.code = ?
        GROUP BY v.voucher_id
    `;
    
    db.query(query, [code], (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi kiểm tra voucher', details: err.message });
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Voucher không tồn tại' });
        }
        
        const v = results[0];
        const vProductIds = v.product_ids ? v.product_ids.split(',').map(Number) : [];
        const vCategoryIds = v.category_ids ? v.category_ids.split(',').map(Number) : [];
        
        // Kiểm tra điều kiện áp dụng
        if (v.status !== 'active') return res.status(400).json({ error: 'Voucher không hoạt động' });
        if (v.target_user_id !== null) return res.status(400).json({ error: 'Voucher này không dành cho cộng đồng' });
        if (v.used >= v.quantity) return res.status(400).json({ error: 'Voucher đã hết lượt sử dụng' });
        
        const now = new Date();
        if (v.start_date && new Date(v.start_date) > now) return res.status(400).json({ error: 'Voucher chưa đến thời gian áp dụng' });
        if (v.end_date && new Date(v.end_date) < now) return res.status(400).json({ error: 'Voucher đã hết hạn' });
        
        // Tính applicableSubtotal
        let applicableSubtotal = 0;
        
        items.forEach(item => {
            const price = Number(item.price);
            const qty = Number(item.quantity);
            const itemTotal = price * qty;
            
            if (v.apply_scope === 'all') {
                applicableSubtotal += itemTotal;
            } else if (v.apply_scope === 'category') {
                if (vCategoryIds.includes(Number(item.category_id))) {
                    applicableSubtotal += itemTotal;
                }
            } else if (v.apply_scope === 'specific') {
                if (vProductIds.includes(Number(item.product_id))) {
                    applicableSubtotal += itemTotal;
                }
            } else if (v.apply_scope === 'custom') {
                if (vCategoryIds.includes(Number(item.category_id)) || vProductIds.includes(Number(item.product_id))) {
                    applicableSubtotal += itemTotal;
                }
            }
        });
        
        // Kiểm tra min_order_value dựa trên applicableSubtotal
        if (v.min_order_value && applicableSubtotal < v.min_order_value) {
            return res.status(400).json({ 
                error: 'Giá trị sản phẩm áp dụng (' + Number(applicableSubtotal).toLocaleString('vi-VN') + 'đ) chưa đạt mức tối thiểu (' + Number(v.min_order_value).toLocaleString('vi-VN') + 'đ)'
            });
        }

        
        if (applicableSubtotal === 0 && v.type !== 'free_ship') {
            return res.status(400).json({ error: 'Không có sản phẩm nào trong giỏ hàng phù hợp với voucher này' });
        }
        
        // Tính toán discount
        let discount = 0;
        if (v.type === 'percent') {
            discount = Math.floor(applicableSubtotal * v.value / 100);
            if (v.max_discount) {
                discount = Math.min(discount, v.max_discount);
            }
        } else if (v.type === 'fixed') {
            discount = Math.min(v.value, applicableSubtotal);
        } else if (v.type === 'free_ship') {
            discount = v.value; // Khuyến mãi phí vận chuyển
        }
        
        res.json({
            code: v.code,
            discount: discount,
            applicableSubtotal: applicableSubtotal,
            scope: v.apply_scope,
            category_id: v.category_id
        });
    });
};
