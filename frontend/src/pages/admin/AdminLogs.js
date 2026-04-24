import React, { useState, useEffect } from "react";
import { getSystemLogsAdmin } from "../../services/api";
import { RefreshCw, Search, Clock, User, Activity, ExternalLink } from "lucide-react";

function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await getSystemLogsAdmin();
      setLogs(Array.isArray(data) ? data : []);
      setFilteredLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi lấy nhật ký:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    const results = logs.filter(log => 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLogs(results);
  }, [searchTerm, logs]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getRoleBadgeColor = (roleName) => {
    switch (roleName?.toUpperCase()) {
      case 'ADMIN': return 'bg-red-100 text-red-700 border-red-200';
      case 'MANAGER': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'STAFF': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="text-indigo-600" size={28} />
            Nhật Ký Hệ Thống
          </h2>
          <p className="text-gray-500 mt-1">Theo dõi thời gian thực các hành động của ban quản lý và nhân viên.</p>
        </div>
        <button 
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {/* Toolbox */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm theo hành động, tên, email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm text-gray-500 font-medium whitespace-nowrap">
          Hiển thị <span className="text-indigo-600">{filteredLogs.length}</span> nhật ký gần nhất
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">Người thực hiện</th>
                <th className="px-6 py-4">Hành động</th>
                <th className="px-6 py-4">Đối tượng (ID)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && !logs.length ? (
                <tr>
                  <td colSpan="4" className="text-center py-20">
                    <div className="flex flex-col items-center gap-2">
                       <RefreshCw className="animate-spin text-indigo-500" size={32} />
                       <span className="text-gray-400 font-medium">Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-20 text-gray-400 font-medium">
                    Không tìm thấy dữ liệu nhật ký nào.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-600 font-medium text-sm">
                        <Clock size={14} className="text-gray-400" />
                        {formatDate(log.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          {log.actor_name?.charAt(0).toUpperCase() || <User size={14}/>}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 leading-none">{log.actor_name || 'Hệ thống'}</p>
                          <div className="flex items-center gap-2 mt-1">
                             <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getRoleBadgeColor(log.role_name)}`}>
                               {log.role_name || 'SYSTEM'}
                             </span>
                             <span className="text-xs text-gray-400">{log.actor_email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const actionText = log.action || "";
                        let badgeClass = "bg-gray-100 text-gray-700 border-gray-200"; // Default
                        
                        const lowerAction = actionText.toLowerCase();
                        if (lowerAction.includes("xóa") || lowerAction.includes("hủy") || lowerAction.includes("khóa")) {
                          badgeClass = "bg-red-50 text-red-700 border-red-200";
                        } else if (lowerAction.includes("tạo mới") || lowerAction.includes("thêm") || lowerAction.includes("duyệt")) {
                          badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                        } else if (lowerAction.includes("cập nhật") || lowerAction.includes("sửa") || lowerAction.includes("reset") || lowerAction.includes("đổi trạng thái")) {
                          badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
                        }

                        return (
                          <div className={`px-3 py-1.5 rounded-lg border text-sm font-medium inline-block w-full ${badgeClass}`}>
                            {actionText}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        {log.target_id && log.target_id !== 0 ? (
                          <>
                            <span className="px-2 py-1 bg-gray-100 rounded border border-gray-200">#{log.target_id}</span>
                            <ExternalLink size={12} className="text-gray-300" />
                          </>
                        ) : (
                          <span className="italic text-gray-300">N/A</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminLogs;
