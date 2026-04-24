const db = require("../config/db");

/**
 * Tặng Welcome Voucher 10% cho khách hàng mới đăng ký
 * Mã: WELCOME_[USER_ID], giảm 10%, tối đa 50k, HSD 30 ngày
 */
exports.giftWelcomeVoucher = (userId, callback) => {
  const code = `WELCOME_${userId}`;
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 30);

  const startStr = now.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);

  // 1. Tạo voucher trong bảng vouchers
  db.query(
    `INSERT INTO vouchers (code, type, value, min_order_value, max_discount, quantity, used, start_date, end_date, status, source)
     VALUES (?, 'percent', 10, 0, 50000, 1, 0, ?, ?, 'active', 'WELCOME')`,
    [code, startStr, endStr],
    (err, result) => {
      if (err) {
        console.error("Lỗi tạo Welcome voucher:", err.message);
        return callback && callback(err);
      }

      const voucherId = result.insertId;

      // 2. Gắn voucher cho user
      db.query(
        "INSERT INTO user_vouchers (user_id, voucher_id, used) VALUES (?, ?, 0)",
        [userId, voucherId],
        (err2) => {
          if (err2) {
            console.error("Lỗi gắn Welcome voucher:", err2.message);
            return callback && callback(err2);
          }

          console.log(`🎁 Đã tặng Welcome Voucher ${code} cho User #${userId}`);

          // 3. Ghi log
          db.query(
            "INSERT INTO user_activity_logs (user_id, action, target_id) VALUES (?, ?, ?)",
            [0, `Hệ thống tự động tặng mã Welcome 10% cho khách hàng mới #${userId}`, userId]
          );

          return callback && callback(null, { voucherId, code });
        }
      );
    }
  );
};

/**
 * Quét sinh nhật và tặng Voucher 15% cho khách hàng có sinh nhật trong 3 ngày tới
 * Mã: BDAY_[USER_ID]_[NĂM], giảm 15%, tối đa 100k, HSD 7 ngày
 */
exports.giftBirthdayVouchers = (callback) => {
  const now = new Date();
  const target = new Date(now);
  target.setDate(target.getDate() + 3); // Tặng trước 3 ngày

  const targetMonth = target.getMonth() + 1;
  const targetDay = target.getDate();
  const currentYear = now.getFullYear();

  // Tìm khách hàng (role_id = 5) có sinh nhật đúng ngày target
  db.query(
    `SELECT id, name, birthday FROM users 
     WHERE role_id = 5 
       AND birthday IS NOT NULL 
       AND MONTH(birthday) = ? 
       AND DAY(birthday) = ?
       AND is_active = 1`,
    [targetMonth, targetDay],
    (err, users) => {
      if (err) {
        console.error("Lỗi quét sinh nhật:", err.message);
        return callback && callback(err);
      }

      if (!users || users.length === 0) {
        console.log("🎂 Không có khách hàng nào có sinh nhật trong 3 ngày tới.");
        return callback && callback(null, 0);
      }

      let giftedCount = 0;
      let processed = 0;

      users.forEach((user) => {
        const code = `BDAY_${user.id}_${currentYear}`;
        const startStr = now.toISOString().slice(0, 10);
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + 7);
        const endStr = endDate.toISOString().slice(0, 10);

        // Kiểm tra đã tặng chưa (tránh trùng lặp)
        db.query(
          "SELECT voucher_id FROM vouchers WHERE code = ?",
          [code],
          (errCheck, existing) => {
            if (existing && existing.length > 0) {
              processed++;
              if (processed === users.length) {
                return callback && callback(null, giftedCount);
              }
              return;
            }

            // Tạo voucher sinh nhật
            db.query(
              `INSERT INTO vouchers (code, type, value, min_order_value, max_discount, quantity, used, start_date, end_date, status, source)
               VALUES (?, 'percent', 15, 0, 100000, 1, 0, ?, ?, 'active', 'BIRTHDAY')`,
              [code, startStr, endStr],
              (errCreate, result) => {
                if (errCreate) {
                  console.error(`Lỗi tạo Birthday voucher cho #${user.id}:`, errCreate.message);
                  processed++;
                  if (processed === users.length) {
                    return callback && callback(null, giftedCount);
                  }
                  return;
                }

                const voucherId = result.insertId;

                // Gắn voucher cho user
                db.query(
                  "INSERT INTO user_vouchers (user_id, voucher_id, used) VALUES (?, ?, 0)",
                  [user.id, voucherId],
                  (errAssign) => {
                    if (!errAssign) {
                      giftedCount++;
                      console.log(`🎂 Đã tặng Birthday Voucher ${code} cho ${user.name} (User #${user.id})`);

                      // Ghi log
                      db.query(
                        "INSERT INTO user_activity_logs (user_id, action, target_id) VALUES (?, ?, ?)",
                        [0, `Hệ thống tự động tặng mã Sinh nhật 15% cho ${user.name} (#${user.id})`, user.id]
                      );
                    }

                    processed++;
                    if (processed === users.length) {
                      return callback && callback(null, giftedCount);
                    }
                  }
                );
              }
            );
          }
        );
      });
    }
  );
};

/**
 * Thống kê voucher cho AI Tiger
 */
exports.getVoucherStats = (callback) => {
  db.query(
    `SELECT 
       (SELECT COUNT(*) FROM vouchers WHERE source = 'WELCOME') AS welcomeCount,
       (SELECT COUNT(*) FROM vouchers WHERE source = 'BIRTHDAY') AS birthdayCount,
       (SELECT COUNT(*) FROM vouchers WHERE source = 'MANUAL') AS manualCount`,
    (err, rows) => {
      if (err) return callback && callback(err);
      callback && callback(null, rows[0]);
    }
  );
};
