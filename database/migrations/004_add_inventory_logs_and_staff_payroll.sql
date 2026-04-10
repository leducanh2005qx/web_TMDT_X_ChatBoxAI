-- Add manager inventory logs and staff payroll support

ALTER TABLE users
ADD COLUMN hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 30000.00;

CREATE TABLE IF NOT EXISTS inventory_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  manager_id INT NOT NULL,
  quantity_added INT NOT NULL,
  old_stock INT NOT NULL,
  new_stock INT NOT NULL,
  note VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS staff_work_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  manager_id INT NOT NULL,
  work_date DATE NOT NULL,
  hours_worked DECIMAL(5,2) NOT NULL,
  note VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_inventory_logs_manager ON inventory_logs(manager_id);
CREATE INDEX idx_inventory_logs_product ON inventory_logs(product_id);
CREATE INDEX idx_staff_work_logs_staff_date ON staff_work_logs(staff_id, work_date);
