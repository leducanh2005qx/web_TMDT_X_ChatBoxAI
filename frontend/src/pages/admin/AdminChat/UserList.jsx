import { useEffect, useState } from "react";

export default function UserList({ onSelectUser, selectedUser }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/chat/admin/threads", {
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    })
      .then((res) => res.json())
      .then(setUsers);
  }, []);

  return (
    <div className="user-list">
      {users.map((u) => (
        <div
          key={u.user_id}
          className={selectedUser?.id === u.user_id ? "active" : ""}
          onClick={() => onSelectUser(u)}
        >
          {u.email}
        </div>
      ))}
    </div>
  );
}
