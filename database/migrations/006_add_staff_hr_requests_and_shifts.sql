-- Staff HR requests, shifts, and attendance correction

CREATE TABLE IF NOT EXISTS staff_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  manager_id INT NULL,
  request_type VARCHAR(20) NOT NULL, -- late | leave
  request_date DATE NOT NULL,
  minutes_late INT NULL,
  reason VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  manager_note VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS shift_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  manager_id INT NULL,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  note VARCHAR(255) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);

ALTER TABLE attendance_sessions
ADD COLUMN corrected_by_manager_id INT NULL,
ADD COLUMN corrected_at DATETIME NULL,
ADD CONSTRAINT fk_attendance_corrected_manager
  FOREIGN KEY (corrected_by_manager_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_staff_requests_status ON staff_requests(status, request_date);
CREATE INDEX idx_shift_registrations_status ON shift_registrations(status, shift_date);
