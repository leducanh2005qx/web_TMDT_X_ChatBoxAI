import { useEffect, useState } from "react";
import {
  getAllVouchersAdmin,
  createVoucher,
  updateVoucherStatusAdmin,
} from "../../services/api";
import "./AdminVouchers.css";

function AdminVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ===== FORM STATE ===== */
  const [code, setCode] = useState("");
  const [type, setType] = useState("percent");
  const [value, setValue] = useState(0);
  const [maxDiscount, setMaxDiscount] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [minOrder, setMinOrder] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  /* ===== UX STATE ===== */
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ===== LOAD ===== */
  const loadVouchers = () => {
    setLoading(true);
    getAllVouchersAdmin()
      .then((data) => setVouchers(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVouchers();
  }, []);

  /* ===== CHECK TRÙNG MÃ ===== */
  const normalizedCode = code.trim().toUpperCase();

  const isDuplicateCode = vouchers.some(
    (v) => v.code.trim().toUpperCase() === normalizedCode,
  );

  /* ===== CREATE ===== */
  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!normalizedCode) {
      setError("⚠️ Vui lòng nhập mã voucher");
      return;
    }

    if (isDuplicateCode) {
      setError("❌ Mã voucher đã tồn tại");
      return;
    }

    if (quantity <= 0) {
      setError("⚠️ Số lượng phải lớn hơn 0");
      return;
    }

    if (type !== "free_ship" && value <= 0) {
      setError("⚠️ Giá trị giảm không hợp lệ");
      return;
    }

    setSubmitting(true);

    try {
      await createVoucher({
        code: normalizedCode,
        type,
        value,
        max_discount: type === "percent" ? maxDiscount || null : null,
        min_order_value: minOrder || 0,
        start_date: startDate || null,
        end_date: endDate || null,
        quantity,
      });

      setSuccess("✅ Tạo voucher thành công");

      /* RESET FORM */
      setCode("");
      setType("percent");
      setValue(0);
      setMaxDiscount("");
      setQuantity(1);
      setMinOrder(0);
      setStartDate("");
      setEndDate("");

      loadVouchers();
    } catch (err) {
      setError("❌ Lỗi lưu Database");
    } finally {
      setSubmitting(false);
    }
  };

  /* ===== TOGGLE STATUS ===== */
  const toggleStatus = async (v) => {
    try {
      await updateVoucherStatusAdmin(v.voucher_id, {
        status: v.status === "active" ? "inactive" : "active",
      });
      loadVouchers();
    } catch (err) {
      alert("Lỗi khi thay đổi trạng thái");
    }
  };

  /* ✅ FIX LOGIC HIỂN THỊ: Phân biệt % và tiền mặt */
  const renderValue = (v) => {
    if (v.type === "percent") return `${v.value}%`;
    if (v.type === "fixed") return `${v.value.toLocaleString()} đ`;
    if (v.type === "free_ship") return `Freeship ${v.value.toLocaleString()} đ`;
    return v.value;
  };

  return (
    <div className="admin-voucher-page">
      <h2>🎁 Quản lý Voucher</h2>

      {/* ================= CREATE ================= */}
      <div className="voucher-card">
        <h3>Tạo voucher mới</h3>

        <form className="voucher-form" onSubmit={handleCreate}>
          <div className="form-row">
            <div className="form-group">
              <label>Mã voucher</label>
              <input
                className={isDuplicateCode ? "input error" : "input"}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError("");
                  setSuccess("");
                }}
                placeholder="VD: SALE10, TIGER2026"
              />
              {isDuplicateCode && (
                <span className="hint error-text">
                  Mã này đã có trong hệ thống
                </span>
              )}
            </div>

            <div className="form-group">
              <label>Loại voucher</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="percent">Giảm theo %</option>
                <option value="fixed">Giảm tiền mặt (đ)</option>
                <option value="free_ship">Free ship (đ)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                {type === "percent" ? "Phần trăm giảm (%)" : "Số tiền giảm (đ)"}
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
              />
            </div>

            {type === "percent" && (
              <div className="form-group">
                <label>Giảm tối đa (đ)</label>
                <input
                  type="number"
                  placeholder="Không giới hạn"
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Đơn tối thiểu (đ)</label>
              <input
                type="number"
                value={minOrder}
                onChange={(e) => setMinOrder(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>Số lượng phát hành</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Ngày bắt đầu</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Ngày kết thúc</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <button
            className="btn-create"
            type="submit"
            disabled={submitting || isDuplicateCode}
          >
            {submitting ? "Đang xử lý..." : "🚀 Phát hành Voucher"}
          </button>

          {error && <div className="alert error">{error}</div>}
          {success && <div className="alert success">{success}</div>}
        </form>
      </div>

      {/* ================= LIST ================= */}
      <div className="voucher-card">
        <h3>Danh sách Voucher đang chạy</h3>

        {loading ? (
          <div className="loading-spinner">Đang tải dữ liệu...</div>
        ) : (
          <div className="table-responsive">
            <table className="voucher-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Loại</th>
                  <th>Giá trị</th>
                  <th>Đơn tối thiểu</th>
                  <th>HSD</th>
                  <th>Đã dùng / Tổng</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v) => (
                  <tr key={v.voucher_id}>
                    <td className="code-cell">{v.code}</td>
                    <td>
                      <span className={`type-tag ${v.type}`}>{v.type}</span>
                    </td>
                    <td className="value-cell">{renderValue(v)}</td>
                    <td>{Number(v.min_order_value || 0).toLocaleString()} đ</td>
                    <td>
                      {v.end_date
                        ? new Date(v.end_date).toLocaleDateString("vi-VN")
                        : "Vô thời hạn"}
                    </td>
                    <td>
                      <span className="quantity-count">
                        {v.used || 0} / {v.quantity}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`status-btn ${v.status}`}
                        onClick={() => toggleStatus(v)}
                        title="Click để thay đổi trạng thái"
                      >
                        {v.status === "active" ? "ĐANG CHẠY" : "ĐÃ TẮT"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminVouchers;
