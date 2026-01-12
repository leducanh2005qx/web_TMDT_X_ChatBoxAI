import { useState } from "react";
import ChatBox from "./ChatBox";
import "./Chat.css";

function ChatButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="chat-button" onClick={() => setOpen(!open)}>
        💬
      </button>

      {open && <ChatBox onClose={() => setOpen(false)} />}
    </>
  );
}

export default ChatButton;
