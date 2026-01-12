function ChatMessage({ message, isMe }) {
  return (
    <div className={`chat-message ${isMe ? "me" : "other"}`}>{message}</div>
  );
}

export default ChatMessage;
