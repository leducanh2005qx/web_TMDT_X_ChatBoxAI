import React, { useState, useEffect, useCallback } from "react";
import {
  Check, X, ShieldAlert, Laptop, Shirt, Utensils,
  Box, Search, History, RotateCcw, Clock, CheckCircle, XCircle,
} from "lucide-react";
import {
  getPendingProducts,
  decideProduct,
  getDecidedProducts,
  restoreProductToPending,
} from "../../services/api";

const AdminApproval = () => {
  const [activeTab, setActiveTab] = useState("pending");

  // Tab Chờ duyệt
  const [pending, setPending] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [rejectId, setRejectId] = useState(null);
  const [reason, setReason] = useState("");
  const [pendingSearch, setPendingSearch] = useState("");

  // Tab Lịch sử
  const [decided, setDecided] = useState([]);
  const [decidedLoading, setDecidedLoading] = useState(false);
  const [decidedSearch, setDecidedSearch] = useState("");
  const [decidedFilter, setDecidedFilter] = useState("all"); // "all" | "active" | "hidden"

  // Thông báo inline
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ===================== FETCH ===================== */

  const fetchPending = useCallback(async () => {
    try {
      setPendingLoading(true);
      const data = await getPendingProducts();
      setPending(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi fetch pending:", err);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  const fetchDecided = useCallback(async () => {
    try {
      setDecidedLoading(true);
      const data = await getDecidedProducts();
      setDecided(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi fetch decided:", err);
    } finally {
      setDecidedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  useEffect(() => {
    if (activeTab === "history") fetchDecided();
  }, [activeTab, fetchDecided]);

  /* ===================== ACTIONS ===================== */

  const handleApprove = async (id) => {
    if (!window.confirm("Duyệt sản phẩm này lên kệ?")) return;
    try {
      await decideProduct(id, "active");
      fetchPending();
      fetchDecided();
      showToast("✅ Đã duyệt sản phẩm thành công!");
    } catch (err) {
      showToast("❌ Lỗi: " + err.message, "error");
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) return showToast("Vui lòng nhập lý do từ chối!", "error");
    try {
      await decideProduct(rejectId, "hidden", reason);
      setRejectId(null);
      setReason("");
      fetchPending();
      fetchDecided();
      showToast("❌ Đã từ chối sản phẩm. Manager sẽ được thông báo.");
    } catch (err) {
      showToast("Lỗi: " + err.message, "error");
    }
  };

  const handleRestore = async (id, name) => {
    if (!window.confirm(`Khôi phục "${name}" về hàng chờ duyệt?`)) return;
    try {
      await restoreProductToPending(id);
      fetchDecided();
      fetchPending();
      showToast(`🔄 Đã khôi phục "${name}" về hàng chờ duyệt!`);
    } catch (err) {
      showToast("Lỗi khôi phục: " + err.message, "error");
    }
  };

  /* ===================== HELPERS ===================== */

  const getIcon = (type) => {
    switch (type) {
      case "electronics": return <Laptop className="text-blue-500" size={16} />;
      case "fashion":     return <Shirt className="text-pink-500" size={16} />;
      case "food":        return <Utensils className="text-green-500" size={16} />;
      default:            return <Box className="text-gray-400" size={16} />;
    }
  };

  const filteredPending = pending.filter((p) => {
    const q = pendingSearch.toLowerCase();
    return !q || p.name?.toLowerCase().includes(q) || p.manager_name?.toLowerCase().includes(q);
  });

  const filteredDecided = decided.filter((p) => {
    const q = decidedSearch.toLowerCase();
    const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.manager_name?.toLowerCase().includes(q);
    const matchFilter = decidedFilter === "all" || p.status === decidedFilter;
    return matchSearch && matchFilter;
  });

  /* ===================== RENDER ===================== */

  return (
    <div className="min-h-screen bg-[#f6f6f6] p-6">

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded shadow-lg text-white text-sm font-medium transition-all ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-[3px] shadow-sm mb-6 border-l-4 border-[#ee4d2d]">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-3xl">🐯</div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Sếp ơi, có{" "}
              <span className="text-[#ee4d2d] text-2xl px-1">{pending.length}</span>{" "}
              sản phẩm đang chờ phê duyệt!
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Lịch sử đã quyết định:{" "}
              <span className="font-bold text-gray-700">{decided.length}</span> sản phẩm
              (<span className="text-green-600">{decided.filter(d => d.status === "active").length} đã duyệt</span>
              {" · "}
              <span className="text-red-500">{decided.filter(d => d.status === "hidden").length} đã từ chối</span>)
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-0 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-[3px] transition-colors ${
            activeTab === "pending"
              ? "border-[#ee4d2d] text-[#ee4d2d] bg-white"
              : "border-transparent text-gray-500 hover:text-gray-700 bg-transparent"
          }`}
        >
          <Clock size={15} />
          Chờ duyệt
          {pending.length > 0 && (
            <span className="bg-[#ee4d2d] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {pending.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-[3px] transition-colors ${
            activeTab === "history"
              ? "border-blue-500 text-blue-600 bg-white"
              : "border-transparent text-gray-500 hover:text-gray-700 bg-transparent"
          }`}
        >
          <History size={15} />
          Lịch sử duyệt
          {decided.length > 0 && (
            <span className="bg-gray-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {decided.length}
            </span>
          )}
        </button>
      </div>

      {/* ============== TAB: CHỜ DUYỆT ============== */}
      {activeTab === "pending" && (
        <div className="bg-white rounded-b-[3px] shadow-sm">
          {/* Toolbar */}
          <div className="p-4 border-b flex justify-between items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                className="pl-9 pr-4 py-2 border rounded-sm outline-none focus:border-[#ee4d2d] w-64 text-sm"
                placeholder="Tìm theo tên hoặc Manager..."
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
              />
            </div>
            <div className="text-xs text-gray-400">Hiển thị {filteredPending.length} sản phẩm</div>
          </div>

          {pendingLoading ? (
            <div className="flex items-center justify-center h-64 text-gray-400 italic">Đang tải...</div>
          ) : filteredPending.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-3">
              <ShieldAlert size={64} className="text-gray-200" />
              <p>Không có sản phẩm nào cần phê duyệt. Thảnh thơi quá sếp ơi! 🎉</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase text-[11px] font-bold border-b">
                  <th className="px-6 py-4 text-left">Sản phẩm</th>
                  <th className="px-6 py-4 text-left">Mô tả</th>
                  <th className="px-6 py-4 text-left">Manager</th>
                  <th className="px-6 py-4 text-left">Giá / Kho</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredPending.map((p) => (
                  <tr key={p.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex gap-3 items-center">
                        <img
                          src={p.image?.startsWith('http') ? p.image : (p.image ? `http://localhost:5000/${p.image}` : "https://via.placeholder.com/80")}
                          alt={p.name}
                          className="w-14 h-14 object-cover border rounded-sm flex-shrink-0"
                        />
                        <div>
                          <div className="font-bold text-gray-800">{p.name}</div>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px] uppercase font-bold flex items-center gap-1 w-fit mt-1">
                            {getIcon(p.display_type)} {p.category_name || "Chưa phân loại"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 max-w-xs">
                      <div className="line-clamp-2 italic text-xs">{p.description || "Không có mô tả."}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-blue-600">@{p.manager_name || "Unknown"}</span>
                      <div className="text-[10px] text-gray-400 mt-0.5">{new Date(p.created_at).toLocaleDateString("vi-VN")}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[#ee4d2d] font-bold">₫{Number(p.price).toLocaleString()}</div>
                      <div className="text-xs text-gray-400">Kho: {p.stock}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 items-center">
                        <button
                          onClick={() => handleApprove(p.id)}
                          className="flex items-center gap-1.5 bg-green-500 text-white px-4 py-1.5 rounded-sm hover:bg-green-600 font-bold text-xs shadow-sm w-32 justify-center"
                        >
                          <Check size={14} /> DUYỆT NGAY
                        </button>
                        <button
                          onClick={() => setRejectId(p.id)}
                          className="flex items-center gap-1.5 border border-red-400 text-red-500 px-4 py-1.5 rounded-sm hover:bg-red-50 font-bold text-xs w-32 justify-center"
                        >
                          <X size={14} /> TỪ CHỐI
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ============== TAB: LỊCH SỬ DUYỆT ============== */}
      {activeTab === "history" && (
        <div className="bg-white rounded-b-[3px] shadow-sm">
          {/* Toolbar */}
          <div className="p-4 border-b flex justify-between items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  className="pl-9 pr-4 py-2 border rounded-sm outline-none focus:border-blue-400 w-60 text-sm"
                  placeholder="Tìm theo tên hoặc Manager..."
                  value={decidedSearch}
                  onChange={(e) => setDecidedSearch(e.target.value)}
                />
              </div>
              <select
                className="border rounded-sm px-3 py-2 text-sm outline-none focus:border-blue-400 text-gray-600"
                value={decidedFilter}
                onChange={(e) => setDecidedFilter(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">✅ Đã duyệt</option>
                <option value="hidden">❌ Đã từ chối</option>
              </select>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-500" /> {decided.filter(d => d.status === "active").length} đã duyệt</span>
              <span className="flex items-center gap-1"><XCircle size={12} className="text-red-500" /> {decided.filter(d => d.status === "hidden").length} đã từ chối</span>
            </div>
          </div>

          {decidedLoading ? (
            <div className="flex items-center justify-center h-64 text-gray-400 italic">Đang tải lịch sử...</div>
          ) : filteredDecided.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-3">
              <History size={56} className="text-gray-200" />
              <p>Chưa có sản phẩm nào trong lịch sử duyệt.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase text-[11px] font-bold border-b">
                  <th className="px-6 py-4 text-left">Sản phẩm</th>
                  <th className="px-6 py-4 text-left">Manager</th>
                  <th className="px-6 py-4 text-left">Giá / Kho</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-left">Lý do từ chối</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredDecided.map((p) => (
                  <tr
                    key={p.id}
                    className={`transition-colors ${p.status === "hidden" ? "bg-red-50/30 hover:bg-red-50/60" : "hover:bg-green-50/30"}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex gap-3 items-center">
                        <img
                          src={p.image?.startsWith('http') ? p.image : (p.image ? `http://localhost:5000/${p.image}` : "https://via.placeholder.com/64")}
                          alt={p.name}
                          className={`w-12 h-12 object-cover border rounded-sm flex-shrink-0 ${p.status === "hidden" ? "opacity-50 grayscale" : ""}`}
                        />
                        <div>
                          <div className={`font-bold ${p.status === "hidden" ? "text-gray-400 line-through" : "text-gray-800"}`}>
                            {p.name}
                          </div>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px] uppercase font-bold flex items-center gap-1 w-fit mt-1">
                            {getIcon(p.display_type)} {p.category_name || "Chưa phân loại"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-blue-600">@{p.manager_name || "Unknown"}</span>
                      <div className="text-[10px] text-gray-400 mt-0.5">{new Date(p.created_at).toLocaleDateString("vi-VN")}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[#ee4d2d] font-bold">₫{Number(p.price).toLocaleString()}</div>
                      <div className="text-xs text-gray-400">Kho: {p.stock}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {p.status === "active" ? (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                          <CheckCircle size={12} /> Đã duyệt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full">
                          <XCircle size={12} /> Đã từ chối
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-[180px]">
                      {p.rejection_reason ? (
                        <div className="text-xs text-red-500 italic bg-red-50 border border-red-100 rounded px-2 py-1">
                          "{p.rejection_reason}"
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300 italic">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {p.status === "hidden" ? (
                        <button
                          onClick={() => handleRestore(p.id, p.name)}
                          className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-1.5 rounded-sm shadow-sm transition-colors"
                          title="Khôi phục về hàng chờ duyệt"
                        >
                          <RotateCcw size={13} /> KHÔI PHỤC
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300 italic">Đang bán</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ============== MODAL TỪ CHỐI ============== */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-sm shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-red-500 font-bold text-lg">
              <ShieldAlert /> Lý do từ chối sản phẩm
            </div>
            <p className="text-gray-500 text-xs">
              Lý do sẽ được lưu vào lịch sử và có thể dùng để khôi phục sau nếu cần.
            </p>
            <textarea
              className="w-full border p-3 rounded-sm min-h-[100px] outline-none focus:border-red-400 text-sm"
              placeholder="VD: Mô tả quá sơ sài, thiếu thông số bảo hành..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setRejectId(null); setReason(""); }}
                className="px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-sm text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                className="px-6 py-2 bg-red-500 text-white font-bold rounded-sm shadow hover:bg-red-600 text-sm"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApproval;
