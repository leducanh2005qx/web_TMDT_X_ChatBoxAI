import { useEffect, useState } from "react";
import { getMyProfile, updateMyProfile } from "../../services/api";
import "./Profile.css";

function Profile() {
  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyProfile()
      .then((data) => {
        setUser(data);
        setPhone(data.phone || "");
        localStorage.setItem("user", JSON.stringify(data));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateMyProfile({
        name: user.name,
        phone,
      });

      const updated = { ...user, phone };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      alert("✅ Cập nhật thành công");
    } catch (err) {
      alert(err.message || "❌ Lỗi cập nhật");
    } finally {
      setSaving(false);
    }
  };

  // Màn hình loading sắc nét hơn
  if (loading)
    return (
      <div className="profile-page">
        <div
          className="profile-card"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p style={{ color: "#ffffff", fontWeight: 600 }}>
            🔍 Đang lấy dữ liệu...
          </p>
        </div>
      </div>
    );

  return (
    <div className="profile-page">
      <div className="profile-card">
        {/* Avatar với chữ cái đầu của tên */}
        <div className="profile-avatar">
          <span>{user.name?.charAt(0).toUpperCase()}</span>
        </div>

        <h2 className="profile-title">Tài khoản</h2>
        <p className="profile-sub">Quản lý và bảo mật thông tin cá nhân</p>

        <div className="profile-form">
          <div className="form-group">
            <label>Họ và tên</label>
            <input value={user.name} disabled />
          </div>

          <div className="form-group">
            <label>Địa chỉ Email</label>
            <input value={user.email} disabled />
          </div>

          <div className="form-group">
            <label>Số điện thoại</label>
            <input
              type="tel"
              placeholder="Nhập số điện thoại liên lạc"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <button className="save-btn" onClick={handleSave} disabled={saving}>
            {saving ? <>⏳ Đang xử lý...</> : <>💾 Lưu thay đổi</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
