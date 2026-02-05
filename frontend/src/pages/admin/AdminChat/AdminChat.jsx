import { useState } from "react";
import UserList from "./UserList";
import ChatPanel from "./ChatPanel";
import "./AdminChat.css";

function AdminChat() {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div className="admin-chat-premium-page">
      {/* Các thành phần trang trí nền */}
      <div className="dynamic-blobs">
        <div className="blob cb-blue"></div>
        <div className="blob cb-purple"></div>
      </div>

      <div className="admin-chat-wrapper">
        <div className="admin-chat-main-container">
          {/* CỘT 1: SIDEBAR DANH SÁCH */}
          <aside className="chat-sidebar-section">
            <div className="sidebar-header-premium">
              <h3>Hội thoại</h3>
              <span className="count-label">5 khách đang online</span>
            </div>
            <div className="sidebar-scrollable">
              {/* Truyền props vào component UserList hiện tại của bạn */}
              <UserList
                selectedUser={selectedUser}
                onSelectUser={setSelectedUser}
              />
            </div>
          </aside>

          {/* CỘT 2: KHUNG CHAT TRUNG TÂM */}
          <main className="chat-content-section">
            {selectedUser ? (
              <ChatPanel user={selectedUser} />
            ) : (
              <div className="chat-placeholder-full">
                <div className="placeholder-content">
                  <div className="icon-pulse">💬</div>
                  <h2>Tiger Shop Admin</h2>
                  <p>
                    Chọn một khách hàng từ danh sách bên trái
                    <br />
                    để bắt đầu hỗ trợ.
                  </p>
                </div>
              </div>
            )}
          </main>

          {/* CỘT 3: THÔNG TIN KHÁCH HÀNG (Chỉ hiện khi đã chọn user) */}
          {selectedUser && (
            <aside className="chat-info-section">
              <div className="user-profile-mini">
                <div className="avatar-large">
                  {selectedUser.email?.charAt(0).toUpperCase()}
                </div>
                <h4>{selectedUser.email}</h4>
                <span className="tag-status">Khách hàng hệ thống</span>
              </div>

              <div className="quick-actions-admin">
                <p className="label">Ghi chú quản trị</p>
                <textarea placeholder="Nhập nhanh thông tin cần lưu ý về khách hàng này..." />
                <button className="btn-view-order">
                  📋 Xem lịch sử đơn hàng
                </button>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminChat;
