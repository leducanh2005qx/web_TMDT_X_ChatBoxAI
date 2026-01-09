-- Create minimal products, orders, order_items tables and seed sample data

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image VARCHAR(255),
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Seed sample product
INSERT INTO products (name, image, price, stock)
VALUES ('Sample Product A', '/images/sample-a.jpg', 199000, 10)
ON DUPLICATE KEY UPDATE name = name;

-- Seed sample user if none exists
INSERT INTO users (name, email, password, role_id)
SELECT 'Sample User', 'sample@example.com', 'password', (SELECT id FROM roles WHERE name = 'CUSTOMER' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'sample@example.com');

-- Create a sample order if none exist
INSERT INTO orders (user_id, total, status)
SELECT u.id, 199000, 'pending'
FROM (SELECT id FROM users WHERE email = 'sample@example.com' LIMIT 1) u
WHERE NOT EXISTS (SELECT 1 FROM orders);

-- Insert corresponding order_items
INSERT INTO order_items (order_id, product_id, quantity, price)
SELECT o.id, p.id, 1, p.price
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN products p ON p.name = 'Sample Product A'
WHERE u.email = 'sample@example.com' AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id);
