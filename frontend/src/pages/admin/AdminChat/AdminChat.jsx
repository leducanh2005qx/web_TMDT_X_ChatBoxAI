import { useState } from "react";
import UserList from "./UserList";
import ChatPanel from "./ChatPanel";
import "./AdminChat.css";

function AdminChat() {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div className="admin-chat">
      <UserList selectedUser={selectedUser} onSelectUser={setSelectedUser} />
      <ChatPanel user={selectedUser} />
    </div>
  );
}

export default AdminChat;
