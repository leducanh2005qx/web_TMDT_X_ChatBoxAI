const { Server } = require("socket.io");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    socket.on("join_thread", (threadId) => {
      socket.join(`thread_${threadId}`);
    });
  });

  return io;
};

module.exports = { initSocket };
