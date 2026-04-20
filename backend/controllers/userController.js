const db = require("../config/db");
const bcrypt = require("bcrypt");

const checkManager = (userId, callback) => {
  db.query(
    "SELECT id, role_id FROM users WHERE id = ?",
    [userId],
    (err, rows) => {
      if (err) return callback({ code: 500, message: "Lỗi server" });
      if (!rows.length)
        return callback({ code: 401, message: "Người dùng không hợp lệ" });
      // Allow both Admin (1) and Manager (2)
      if (![1, 2].includes(rows[0].role_id))
        return callback({
          code: 403,
          message: "Chỉ Admin hoặc Manager mới được thực hiện thao tác này",
        });
      return callback(null, rows[0]);
    },
  );
};

const checkStaffActive = (userId, callback) => {
  db.query(
    "SELECT id, role_id, status FROM users WHERE id = ?",
    [userId],
    (err, rows) => {
      if (err) return callback({ code: 500, message: "Lỗi server" });
      if (!rows.length || rows[0].role_id !== 3) {
        return callback({ code: 403, message: "Chỉ Staff được thực hiện thao tác này" });
      }
      if (rows[0].status !== "active") {
        return callback({ code: 403, message: "Staff chưa active" });
      }
      return callback(null, rows[0]);
    },
  );
};


// ✅ LẤY TẤT CẢ NHÂN VIÊN VÀ QUẢN LÝ (Cho Manager/Admin xem)
exports.getMe = (req, res) => {
  db.query(
    "SELECT id, name, email, phone FROM users WHERE id = ?",
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Lỗi server" });
      res.json(rows[0]);
    },
  );
};

exports.updateMe = (req, res) => {
  const { name, phone } = req.body;

  db.query(
    "UPDATE users SET name = ?, phone = ? WHERE id = ?",
    [name, phone, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ message: "Lỗi cập nhật" });
      res.json({ success: true });
    },
  );
};

exports.storeUser = (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Thiếu thông tin tạo nhân viên" });
  }

  db.query("SELECT id, role_id FROM users WHERE id = ?", [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi server" });
    if (!rows.length) return res.status(401).json({ message: "Người dùng không hợp lệ" });

    const actor = rows[0];
    if (actor.role_id !== 2) {
      return res.status(403).json({ message: "Chỉ Manager mới được tạo nhân viên" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const sql = `
      INSERT INTO users (name, email, password, phone, role_id, status, created_by)
      VALUES (?, ?, ?, ?, 3, 'pending', ?)
    `;
    db.query(sql, [name, email, hashedPassword, phone || null, actor.id], (insertErr, result) => {
      if (insertErr) {
        return res.status(500).json({ message: "Không thể tạo nhân viên", error: insertErr.message });
      }
      return res.status(201).json({
        message: "Tạo nhân viên thành công, chờ Admin duyệt",
        user_id: result.insertId,
        status: "pending",
      });
    });
  });
};

exports.directCreateUser = (req, res) => {
  const { name, email, password, phone, role_id } = req.body;

  if (!name || !email || !password || !role_id) {
    return res.status(400).json({ message: "Thiếu thông tin tạo tài khoản" });
  }

  checkManager(req.user.id, (checkErr, actor) => {
    if (checkErr) return res.status(checkErr.code).json({ message: checkErr.message });

    // Check email existence first
    db.query("SELECT id, name, role_id FROM users WHERE email = ?", [email], (emailErr, emailRows) => {
      if (emailErr) return res.status(500).json({ message: "Lỗi kiểm tra email" });
      
      if (emailRows.length > 0) {
        const existingUser = emailRows[0];
        if (existingUser.role_id === 5) {
          return res.status(409).json({ 
            message: `Email này đã có tài khoản Khách hàng (@${existingUser.name}). Bạn có muốn nâng cấp họ lên nhân viên không?`,
            type: "UPGRADE_REQUIRED",
            userId: existingUser.id
          });
        }
        return res.status(400).json({ message: "Email này đã được sử dụng bởi một tài khoản khác." });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const sql = `
        INSERT INTO users (name, email, password, phone, role_id, status, is_active, created_by)
        VALUES (?, ?, ?, ?, ?, 'active', 1, ?)
      `;
      db.query(sql, [name, email, hashedPassword, phone || null, role_id, actor.id], (insertErr, result) => {
        if (insertErr) return res.status(500).json({ message: "Không thể tạo tài khoản trực tiếp" });
        return res.status(201).json({
          message: "Đã tạo tài khoản nhân viên thành công!",
          user_id: result.insertId,
          status: "active"
        });
      });
    });
  });
};

exports.approveUser = (req, res) => {
  const { userId } = req.params;

  db.query("SELECT id, role_id FROM users WHERE id = ?", [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi server" });
    if (!rows.length) return res.status(401).json({ message: "Người dùng không hợp lệ" });

    const actor = rows[0];
    if (actor.role_id !== 1) {
      return res.status(403).json({ message: "Chỉ Admin mới được duyệt tài khoản" });
    }

    const sql = `
      UPDATE users
      SET status = 'active'
      WHERE id = ? AND role_id = 3 AND status = 'pending'
    `;

    db.query(sql, [userId], (updateErr, result) => {
      if (updateErr) return res.status(500).json({ message: "Không thể duyệt tài khoản" });
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Không tìm thấy nhân viên pending để duyệt" });
      }

      // Fetch user name to log
      db.query("SELECT name FROM users WHERE id = ?", [userId], (errTarget, rowsTarget) => {
        const staffName = rowsTarget.length ? rowsTarget[0].name : "Không rõ";
        const actionStr = `Admin ${actor.name || actor.email || 'Hệ thống'} đã phê duyệt nhân viên ${staffName} vào hệ thống.`;
        db.query(
          "INSERT INTO user_activity_logs (user_id, action, target_id) VALUES (?, ?, ?)",
          [actor.id, actionStr, userId]
        );
      });

      return res.json({ message: "Duyệt nhân viên thành công", status: "active" });
    });
  });
};

exports.rejectUser = (req, res) => {
  const { userId } = req.params;

  db.query("SELECT id, role_id FROM users WHERE id = ?", [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi server" });
    if (!rows.length) return res.status(401).json({ message: "Người dùng không hợp lệ" });

    const actor = rows[0];
    if (actor.role_id !== 1) {
      return res.status(403).json({ message: "Chỉ Admin mới được từ chối tài khoản" });
    }

    const sql = `
      UPDATE users
      SET status = 'rejected'
      WHERE id = ? AND role_id = 3 AND status = 'pending'
    `;

    db.query(sql, [userId], (updateErr, result) => {
      if (updateErr) return res.status(500).json({ message: "Không thể từ chối tài khoản" });
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Không tìm thấy nhân viên pending để từ chối" });
      }
      return res.json({ message: "Đã từ chối nhân viên", status: "rejected" });
    });
  });
};

exports.getPendingStaff = (req, res) => {
  db.query("SELECT role_id FROM users WHERE id = ?", [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi server" });
    if (!rows.length) return res.status(401).json({ message: "Người dùng không hợp lệ" });
    if (rows[0].role_id !== 1) {
      return res.status(403).json({ message: "Chỉ Admin được xem danh sách chờ duyệt" });
    }

    const sql = `
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        u.status,
        u.created_by,
        creator.name AS created_by_name
      FROM users u
      LEFT JOIN users creator ON u.created_by = creator.id
      WHERE u.role_id = 3 AND u.status = 'pending'
      ORDER BY u.id DESC
    `;
    db.query(sql, (listErr, pendingRows) => {
      if (listErr) return res.status(500).json({ message: "Không thể lấy danh sách chờ duyệt" });
      return res.json(pendingRows);
    });
  });
};

exports.getCreatedStaff = (req, res) => {
  db.query("SELECT id, role_id FROM users WHERE id = ?", [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi server" });
    if (!rows.length) return res.status(401).json({ message: "Người dùng không hợp lệ" });
    if (rows[0].role_id !== 2) {
      return res.status(403).json({ message: "Chỉ Manager được xem danh sách nhân viên đã tạo" });
    }

    // Removed created_by = ? filter to show all staff to Managers
    const sql = `
      SELECT id, name, email, phone, status, created_by
      FROM users
      WHERE role_id = 3
      ORDER BY id DESC
    `;
    db.query(sql, (listErr, staffRows) => {
      if (listErr) return res.status(500).json({ message: "Không thể lấy danh sách nhân viên" });
      return res.json(staffRows);
    });
  });
};

exports.addInventoryStock = (req, res) => {
  const { product_id, quantity, note } = req.body;
  const qty = Number(quantity);

  if (!product_id || !qty || qty <= 0) {
    return res.status(400).json({ message: "Thiếu product_id hoặc quantity không hợp lệ" });
  }

  checkManager(req.user.id, (checkErr) => {
    if (checkErr) return res.status(checkErr.code).json({ message: checkErr.message });

    db.query("SELECT id, name, stock FROM products WHERE id = ?", [product_id], (err, rows) => {
      if (err) return res.status(500).json({ message: "Lỗi lấy sản phẩm" });
      if (!rows.length) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

      const product = rows[0];
      const oldStock = Number(product.stock || 0);
      const newStock = oldStock + qty;

      db.query("UPDATE products SET stock = ? WHERE id = ?", [newStock, product_id], (updateErr) => {
        if (updateErr) return res.status(500).json({ message: "Không thể cập nhật tồn kho" });

        const insertLogSql = `
          INSERT INTO inventory_logs (product_id, manager_id, quantity_added, old_stock, new_stock, note)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        db.query(
          insertLogSql,
          [product_id, req.user.id, qty, oldStock, newStock, note || null],
          (logErr) => {
            if (logErr) return res.status(500).json({ message: "Cập nhật kho thành công nhưng lỗi lưu lịch sử nhập" });
            return res.json({
              message: "Nhập kho thành công",
              product_id: Number(product_id),
              product_name: product.name,
              old_stock: oldStock,
              new_stock: newStock,
            });
          },
        );
      });
    });
  });
};

exports.getInventoryLogs = (req, res) => {
  checkManager(req.user.id, (checkErr) => {
    if (checkErr) return res.status(checkErr.code).json({ message: checkErr.message });

    // Removed manager_id = ? filter to show all inventory logs to Managers
    const sql = `
      SELECT
        l.id,
        l.product_id,
        p.name AS product_name,
        l.quantity_added,
        l.old_stock,
        l.new_stock,
        l.note,
        l.created_at
      FROM inventory_logs l
      JOIN products p ON p.id = l.product_id
      ORDER BY l.id DESC
      LIMIT 100
    `;
    db.query(sql, (err, rows) => {
      if (err) return res.status(500).json({ message: "Không thể lấy lịch sử nhập kho" });
      return res.json(rows);
    });
  });
};

exports.addStaffWorkLog = (req, res) => {
  const { staff_id, work_date, hours_worked, note } = req.body;
  const hours = Number(hours_worked);

  if (!staff_id || !work_date || !hours || hours <= 0) {
    return res.status(400).json({ message: "Thiếu staff_id, work_date hoặc hours_worked không hợp lệ" });
  }

  checkManager(req.user.id, (checkErr) => {
    if (checkErr) return res.status(checkErr.code).json({ message: checkErr.message });

    db.query(
      "SELECT id, role_id, status FROM users WHERE id = ?",
      [staff_id],
      (staffErr, staffRows) => {
        if (staffErr) return res.status(500).json({ message: "Lỗi kiểm tra nhân viên" });
        if (!staffRows.length || staffRows[0].role_id !== 3) {
          return res.status(404).json({ message: "Không tìm thấy tài khoản Staff" });
        }
        if (staffRows[0].status !== "active") {
          return res.status(400).json({ message: "Staff chưa active nên chưa thể chấm công" });
        }

        const sql = `
          INSERT INTO staff_work_logs (staff_id, manager_id, work_date, hours_worked, note)
          VALUES (?, ?, ?, ?, ?)
        `;
        db.query(sql, [staff_id, req.user.id, work_date, hours, note || null], (insErr) => {
          if (insErr) return res.status(500).json({ message: "Không thể lưu giờ làm" });
          return res.status(201).json({ message: "Đã lưu giờ làm cho Staff" });
        });
      },
    );
  });
};

exports.getStaffPayroll = (req, res) => {
  const month = req.query.month;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ message: "month phải theo định dạng YYYY-MM" });
  }

  checkManager(req.user.id, (checkErr) => {
    if (checkErr) return res.status(checkErr.code).json({ message: checkErr.message });

    const sql = `
      SELECT
        u.id AS staff_id,
        u.name AS staff_name,
        u.email,
        u.employment_status,
        u.probation_hourly_rate,
        u.official_hourly_rate,
        ROUND(IFNULL(SUM(a.worked_seconds), 0) / 3600, 2) AS total_hours,
        ROUND(
          IFNULL(
            SUM((a.worked_seconds / 3600) * a.wage_rate),
            0
          ),
          0
        ) AS salary_amount
      FROM users u
      LEFT JOIN attendance_sessions a
        ON a.staff_id = u.id
        AND a.status = 'closed'
        AND DATE_FORMAT(a.check_in_at, '%Y-%m') = ?
        AND NOT EXISTS (
          SELECT 1
          FROM attendance_sessions bad
          WHERE bad.staff_id = u.id
            AND bad.status = 'open'
            AND DATE(bad.check_in_at) = DATE(a.check_in_at)
            AND TIMESTAMPDIFF(HOUR, bad.check_in_at, NOW()) >= 24
        )
      WHERE u.role_id = 3 AND u.status = 'active'
      GROUP BY
        u.id, u.name, u.email, u.employment_status,
        u.probation_hourly_rate, u.official_hourly_rate
      ORDER BY u.id DESC
    `;

    db.query(sql, [month], (err, rows) => {
      if (err) return res.status(500).json({ message: "Không thể tính lương nhân viên" });
      
      // Calculate current stats for AI Tiger
      const statsSql = `
        SELECT 
          COUNT(*) as workingCount, 
          IFNULL(SUM(wage_rate * TIMESTAMPDIFF(SECOND, check_in_at, NOW()) / 3600), 0) as estimatedCost
        FROM attendance_sessions
        WHERE status = 'open' AND DATE(check_in_at) = CURDATE()
      `;
      db.query(statsSql, (statsErr, statsRows) => {
        const stats = statsRows[0] || { workingCount: 0, estimatedCost: 0 };
        return res.json({
          rows,
          stats: {
            workingCount: stats.workingCount,
            estimatedCost: Math.round(stats.estimatedCost)
          }
        });
      });
    });
  });
};

exports.getMyPayroll = (req, res) => {
  const month = req.query.month;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ message: "month phải theo định dạng YYYY-MM" });
  }
  checkStaffActive(req.user.id, (checkErr) => {
    if (checkErr) return res.status(checkErr.code).json({ message: checkErr.message });

    const sql = `
      SELECT
        u.id AS staff_id,
        u.name AS staff_name,
        u.email,
        u.employment_status,
        u.probation_hourly_rate,
        u.official_hourly_rate,
        ROUND(IFNULL(SUM(a.worked_seconds), 0) / 3600, 2) AS total_hours,
        ROUND(IFNULL(SUM((a.worked_seconds / 3600) * a.wage_rate), 0), 0) AS salary_amount
      FROM users u
      LEFT JOIN attendance_sessions a
        ON a.staff_id = u.id
        AND a.status = 'closed'
        AND DATE_FORMAT(a.check_in_at, '%Y-%m') = ?
        AND NOT EXISTS (
          SELECT 1
          FROM attendance_sessions bad
          WHERE bad.staff_id = u.id
            AND bad.status = 'open'
            AND DATE(bad.check_in_at) = DATE(a.check_in_at)
            AND TIMESTAMPDIFF(HOUR, bad.check_in_at, NOW()) >= 24
        )
      WHERE u.id = ?
      GROUP BY u.id, u.name, u.email, u.employment_status, u.probation_hourly_rate, u.official_hourly_rate
    `;
    db.query(sql, [month, req.user.id], (err, rows) => {
      if (err) return res.status(500).json({ message: "Không thể lấy lương cá nhân" });
      return res.json(rows[0] || null);
    });
  });
};

exports.getProbationStaff = (req, res) => {
  checkManager(req.user.id, (checkErr) => {
    if (checkErr) return res.status(checkErr.code).json({ message: checkErr.message });

    const sql = `
      SELECT
        id, name, email, employment_status, probation_start_at,
        probation_hourly_rate, official_hourly_rate
      FROM users
      WHERE role_id = 3 AND status = 'active' AND employment_status = 'probation'
      ORDER BY id DESC
    `;
    db.query(sql, (err, rows) => {
      if (err) return res.status(500).json({ message: "Không thể lấy danh sách thử việc" });
      return res.json(rows);
    });
  });
};

exports.approveOfficialStaff = (req, res) => {
  const { userId } = req.params;
  checkManager(req.user.id, (checkErr) => {
    if (checkErr) return res.status(checkErr.code).json({ message: checkErr.message });

    const sql = `
      UPDATE users
      SET employment_status = 'official', official_at = NOW()
      WHERE id = ? AND role_id = 3 AND status = 'active'
    `;
    db.query(sql, [userId], (err, result) => {
      if (err) return res.status(500).json({ message: "Không thể duyệt lên chính thức" });
      if (!result.affectedRows) return res.status(404).json({ message: "Không tìm thấy staff phù hợp" });
      return res.json({ message: "Đã duyệt nhân viên lên chính thức", employment_status: "official" });
    });
  });
};

exports.getMyAttendanceStatus = (req, res) => {
  db.query(
    "SELECT id, role_id, status, employment_status, probation_hourly_rate, official_hourly_rate FROM users WHERE id = ?",
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Lỗi server" });
      if (!rows.length || rows[0].role_id !== 3) return res.status(403).json({ message: "Chỉ Staff được chấm công" });
      if (rows[0].status !== "active") return res.status(403).json({ message: "Staff chưa active" });

      db.query(
        "SELECT id, check_in_at FROM attendance_sessions WHERE staff_id = ? AND status = 'open' ORDER BY id DESC LIMIT 1",
        [req.user.id],
        (sessionErr, sessions) => {
          if (sessionErr) return res.status(500).json({ message: "Không thể lấy trạng thái chấm công" });
          const openSession = sessions[0] || null;
          return res.json({
            employment_status: rows[0].employment_status,
            probation_hourly_rate: Number(rows[0].probation_hourly_rate || 20000),
            official_hourly_rate: Number(rows[0].official_hourly_rate || 25000),
            open_session: openSession,
          });
        },
      );
    },
  );
};

exports.staffClockIn = (req, res) => {
  db.query(
    "SELECT id, role_id, status, employment_status, probation_start_at, probation_hourly_rate, official_hourly_rate FROM users WHERE id = ?",
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Lỗi server" });
      if (!rows.length || rows[0].role_id !== 3) return res.status(403).json({ message: "Chỉ Staff được chấm công" });
      if (rows[0].status !== "active") return res.status(403).json({ message: "Staff chưa active" });

      const staff = rows[0];
      db.query(
        "SELECT id FROM attendance_sessions WHERE staff_id = ? AND status = 'open' LIMIT 1",
        [req.user.id],
        (openErr, openRows) => {
          if (openErr) return res.status(500).json({ message: "Lỗi kiểm tra ca làm" });
          if (openRows.length) return res.status(400).json({ message: "Bạn đang có ca làm chưa check-out" });

          const wageRate =
            staff.employment_status === "official"
              ? Number(staff.official_hourly_rate || 25000)
              : Number(staff.probation_hourly_rate || 20000);

          const insertSql = `
            INSERT INTO attendance_sessions (staff_id, wage_rate, status)
            VALUES (?, ?, 'open')
          `;
          db.query(insertSql, [req.user.id, wageRate], (insErr, result) => {
            if (insErr) return res.status(500).json({ message: "Không thể check-in" });

            if (staff.employment_status === "probation" && !staff.probation_start_at) {
              db.query(
                "UPDATE users SET probation_start_at = NOW() WHERE id = ?",
                [req.user.id],
                () => {
                  return res.status(201).json({ message: "Check-in thành công", session_id: result.insertId });
                },
              );
              return;
            }
            return res.status(201).json({ message: "Check-in thành công", session_id: result.insertId });
          });
        },
      );
    },
  );
};

exports.staffClockOut = (req, res) => {
  db.query(
    "SELECT id, role_id, status, employment_status FROM users WHERE id = ?",
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Lỗi server" });
      if (!rows.length || rows[0].role_id !== 3) return res.status(403).json({ message: "Chỉ Staff được chấm công" });
      if (rows[0].status !== "active") return res.status(403).json({ message: "Staff chưa active" });

      const staff = rows[0];
      const getSessionSql = `
        SELECT id, check_in_at
        FROM attendance_sessions
        WHERE staff_id = ? AND status = 'open'
        ORDER BY id DESC
        LIMIT 1
      `;
      db.query(getSessionSql, [req.user.id], (sessionErr, sessionRows) => {
        if (sessionErr) return res.status(500).json({ message: "Lỗi lấy ca làm" });
        if (!sessionRows.length) return res.status(400).json({ message: "Không có ca làm đang mở để check-out" });

        const session = sessionRows[0];
        const closeSql = `
          UPDATE attendance_sessions
          SET check_out_at = NOW(),
              worked_seconds = TIMESTAMPDIFF(SECOND, check_in_at, NOW()),
              status = 'closed'
          WHERE id = ?
        `;
        db.query(closeSql, [session.id], (closeErr) => {
          if (closeErr) return res.status(500).json({ message: "Không thể check-out" });

          if (staff.employment_status !== "probation") {
            return res.json({ message: "Check-out thành công" });
          }

          const probationDaysSql = `
            SELECT COUNT(DISTINCT DATE(check_in_at)) AS total_days
            FROM attendance_sessions
            WHERE staff_id = ? AND status = 'closed'
          `;
          db.query(probationDaysSql, [req.user.id], (daysErr, daysRows) => {
            if (daysErr) return res.json({ message: "Check-out thành công" });
            const totalDays = Number(daysRows?.[0]?.total_days || 0);
            if (totalDays < 3) return res.json({ message: "Check-out thành công" });

            db.query(
              "UPDATE users SET employment_status = 'official', official_at = NOW() WHERE id = ?",
              [req.user.id],
              () => {
                return res.json({
                  message: "Check-out thành công. Bạn đã đủ 3 ngày thử việc và được chuyển chính thức.",
                  employment_status: "official",
                });
              },
            );
          });
        });
      });
    },
  );
};

exports.createStaffRequest = (req, res) => {
  const { request_type, request_date, reason, minutes_late } = req.body;
  if (!request_type || !request_date || !reason) {
    return res.status(400).json({ message: "Thiếu thông tin đơn xin" });
  }
  if (!["late", "leave"].includes(request_type)) {
    return res.status(400).json({ message: "request_type chỉ nhận late hoặc leave" });
  }
  checkStaffActive(req.user.id, (checkErr) => {
    if (checkErr) return res.status(checkErr.code).json({ message: checkErr.message });
    const sql = `
      INSERT INTO staff_requests
      (staff_id, request_type, request_date, minutes_late, reason)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(
      sql,
      [req.user.id, request_type, request_date, minutes_late || null, reason],
      (err) => {
        if (err) return res.status(500).json({ message: "Không thể gửi đơn" });
        return res.status(201).json({ message: "Đã gửi đơn thành công" });
      },
    );
  });
};

exports.getMyStaffRequests = (req, res) => {
  checkStaffActive(req.user.id, (checkErr) => {
    if (checkErr) return res.status(checkErr.code).json({ message: checkErr.message });
    db.query(
      "SELECT * FROM staff_requests WHERE staff_id = ? ORDER BY id DESC LIMIT 100",
      [req.user.id],
      (err, rows) => {
        if (err) return res.status(500).json({ message: "Không thể lấy đơn của bạn" });
        return res.json(rows);
      },
    );
  });
};

exports.registerShift = (req, res) => {
  const { shift_date, start_time, end_time, note } = req.body;
  if (!shift_date || !start_time || !end_time) {
    return res.status(400).json({ message: "Thiếu thông tin ca làm" });
  }
  checkStaffActive(req.user.id, (checkErr) => {
    if (checkErr) return res.status(checkErr.code).json({ message: checkErr.message });
    db.query(
      `INSERT INTO shift_registrations (staff_id, shift_date, start_time, end_time, note)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, shift_date, start_time, end_time, note || null],
      (err) => {
        if (err) return res.status(500).json({ message: "Không thể đăng ký ca" });
        return res.status(201).json({ message: "Đã đăng ký ca làm" });
      },
    );
  });
};

exports.getMyShifts = (req, res) => {
  checkStaffActive(req.user.id, (checkErr) => {
    if (checkErr) return res.status(checkErr.code).json({ message: checkErr.message });
    db.query(
      "SELECT * FROM shift_registrations WHERE staff_id = ? ORDER BY id DESC LIMIT 100",
      [req.user.id],
      (err, rows) => {
        if (err) return res.status(500).json({ message: "Không thể lấy ca làm của bạn" });
        return res.json(rows);
      },
    );
  });
};

exports.getPendingStaffRequests = (req, res) => {
  checkManager(req.user.id, (checkErr) => {
    if (checkErr) return res.status(checkErr.code).json({ message: checkErr.message });
    const sql = `
      SELECT r.*, u.name AS staff_name, u.email AS staff_email
      FROM staff_requests r
      JOIN users u ON u.id = r.staff_id
      WHERE r.status = 'pending'
      ORDER BY r.id DESC
    `;
    db.query(sql, (err, rows) => {
      if (err) return res.status(500).json({ message: "Không thể lấy đơn chờ duyệt" });
      return res.json(rows);
    });
  });
};

exports.decideStaffRequest = (req, res) => {
  const { requestId } = req.params;
  const { decision, manager_note } = req.body;
  if (!["approved", "rejected"].includes(decision)) {
    return res.status(400).json({ message: "decision chỉ nhận approved hoặc rejected" });
  }
  checkManager(req.user.id, (checkErr) => {
    if (checkErr) return res.status(checkErr.code).json({ message: checkErr.message });
    db.query(
      `UPDATE staff_requests
       SET status = ?, manager_id = ?, manager_note = ?
       WHERE id = ? AND status = 'pending'`,
      [decision, req.user.id, manager_note || null, requestId],
      (err, result) => {
        if (err) return res.status(500).json({ message: "Không thể duyệt đơn" });
        if (!result.affectedRows) return res.status(404).json({ message: "Không tìm thấy đơn pending" });
        return res.json({ message: "Đã cập nhật trạng thái đơn" });
      },
    );
  });
};

exports.getPendingShifts = (req, res) => {
  checkManager(req.user.id, (checkErr) => {
    if (checkErr) return res.status(checkErr.code).json({ message: checkErr.message });
    const sql = `
      SELECT s.*, u.name AS staff_name, u.email AS staff_email
      FROM shift_registrations s
      JOIN users u ON u.id = s.staff_id
      WHERE s.status = 'pending'
      ORDER BY s.id DESC
    `;
    db.query(sql, (err, rows) => {
      if (err) return res.status(500).json({ message: "Không thể lấy ca chờ duyệt" });
      return res.json(rows);
    });
  });
};

exports.decideShift = (req, res) => {
  const { shiftId } = req.params;
  const { decision } = req.body;
  if (!["approved", "rejected"].includes(decision)) {
    return res.status(400).json({ message: "decision chỉ nhận approved hoặc rejected" });
  }
  checkManager(req.user.id, (checkErr) => {
    if (checkErr) return res.status(checkErr.code).json({ message: checkErr.message });
    db.query(
      `UPDATE shift_registrations
       SET status = ?, manager_id = ?
       WHERE id = ? AND status = 'pending'`,
      [decision, req.user.id, shiftId],
      (err, result) => {
        if (err) return res.status(500).json({ message: "Không thể duyệt ca" });
        if (!result.affectedRows) return res.status(404).json({ message: "Không tìm thấy ca pending" });
        return res.json({ message: "Đã cập nhật trạng thái ca" });
      },
    );
  });
};

exports.getAttendanceIssues = (req, res) => {
  checkManager(req.user.id, (checkErr) => {
    if (checkErr) return res.status(checkErr.code).json({ message: checkErr.message });
    const sql = `
      SELECT a.id, a.staff_id, u.name AS staff_name, u.email AS staff_email, a.check_in_at, a.status
      FROM attendance_sessions a
      JOIN users u ON u.id = a.staff_id
      WHERE a.status = 'open'
        AND TIMESTAMPDIFF(HOUR, a.check_in_at, NOW()) >= 24
      ORDER BY a.check_in_at ASC
    `;
    db.query(sql, (err, rows) => {
      if (err) return res.status(500).json({ message: "Không thể lấy ca lỗi check-out" });
      return res.json(rows);
    });
  });
};

exports.fixAttendanceCheckout = (req, res) => {
  const { sessionId } = req.params;
  const { check_out_at } = req.body;
  if (!check_out_at) return res.status(400).json({ message: "Thiếu check_out_at" });

  checkManager(req.user.id, (checkErr) => {
    if (checkErr) return res.status(checkErr.code).json({ message: checkErr.message });

    const sql = `
      UPDATE attendance_sessions
      SET check_out_at = ?,
          worked_seconds = GREATEST(TIMESTAMPDIFF(SECOND, check_in_at, ?), 0),
          status = 'closed',
          corrected_by_manager_id = ?,
          corrected_at = NOW()
      WHERE id = ?
    `;
    db.query(sql, [check_out_at, check_out_at, req.user.id, sessionId], (err, result) => {
      if (err) return res.status(500).json({ message: "Không thể chỉnh sửa check-out" });
      if (!result.affectedRows) return res.status(404).json({ message: "Không tìm thấy session" });
      return res.json({ message: "Đã chỉnh thời gian check-out thành công" });
    });
  });
};

// ✅ LẤY TẤT CẢ NHÂN VIÊN VÀ QUẢN LÝ (Cho Manager/Admin xem)
exports.getAllUsers = (req, res) => {
  checkManager(req.user.id, (checkErr) => {
    if (checkErr) return res.status(checkErr.code).json({ message: checkErr.message });

    const sql = `
      SELECT id, name, email, phone, role_id, status, is_active,
             probation_hourly_rate, official_hourly_rate, employment_status
      FROM users 
      WHERE deleted_at IS NULL 
      ORDER BY role_id ASC, name ASC
    `;
    db.query(sql, (err, rows) => {
      if (err) return res.status(500).json({ message: "Lỗi lấy danh sách nhân sự: " + err.message });
      res.json(rows);
    });
  });
};

exports.getActiveStaff = (req, res) => {
  checkManager(req.user.id, (checkErr) => {
    if (checkErr) return res.status(checkErr.code).json({ message: checkErr.message });

    db.query(
      "SELECT id, name, email, hourly_rate FROM users WHERE role_id = 3 AND status = 'active' AND deleted_at IS NULL ORDER BY id DESC",
      (err, rows) => {
        if (err) return res.status(500).json({ message: "Không thể lấy danh sách staff" });
        return res.json(rows);
      },
    );
  });
};
// ✅ SOFT DELETE USER
exports.deleteUser = (req, res) => {
  const { userId } = req.params;
  db.query("UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?", [userId], (err) => {
    if (err) return res.status(500).json({ message: "Lỗi xóa người dùng" });
    res.json({ message: "Đã chuyển người dùng vào thùng rác" });
  });
};

// ✅ RESTORE USER
exports.restoreUser = (req, res) => {
  const { userId } = req.params;
  db.query("UPDATE users SET deleted_at = NULL WHERE id = ?", [userId], (err) => {
    if (err) return res.status(500).json({ message: "Lỗi khôi phục người dùng" });
    res.json({ message: "Khôi phục người dùng thành công" });
  });
};

// ✅ CHANGE ROLE
exports.changeRole = (req, res) => {
  const { userId } = req.params;
  const { role_id } = req.body;
  
  if (!role_id) return res.status(400).json({ message: "Thiếu role_id" });

  db.query("UPDATE users SET role_id = ? WHERE id = ?", [role_id, userId], (err) => {
    if (err) return res.status(500).json({ message: "Lỗi phân quyền" });
    res.json({ message: "Cập nhật quyền thành công" });
  });
};

// ✅ CẬP NHẬT THÔNG TIN CÔNG VIỆC NHÂN VIÊN (Manager/Admin)
exports.changeJobInfo = (req, res) => {
  const { userId } = req.params;
  const { role_id, probation_hourly_rate, official_hourly_rate } = req.body;
  if (!role_id || !probation_hourly_rate || !official_hourly_rate) {
    return res.status(400).json({ message: "Thiếu thông tin công việc" });
  }

  const sql = `
    UPDATE users 
    SET role_id = ?, probation_hourly_rate = ?, official_hourly_rate = ?
    WHERE id = ?
  `;

  db.query(sql, [role_id, probation_hourly_rate, official_hourly_rate, userId], (err, result) => {
    if (err) return res.status(500).json({ message: "Lỗi hệ thống: " + err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    res.json({ message: "Cập nhật thông tin công việc thành công" });
  });
};

// ✅ TOGGLE LOCK STATUS
exports.toggleStatus = (req, res) => {
  const { userId } = req.params;
  const { is_active } = req.body;

  if (is_active === undefined) return res.status(400).json({ message: "Thiếu trạng thái is_active" });

  db.query("UPDATE users SET is_active = ? WHERE id = ?", [is_active ? 1 : 0, userId], (err) => {
    if (err) return res.status(500).json({ message: "Lỗi khóa tài khoản" });
    res.json({ message: is_active ? "Đã mở khóa tài khoản" : "Tài khoản đã bị khóa" });
  });
};

// ✅ CHI TIẾT PHIẾU LƯƠNG THEO NGÀY (STAFF TỰ XEM)
exports.getMyPayrollDetail = (req, res) => {
  const month = req.query.month;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ message: "month phải theo định dạng YYYY-MM" });
  }
  checkStaffActive(req.user.id, (checkErr) => {
    if (checkErr) return res.status(checkErr.code).json({ message: checkErr.message });

    // Lấy thông tin nhân viên
    db.query(
      "SELECT id, name, email, employment_status, probation_hourly_rate, official_hourly_rate FROM users WHERE id = ?",
      [req.user.id],
      (userErr, userRows) => {
        if (userErr || !userRows.length) return res.status(500).json({ message: "Lỗi lấy thông tin nhân viên" });
        const user = userRows[0];

        // Lấy từng ca chấm công đã đóng trong tháng
        const sql = `
          SELECT
            DATE(check_in_at) AS work_date,
            TIME(check_in_at) AS check_in_time,
            TIME(check_out_at) AS check_out_time,
            ROUND(worked_seconds / 3600, 2) AS hours_worked,
            wage_rate,
            ROUND((worked_seconds / 3600) * wage_rate, 0) AS daily_pay,
            id AS session_id
          FROM attendance_sessions
          WHERE staff_id = ?
            AND status = 'closed'
            AND DATE_FORMAT(check_in_at, '%Y-%m') = ?
          ORDER BY check_in_at ASC
        `;
        db.query(sql, [req.user.id, month], (err, days) => {
          if (err) return res.status(500).json({ message: "Không thể lấy chi tiết phiếu lương" });

          const totalHours = days.reduce((s, d) => s + Number(d.hours_worked || 0), 0);
          const totalPay = days.reduce((s, d) => s + Number(d.daily_pay || 0), 0);

          return res.json({
            staff: {
              id: user.id,
              name: user.name,
              email: user.email,
              employment_status: user.employment_status,
              hourly_rate: user.employment_status === "official"
                ? Number(user.official_hourly_rate || 25000)
                : Number(user.probation_hourly_rate || 20000),
            },
            month,
            days,
            summary: {
              total_days: days.length,
              total_hours: Math.round(totalHours * 100) / 100,
              total_pay: Math.round(totalPay),
            },
          });
        });
      }
    );
  });
};

// ✅ CHI TIẾT PHIẾU LƯƠNG THEO NGÀY (MANAGER XEM CHO TỪNG NHÂN VIÊN)
exports.getStaffPayrollDetail = (req, res) => {
  const month = req.query.month;
  const staffId = req.query.staff_id;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ message: "month phải theo định dạng YYYY-MM" });
  }
  if (!staffId) return res.status(400).json({ message: "Thiếu staff_id" });

  checkManager(req.user.id, (checkErr) => {
    if (checkErr) return res.status(checkErr.code).json({ message: checkErr.message });

    db.query(
      "SELECT id, name, email, employment_status, probation_hourly_rate, official_hourly_rate FROM users WHERE id = ? AND role_id = 3",
      [staffId],
      (userErr, userRows) => {
        if (userErr || !userRows.length) return res.status(404).json({ message: "Không tìm thấy nhân viên" });
        const user = userRows[0];

        const sql = `
          SELECT
            DATE(check_in_at) AS work_date,
            TIME(check_in_at) AS check_in_time,
            TIME(check_out_at) AS check_out_time,
            ROUND(worked_seconds / 3600, 2) AS hours_worked,
            wage_rate,
            ROUND((worked_seconds / 3600) * wage_rate, 0) AS daily_pay,
            id AS session_id
          FROM attendance_sessions
          WHERE staff_id = ?
            AND status = 'closed'
            AND DATE_FORMAT(check_in_at, '%Y-%m') = ?
          ORDER BY check_in_at ASC
        `;
        db.query(sql, [staffId, month], (err, days) => {
          if (err) return res.status(500).json({ message: "Không thể lấy chi tiết phiếu lương" });

          const totalHours = days.reduce((s, d) => s + Number(d.hours_worked || 0), 0);
          const totalPay = days.reduce((s, d) => s + Number(d.daily_pay || 0), 0);

          return res.json({
            staff: {
              id: user.id,
              name: user.name,
              email: user.email,
              employment_status: user.employment_status,
              hourly_rate: user.employment_status === "official"
                ? Number(user.official_hourly_rate || 25000)
                : Number(user.probation_hourly_rate || 20000),
            },
            month,
            days,
            summary: {
              total_days: days.length,
              total_hours: Math.round(totalHours * 100) / 100,
              total_pay: Math.round(totalPay),
            },
          });
        });
      }
    );
  });
};
