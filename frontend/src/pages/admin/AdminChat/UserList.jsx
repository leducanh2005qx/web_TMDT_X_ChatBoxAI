import { useEffect, useState } from "react";

export default function UserList({ onSelectUser, selectedUser }) {
  const [threads, setThreads] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/chat/admin/threads", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setThreads(Array.isArray(data) ? data : []);
      });
  }, []);

  return (
    <div className="user-list">
      {threads.map((t) => {
        const user = {
          id: t.user_id,
          email: t.email,
          threadId: t.thread_id, // ✅ FIX CHÍNH Ở ĐÂY
        };

        return (
          <div
            key={t.thread_id}
            className={selectedUser?.id === user.id ? "active" : ""}
            onClick={() => onSelectUser(user)}
          >
            {user.email}
          </div>
        );
      })}
    </div>
  );
}
