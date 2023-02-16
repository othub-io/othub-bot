require('dotenv').config()
const db = require('better-sqlite3')(`${__dirname}/../../database/bot.db`, {
  verbose: console.log
})

module.exports = spamCheck = async (command, telegram_id) => {
  //check for spam
  const spam_result = await db
    .prepare('SELECT * FROM command_history WHERE command = ? AND tg_id = ?')
    .get(command, telegram_id)

  console.log(spam_result)

  if (!spam_result) {
    console.log(`Vistor:${telegram_id} is allow to ${command}.`)

    //insert a new time stamp
    time_stamp = new Date()
    time_stamp = Math.abs(time_stamp)
    await db
      .prepare('REPLACE INTO command_history VALUES (?,?,?)')
      .run(command, telegram_id, time_stamp)

    return {
      permission: `allow`
    }
  }

  expireDate = new Date(spam_result.date_last_used)
  currentDate = new Date()

  timeDif = Math.abs(currentDate - expireDate)
  expireDate = Math.abs(expireDate)
  cooldown = Number(process.env.MILLIMIN_COOLDOWN)

  if (timeDif > cooldown) {
    permission = `allow`
    console.log(`Command: ${command} is allowed from member ${telegram_id}`)

    //insert a new time stamp
    time_stamp = new Date()
    time_stamp = Math.abs(time_stamp)
    await db
      .prepare('REPLACE INTO command_history VALUES (?,?,?)')
      .run(command, telegram_id, time_stamp)
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
