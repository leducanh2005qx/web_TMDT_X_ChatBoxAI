import { useState, useEffect } from "react";
import {
  getAllUsers,
  deleteUserAdmin,
  restoreUserAdmin,
  changeRoleAdmin,
  toggleUserStatusAdmin,
} from "../../services/api";

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [trashUsers, setTrashUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(Array.isArray(data) ? data : []);

      const trash = await getAllUsers(true);
      setTrashUsers(Array.isArray(trash) ? trash : []);
      setError("");
    } catch (err) {
      setError(err.message || "Lỗi tải quản lý người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn chuyển người dùng này vào thùng rác?")) return;
    try {
      await deleteUserAdmin(id);
      alert("Đã chuyển người dùng vào thùng rác!");
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRestoreUser = async (id) => {
    try {
      await restoreUserAdmin(id);
      alert("Đã khôi phục người dùng!");
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRoleChange = async (id, roleId) => {
    try {
      await changeRoleAdmin(id, roleId);
      alert("Đã phân quyền thành công!");
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const isCurrentlyActive = currentStatus !== 0; // null defaults to true logically
    const nextStatus = !isCurrentlyActive;
    if (!window.confirm(`Bạn muốn ${nextStatus ? 'mở khóa' : 'KHÓA'} người dùng này?`)) return;
    
    try {
      await toggleUserStatusAdmin(id, nextStatus);
      alert(nextStatus ? "Đã mở khóa tài khoản!" : "Tài khoản đã bị khóa!");
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const getRoleBadge = (roleId) => {
    switch (roleId) {
      case 1:
        return "bg-red-100 text-red-800 border-red-200";
      case 2:
        return "bg-orange-100 text-orange-800 border-orange-200";
      case 3:
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Quản Lý Người Dùng</h2>
        <p className="text-gray-500 mt-1">Quản lý phân quyền, theo dõi và khóa tài khoản vi phạm.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200">
          {error}
        </div>
      )}

      {/* ACTIVE USERS TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Tài khoản hoạt động</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium">ID</th>
                <th className="px-6 py-4 font-medium">Tài khoản</th>
                <th className="px-6 py-4 font-medium text-center">Chức vụ</th>
                <th className="px-6 py-4 font-medium text-center">Trạng thái</th>
                <th className="px-6 py-4 font-medium text-right shadow-sm">Phân quyền</th>
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8">
                    <span className="text-gray-500 hover:text-blue-500 transition-colors">Đang tải dữ liệu...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    Không có người dùng nào.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isActive = u.is_active !== 0; // fallback null to true
                  return (
                    <tr key={u.id} className={`bg-white hover:bg-gray-50 transition-colors ${!isActive ? 'opacity-60 grayscale' : ''}`}>
                      <td className="px-6 py-4 font-medium text-gray-900 border-r border-gray-50">#{u.id}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{u.name}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{u.email}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1.5 text-xs font-semibold rounded-md border shadow-sm ${getRoleBadge(u.role_id)}`}>
                          {u.role_name || "User"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-50 text-green-700 rounded-md border border-green-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Bình thường
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-700 rounded-md border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            Bị khóa
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select
                          className="bg-white border hover:bg-gray-50 cursor-pointer border-gray-300 text-gray-900 text-sm font-medium rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm block w-full p-2.5 outline-none transition-all"
                          value={u.role_id || ""}
                          onChange={(e) => handleRoleChange(u.id, Number(e.target.value))}
                        >
                          <option value={5}>Customer</option>
                          <option value={3}>Staff (Nhân viên)</option>
                          <option value={2}>Manager (Quản lý)</option>
                          <option value={1}>Admin (Chủ)</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(u.id, u.is_active)}
                          className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-offset-1 ${
                            isActive
                              ? "text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 hover:text-red-800 hover:border-red-300 focus:ring-red-500"
                              : "text-white bg-green-600 border border-transparent hover:bg-green-700 focus:ring-green-500"
                          }`}
                        >
                          {isActive ? "Khóa" : "Mở"}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white rounded-lg border border-gray-300 shadow-sm hover:bg-gray-50 hover:text-red-600 focus:ring-2 focus:ring-offset-1 focus:ring-red-500 transition-all"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TRASH SECTION */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
           <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          <h3 className="text-lg font-semibold text-gray-700">Thùng rác - Đã ẩn</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-400 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">ID</th>
                <th className="px-6 py-4 font-medium">Tên & Email</th>
                <th className="px-6 py-4 font-medium text-right">Cứu xét</th>
              </tr>
            </thead>
            <tbody>
              {trashUsers.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-8 text-gray-400">Thùng rác trống.</td>
                </tr>
              ) : (
                trashUsers.map(tu => (
                  <tr key={tu.id} className="border-b last:border-0 border-gray-100 bg-white hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-700">#{tu.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{tu.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{tu.email}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRestoreUser(tu.id)}
                        className="px-4 py-2 shadow-sm text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all"
                      >
                        Khôi phục
                      </button>
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
