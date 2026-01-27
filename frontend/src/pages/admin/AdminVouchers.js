import { useEffect, useState } from "react";
import {
  getAllVouchersAdmin,
  createVoucher,
  updateVoucherStatusAdmin,
} from "../../services/api";
import "./AdminVouchers.css";

function AdminVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [form, setForm] = useState({
    code: "",
    type: "percent",
    value: "",
    min_order_value: "",
    max_discount: "",
    quantity: "",
  });

  // ✅ CẬP NHẬT: Đảm bảo dữ liệu luôn là mảng để không lỗi .map()
  const loadVouchers = async () => {
    try {
      const data = await getAllVouchersAdmin();
      setVouchers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách voucher:", error);
      setVouchers([]); // Nếu lỗi thì gán mảng rỗng
    }
  };

  useEffect(() => {
    loadVouchers();
  }, []);

  // ✅ CẬP NHẬT: Xử lý bật/tắt trạng thái và load lại danh sách
  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await updateVoucherStatusAdmin(id, newStatus);
      await loadVouchers(); // Load lại để cập nhật giao diện
    } catch (error) {
      alert("Không thể cập nhật trạng thái: " + error.message);
    }
  };

  const handleSubmit = async () => {
    if (!form.code || !form.value || !form.quantity) {
      alert("Vui lòng nhập đủ thông tin bắt buộc");
      return;
    }

    try {
      await createVoucher(form);
      alert("Tạo voucher thành công!");

      // Reset form
      setForm({
        code: "",
        type: "percent",
        value: "",
        min_order_value: "",
        max_discount: "",
        quantity: "",
      });

      // ✅ QUAN TRỌNG: Load lại danh sách ngay lập tức để hiển thị voucher mới
      await loadVouchers();
    } catch (error) {
      alert("Lỗi khi tạo voucher: " + error.message);
    }
  };

  return (
    <div className="voucher-admin">
      <div className="voucher-header">
        <h2>🎟 Quản lý Voucher</h2>
        <p>Tạo và kiểm soát mã giảm giá cho khách hàng</p>
      </div>

      <div className="voucher-card">
        <h3>➕ Tạo voucher mới</h3>
        <div className="voucher-form">
          <div className="form-group">
            <label>Mã voucher *</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="VD: SALE50"
            />
          </div>
          <div className="form-group">
            <label>Loại</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="percent">Giảm %</option>
              <option value="fixed">Giảm tiền</option>
            </select>
          </div>
          <div className="form-group">
            <label>Giá trị *</label>
            <input
              type="number"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Đơn tối thiểu</label>
            <input
              type="number"
              value={form.min_order_value}
              onChange={(e) =>
                setForm({ ...form, min_order_value: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>Giảm tối đa</label>
            <input
              type="number"
              value={form.max_discount}
              onChange={(e) =>
                setForm({ ...form, max_discount: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>Số lượt dùng *</label>
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </div>
        </div>
        <button className="primary-btn" onClick={handleSubmit}>
          Tạo voucher
        </button>
      </div>

      <div className="voucher-card">
        <h3>📋 Danh sách voucher</h3>
        <table className="voucher-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Loại</th>
              <th>Giá trị</th>
              <th>Đã dùng</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {/* ✅ Kiểm tra vouchers có dữ liệu trước khi map */}
            {vouchers.length > 0 ? (
              vouchers.map((v) => (
                <tr key={v.voucher_id}>
                  <td className="code">{v.code}</td>
                  <td>{v.type === "percent" ? "%" : "₫"}</td>
                  <td>{v.value}</td>
                  <td>
                    {v.used || 0}/{v.quantity}
                  </td>
                  <td>
                    <span
                      className={`status ${v.status === "active" ? "active" : "inactive"}`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="toggle-btn"
                      onClick={() => handleToggleStatus(v.voucher_id, v.status)}
                    >
                      Bật / Tắt
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  Chưa có voucher nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminVouchers;
