import { useState } from "react";
import ChatBox from "./ChatBox";
import "./Chat.css";

function ChatButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Sử dụng class chat-fab để khớp với CSS Premium mới */}
      <button className="chat-fab" onClick={() => setOpen(!open)}>
        {open ? "✖" : "💬"}
      </button>

      {open && <ChatBox onClose={() => setOpen(false)} />}
    </>
  );
}

export default ChatButton;
