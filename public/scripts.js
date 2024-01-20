var id = new URLSearchParams(window.location.search).get("room");
if (id == null || id.length < 3) {
  id = prompt("Please enter Room ID");
  window.location.search = "?room=" + id;
}
document.title += " - " + id;
document.getElementById("room").innerHTML = id;

const textBox = document.getElementById("textbox");
const socket = io("/");

socket.emit("newUserRoom", id);

socket.on("assignId", (userId) => {
  saveId(id, userId);
});

socket.on("newUser", () => {
  socket.emit("sendText", id, textBox.value);
});

socket.on("maxRoomsReached", () => {
  alert("Maximum rooms reached");
});

socket.on("fullRoom", () => {
  alert("Maximum users reached");
});

socket.on("receiveText", (text) => {
  const selectionStart = textBox.selectionStart;
  const selectionEnd = textBox.selectionEnd;

  textBox.value = text;
  textBox.selectionStart = selectionStart;
  textBox.selectionEnd = selectionEnd;
});

textBox.addEventListener("keyup", () => {
  socket.emit("sendText", id, textBox.value);
});

function saveId(room, id) {
  const data = localStorage.getItem("livenotes_data");
  let rooms = [];

  if (data != null) {
    rooms = JSON.parse(data);

    var exist = rooms.find((element) => element.room == room);
    if (exist) return;
  }

  rooms.push({ room: room, id: id });
  localStorage.setItem("livenotes_data", JSON.stringify(rooms));
}
