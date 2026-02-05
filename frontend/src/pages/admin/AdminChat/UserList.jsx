import { useEffect, useState } from "react";

export default function UserList({ onSelectUser, selectedUser }) {
  const [threads, setThreads] = useState([]);

  useEffect(() => {
    // Gọi API lấy danh sách các luồng chat từ Database
    fetch("http://localhost:5000/api/chat/admin/threads", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        // Đảm bảo dữ liệu là mảng trước khi set state
        setThreads(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Lỗi lấy danh sách chat:", err));
  }, []);

  return (
    <div className="user-list-container">
      {threads.length === 0 ? (
        <div className="empty-chat-hint">Chưa có hội thoại nào.</div>
      ) : (
        threads.map((t) => {
          const user = {
            id: t.user_id,
            email: t.email,
            threadId: t.thread_id,
          };

          return (
            <div
              key={t.thread_id}
              className={`chat-user-box ${selectedUser?.id === user.id ? "active" : ""}`}
              onClick={() => onSelectUser(user)}
            >
              {/* Avatar biểu tượng cho mỗi ô */}
              <div className="user-avatar">
                {user.email?.charAt(0).toUpperCase()}
              </div>

              <div className="user-details">
                <span className="user-email-text">{user.email}</span>
                <span className="user-subtext">Hội thoại #{t.thread_id}</span>
              </div>

              {/* Vạch xanh chỉ báo khi đang chọn ô này */}
              {selectedUser?.id === user.id && <div className="active-line" />}
            </div>
          );
        })
      )}
    </div>
  );
}
