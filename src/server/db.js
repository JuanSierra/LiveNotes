const { Level } = require("level");
const path = require("path");
const MESSAGE = "messages";
const USERS = "users";
const crypto = require("crypto");

class DB {
  constructor() {
    this.dbPath = process.env.DB_PATH || path.join(__dirname, "notes");
    this.db = new Level(this.dbPath, { valueEncoding: "json" });
  }

  _saveUser(room) {
    this.db.get(key, (err, value) => {
      if (err) {
        callback(err, null);
      } else {
        var userId = crypto.randomBytes(16).toString("hex");
        var data = { id: userId, value: value === undefined ? null : value };

        this.users.put(room, data);
      }
    });
  }

  getMessage(room, callback) {
    let messages = this.db.sublevel(MESSAGE);

    messages.get(room, (err, value) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, value);
      }
    });
  }

  addUser(room, callback) {
    let users = this.db.sublevel(USERS, { valueEncoding: "json" });

    users.get(room, (err, roomUsers) => {
      var userId = crypto.randomBytes(16).toString("hex");

      if (err) {
        //if not found, create room
        users.put(room, [userId]);
      } else {
        roomUsers.push(userId);
        users.put(room, roomUsers);
      }
      callback(userId);
    });
  }

  updateMessage(room, data) {
    let messages = this.db.sublevel(MESSAGE);
    messages.put(room, data);
  }
}

module.exports = new DB();
