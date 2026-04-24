import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Menu, X, LogOut, LayoutDashboard, Users, UserCog,
  FileText, Package, ShoppingCart, PlusCircle, DollarSign,
  ClipboardCheck, Clock, CalendarDays, FileWarning, Ticket,
  User, Lock, ChevronDown, Eye, EyeOff, CheckCircle, AlertCircle, Camera,
  MessageCircle
} from 'lucide-react';
import { changePassword, updateMe, uploadAvatar } from '../../services/api';

const BACKEND_URL = 'http://localhost:5000';

const ADMIN_MENU = [
  { path: "/admin/dashboard", label: "Tổng quan", icon: <LayoutDashboard size={20} /> },
  { path: "/admin/stats", label: "Doanh thu", icon: <DollarSign size={20} /> },
  { path: "/admin/users", label: "Người dùng", icon: <UserCog size={20} /> },
  { path: "/admin/system-logs", label: "Nhật ký hệ thống", icon: <FileWarning size={20} /> },
];

const MANAGER_MENU = [
  { path: "/manager/workspace", label: "Tổng quan", icon: <LayoutDashboard size={20} /> },
  { path: "/manager/orders", label: "Đơn hàng", icon: <ShoppingCart size={20} /> },
  { path: "/manager/inventory", label: "Kho", icon: <Package size={20} /> },
  { path: "/manager/add-product", label: "Thêm SP", icon: <PlusCircle size={20} /> },
  { path: "/manager/payroll", label: "Lương", icon: <DollarSign size={20} /> },
  { path: "/manager/approvals", label: "Duyệt đơn", icon: <ClipboardCheck size={20} /> },
  { path: "/manager/attendance", label: "Sửa chấm công", icon: <Clock size={20} /> },
  { path: "/manager/staff", label: "Nhân viên", icon: <Users size={20} /> },
  { path: "/manager/shifts", label: "Lịch ca", icon: <CalendarDays size={20} /> },
  { path: "/manager/vouchers", label: "Mã Giảm Giá", icon: <Ticket size={20} /> },
];

const STAFF_MENU = [
  { path: "/staff/workspace", label: "Tổng quan", icon: <LayoutDashboard size={20} /> },
  { path: "/staff/orders", label: "Đơn hàng", icon: <ShoppingCart size={20} /> },
  { path: "/staff/chat", label: "Hỗ trợ khách", icon: <MessageCircle size={20} /> },
  { path: "/staff/shifts", label: "Đăng ký ca", icon: <CalendarDays size={20} /> },
  { path: "/staff/attendance", label: "Chấm công", icon: <Clock size={20} /> },
  { path: "/staff/payroll", label: "Bảng lương", icon: <DollarSign size={20} /> },
  { path: "/staff/requests", label: "Đơn xin", icon: <FileText size={20} /> },
];

/* ===== CHANGE PASSWORD MODAL ===== */
function ChangePasswordModal({ open, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  const reset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setMessage(null);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ thông tin' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    setLoading(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      setMessage({ type: 'success', text: res.message || 'Đổi mật khẩu thành công!' });
      setTimeout(() => handleClose(), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Đổi mật khẩu thất bại' });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div style={modalStyles.overlay} onClick={handleClose}>
      <div style={modalStyles.container} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={modalStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={modalStyles.headerIcon}>
              <Lock size={20} color="#fff" />
            </div>
            <h3 style={modalStyles.title}>Đổi mật khẩu</h3>
          </div>
          <button onClick={handleClose} style={modalStyles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={modalStyles.body}>
          {message && (
            <div style={{
              ...modalStyles.alert,
              background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
              color: message.type === 'success' ? '#065f46' : '#991b1b',
              borderColor: message.type === 'success' ? '#a7f3d0' : '#fecaca',
            }}>
              {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </div>
          )}

          {/* Current Password */}
          <div style={modalStyles.fieldGroup}>
            <label style={modalStyles.label}>Mật khẩu hiện tại</label>
            <div style={modalStyles.inputWrapper}>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                style={modalStyles.input}
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={modalStyles.eyeBtn}>
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div style={modalStyles.fieldGroup}>
            <label style={modalStyles.label}>Mật khẩu mới</label>
            <div style={modalStyles.inputWrapper}>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                style={modalStyles.input}
              />
              <button type="button" onClick={() => setShowNew(!showNew)} style={modalStyles.eyeBtn}>
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div style={modalStyles.fieldGroup}>
            <label style={modalStyles.label}>Xác nhận mật khẩu mới</label>
            <div style={modalStyles.inputWrapper}>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                style={modalStyles.input}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={modalStyles.eyeBtn}>
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div style={modalStyles.actions}>
            <button type="button" onClick={handleClose} style={modalStyles.cancelBtn}>
              Hủy
            </button>
            <button type="submit" disabled={loading} style={{
              ...modalStyles.submitBtn,
              opacity: loading ? 0.6 : 1,
            }}>
              {loading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const modalStyles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, backdropFilter: 'blur(4px)',
  },
  container: {
    background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440,
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)', overflow: 'hidden',
    animation: 'fadeInUp 0.25s ease-out',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
  },
  headerIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: 'linear-gradient(135deg, #f97316, #ea580c)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  title: { margin: 0, fontSize: 17, fontWeight: 700, color: '#1e293b' },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#94a3b8', padding: 4, borderRadius: 6,
    transition: 'color 0.2s',
  },
  body: { padding: '24px' },
  alert: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
    borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 16,
    border: '1px solid',
  },
  fieldGroup: { marginBottom: 16 },
  label: {
    display: 'block', fontSize: 13, fontWeight: 600, color: '#475569',
    marginBottom: 6,
  },
  inputWrapper: {
    position: 'relative', display: 'flex', alignItems: 'center',
  },
  input: {
    width: '100%', padding: '10px 40px 10px 14px', border: '1.5px solid #e2e8f0',
    borderRadius: 10, fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
    color: '#1e293b', background: '#f8fafc', boxSizing: 'border-box',
  },
  eyeBtn: {
    position: 'absolute', right: 10, background: 'none', border: 'none',
    cursor: 'pointer', color: '#94a3b8', padding: 4,
  },
  actions: {
    display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24,
  },
  cancelBtn: {
    padding: '10px 20px', border: '1.5px solid #e2e8f0', borderRadius: 10,
    background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14,
    color: '#64748b', transition: 'all 0.2s',
  },
  submitBtn: {
    padding: '10px 24px', border: 'none', borderRadius: 10,
    background: 'linear-gradient(135deg, #f97316, #ea580c)',
    color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14,
    transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(249,115,22,0.35)',
  },
};

/* ===== AVATAR RENDER HELPER ===== */
function AvatarImage({ src, initial, size = 38, style = {} }) {
  const avatarUrl = src ? `${BACKEND_URL}/${src}` : null;
  const baseStyle = {
    width: size, height: size, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, overflow: 'hidden',
    ...style,
  };
  if (avatarUrl) {
    return <img src={avatarUrl} alt="avatar" style={{ ...baseStyle, objectFit: 'cover' }} />;
  }
  return (
    <div style={{
      ...baseStyle,
      background: 'linear-gradient(135deg, #f97316, #ea580c)',
      color: '#fff', fontWeight: 800, fontSize: size * 0.42,
      letterSpacing: 0.5,
    }}>
      {initial}
    </div>
  );
}

/* ===== PROFILE MODAL ===== */
function ProfileModal({ open, onClose }) {
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const u = JSON.parse(userStr);
          setProfileForm({ name: u.name || '', phone: u.phone || '' });
          setAvatarPreview(u.avatar ? `${BACKEND_URL}/${u.avatar}` : null);
        }
      } catch (e) {}
      setAvatarFile(null);
      setMessage(null);
    }
  }, [open]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Ảnh không được quá 5MB' });
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Upload avatar first if changed
      let newAvatarPath = null;
      if (avatarFile) {
        const avatarRes = await uploadAvatar(avatarFile);
        newAvatarPath = avatarRes.avatar;
      }

      await updateMe(profileForm);

      // Update localStorage
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const u = JSON.parse(userStr);
          u.name = profileForm.name;
          u.phone = profileForm.phone;
          if (newAvatarPath) u.avatar = newAvatarPath;
          localStorage.setItem('user', JSON.stringify(u));
        }
      } catch (e) {}
      setMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công!' });
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Không thể cập nhật hồ sơ' });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const userStr = localStorage.getItem('user');
  const initial = userStr ? (JSON.parse(userStr).name || 'U').charAt(0).toUpperCase() : 'U';

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.container} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ ...modalStyles.headerIcon, background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
              <User size={20} color="#fff" />
            </div>
            <h3 style={modalStyles.title}>Hồ sơ cá nhân</h3>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <div style={modalStyles.body}>
          {message && (
            <div style={{
              ...modalStyles.alert,
              background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
              color: message.type === 'success' ? '#065f46' : '#991b1b',
              borderColor: message.type === 'success' ? '#a7f3d0' : '#fecaca',
            }}>
              {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </div>
          )}

          {/* Avatar Upload */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" style={{
                  width: 90, height: 90, borderRadius: '50%', objectFit: 'cover',
                  border: '3px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }} />
              ) : (
                <div style={{
                  width: 90, height: 90, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 36, fontWeight: 800,
                  border: '3px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}>
                  {initial}
                </div>
              )}
              <div style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 30, height: 30, borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}>
                <Camera size={14} color="#fff" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
            <span style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>Nhấn để thay đổi ảnh đại diện</span>
          </div>

          <div style={modalStyles.fieldGroup}>
            <label style={modalStyles.label}>Tên hiển thị</label>
            <input
              type="text"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              placeholder="Nhập tên hiển thị"
              style={modalStyles.input}
            />
          </div>

          <div style={modalStyles.fieldGroup}>
            <label style={modalStyles.label}>Số điện thoại</label>
            <input
              type="text"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              placeholder="Nhập số điện thoại"
              style={modalStyles.input}
            />
          </div>

          <div style={{
            padding: '10px 14px', borderRadius: 10, fontSize: 13,
            background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe',
            marginBottom: 0,
          }}>
            💡 Lưu ý: Bạn không thể tự sửa chức vụ, mức lương, hay email tài khoản. Nếu cần thay đổi, vui lòng liên hệ Quản lý.
          </div>

          <div style={modalStyles.actions}>
            <button type="button" onClick={onClose} style={modalStyles.cancelBtn}>Đóng</button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{ ...modalStyles.submitBtn, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 14px rgba(59,130,246,0.35)', opacity: saving ? 0.6 : 1 }}
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== AVATAR DROPDOWN ===== */
function AvatarDropdown({ userName, role, avatarUrl, onLogout }) {
  const [open, setOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initial = (userName || 'U').charAt(0).toUpperCase();

  return (
    <>
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        {/* Avatar Button */}
        <button
          id="avatar-dropdown-trigger"
          onClick={() => setOpen(!open)}
          style={dropdownStyles.trigger}
        >
          <AvatarImage src={avatarUrl} initial={initial} size={38} style={{ boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }} />
          <div style={dropdownStyles.userInfo}>
            <div style={dropdownStyles.userName}>{userName}</div>
            <div style={dropdownStyles.userRole}>{role}</div>
          </div>
          <ChevronDown
            size={16}
            style={{
              color: '#94a3b8',
              transition: 'transform 0.25s ease',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </button>

        {/* Dropdown Menu */}
        {open && (
          <div style={dropdownStyles.menu}>
            {/* User Info Header */}
            <div style={dropdownStyles.menuHeader}>
              <AvatarImage src={avatarUrl} initial={initial} size={42} style={{ boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{userName}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{role}</div>
              </div>
            </div>

            <div style={dropdownStyles.divider} />

            {/* Menu Items */}
            <button
              id="dropdown-profile"
              style={dropdownStyles.menuItem}
              onClick={() => { setOpen(false); setShowProfileModal(true); }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <User size={16} style={{ color: '#64748b' }} />
              <span>Hồ sơ cá nhân</span>
            </button>

            <button
              id="dropdown-change-password"
              style={dropdownStyles.menuItem}
              onClick={() => { setOpen(false); setShowPasswordModal(true); }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Lock size={16} style={{ color: '#64748b' }} />
              <span>Đổi mật khẩu</span>
            </button>

            <div style={dropdownStyles.divider} />

            <button
              id="dropdown-logout"
              style={{ ...dropdownStyles.menuItem, color: '#ef4444' }}
              onClick={() => { setOpen(false); onLogout(); }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <LogOut size={16} style={{ color: '#ef4444' }} />
              <span>Đăng xuất</span>
            </button>
          </div>
        )}
      </div>

      <ChangePasswordModal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      <ProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </>
  );
}

const dropdownStyles = {
  trigger: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'none', border: '1.5px solid transparent',
    cursor: 'pointer', padding: '6px 10px', borderRadius: 12,
    transition: 'all 0.2s ease',
  },
  avatar: {
    width: 38, height: 38, borderRadius: 12,
    background: 'linear-gradient(135deg, #f97316, #ea580c)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 800, fontSize: 16,
    boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
    letterSpacing: 0.5,
  },
  userInfo: { textAlign: 'left' },
  userName: { fontWeight: 700, fontSize: 14, color: '#1e293b', lineHeight: 1.2 },
  userRole: { fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' },
  menu: {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    width: 260, background: '#fff', borderRadius: 14,
    boxShadow: '0 20px 50px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
    zIndex: 1000, overflow: 'hidden',
    animation: 'fadeInDown 0.2s ease-out',
  },
  menuHeader: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '16px 18px',
    background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
  },
  menuAvatar: {
    width: 42, height: 42, borderRadius: 12,
    background: 'linear-gradient(135deg, #f97316, #ea580c)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 800, fontSize: 18,
    boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
  },
  divider: {
    height: 1, background: '#f1f5f9', margin: '0',
  },
  menuItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    width: '100%', padding: '12px 18px',
    background: 'transparent', border: 'none', cursor: 'pointer',
    fontSize: 14, fontWeight: 600, color: '#475569',
    transition: 'background 0.15s ease',
    textAlign: 'left',
  },
};

/* ===== MAIN LAYOUT ===== */
export default function DashboardLayout({ children, explicitRole }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  
  // Xử lý Role
  const currentRole = explicitRole || localStorage.getItem("role") || "USER";
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const userName = userObj?.name || currentRole;
  const userAvatar = userObj?.avatar || null;

  let menuItems = [];
  if (currentRole.toUpperCase() === "ADMIN") menuItems = ADMIN_MENU;
  else if (currentRole.toUpperCase() === "MANAGER") menuItems = MANAGER_MENU;
  else if (currentRole.toUpperCase() === "STAFF") menuItems = STAFF_MENU;

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
    window.location.reload();
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Animations */}
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* SIDEBAR */}
      <aside 
        className={`transition-all duration-300 ease-in-out bg-gray-900 text-white flex flex-col ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-800 shrink-0">
          <div className="font-bold text-orange-500 tracking-wider flex items-center gap-2">
            <span className="text-2xl">🐯</span>
            {!collapsed && <span>TIGER SHOP</span>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <nav className="space-y-1 px-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    isActive 
                      ? "bg-orange-500 text-white" 
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  } ${collapsed ? "justify-center" : ""}`
                }
                title={collapsed ? item.label : ""}
              >
                <div className="shrink-0">{item.icon}</div>
                {!collapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-800 text-center text-xs text-gray-500">
          {!collapsed && <span>© 2026 TigerShop</span>}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP HEADER */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 -ml-2 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <Menu size={24} />
            </button>
            <h1 className="font-semibold text-gray-800 hidden sm:block">
              {currentRole.toUpperCase()} PANEL
            </h1>
          </div>

          {/* AVATAR DROPDOWN thay thế nút logout cũ */}
          <AvatarDropdown
            userName={userName}
            role={currentRole.toUpperCase()}
            avatarUrl={userAvatar}
            onLogout={handleLogout}
          />
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
