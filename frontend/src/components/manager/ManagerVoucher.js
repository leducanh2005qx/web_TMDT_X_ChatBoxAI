import { useState, useEffect } from "react";
import { getManagerVouchers, createManagerVoucher, toggleManagerVoucher, getCategories } from "../../services/api";
import { Tag, PlusCircle, ToggleLeft, ToggleRight, Ticket } from "lucide-react";

export default function ManagerVoucher() {
  const [vouchers, setVouchers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [form, setForm] = useState({
    code: "",
    type: "percent",
    value: "",
    min_order_value: "",
    max_discount: "",
    quantity: "",
    start_date: "",
    end_date: "",
    category_id: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [v, cats] = await Promise.all([getManagerVouchers(), getCategories()]);
      setVouchers(Array.isArray(v) ? v : []);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (err) {
      setError("Không thể tải dữ liệu voucher");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const genCode = () => {
    const prefix = "TIGER";
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    setForm((f) => ({ ...f, code: `${prefix}${random}` }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    // Client-side validation
    if (!form.code.trim()) return setError("Vui lòng nhập mã voucher");
    if (!form.value || Number(form.value) <= 0) return setError("Giá trị giảm phải lớn hơn 0");
    if (form.type === "percent" && Number(form.value) > 100) return setError("Giảm % không thể vượt quá 100%");
    if (!form.quantity || Number(form.quantity) <= 0) return setError("Số lượt sử dụng phải lớn hơn 0");
    if (!form.start_date || !form.end_date) return setError("Vui lòng chọn ngày bắt đầu và kết thúc");
    if (new Date(form.end_date) <= new Date(form.start_date)) return setError("Ngày kết thúc phải sau ngày bắt đầu");
    try {
      const payload = {
        ...form,
        value: Number(form.value),
        quantity: Number(form.quantity),
        min_order_value: form.min_order_value ? Number(form.min_order_value) : 0,
        max_discount: form.max_discount ? Number(form.max_discount) : null,
        category_id: form.category_id ? Number(form.category_id) : null,
      };
      await createManagerVoucher(payload);
      setSuccess("✅ Tạo voucher thành công!");
      setShowForm(false);
      setForm({ code: "", type: "percent", value: "", min_order_value: "", max_discount: "", quantity: "", start_date: "", end_date: "", category_id: "" });
      fetchData();
    } catch (err) {
      setError(err.message || "Lỗi tạo voucher - kiểm tra lại thông tin");
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleManagerVoucher(id);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const getTypeBadge = (type) => {
    if (type === "percent") return "bg-purple-100 text-purple-700 border-purple-200";
    if (type === "fixed") return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-green-100 text-green-700 border-green-200";
  };

  const getTypeLabel = (type) => {
    if (type === "percent") return "% Giảm";
    if (type === "fixed") return "Giảm cố định";
    return "Freeship";
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Ticket className="text-orange-500" size={28} />
            Mã Giảm Giá
          </h2>
          <p className="text-gray-500 mt-1 text-sm">Quản lý voucher cho ngành hàng bạn phụ trách</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 shadow-sm transition-colors"
        >
          <PlusCircle size={18} />
          {showForm ? "Đóng" : "Tạo Voucher"}
        </button>
      </div>

      {/* Messages */}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">{success}</div>}

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
            <Tag size={18} className="text-orange-500" />
            Tạo mã giảm giá mới
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Code */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Mã Voucher</label>
              <div className="flex gap-2">
                <input
                  name="code" value={form.code} onChange={handleChange} required
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
                  placeholder="VD: TIGER2025..."
                />
                <button type="button" onClick={genCode} className="px-3 py-2 border border-orange-200 bg-orange-50 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-100">
                  Tự động
                </button>
              </div>
            </div>

            {/* Type */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Loại Giảm Giá</label>
              <select name="type" value={form.type} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300 bg-white">
                <option value="percent">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định (₫)</option>
                <option value="free_ship">Miễn phí vận chuyển</option>
              </select>
            </div>

            {/* Value */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Giá trị {form.type === "percent" ? "(%)" : "(₫)"}
              </label>
              <input type="number" name="value" value={form.value} onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                placeholder={form.type === "percent" ? "VD: 10" : "VD: 50000"} />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Ngành hàng áp dụng</label>
              <select name="category_id" value={form.category_id} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300 bg-white">
                <option value="">Tất cả ngành hàng</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Min order */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Đơn hàng tối thiểu (₫)</label>
              <input type="number" name="min_order_value" value={form.min_order_value} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                placeholder="VD: 100000" />
            </div>

            {/* Max discount */}
            {form.type === "percent" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Giảm tối đa (₫)</label>
                <input type="number" name="max_discount" value={form.max_discount} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                  placeholder="VD: 200000" />
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Số lượt sử dụng</label>
              <input type="number" name="quantity" value={form.quantity} onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                placeholder="VD: 100" />
            </div>

            {/* Dates */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Ngày bắt đầu</label>
              <input type="date" name="start_date" value={form.start_date} onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Ngày kết thúc</label>
              <input type="date" name="end_date" value={form.end_date} onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300" />
            </div>

            {/* Submit */}
            <div className="md:col-span-2 flex justify-end pt-2">
              <button type="submit"
                className="px-8 py-2.5 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors shadow-sm">
                Lưu Voucher
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Voucher Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-4">Mã</th>
                <th className="px-5 py-4">Loại</th>
                <th className="px-5 py-4">Giá Trị</th>
                <th className="px-5 py-4">Đã dùng / Tổng</th>
                <th className="px-5 py-4">Hiệu lực</th>
                <th className="px-5 py-4 text-center">Trạng thái</th>
                <th className="px-5 py-4 text-right">Bật/Tắt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-8 text-gray-400">Đang tải...</td></tr>
              ) : vouchers.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-gray-400">Chưa có voucher nào</td></tr>
              ) : vouchers.map((v) => (
                <tr key={v.voucher_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-200">
                      {v.code}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded border ${getTypeBadge(v.type)}`}>
                      {getTypeLabel(v.type)}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-gray-800">
                    {v.type === "percent" ? `${v.value}%` : `${Number(v.value).toLocaleString("vi-VN")} ₫`}
                    {v.max_discount ? <span className="text-xs text-gray-400 ml-1">(max {Number(v.max_discount).toLocaleString("vi-VN")}₫)</span> : ""}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-gray-600">{v.used || 0}</span>
                    <span className="text-gray-300 mx-1">/</span>
                    <span className="font-semibold">{v.quantity}</span>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500">
                    {fmtDate(v.start_date)} → {fmtDate(v.end_date)}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {v.status === "active" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-green-50 text-green-700 rounded border border-green-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Đang hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-gray-50 text-gray-500 rounded border border-gray-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                        Tạm dừng
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => handleToggle(v.voucher_id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-orange-500 transition-colors">
                      {v.status === "active"
                        ? <ToggleRight size={24} className="text-orange-500" />
                        : <ToggleLeft size={24} />
                      }
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
