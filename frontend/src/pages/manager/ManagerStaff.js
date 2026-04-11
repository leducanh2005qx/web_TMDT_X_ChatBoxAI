import { useEffect, useState } from "react";
import {
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


  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Quan ly nhan vien (Manager)</h3>
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
