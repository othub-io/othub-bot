require('dotenv').config()
const mysql = require('mysql')
const otnodedb_connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.BOT_DB
})

module.exports = spamCheck = (command, telegram_id) => {
  return new Promise((resolve, reject) => {
    otnodedb_connection.query('SELECT * FROM command_history WHERE command = ? AND tg_id = ?', [command, telegram_id], function (error, results, fields) {
      if (error) {
        reject(error);
        return;
      }

      console.log(results);

      if (!results || results.length === 0) {
        console.log(`Visitor:${telegram_id} is allowed to ${command}.`)
        let time_stamp = Date.now()
        otnodedb_connection.query('INSERT INTO command_history (command, tg_id, date_last_used) VALUES (?,?,?)', [command, telegram_id, time_stamp], function (error, results, fields) {
          if (error) {
            reject(error);
            return;
          }

          resolve({ permission: "allow" });
        });
      } else {
        let spam_result = results[0];
        let expireDate = Number(spam_result.date_last_used)  // Parse to number here
        console.log(expireDate)

        let currentDate = Date.now()  // Use Date.now() to get current time in milliseconds
        console.log(currentDate)

        let timeDif = currentDate - expireDate  // Math.abs() not needed here
        console.log(timeDif)

        let cooldown = Number(process.env.MILLIMIN_COOLDOWN)
        console.log(cooldown)

        if (timeDif > cooldown) {
          let time_stamp = currentDate
          otnodedb_connection.query('UPDATE command_history SET date_last_used = ? WHERE tg_id = ? AND command = ?', [time_stamp, telegram_id, command], function (error, results, fields) {
            if (error) {
              reject(error);
              return;
            }
            console.log(`Command: ${command} is allowed from member ${telegram_id}`)
            resolve({ permission: "allow" });
          });
        } else {
          let remaining = cooldown - timeDif
          console.log(`Command: ${command} was blocked. Time remaining: ${remaining} milliseconds.`)
          resolve({ permission: "block" });
        }
      }
    });
  });
}