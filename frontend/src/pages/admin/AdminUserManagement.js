import { useState, useEffect } from "react";
import { getAllUsers, deleteUserAdmin, restoreUserAdmin } from "../../services/api";

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

  const getRoleName = (roleId) => {
    switch (roleId) {
      case 1: return "Admin";
      case 2: return "Manager";
      case 3: return "Staff";
      default: return "User";
    }
  };

  const getRoleBadge = (roleId) => {
    switch (roleId) {
      case 1: return "badge bg-danger";
      case 2: return "badge bg-warning text-dark";
      case 3: return "badge bg-info text-dark";
      default: return "badge bg-secondary";
    }
  };

  const getStatusBadge = (status) => {
    if (status === "active") return "badge bg-success";
    if (status === "pending") return "badge bg-warning";
    if (status === "rejected") return "badge bg-danger";
    return "badge bg-secondary";
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Quản Lý Người Dùng</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="card shadow-sm">
        <div className="card-header bg-white">
          <h5 className="mb-0">Danh sách tất cả người dùng</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Tên</th>
                  <th>Email</th>
                  <th>Số Điện Thoại</th>
                  <th>Chức Vụ</th>
                  <th>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <div className="spinner-border spinner-border-sm text-primary" /> Đang tải...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">
                      Không có người dùng nào.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td className="fw-medium">{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.phone || "-"}</td>
                      <td>
                        <span className={getRoleBadge(u.role_id)}>
                          {getRoleName(u.role_id)}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusBadge(u.status)}>
                          {u.status === "active" ? "Hoạt động" : u.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <button 
                          className="btn btn-sm btn-outline-danger me-2"
                          onClick={() => handleDeleteUser(u.id)}
                        >
                          Xoá
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

      {/* TRASH SECTION FOR USERS */}
      <div className="mt-5">
        <h4 className="text-secondary">Thùng rác - Người dùng đã ẩn</h4>
        <div className="card border-0 shadow-sm">
           <div className="card-body p-0">
              <table className="table table-sm table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Tên</th>
                    <th>Email</th>
                    <th className="text-end">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                   {trashUsers.length === 0 ? (
                      <tr className="text-muted">
                        <td colSpan="4" className="text-center py-2">
                          Thùng rác đang trống.
                        </td>
                      </tr>
                   ) : (
                     trashUsers.map(tu => (
                       <tr key={tu.id}>
                         <td>{tu.id}</td>
                         <td>{tu.name}</td>
                         <td>{tu.email}</td>
                         <td className="text-end">
                           <button className="btn btn-sm btn-outline-success" onClick={() => handleRestoreUser(tu.id)}>
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
    </div>
  );
}
