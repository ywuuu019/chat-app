const express = require("express");
const path = require("path");
const http = require("http"); // express建立在http之上，使得開發web應用更方便。
const socketio = require("socket.io");
const Filter = require("bad-words");
const { generateMessage, generateLocationMessage } = require("./utils/message");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server); // socket io需要用到原始的http server

const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, "../public");

app.use(express.static(publicDir)); // 所有public目錄的檔案user都可以存取到

// socket是一個object, 包含連線的資訊。若有五個人連線，這邊就會執行五次
// io.on用於server端監聽事件
io.on("connection", (socket) => {
  console.log("New websocket connection"); // 每次重新整理都會執行一次

  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });
    // 這邊的error是上面desctructure, 也是我自己回傳的object
    if (error) {
      return callback(error); // 這邊要再callback, 回傳給user呈現
    }

    // 需要注意，user.room和room不同，room是使用者輸入的，user.room是修剪過的
    socket.join(user.room); // socket.io內建的method, 讓我們可以指定加入某個room
    socket.emit("message", generateMessage("System", "Welcome!"));
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage("System", `"${user.username}" has joined the room!`)
      );
    // side bar
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
  });

  socket.on("userSendMessage", (message, callback) => {
    const user = getUser(socket.id);
    filter = new Filter();
    // console.log(`user sending message "${message}"`);

    if (filter.isProfane(message)) {
      return callback("Profane is not allowed.");
    }
    io.to(user.room).emit("message", generateMessage(user.username, message));
    callback(); // 若合法，就不會回傳訊息，也就不會進到error
  });

  socket.on("sendLocation", (coords, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
      )
    );
    callback("Location shared!");
  });

  // disconnect是內建的事件
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("System", `"${user.username}" has left.`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Web server is listening on port ${port}`);
});
