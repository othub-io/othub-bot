require('dotenv').config()
const db = require('better-sqlite3')(`${__dirname}/../../database/bot.db`, {
  verbose: console.log
})

module.exports = spamCheck = async command => {
  if (command) {
    //check for spam
    const spam_result = await db
      .prepare('SELECT date_last_used FROM command_history WHERE command = ?')
      .get(command)

    expireDate = new Date(spam_result.date_last_used)
    currentDate = new Date()

    timeDif = Math.abs(currentDate - expireDate)
    expireDate = Math.abs(expireDate)
    cooldown = process.env.MILLIMIN_COOLDOWN

    if (timeDif > cooldown) {
      permission = `allow`
      console.log(`Command: ${command} is allowed`)

      //insert a new time stamp
      time_stamp = new Date()
      time_stamp = Math.abs(time_stamp)
      await db
        .prepare('REPLACE INTO command_history VALUES (?,?)')
        .run(command, time_stamp)
    } else {
      permission = `block`
      remaining = cooldown - timeDif
      console.log(
        `Command: ${command} was blocked. Time remaining: ${remaining} milliseconds.`
      )
    }
  } else {
    permission = `allow`
  }

  return {
    permission: permission
  }
}
