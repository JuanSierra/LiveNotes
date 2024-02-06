const db = require("./db");
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);
const Constants = require('../shared/constants');

class Summit{
    addUser(socket, roomID)
    {
        const currentRooms = this.#getRooms(socket.adapter.rooms);
      
        console.log(
          `New user joined room ${roomID} (${currentRooms}/${Constants.MAX_ROOMS})`,
        );
    
        if (currentRooms.length < Constants.MAX_ROOMS || currentRooms.includes(roomID)) {
          if (currentRooms.includes(roomID)) {
            const currentUsers = socket.adapter.rooms[roomID].length;
    
            if (currentUsers + 1 > Constants.MAX_USERS) {
              socket.emit(Constants.MESSAGES.FULL_ROOM);
              return;
            }
          }
    
          socket.join(roomID, () => {
            socket.roomID = roomID;
            socket.to(roomID).emit(Constants.MESSAGES.NEW_USER);
    
            db.addUser(roomID, function (id) {
              socket.emit(Constants.MESSAGES.ASSIGN_ID, id);
    
              db.getMessage(roomID, function (err, value) {
                if (err && !err.notFound) throw err;
    
                if (value !== "undefined") {
                  socket.emit(Constants.MESSAGES.RECEIVE_TEXT, value);
                }
              });
            });
          });
        } else {
          socket.emit(Constants.MESSAGES.MAX_ROOMS_REACHED);
        }
    }

    sendText(socket, id, data){
        console.log('text received')
        console.log(id)
        console.log(data)
        data = DOMPurify.sanitize(data);
        socket.to(id).emit(Constants.MESSAGES.RECEIVE_TEXT, data);
        db.updateMessage(id, data);
    }

    removeUser(socket){
        if (socket.adapter.rooms.hasOwnProperty(socket.roomID)) {
            console.log(
              "cli in room:" + socket.adapter.rooms[socket.roomID].length,
            );
        }
    }

    #getRooms(rooms) {
        var clientRooms = Object.keys(rooms).filter((r) =>
        Object.keys(rooms[r].sockets).every((k) => k != r),
      );
    
      return clientRooms;
    }
}

module.exports = new Summit();