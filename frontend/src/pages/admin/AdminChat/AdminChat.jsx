import { useState } from "react";
import UserList from "./UserList";
import ChatPanel from "./ChatPanel";
import "./AdminChat.css";

function AdminChat() {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div className="admin-chat-page">
      <div className="chat-sidebar">
        <UserList selectedUser={selectedUser} onSelectUser={setSelectedUser} />
      </div>

      <div className="chat-main">
        <ChatPanel user={selectedUser} />
      </div>
    </div>
  );
}

export default AdminChat;
