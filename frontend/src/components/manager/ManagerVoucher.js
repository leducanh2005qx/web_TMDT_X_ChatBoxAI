import React, { useState, useEffect } from "react";
import { getManagerVouchers, createManagerVoucher, toggleManagerVoucher, getCategories, getProducts } from "../../services/api";
import { Tag, PlusCircle, ToggleLeft, ToggleRight, Ticket, Edit } from "lucide-react";

export default function ManagerVoucher() {
  const [vouchers, setVouchers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editVoucher, setEditVoucher] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form state chung (create/edit)
  const [form, setForm] = useState({
    code: "",
    type: "percent",
    value: "",
    min_order_value: "",
    max_discount: "",
    quantity: "",
    start_date: "",
    end_date: "",
    apply_scope: "all",
    category_ids: [],
    product_ids: []
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

  const loadProducts = () => {
    if (products.length === 0) {
      getProducts().then(data => setProducts(Array.isArray(data) ? data : []));
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (name === "apply_scope" && value === "specific") {
      loadProducts();
    }
  };

  const handleCategoryToggle = (catId) => {
    setForm(prev => {
      const isSelected = prev.category_ids?.includes(catId);
      if (isSelected) {
        return { ...prev, category_ids: prev.category_ids.filter(id => id !== catId) };
      } else {
        return { ...prev, category_ids: [...(prev.category_ids || []), catId] };
      }
    });
  };

  const handleProductToggle = (productId) => {
    setForm(prev => {
      const isSelected = prev.product_ids.includes(productId);
      if (isSelected) {
        return { ...prev, product_ids: prev.product_ids.filter(id => id !== productId) };
      } else {
        return { ...prev, product_ids: [...prev.product_ids, productId] };
      }
    });
  };

  const genCode = () => {
    const prefix = "TIGER";
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    setForm((f) => ({ ...f, code: `${prefix}${random}` }));
  };

  const resetForm = () => {
    setForm({ code: "", type: "percent", value: "", min_order_value: "", max_discount: "", quantity: "", start_date: "", end_date: "", apply_scope: "all", category_ids: [], product_ids: [] });
    setError("");
    setSuccess("");
    setSearchProduct("");
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(!showForm);
  };

  const openEditModal = (v) => {
    setEditVoucher(v);
    setForm({
      code: v.code || "",
      type: v.type || "percent",
      value: v.value || "",
      min_order_value: v.min_order_value || "",
      max_discount: v.max_discount || "",
      quantity: v.quantity || "",
      start_date: v.start_date ? new Date(new Date(v.start_date).getTime() - new Date(v.start_date).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
      end_date: v.end_date ? new Date(new Date(v.end_date).getTime() - new Date(v.end_date).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
      apply_scope: v.apply_scope || "all",
      category_ids: v.category_ids || [],
      product_ids: v.product_ids || []
    });
    if (v.apply_scope === "specific") {
      loadProducts();
    }
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditVoucher(null);
  };

  const updateManagerVoucherLocal = async (id, payload) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:5000/api/vouchers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Lỗi cập nhật voucher");
    }
    return res.json();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    
    if (!form.code.trim()) return setError("Vui lòng nhập mã voucher");
    if (!form.value || Number(form.value) <= 0) return setError("Giá trị giảm phải lớn hơn 0");
    if (form.type === "percent" && Number(form.value) > 100) return setError("Giảm % không thể vượt quá 100%");
    if (!form.quantity || Number(form.quantity) <= 0) return setError("Số lượt sử dụng phải lớn hơn 0");
    if (!form.start_date || !form.end_date) return setError("Vui lòng chọn ngày bắt đầu và kết thúc");
    if (new Date(form.end_date) <= new Date(form.start_date)) return setError("Ngày kết thúc phải sau ngày bắt đầu");
    if ((form.apply_scope === "category" || form.apply_scope === "custom") && (!form.category_ids || form.category_ids.length === 0)) return setError("Vui lòng chọn ngành hàng");
    if ((form.apply_scope === "specific" || form.apply_scope === "custom") && (!form.product_ids || form.product_ids.length === 0)) return setError("Vui lòng chọn ít nhất 1 sản phẩm");

    try {
      setSubmitting(true);
      const payload = {
        ...form,
        value: Number(form.value),
        quantity: Number(form.quantity),
        min_order_value: form.min_order_value ? Number(form.min_order_value) : 0,
        max_discount: form.max_discount ? Number(form.max_discount) : null,
        category_ids: (form.apply_scope === "category" || form.apply_scope === "custom") ? form.category_ids : [],
        product_ids: (form.apply_scope === "specific" || form.apply_scope === "custom") ? form.product_ids : []
      };
      
      if (editVoucher) {
        await updateManagerVoucherLocal(editVoucher.voucher_id, payload);
        setSuccess("✅ Cập nhật voucher thành công!");
        setTimeout(() => closeEditModal(), 1000);
      } else {
        await createManagerVoucher(payload);
        setSuccess("✅ Tạo voucher thành công!");
        setShowForm(false);
        resetForm();
      }
      fetchData();
    } catch (err) {
      setError(err.message || "Lỗi tạo/sửa voucher - kiểm tra lại thông tin");
    } finally {
      setSubmitting(false);
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

  const getStatusBadge = (computedStatus) => {
    const baseClass = "px-3 py-1 text-sm font-semibold rounded-full whitespace-nowrap text-white";
    switch (computedStatus) {
      case "active_running":
        return <span className={`${baseClass} bg-green-600`}>🟢 Đang chạy</span>;
      case "upcoming":
        return <span className={`${baseClass} bg-yellow-600`}>🟡 Sắp diễn ra</span>;
      case "expired":
        return <span className={`${baseClass} bg-red-600`}>🔴 Hết hạn</span>;
      case "exhausted":
        return <span className={`${baseClass} bg-gray-500`}>⚪ Hết lượt</span>;
      case "inactive":
        return <span className={`${baseClass} bg-gray-800`}>⚫ Đã tắt</span>;
      default:
        return <span className={`${baseClass} bg-gray-400`}>Không xác định</span>;
    }
  };

  const renderScope = (v) => {
    if (v.apply_scope === "all") return "Toàn sàn";
    if (v.apply_scope === "category") return `Ngành: ${v.category_ids?.length || 0} ngành`;
    if (v.apply_scope === "specific") return `Cố định: ${v.product_ids?.length || 0} SP`;
    if (v.apply_scope === "custom") return `Kết hợp: ${v.category_ids?.length || 0} ngành, ${v.product_ids?.length || 0} SP`;
    return "Toàn sàn";
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

  const renderFormContent = (isEdit = false) => (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Code */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">Mã Voucher</label>
        <div className="flex gap-2">
          <input
            name="code" value={form.code} onChange={handleChange} required disabled={isEdit}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
            placeholder="VD: TIGER2025..."
          />
          {!isEdit && (
            <button type="button" onClick={genCode} className="px-3 py-2 border border-orange-200 bg-orange-50 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-100">
              Tự động
            </button>
          )}
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

      {/* Max discount */}
      {form.type === "percent" && (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase">Giảm tối đa (₫)</label>
          <input type="number" name="max_discount" value={form.max_discount} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300"
            placeholder="VD: 200000" />
        </div>
      )}

      {/* Min order */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">Đơn hàng tối thiểu (₫)</label>
        <input type="number" name="min_order_value" value={form.min_order_value} onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300"
          placeholder="VD: 100000" />
      </div>

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
        <input type="datetime-local" name="start_date" value={form.start_date} onChange={handleChange} required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">Ngày kết thúc</label>
        <input type="datetime-local" name="end_date" value={form.end_date} onChange={handleChange} required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300" />
      </div>

      {/* Scope */}
      <div className="space-y-1 md:col-span-2">
        <label className="text-xs font-semibold text-gray-500 uppercase">Phạm vi áp dụng</label>
        <select name="apply_scope" value={form.apply_scope} onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300 bg-white mb-2">
          <option value="all">Toàn sàn</option>
          <option value="category">Theo Ngành hàng</option>
          <option value="specific">Cố định Sản phẩm</option>
          <option value="custom">Tùy chỉnh (Kết hợp)</option>
        </select>
        
        {(form.apply_scope === "category" || form.apply_scope === "custom") && (
          <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 mb-2">
            <div className="text-xs font-bold text-gray-500 mb-2">CHỌN NGÀNH HÀNG</div>
            <div className="max-h-32 overflow-y-auto space-y-1 bg-white border border-gray-200 rounded p-2">
              {categories.map(c => (
                <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input 
                    type="checkbox" 
                    checked={form.category_ids?.includes(c.id)}
                    onChange={() => handleCategoryToggle(c.id)}
                    className="rounded text-orange-500 focus:ring-orange-500"
                  />
                  <span className="truncate">{c.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {(form.apply_scope === "specific" || form.apply_scope === "custom") && (
          <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
            <input 
              type="text" 
              placeholder="Tìm sản phẩm..." 
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-orange-300 mb-2"
              value={searchProduct}
              onChange={e => setSearchProduct(e.target.value)}
            />
            <div className="max-h-40 overflow-y-auto space-y-1 bg-white border border-gray-200 rounded p-2">
              {products.filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase())).map(p => (
                <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input 
                    type="checkbox" 
                    checked={form.product_ids.includes(p.id)}
                    onChange={() => handleProductToggle(p.id)}
                    className="rounded text-orange-500 focus:ring-orange-500"
                  />
                  <span className="truncate">{p.name}</span>
                </label>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-500 font-medium">
              Đã chọn: {form.product_ids.length} sản phẩm
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="md:col-span-2 flex justify-end gap-2 pt-2">
        {isEdit && (
          <button type="button" onClick={closeEditModal}
            className="px-6 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors shadow-sm">
            Hủy
          </button>
        )}
        <button type="submit" disabled={submitting}
          className="px-8 py-2.5 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors shadow-sm disabled:bg-orange-300">
          {submitting ? "Đang xử lý..." : (isEdit ? "Lưu thay đổi" : "Lưu Voucher")}
        </button>
      </div>
    </form>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto relative">
      {/* Edit Modal Overlay */}
      {showEditModal && editVoucher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Edit size={20} className="text-orange-500" />
                Sửa Voucher {editVoucher.code}
              </h3>
              <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto">
              {renderFormContent(true)}
            </div>
          </div>
        </div>
      )}

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
          onClick={openCreateForm}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 shadow-sm transition-colors"
        >
          <PlusCircle size={18} />
          {showForm ? "Đóng Form" : "Tạo Voucher"}
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
          {renderFormContent(false)}
        </div>
      )}

      {/* Voucher Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="w-full">
          <table className="block md:table w-full text-sm text-left table-fixed">
            <thead className="hidden md:table-header-group text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-1/5">Mã & Loại</th>
                <th className="px-4 py-3 w-1/5">Phạm vi</th>
                <th className="px-4 py-3 w-1/5">Giá trị & Sử dụng</th>
                <th className="px-4 py-3 w-1/5">Hiệu lực</th>
                <th className="px-4 py-3 w-1/5 text-center">Trạng thái & Thao tác</th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group divide-y divide-gray-100">
              {loading ? (
                <tr className="block md:table-row"><td colSpan="5" className="block md:table-cell text-center py-8 text-gray-400">Đang tải...</td></tr>
              ) : vouchers.length === 0 ? (
                <tr className="block md:table-row"><td colSpan="5" className="block md:table-cell text-center py-8 text-gray-400">Chưa có voucher nào</td></tr>
              ) : vouchers.map((v) => (
                <tr key={v.voucher_id} className="block md:table-row hover:bg-gray-50 transition-colors border-b md:border-b-0 p-4 md:p-0">
                  <td className="block md:table-cell px-4 py-3 align-middle">
                    <div className="font-mono font-bold text-orange-600 mb-1">{v.code}</div>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${getTypeBadge(v.type)}`}>
                      {getTypeLabel(v.type)}
                    </span>
                  </td>
                  <td className="block md:table-cell px-4 py-3 text-gray-700 font-medium align-middle">
                    <div className="md:hidden text-xs text-gray-400 mb-1 uppercase">Phạm vi</div>
                    {renderScope(v)}
                  </td>
                  <td className="block md:table-cell px-4 py-3 font-semibold text-gray-800 align-middle">
                    <div className="md:hidden text-xs text-gray-400 mb-1 uppercase">Giá trị & Sử dụng</div>
                    <div>
                      {v.type === "percent" ? `${v.value}%` : `${Number(v.value).toLocaleString("vi-VN")} ₫`}
                      {v.max_discount ? <span className="text-xs text-gray-400 font-normal ml-1">(max {Number(v.max_discount).toLocaleString("vi-VN")}₫)</span> : null}
                    </div>
                    <div className="text-xs text-gray-500 font-normal mt-1">Đã dùng: {v.used || 0}/{v.quantity}</div>
                  </td>
                  <td className="block md:table-cell px-4 py-3 text-xs text-gray-600 align-middle">
                    <div className="md:hidden text-xs text-gray-400 mb-1 uppercase">Hiệu lực</div>
                    <div>Từ: {fmtDate(v.start_date)}</div>
                    <div>Đến: {fmtDate(v.end_date)}</div>
                  </td>
                  <td className="block md:table-cell px-4 py-3 text-center align-middle space-y-2 mt-4 md:mt-0">
                    <div>{getStatusBadge(v.computed_status)}</div>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <button onClick={() => openEditModal(v)}
                        className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors border border-blue-200 flex items-center gap-1">
                        <Edit size={14} /> Sửa
                      </button>
                      <button onClick={() => handleToggle(v.voucher_id)}
                        className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-orange-500 transition-colors">
                        {v.status === "active"
                          ? <ToggleRight size={22} className="text-orange-500" title="Đang bật, click để tắt" />
                          : <ToggleLeft size={22} title="Đang tắt, click để bật" />
                        }
                      </button>
                    </div>
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
