const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);

const port = process.env.PORT || 3000;

const Constants = require('../shared/constants');
const summit = require('./summit');

app.use(express.static('public'));

io.on("connection", (socket) => {
  socket.on(Constants.MESSAGES.JOIN_ROOM, joinRoom);
  socket.on(Constants.MESSAGES.TEXT, textInput);
  socket.on('disconnect', onDisconnect);
});

//const summit = new Summit();

function joinRoom(roomID) {
  summit.addUser(this, roomID);
}

function textInput(id, data) {
  summit.sendText(this, id, data);
}

function onDisconnect() {
  summit.removeUser(this);
}

http.listen(port, () => console.log("listening on port " + port));
