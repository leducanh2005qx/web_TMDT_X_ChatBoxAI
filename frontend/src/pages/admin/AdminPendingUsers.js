import { useEffect, useState } from "react";
import {
  getAdminPendingStaff,
  approveStaff,
  rejectStaff,
} from "../../services/api";

function AdminPendingUsers() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      const data = await getAdminPendingStaff();
      setPendingUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Khong the tai danh sach cho duyet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const handleApprove = async (userId) => {
    try {
      setActionLoading(`approve-${userId}`);
      await approveStaff(userId);
      await loadPendingUsers();
    } catch (err) {
      setError(err.message || "Duyet that bai");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId) => {
    try {
      setActionLoading(`reject-${userId}`);
      await rejectStaff(userId);
      await loadPendingUsers();
    } catch (err) {
      setError(err.message || "Tu choi that bai");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Duyet tai khoan nhan vien (Admin)</h3>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm">
        <div className="card-body">
          {loading ? (
            <p className="mb-0">Dang tai du lieu...</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 80 }}>ID</th>
                    <th>Ten nhan vien</th>
                    <th>Email</th>
                    <th>Nguoi tao (Manager)</th>
                    <th style={{ width: 180 }}>Trang thai</th>
                    <th style={{ width: 220 }}>Thao tac</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted">
                        Khong co nhan vien nao dang cho duyet.
                      </td>
                    </tr>
                  ) : (
                    pendingUsers.map((user) => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.created_by_name || `ID ${user.created_by || "-"}`}</td>
                        <td>
                          <span className="badge bg-warning text-dark">Cho duyet</span>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleApprove(user.id)}
                              disabled={actionLoading !== null}
                            >
                              {actionLoading === `approve-${user.id}` ? "Dang duyet..." : "Duyet"}
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleReject(user.id)}
                              disabled={actionLoading !== null}
                            >
                              {actionLoading === `reject-${user.id}` ? "Dang tu choi..." : "Tu choi"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPendingUsers;
