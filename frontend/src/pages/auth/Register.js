import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../../services/api";
import "./Register.css";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await register(name, email, password, phone);
      alert("✅ Đăng ký thành công! Hãy đăng nhập ngay.");
      navigate("/login");
    } catch (err) {
      setError(err.message || "Đăng ký thất bại");
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <div
          style={{
            fontSize: "3rem",
            textAlign: "center",
            marginBottom: "10px",
          }}
        >
          🐅
        </div>
        <h2>Tham gia cùng Tiger</h2>
        <p className="subtitle">Khám phá thế giới mua sắm hiện đại</p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Họ và tên</label>
            <input
              type="text"
              placeholder="Nhập tên đầy đủ của bạn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Số điện thoại</label>
            <input
              type="tel"
              placeholder="Nhập số điện thoại liên lạc"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Ví dụ: tiger@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              placeholder="Tối thiểu 6 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="register-btn" type="submit">
            Tạo tài khoản ngay
          </button>
        </form>

        <p className="login-text">
          Đã có tài khoản? <Link to="/login">Đăng nhập tại đây</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
