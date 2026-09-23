import React, { useEffect, useState } from "react";
import {
  getAllVouchersAdmin,
  createVoucher,
  updateVoucherStatusAdmin,
  updateVoucher,
  getCategories,
  getProducts
} from "../../services/api";
import "./AdminVouchers.css";

function AdminVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // States cho Form Tạo mới
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // States cho Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editVoucher, setEditVoucher] = useState(null);

  // Form Data chung (dùng cho cả create và edit)
  const [formData, setFormData] = useState({
    code: "",
    type: "percent",
    value: 0,
    max_discount: "",
    quantity: 1,
    min_order_value: 0,
    start_date: "",
    end_date: "",
    status: "active",
    apply_scope: "all", // all, category, specific, custom
    category_ids: [],
    product_ids: []
  });

  const [searchProduct, setSearchProduct] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadVouchers = () => {
    setLoading(true);
    getAllVouchersAdmin()
      .then((data) => setVouchers(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadCategories = () => {
    getCategories().then(data => setCategories(Array.isArray(data) ? data : []));
  };

  const loadProducts = () => {
    if (products.length === 0) {
      getProducts().then(data => setProducts(Array.isArray(data) ? data : []));
    }
  };

  useEffect(() => {
    loadVouchers();
    loadCategories();
  }, []);

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

  const handleFormChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
    if (field === "apply_scope" && val === "specific") {
      loadProducts();
    }
  };

  const handleCategoryToggle = (catId) => {
    setFormData(prev => {
      const isSelected = prev.category_ids?.includes(catId);
      if (isSelected) {
        return { ...prev, category_ids: prev.category_ids.filter(id => id !== catId) };
      } else {
        return { ...prev, category_ids: [...(prev.category_ids || []), catId] };
      }
    });
  };

  const handleProductToggle = (productId) => {
    setFormData(prev => {
      const isSelected = prev.product_ids.includes(productId);
      if (isSelected) {
        return { ...prev, product_ids: prev.product_ids.filter(id => id !== productId) };
      } else {
        return { ...prev, product_ids: [...prev.product_ids, productId] };
      }
    });
  };

  const resetForm = () => {
    setFormData({
      code: "",
      type: "percent",
      value: 0,
      max_discount: "",
      quantity: 1,
      min_order_value: 0,
      start_date: "",
      end_date: "",
      status: "active",
      apply_scope: "all",
      category_ids: [],
      product_ids: []
    });
    setError("");
    setSuccess("");
    setSearchProduct("");
  };

  const openCreateForm = () => {
    resetForm();
    setShowCreateForm(!showCreateForm);
  };

  const openEditModal = (v) => {
    setEditVoucher(v);
    setFormData({
      code: v.code || "",
      type: v.type || "percent",
      value: v.value || 0,
      max_discount: v.max_discount || "",
      quantity: v.quantity || 1,
      min_order_value: v.min_order_value || 0,
      start_date: v.start_date ? new Date(new Date(v.start_date).getTime() - new Date(v.start_date).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
      end_date: v.end_date ? new Date(new Date(v.end_date).getTime() - new Date(v.end_date).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
      status: v.status || "active",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.code.trim()) return setError("⚠️ Vui lòng nhập mã voucher");
    if (formData.quantity <= 0) return setError("⚠️ Số lượng phải lớn hơn 0");
    if (formData.type !== "free_ship" && formData.value <= 0) return setError("⚠️ Giá trị giảm không hợp lệ");
    if ((formData.apply_scope === "category" || formData.apply_scope === "custom") && (!formData.category_ids || formData.category_ids.length === 0)) return setError("⚠️ Vui lòng chọn ngành hàng");
    if ((formData.apply_scope === "specific" || formData.apply_scope === "custom") && (!formData.product_ids || formData.product_ids.length === 0)) return setError("⚠️ Vui lòng chọn ít nhất 1 sản phẩm");

    const payload = {
      ...formData,
      code: formData.code.trim().toUpperCase(),
      max_discount: formData.type === "percent" ? (formData.max_discount || null) : null,
      category_ids: (formData.apply_scope === "category" || formData.apply_scope === "custom") ? formData.category_ids : [],
      product_ids: (formData.apply_scope === "specific" || formData.apply_scope === "custom") ? formData.product_ids : []
    };

    setSubmitting(true);
    try {
      if (editVoucher) {
        await updateVoucher(editVoucher.voucher_id, payload);
        setSuccess("✅ Cập nhật voucher thành công");
        setTimeout(() => closeEditModal(), 1000);
      } else {
        await createVoucher(payload);
        setSuccess("✅ Tạo voucher thành công");
        resetForm();
      }
      loadVouchers();
    } catch (err) {
      setError(err.message || "❌ Lỗi xử lý");
    } finally {
      setSubmitting(false);
    }
  };

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

  const renderValue = (v) => {
    if (v.type === "percent") return `${v.value}%`;
    if (v.type === "fixed") return `${Number(v.value).toLocaleString()} đ`;
    if (v.type === "free_ship") return `Freeship ${Number(v.value).toLocaleString()} đ`;
    return v.value;
  };

  const renderForm = (isEdit = false) => (
    <form className="voucher-form" onSubmit={handleSubmit}>
      <div className="form-row" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Mã voucher</label>
          <input
            className="input"
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            value={formData.code}
            onChange={(e) => handleFormChange("code", e.target.value)}
            placeholder="VD: SALE10"
            disabled={isEdit}
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Loại voucher</label>
          <select 
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            value={formData.type} onChange={(e) => handleFormChange("type", e.target.value)}>
            <option value="percent">Giảm theo %</option>
            <option value="fixed">Giảm tiền mặt (đ)</option>
            <option value="free_ship">Free ship (đ)</option>
          </select>
        </div>
      </div>

      <div className="form-row" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{formData.type === "percent" ? "Phần trăm giảm (%)" : "Số tiền giảm (đ)"}</label>
          <input
            type="number"
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            value={formData.value}
            onChange={(e) => handleFormChange("value", Number(e.target.value))}
          />
        </div>
        {formData.type === "percent" && (
          <div className="form-group" style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Giảm tối đa (đ)</label>
            <input
              type="number"
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              placeholder="Không giới hạn"
              value={formData.max_discount}
              onChange={(e) => handleFormChange("max_discount", e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="form-row" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Đơn tối thiểu (đ)</label>
          <input
            type="number"
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            value={formData.min_order_value}
            onChange={(e) => handleFormChange("min_order_value", Number(e.target.value))}
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Số lượng phát hành</label>
          <input
            type="number"
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            value={formData.quantity}
            onChange={(e) => handleFormChange("quantity", Number(e.target.value))}
          />
        </div>
      </div>

      <div className="form-row" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Ngày bắt đầu</label>
          <input
            type="datetime-local"
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            value={formData.start_date}
            onChange={(e) => handleFormChange("start_date", e.target.value)}
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Ngày kết thúc</label>
          <input
            type="datetime-local"
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            value={formData.end_date}
            onChange={(e) => handleFormChange("end_date", e.target.value)}
          />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Phạm vi áp dụng</label>
        <select
          style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '8px' }}
          value={formData.apply_scope}
          onChange={(e) => handleFormChange("apply_scope", e.target.value)}
        >
          <option value="all">Toàn sàn</option>
          <option value="category">Theo Ngành hàng</option>
          <option value="specific">Cố định Sản phẩm</option>
          <option value="custom">Tùy chỉnh (Kết hợp)</option>
        </select>

        {(formData.apply_scope === "category" || formData.apply_scope === "custom") && (
          <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 mb-2">
            <div className="text-xs font-bold text-gray-500 mb-2">CHỌN NGÀNH HÀNG</div>
            <div className="max-h-32 overflow-y-auto space-y-1 bg-white border border-gray-200 rounded p-2">
              {categories.map(c => (
                <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input 
                    type="checkbox" 
                    checked={formData.category_ids?.includes(c.id)}
                    onChange={() => handleCategoryToggle(c.id)}
                    className="rounded text-orange-500 focus:ring-orange-500"
                  />
                  <span className="truncate">{c.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {(formData.apply_scope === "specific" || formData.apply_scope === "custom") && (
          <div style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px' }}>
            <input 
              type="text" 
              placeholder="Tìm sản phẩm..." 
              style={{ width: '100%', padding: '6px', marginBottom: '8px', border: '1px solid #eee', borderRadius: '4px' }}
              value={searchProduct}
              onChange={e => setSearchProduct(e.target.value)}
            />
            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {products.filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase())).map(p => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', fontSize: '14px' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.product_ids.includes(p.id)}
                    onChange={() => handleProductToggle(p.id)}
                  />
                  {p.name}
                </label>
              ))}
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              Đã chọn: {formData.product_ids.length} sản phẩm
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          className="btn-create"
          type="submit"
          disabled={submitting}
          style={{ flex: 1, padding: '10px', background: '#f97316', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {submitting ? "Đang xử lý..." : isEdit ? "💾 Lưu thay đổi" : "🚀 Phát hành Voucher"}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={closeEditModal}
            style={{ flex: 1, padding: '10px', background: '#ccc', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Hủy
          </button>
        )}
      </div>

      {error && <div style={{ color: 'red', marginTop: '10px', padding: '10px', background: '#fee2e2', borderRadius: '4px' }}>{error}</div>}
      {success && <div style={{ color: 'green', marginTop: '10px', padding: '10px', background: '#dcfce3', borderRadius: '4px' }}>{success}</div>}
    </form>
  );

  return (
    <div className="admin-voucher-page" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>🎁 Quản lý Voucher</h2>
        <button 
          onClick={openCreateForm}
          style={{ padding: '8px 16px', background: '#f97316', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {showCreateForm ? "Đóng Form" : "+ Tạo Voucher mới"}
        </button>
      </div>

      {showCreateForm && (
        <div className="voucher-card" style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
          <h3>Tạo voucher mới</h3>
          {renderForm(false)}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editVoucher && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div style={{
            background: 'white', borderRadius: '12px', maxWidth: '600px', width: '100%',
            maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Sửa Voucher {editVoucher.code}</h3>
            {renderForm(true)}
          </div>
        </div>
      )}

      <div className="voucher-card" style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginBottom: '16px' }}>Danh sách Voucher</h3>

        {loading ? (
          <div className="loading-spinner">Đang tải dữ liệu...</div>
        ) : (
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
                {vouchers.map((v) => (
                  <tr key={v.voucher_id} className="block md:table-row hover:bg-gray-50 transition-colors border-b md:border-b-0 p-4 md:p-0">
                    <td className="block md:table-cell px-4 py-3 align-middle">
                      <div className="font-mono font-bold text-orange-600 mb-1">{v.code}</div>
                      <div className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded inline-block border border-gray-200">
                        {v.type === 'percent' ? '% Giảm' : v.type === 'fixed' ? 'Giảm cố định' : 'Freeship'}
                      </div>
                    </td>
                    <td className="block md:table-cell px-4 py-3 text-gray-700 font-medium align-middle">
                      <div className="md:hidden text-xs text-gray-400 mb-1 uppercase">Phạm vi</div>
                      {renderScope(v)}
                    </td>
                    <td className="block md:table-cell px-4 py-3 font-semibold text-gray-800 align-middle">
                      <div className="md:hidden text-xs text-gray-400 mb-1 uppercase">Giá trị & Sử dụng</div>
                      <div>
                        {renderValue(v)}
                        {v.max_discount ? <span className="text-xs text-gray-400 font-normal ml-1">(max {Number(v.max_discount).toLocaleString("vi-VN")}₫)</span> : null}
                      </div>
                      <div className="text-xs text-gray-500 font-normal mt-1">Đã dùng: {v.used || 0}/{v.quantity}</div>
                    </td>
                    <td className="block md:table-cell px-4 py-3 text-xs text-gray-600 align-middle">
                      <div className="md:hidden text-xs text-gray-400 mb-1 uppercase">Hiệu lực</div>
                      <div>Từ: {v.start_date ? new Date(v.start_date).toLocaleDateString("vi-VN") : "—"}</div>
                      <div>Đến: {v.end_date ? new Date(v.end_date).toLocaleDateString("vi-VN") : "Vô thời hạn"}</div>
                    </td>
                    <td className="block md:table-cell px-4 py-3 text-center align-middle mt-4 md:mt-0">
                      <div className="mb-2">{getStatusBadge(v.computed_status)}</div>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <button 
                          onClick={() => openEditModal(v)}
                          style={{ padding: '4px 10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          onClick={() => toggleStatus(v)}
                          style={{ padding: '4px 10px', background: v.status === "active" ? '#ef4444' : '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                        >
                          {v.status === "active" ? "Tắt" : "Bật"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {vouchers.length === 0 && (
                  <tr className="block md:table-row">
                    <td colSpan="5" className="block md:table-cell text-center padding-24 text-gray-500">Chưa có voucher nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminVouchers;
