const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);

const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const port = process.env.PORT || 3000;
var db = require("./db");

const MAX_ROOMS = 2;
const MAX_USERS = 2;

app.use(express.static(__dirname + "/public"));

function getRooms(rooms) {
  var clientRooms = Object.keys(rooms).filter((r) =>
    Object.keys(rooms[r].sockets).every((k) => k != r),
  );

  return clientRooms;
}

io.on("connection", (socket) => {
  socket.on("newUserRoom", (roomID) => {
    const currentRooms = getRooms(io.sockets.adapter.rooms);

    console.log(
      `New user joined room ${roomID} (${currentRooms}/${MAX_ROOMS})`,
    );

    if (currentRooms.length < MAX_ROOMS || currentRooms.includes(roomID)) {
      if (currentRooms.includes(roomID)) {
        const currentUsers = io.sockets.adapter.rooms[roomID].length;

        if (currentUsers + 1 > MAX_USERS) {
          socket.emit("fullRoom");
          return;
        }
      }

      socket.join(roomID, () => {
        socket.roomID = roomID;
        socket.to(roomID).emit("newUser");

        db.addUser(roomID, function (id) {
          socket.emit("assignId", id);

          db.getMessage(roomID, function (err, value) {
            if (err && !err.notFound) throw err;

            if (value !== "undefined") {
              socket.emit("receiveText", value);
            }
          });
        });
      });
    } else {
      socket.emit("maxRoomsReached");
    }
  });

  socket.on("disconnect", () => {
    if (io.sockets.adapter.rooms.hasOwnProperty(socket.roomID)) {
      console.log(
        "cli in room:" + io.sockets.adapter.rooms[socket.roomID].length,
      );
    }
  });

  socket.on("sendText", (id, data) => {
    data = DOMPurify.sanitize(data);
    socket.to(id).emit("receiveText", data);
    db.updateMessage(id, data);
  });
});

http.listen(port, () => console.log("listening on port " + port));
