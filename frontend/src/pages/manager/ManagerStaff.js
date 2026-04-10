import { useEffect, useState } from "react";
import {
  createStaffByManager,
  getManagerCreatedStaff,
} from "../../services/api";

function renderStatusBadge(status) {
  if (status === "active") {
    return <span className="badge bg-success">Da kich hoat</span>;
  }
  if (status === "pending") {
    return <span className="badge bg-warning text-dark">Cho duyet</span>;
  }
  if (status === "rejected") {
    return <span className="badge bg-danger">Da tu choi</span>;
  }
  return <span className="badge bg-secondary">{status || "Unknown"}</span>;
}

function ManagerStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getManagerCreatedStaff();
      setStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Khong the tai danh sach nhan vien");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setCreating(true);
      await createStaffByManager(form);
      setSuccess("Tao nhan vien thanh cong. Tai khoan dang cho Admin duyet.");
      setForm({ name: "", email: "", phone: "", password: "" });
      await loadData();
    } catch (err) {
      setError(err.message || "Khong the tao nhan vien");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Quan ly nhan vien (Manager)</h3>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card shadow-sm mb-3">
        <div className="card-header bg-light">
          <strong>Dang ky nhan vien moi</strong>
        </div>
        <div className="card-body">
          <form onSubmit={handleCreateStaff}>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Ten nhan vien</label>
                <input
                  className="form-control"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">So dien thoai</label>
                <input
                  className="form-control"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Mat khau</label>
                <input
                  type="password"
                  className="form-control"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button
                  className="btn btn-primary w-100"
                  type="submit"
                  disabled={creating}
                >
                  {creating ? "Dang tao..." : "Tao nhan vien"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

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
                    <th>So dien thoai</th>
                    <th style={{ width: 180 }}>Trang thai</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted">
                        Chua co nhan vien nao do ban tao.
                      </td>
                    </tr>
                  ) : (
                    staff.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.name}</td>
                        <td>{item.email}</td>
                        <td>{item.phone || "-"}</td>
                        <td>{renderStatusBadge(item.status)}</td>
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

export default ManagerStaff;
