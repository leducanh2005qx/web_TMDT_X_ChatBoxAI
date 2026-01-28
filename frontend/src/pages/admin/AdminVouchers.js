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
    await updateVoucherStatusAdmin(v.voucher_id, {
      status: v.status === "active" ? "inactive" : "active",
    });
    loadVouchers();
  };

  const renderValue = (v) => {
    if (v.type === "percent") return `${v.value}%`;
    if (v.type === "fixed") return `${v.value.toLocaleString()} đ`;
    if (v.type === "free_ship")
      return `Free ship ${v.value.toLocaleString()} đ`;
    return "";
  };

  return (
    <div className="admin-voucher-page">
      <h2>🎁 Quản lý Voucher</h2>

      {/* ================= CREATE ================= */}
      <div className="voucher-card">
        <h3>Tạo voucher</h3>

        <form className="voucher-form" onSubmit={handleCreate}>
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
              placeholder="VD: SALE20, FREESHIP"
            />
            {isDuplicateCode && (
              <span className="hint error-text">Mã đã tồn tại</span>
            )}
          </div>

          <div className="form-group">
            <label>Loại voucher</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="percent">Giảm %</option>
              <option value="fixed">Giảm tiền</option>
              <option value="free_ship">Free ship</option>
            </select>
          </div>

          {type !== "free_ship" && (
            <div className="form-group">
              <label>Giá trị</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
              />
            </div>
          )}

          {type === "percent" && (
            <div className="form-group">
              <label>Giảm tối đa</label>
              <input
                type="number"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
              />
            </div>
          )}

          {type === "free_ship" && (
            <div className="form-group">
              <label>Giảm ship tối đa</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
              />
            </div>
          )}

          <div className="form-group">
            <label>Đơn tối thiểu</label>
            <input
              type="number"
              value={minOrder}
              onChange={(e) => setMinOrder(Number(e.target.value))}
            />
          </div>

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

          <div className="form-group">
            <label>Số lượng</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>

          <button
            className="btn-create"
            disabled={submitting || isDuplicateCode}
          >
            {submitting ? "Đang tạo..." : "Tạo voucher"}
          </button>

          {error && <div className="alert error">{error}</div>}
          {success && <div className="alert success">{success}</div>}
        </form>
      </div>

      {/* ================= LIST ================= */}
      <div className="voucher-card">
        <h3>Danh sách voucher</h3>

        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <table className="voucher-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Loại</th>
                <th>Giá trị</th>
                <th>Đơn tối thiểu</th>
                <th>HSD</th>
                <th>Còn</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v) => (
                <tr key={v.voucher_id}>
                  <td>{v.code}</td>
                  <td>{v.type}</td>
                  <td>{renderValue(v)}</td>
                  <td>{(v.min_order_value || 0).toLocaleString()} đ</td>
                  <td>{v.end_date || "∞"}</td>
                  <td>{v.quantity}</td>
                  <td>
                    <span
                      className={`status ${v.status}`}
                      onClick={() => toggleStatus(v)}
                    >
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminVouchers;
