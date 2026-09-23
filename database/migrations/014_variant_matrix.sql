ALTER TABLE product_variants 
ADD COLUMN color VARCHAR(50) NULL COMMENT 'Tên màu sắc (Đỏ, Đen, Trắng...)',
ADD COLUMN size VARCHAR(50) NULL COMMENT 'Kích cỡ (S, M, L, 39, 40...)',
ADD COLUMN image_url VARCHAR(255) NULL COMMENT 'Ảnh tương ứng với màu';

-- Chuyển đổi dữ liệu cũ (Tạm thời map tên cũ vào thuộc tính color để không bị rỗng)
UPDATE product_variants SET color = variant_name WHERE color IS NULL AND variant_name IS NOT NULL;
