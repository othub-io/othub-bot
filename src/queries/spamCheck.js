require('dotenv').config()
const mysql = require('mysql')
const otnodedb_connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: 'otnodedb'
})

module.exports = spamCheck = async (command, telegram_id) => {
  //check for spam
  const spam_result = await otnodedb_connection
    .prepare('SELECT * FROM command_history WHERE command = ? AND tg_id = ?')
    .get(command, telegram_id)

  console.log(spam_result)

  if (!spam_result) {
    console.log(`Vistor:${telegram_id} is allow to ${command}.`)

    //insert a new time stamp
    time_stamp = new Date()
    time_stamp = Math.abs(time_stamp)
    await db
      .prepare('INSERT INTO command_history VALUES (?,?,?)')
      .run(command, telegram_id, time_stamp)

    return {
      permission: `allow`
    }
  }

  expireDate = new Date(spam_result.date_last_used)
  expireDate = Math.abs(expireDate)
  console.log(expireDate)

  currentDate = new Date()
  currentDate = Math.abs(currentDate)
  console.log(currentDate)

  timeDif = Math.abs(currentDate - expireDate)
  console.log(timeDif)

  cooldown = Number(process.env.MILLIMIN_COOLDOWN)
  console.log(cooldown)

  if (timeDif > cooldown) {
    permission = `allow`
    console.log(`Command: ${command} is allowed from member ${telegram_id}`)

    //insert a new time stamp
    time_stamp = new Date()
    time_stamp = Math.abs(time_stamp)
    await db
      .prepare('UPDATE command_history SET date_last_used = ? WHERE tg_id = ?')
      .run(time_stamp, telegram_id)
  } else {
    permission = `block`
    remaining = cooldown - timeDif
    console.log(
      `Command: ${command} was blocked. Time remaining: ${remaining} milliseconds.`
    )
  }

  return {
    permission: permission
  }
}
