-- ============================================================
-- Migration 011: Enhance product_variants table
-- ============================================================

-- Thêm cột sku nếu chưa có
ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS sku VARCHAR(100) NULL AFTER product_id;

-- Thêm cột created_at nếu chưa có
ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER stock;

-- Cập nhật kiểu price sang DECIMAL(12,2)
ALTER TABLE product_variants
  MODIFY COLUMN price DECIMAL(12,2) NOT NULL;
