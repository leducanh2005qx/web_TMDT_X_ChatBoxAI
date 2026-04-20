import { useEffect, useRef } from "react";
import "./PayslipModal.css";

/**
 * PayslipModal - Phiếu lương chi tiết theo ngày
 * Props:
 *   data: { staff, month, days, summary } | null
 *   onClose: () => void
 *   loading?: boolean
 */
export default function PayslipModal({ data, onClose, loading = false }) {
  const printRef = useRef();

  // Close on ESC
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const fmtTime = (t) => {
    if (!t) return "—";
    return String(t).slice(0, 5); // HH:MM
  };

  const fmtDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    return dt.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" });
  };

  const fmtMoney = (n) => `${Number(n || 0).toLocaleString("vi-VN")} đ`;

  const handlePrint = () => {
    window.print();
  };

  const monthLabel = data?.month
    ? (() => {
        const [y, m] = data.month.split("-");
        return `Tháng ${m}/${y}`;
      })()
    : "";

  const statusLabel = data?.staff?.employment_status === "official" ? "Chính thức" : "Thử việc";
  const statusColor = data?.staff?.employment_status === "official" ? "#10b981" : "#f59e0b";

  // AI Tiger auto comment
  const getAiComment = (summary, days) => {
    if (!summary || !days) return "Tháng này em làm rất tốt, đi làm đúng giờ 100%, thưởng nóng thôi! 🐯";
    const { total_days, total_hours } = summary;
    if (total_days === 0) return "Tháng này chưa có ca làm nào được ghi nhận sếp ơi! Nhớ bấm check-in nhé 🐯";
    const avgHours = (total_hours / total_days).toFixed(1);
    if (total_days >= 20) return `Tháng này em làm rất xuất sắc với ${total_days} ngày công! Trung bình ${avgHours}h/ngày, thưởng nóng thôi! 🐯🔥`;
    if (total_days >= 10) return `Tháng này em đã tích lũy ${total_days} ngày công, trung bình ${avgHours}h/ngày. Cố lên tiger! 🐯`;
    return `Tháng này em làm ${total_days} ngày công. Tiger tin em sẽ làm tốt hơn tháng sau! 🐯`;
  };

  return (
    <div className="payslip-overlay" onClick={(e) => { if (e.target.classList.contains("payslip-overlay")) onClose(); }}>
      <div className="payslip-container">
        {/* Toolbar (không in) */}
        <div className="payslip-toolbar no-print">
          <span className="payslip-toolbar-title">📄 Phiếu Lương Chi Tiết</span>
          <div className="d-flex gap-2">
            <button className="payslip-btn payslip-btn-pdf" onClick={handlePrint}>
              📥 Xuất PDF
            </button>
            <button className="payslip-btn payslip-btn-close" onClick={onClose}>✕ Đóng</button>
          </div>
        </div>

        {/* Nội dung phiếu lương (vùng được in) */}
        <div className="payslip-body" ref={printRef}>
          {loading ? (
            <div className="payslip-loading">
              <div className="spinner-border text-warning" />
              <p>Đang tải dữ liệu phiếu lương...</p>
            </div>
          ) : !data ? (
            <div className="payslip-empty">Không có dữ liệu chấm công trong tháng này.</div>
          ) : (
            <>
              {/* Header phiếu lương */}
              <div className="payslip-header">
                <div className="payslip-logo">🐯 Tiger Shop</div>
                <div className="payslip-title-block">
                  <h2 className="payslip-title">PHIẾU LƯƠNG</h2>
                  <div className="payslip-subtitle">{monthLabel}</div>
                </div>
              </div>

              {/* Thông tin nhân viên */}
              <div className="payslip-info-grid">
                <div className="payslip-info-item">
                  <span className="payslip-info-label">Họ và tên</span>
                  <span className="payslip-info-value">{data.staff?.name}</span>
                </div>
                <div className="payslip-info-item">
                  <span className="payslip-info-label">Email</span>
                  <span className="payslip-info-value">{data.staff?.email}</span>
                </div>
                <div className="payslip-info-item">
                  <span className="payslip-info-label">Trạng thái</span>
                  <span className="payslip-info-value" style={{ color: statusColor, fontWeight: 700 }}>
                    {statusLabel}
                  </span>
                </div>
                <div className="payslip-info-item">
                  <span className="payslip-info-label">Lương/giờ</span>
                  <span className="payslip-info-value">{fmtMoney(data.staff?.hourly_rate)}</span>
                </div>
              </div>

              {/* Bảng chi tiết từng ngày */}
              <div className="payslip-table-wrap">
                <table className="payslip-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Ngày làm</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Số giờ</th>
                      <th>Lương/giờ</th>
                      <th className="text-end">Lương ngày</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.days.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="payslip-empty-row">
                          Chưa có dữ liệu chấm công trong tháng này
                        </td>
                      </tr>
                    ) : (
                      data.days.map((d, i) => (
                        <tr key={d.session_id || i} className={i % 2 === 0 ? "payslip-row-even" : "payslip-row-odd"}>
                          <td className="payslip-col-idx">{i + 1}</td>
                          <td className="payslip-col-date">{fmtDate(d.work_date)}</td>
                          <td className="payslip-col-time payslip-checkin">{fmtTime(d.check_in_time)}</td>
                          <td className="payslip-col-time payslip-checkout">{fmtTime(d.check_out_time)}</td>
                          <td className="payslip-col-hours">{Number(d.hours_worked || 0).toFixed(2)}h</td>
                          <td className="payslip-col-rate">{fmtMoney(d.wage_rate)}</td>
                          <td className="payslip-col-pay text-end">{fmtMoney(d.daily_pay)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Tổng kết */}
              <div className="payslip-summary">
                <div className="payslip-summary-row">
                  <span>Tổng số ngày công</span>
                  <span className="payslip-summary-val">{data.summary?.total_days} ngày</span>
                </div>
                <div className="payslip-summary-row">
                  <span>Tổng giờ làm việc</span>
                  <span className="payslip-summary-val">{Number(data.summary?.total_hours || 0).toFixed(2)} giờ</span>
                </div>
                <div className="payslip-summary-row payslip-summary-total">
                  <span>💰 TỔNG LƯƠNG THÁNG</span>
                  <span className="payslip-total-amount">{fmtMoney(data.summary?.total_pay)}</span>
                </div>
              </div>

              {/* AI Tiger Comment */}
              <div className="payslip-tiger-comment">
                <div className="payslip-tiger-avatar">🐯</div>
                <div className="payslip-tiger-text">
                  <div className="payslip-tiger-name">AI Tiger Nhận xét</div>
                  <div className="payslip-tiger-msg">
                    {getAiComment(data.summary, data.days)}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="payslip-footer">
                <div className="payslip-footer-left">
                  <div className="payslip-footer-label">Nhân viên xác nhận</div>
                  <div className="payslip-footer-sign">{data.staff?.name}</div>
                </div>
                <div className="payslip-footer-right">
                  <div className="payslip-footer-label">Quản lý duyệt</div>
                  <div className="payslip-footer-sign">Tiger Shop Manager</div>
                </div>
              </div>
              <div className="payslip-generated">
                Phiếu lương được tạo tự động bởi Tiger Shop System • {new Date().toLocaleString("vi-VN")}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
