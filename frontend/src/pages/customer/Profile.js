import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProfile, updateMyProfile, uploadAvatar, getMyAddresses, createMyAddress, deleteMyAddress, setDefaultAddress } from "../../services/api";
import { Camera, X, User, MapPin, Trash2 } from "lucide-react";
import "./Profile.css";

function Profile() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState({ receiverName: "", receiverPhone: "", province: "", address: "" });
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    getMyProfile()
      .then((data) => {
        setUser(data);
        setName(data.name || "");
        setPhone(data.phone || "");
        localStorage.setItem("user", JSON.stringify(data));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getMyAddresses().then((data) => setAddresses(Array.isArray(data) ? data : [])).catch(() => setAddresses([]));
  }, []);

  const handleAddAddress = async () => {
    if (!addressForm.receiverName.trim() || !addressForm.receiverPhone.trim() || !addressForm.province.trim() || !addressForm.address.trim()) {
      return alert("Vui lòng nhập đủ thông tin địa chỉ");
    }
    try {
      const result = await createMyAddress({ ...addressForm, isDefault: addresses.length === 0 });
      const next = { ...addressForm, id: result.id, isDefault: addresses.length === 0 };
      setAddresses((previous) => [next, ...previous]);
      setAddressForm({ receiverName: "", receiverPhone: "", province: "", address: "" });
    } catch (err) {
      alert(err.message || "Không thể lưu địa chỉ");
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Xóa địa chỉ này?")) return;
    try {
      await deleteMyAddress(id);
      setAddresses((previous) => previous.filter((address) => address.id !== id));
    } catch (err) {
      alert(err.message || "Không thể xóa địa chỉ");
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      await setDefaultAddress(id);
      setAddresses((previous) => previous.map((address) => ({ ...address, isDefault: address.id === id })));
    } catch (err) {
      alert(err.message || "Không thể đặt địa chỉ mặc định");
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateMyProfile({
        name,
        phone,
      });

      const updated = { ...user, name, phone };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      alert("✅ Cập nhật thành công");
    } catch (err) {
      alert(err.message || "❌ Lỗi cập nhật");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setSaving(true);
      const res = await uploadAvatar(file);
      if (res.success) {
        const updated = { ...user, avatar: res.avatar };
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
        alert("✅ Cập nhật ảnh đại diện thành công!");
      }
    } catch (err) {
      alert(err.message || "❌ Lỗi tải lên ảnh");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    navigate(-1); // Quay lại trang trước đó
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  if (loading)
    return (
      <div className="profile-page">
        <div className="profile-card loading-card">
          <p className="loading-text">
            🔍 Đang lấy dữ liệu hồ sơ...
          </p>
        </div>
      </div>
    );

  return (
    <div className="profile-page">
      <div className="profile-card">
        {/* Header */}
        <div className="profile-header">
          <div className="header-title-container">
            <div className="header-icon-box">
              <User size={20} className="header-icon" />
            </div>
            <span className="header-title-text">Hồ sơ cá nhân</span>
          </div>
          <button className="header-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Avatar Section */}
        <div className="avatar-section">
          <div className="avatar-wrapper" onClick={triggerFileInput}>
            {user.avatar ? (
              <img
                src={`http://localhost:5000/${user.avatar}`}
                alt="Avatar"
                className="avatar-img"
              />
            ) : (
              <div className="avatar-letter">
                {name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            <div className="camera-btn">
              <Camera size={14} />
            </div>
          </div>
          <span className="avatar-caption">Nhấn để thay đổi ảnh đại diện</span>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            style={{ display: "none" }}
          />
        </div>

        {/* Form Fields */}
        <div className="profile-form">
          <div className="form-group">
            <label className="form-label">Tên hiển thị</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên hiển thị"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Số điện thoại</label>
            <input
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nhập số điện thoại"
            />
          </div>

          {/* Note Callout */}
          <div className="note-callout">
            <span className="note-text">
              💡 Lưu ý: Bạn không thể tự sửa chức vụ, mức lương, hay email tài khoản. Nếu cần thay đổi, vui lòng liên hệ Quản lý.
            </span>
          </div>

          <div className="address-book">
            <div className="address-book-title"><MapPin size={17} /> Sổ địa chỉ nhận hàng</div>
            {addresses.map((address) => (
              <div className="saved-address" key={address.id}>
                <div>
                  <strong>{address.receiverName} · {address.receiverPhone}</strong>
                  <div>{address.address}, {address.province}</div>
                  {address.isDefault ? <span className="default-address-badge">Mặc định</span> : (
                    <button className="address-link" onClick={() => handleSetDefaultAddress(address.id)}>Đặt mặc định</button>
                  )}
                </div>
                <button className="delete-address-btn" onClick={() => handleDeleteAddress(address.id)} aria-label="Xóa địa chỉ"><Trash2 size={16} /></button>
              </div>
            ))}
            <div className="address-form-grid">
              <input className="form-input" placeholder="Tên người nhận" value={addressForm.receiverName} onChange={(e) => setAddressForm({ ...addressForm, receiverName: e.target.value })} />
              <input className="form-input" placeholder="Số điện thoại" value={addressForm.receiverPhone} onChange={(e) => setAddressForm({ ...addressForm, receiverPhone: e.target.value })} />
              <input className="form-input" placeholder="Tỉnh/Thành phố" value={addressForm.province} onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })} />
              <input className="form-input address-full-input" placeholder="Địa chỉ chi tiết" value={addressForm.address} onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })} />
            </div>
            <button className="address-add-btn" onClick={handleAddAddress}>+ Thêm địa chỉ</button>
          </div>

          {/* Actions */}
          <div className="profile-actions">
            <button className="profile-btn-close" onClick={handleClose}>
              Đóng
            </button>
            <button
              className="profile-btn-save"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
