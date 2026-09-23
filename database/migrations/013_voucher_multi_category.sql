CREATE TABLE IF NOT EXISTS voucher_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    voucher_id INT NOT NULL,
    category_id INT NOT NULL,
    FOREIGN KEY (voucher_id) REFERENCES vouchers(voucher_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Thay đổi apply_scope ENUM
ALTER TABLE vouchers MODIFY apply_scope ENUM('all', 'category', 'specific', 'custom') DEFAULT 'all';

-- Chuyển dữ liệu cũ sang bảng mới
INSERT INTO voucher_categories (voucher_id, category_id)
SELECT voucher_id, category_id FROM vouchers WHERE category_id IS NOT NULL;

-- Cột category_id ở bảng vouchers giờ sẽ không dùng nữa, nhưng tạm thời giữ nguyên để an toàn (có thể drop sau này).
