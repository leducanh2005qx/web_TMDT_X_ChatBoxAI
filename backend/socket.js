const { Server } = require("socket.io");

const initSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    // Khi khách hoặc admin tham gia vào một hội thoại
    socket.on("join_thread", (threadId) => {
      // Tôi khuyên bạn dùng trực tiếp threadId để đồng bộ với các hàm .to(threadId)
      socket.join(String(threadId));
      console.log(`📡 Socket joined room: ${threadId}`);
    });

    socket.on("disconnect", () => {
      console.log("❌ A user disconnected");
    });
  });

  return io;
};

module.exports = { initSocket };
