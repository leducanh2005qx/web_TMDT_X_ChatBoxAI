-- ================================================================
-- Migration 012: Voucher System Upgrade + AI Incentive Engine
-- ================================================================
-- MySQL 8.x compatible (không dùng ADD COLUMN IF NOT EXISTS)
-- Chạy: mysql -u root ecommerce < 012_voucher_system_upgrade.sql

-- ----------------------------------------------------------------
-- 1. Cập nhật bảng vouchers
-- ----------------------------------------------------------------

-- 1a. Thêm apply_scope
ALTER TABLE `vouchers`
  ADD COLUMN `apply_scope`
    ENUM('all','category','specific') NOT NULL DEFAULT 'all'
    COMMENT 'all=toàn sàn, category=theo ngành, specific=sản phẩm cố định'
    AFTER `max_discount`;

-- 1b. Đổi start_date / end_date sang DATETIME
ALTER TABLE `vouchers`
  MODIFY COLUMN `start_date` DATETIME NULL DEFAULT NULL,
  MODIFY COLUMN `end_date`   DATETIME NULL DEFAULT NULL;

-- 1c. Thêm target_user_id (mã AI riêng cho 1 user)
ALTER TABLE `vouchers`
  ADD COLUMN `target_user_id` INT NULL DEFAULT NULL
    COMMENT 'NULL = công khai, != NULL = chỉ user đó dùng được'
    AFTER `apply_scope`;

-- 1d. Thêm source_type
ALTER TABLE `vouchers`
  ADD COLUMN `source_type`
    ENUM('manual','ai_auto') NOT NULL DEFAULT 'manual'
    AFTER `target_user_id`;

-- ----------------------------------------------------------------
-- 2. Bảng voucher_products
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `voucher_products` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `voucher_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  UNIQUE KEY `uq_vp` (`voucher_id`, `product_id`),
  FOREIGN KEY (`voucher_id`) REFERENCES `vouchers`(`voucher_id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Danh sách sản phẩm cố định áp dụng voucher (scope=specific)';

-- ----------------------------------------------------------------
-- 3. Bảng voucher_usages
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `voucher_usages` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `voucher_id` INT NOT NULL,
  `user_id`    INT NOT NULL,
  `source`     ENUM('ai_freeship','ai_gift_flag') NOT NULL DEFAULT 'ai_freeship',
  `used_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`voucher_id`) REFERENCES `vouchers`(`voucher_id`) ON DELETE CASCADE,
  INDEX `idx_user_month` (`user_id`, `used_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Lịch sử AI phát ưu đãi — giới hạn 1 lần/tháng/user';

-- ----------------------------------------------------------------
-- 4. Bảng gifts
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `gifts` (
  `id`               INT AUTO_INCREMENT PRIMARY KEY,
  `gift_name`        VARCHAR(150) NOT NULL,
  `min_order_value`  BIGINT NOT NULL,
  `stock`            INT NOT NULL DEFAULT 100,
  `is_active`        TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Cấu hình quà tặng tự động kèm đơn hàng lớn';

INSERT IGNORE INTO `gifts` (`id`, `gift_name`, `min_order_value`, `stock`, `is_active`) VALUES
  (1, 'Móc khóa Tiger 🐯',     300000, 200, 1),
  (2, 'Đôi tất Tiger cao cấp', 500000, 150, 1),
  (3, 'Túi Tote Tiger Shop',   700000, 100, 1);

-- ----------------------------------------------------------------
-- 5. Thêm cột is_gift vào order_items
-- ----------------------------------------------------------------
ALTER TABLE `order_items`
  ADD COLUMN `is_gift` TINYINT(1) NOT NULL DEFAULT 0
    COMMENT '1 = dòng quà tặng tự động, giá = 0'
    AFTER `product_image`;

-- ----------------------------------------------------------------
-- 6. Index hỗ trợ
-- ----------------------------------------------------------------
ALTER TABLE `vouchers`
  ADD INDEX `idx_voucher_target_user` (`target_user_id`),
  ADD INDEX `idx_voucher_scope` (`apply_scope`);

SELECT 'Migration 012 completed! Tiger Shop Voucher Engine v2 🐯' AS status;
