import { useState } from "react";
import UserList from "./UserList";
import ChatPanel from "./ChatPanel";
import "./AdminChat.css";

function AdminChat() {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div className="admin-chat-dashboard">
      {/* Header trang đồng bộ Dashboard */}
      <header className="page-header">
        <div className="header-left">
          <h1>💬 Trung tâm hỗ trợ TIGER SHOP</h1>
        </div>
        <div className="stat-card">
          <span>TỔNG TIN NHẮN</span>
          <strong>24</strong>
        </div>
      </header>

      <div className="admin-chat-grid-container">
        {/* Ô 1: DANH SÁCH KHÁCH HÀNG (Dạng thẻ đứng bên trái) */}
        <aside className="glass-card chat-sidebar-box">
          <div className="box-header">
            <h3>Hội thoại gần đây</h3>
          </div>
          <div className="sidebar-list">
            <UserList
              selectedUser={selectedUser}
              onSelectUser={setSelectedUser}
            />
          </div>
        </aside>

        {/* Ô 2: KHUNG NỘI DUNG TIN NHẮN (Dạng thẻ lớn ở giữa) */}
        <main className="glass-card chat-main-box">
          {selectedUser ? (
            <ChatPanel user={selectedUser} />
          ) : (
            <div className="chat-empty-state">
              <div className="empty-icon">✉️</div>
              <h3>Chưa chọn hội thoại</h3>
              <p>Chọn một khách hàng bên trái để xem tin nhắn</p>
            </div>
          )}
        </main>

        {/* Ô 3: THÔNG TIN CHI TIẾT (Dạng thẻ nhỏ bên phải) */}
        <aside className="glass-card chat-info-box">
          {selectedUser ? (
            <div className="info-box-content">
              <div className="user-profile-summary">
                <div className="avatar-circle">
                  {selectedUser.email?.charAt(0).toUpperCase()}
                </div>
                <h4>{selectedUser.email}</h4>
                <span className="user-tag">Customer</span>
              </div>

              <div className="info-sections">
                <div className="info-item">
                  <label>Ghi chú khách hàng</label>
                  <textarea placeholder="Nhập lưu ý nội bộ..." />
                </div>
              </div>

              <div className="info-footer-actions">
                <button className="btn-order-history">📜 Xem đơn hàng</button>
                <button className="btn-finish">Đóng hội thoại</button>
              </div>
            </div>
          ) : (
            <div className="info-empty">
              <p>Thông tin khách hàng sẽ hiển thị tại đây</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default AdminChat;
