-- Update roles and users table without changing existing core logic

-- 1) Ensure required roles with fixed IDs
INSERT INTO roles (id, name) VALUES
  (1, 'Admin'),
  (2, 'Manager'),
  (3, 'Staff'),
  (4, 'Customer')
ON DUPLICATE KEY UPDATE
  name = VALUES(name);

-- 2) Add users.status with default pending
ALTER TABLE users
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending';

-- 3) Add users.created_by to reference creator manager
ALTER TABLE users
ADD COLUMN created_by INT NULL;

ALTER TABLE users
ADD CONSTRAINT fk_users_created_by
FOREIGN KEY (created_by) REFERENCES users(id)
ON UPDATE CASCADE
ON DELETE SET NULL;

CREATE INDEX idx_users_created_by ON users(created_by);
