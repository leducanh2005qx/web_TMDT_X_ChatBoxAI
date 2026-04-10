-- Realtime attendance and probation payroll support

ALTER TABLE users
ADD COLUMN employment_status VARCHAR(20) NOT NULL DEFAULT 'official',
ADD COLUMN probation_start_at DATETIME NULL,
ADD COLUMN official_at DATETIME NULL,
ADD COLUMN probation_hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 20000.00,
ADD COLUMN official_hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 25000.00;

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  check_in_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  check_out_at DATETIME NULL,
  worked_seconds INT NOT NULL DEFAULT 0,
  wage_rate DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  note VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_attendance_staff_status ON attendance_sessions(staff_id, status);
CREATE INDEX idx_attendance_checkin ON attendance_sessions(check_in_at);

-- Initialize existing active staff to probation mode from now
UPDATE users
SET employment_status = 'probation',
    probation_start_at = IFNULL(probation_start_at, NOW())
WHERE role_id = 3 AND status = 'active';
