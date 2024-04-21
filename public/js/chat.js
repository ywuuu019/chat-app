const socket = io();

// element
const $messageForm = document.querySelector("#messageForm");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");
const $sidebar = document.querySelector("#sidebar");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML; // 這個很重要
const urlTemplate = document.querySelector("#url-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault(); // 避免按按鈕時 整個頁面重新整理
  const message = e.target.elements.message.value;
  $messageFormButton.setAttribute("disabled", "disabled"); // 送完之後等一下，等處理完再允許繼續按
  socket.emit("userSendMessage", message, (error) => {
    if (error) {
      return console.log(error);
    }
    console.log("user send message.");
    $messageFormInput.value = ""; // 清空搜尋列
    $messageFormInput.focus(); // 讓重點回到輸入欄位
    $messageFormButton.removeAttribute("disabled");
  });
});

// socket.on用於client端接收event
// 不一定要對應到emit的名稱(count), 重點是順序，可以傳送多個變數
socket.on("message", (message) => {
  console.log(message.text);
  const html = Mustache.render(messageTemplate, {
    name: message.username,
    msg1: message.text,
    createdAt: moment(message.createdAt).format("a h:mm:ss"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
});

socket.on("locationMessage", (message) => {
  console.log(message);
  const html = Mustache.render(urlTemplate, {
    name: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format("a h:mm:ss"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  $sidebar.innerHTML = html;
});

$sendLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not support by your browser.");
  }
  // 按過之後先反白，不能按，等處理完再允許
  $sendLocationButton.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    const location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    socket.emit("sendLocation", location, (status) => {
      console.log(status);
      $sendLocationButton.removeAttribute("disabled"); // 發送完才允許繼續按
    });
  });
});
