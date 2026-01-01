import { useState } from "react";
import { login } from "../../services/api";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const result = await login(email, password);

      if (result && result.token) {
        localStorage.setItem("token", result.token);
        localStorage.setItem("role", result.role);

        if (result.role === "ADMIN") {
          navigate("/admin/dashboard");
        } else {
          navigate("/home");
        }
      } else {
        alert("Email hoặc mật khẩu sai");
      }
    } catch (error) {
      alert("Không kết nối được server");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Đăng nhập</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="button" onClick={handleLogin}>
          Đăng nhập
        </button>

        <p className="auth-switch">
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
