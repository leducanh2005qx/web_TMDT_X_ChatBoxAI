import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../../services/api";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await login(email, password);

      // ✅ GIỮ NGUYÊN
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      // ✅ THÊM DUY NHẤT DÒNG NÀY
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/home");
      }
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>🔐 Đăng nhập</h2>
        <p className="subtitle">Chào mừng bạn quay trở lại</p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Nhập email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="login-btn">Đăng nhập</button>
        </form>

        <p className="register-text">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
