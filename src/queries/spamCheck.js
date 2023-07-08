require('dotenv').config()
const mysql = require('mysql')
const connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.OTHUB_DB,
})

function executeOTNODEQuery (query, params) {
  return new Promise((resolve, reject) => {
    connection.query(query, params, (error, results) => {
      if (error) {
        reject(error)
      } else {
        resolve(results)
      }
    })
  })
}

async function getOTNODEData (query, params) {
  try {
    const results = await executeOTNODEQuery(query, params)
    return results
  } catch (error) {
    console.error('Error executing query:', error)
    throw error
  }
}

module.exports = spamCheck = async (command, telegram_id) => {
  query = 'SELECT * FROM command_history WHERE command = ? AND tg_id = ?'
  params = [command, telegram_id]
  commandRecord = await getOTNODEData(query, params)
    .catch(error => {
      console.error('Error retrieving data:', error)
    })

  if (!commandRecord.length) {
    console.log(`Visitor:${telegram_id} is allowed to ${command}.`)

    //insert a new time stamp
    time_stamp = new Date()
    time_stamp = Math.abs(time_stamp)

    query = 'INSERT INTO command_history (tg_id, command, date_last_used) VALUES (?,?,?)'
    params = [telegram_id, command, time_stamp]
    await executeOTNODEQuery(query, params)
      .catch(error => {
        console.error('Error inserting data:', error)
      })

    return {
      permission: `allow`
    }
  }

  expireDate = commandRecord[0].date_last_used
  currentDate = Math.abs(new Date())
  timeDif = Math.abs(currentDate - expireDate)
  cooldown = Number(process.env.COOLDOWN)

  permission = `block`
  remaining = cooldown - timeDif
  log_msg = `Command: ${command} was blocked for member ${telegram_id}. Time remaining: ${remaining} milliseconds.`

  if (timeDif > cooldown) {
    permission = `allow`
    log_msg = `Command: ${command} is allowed from member ${telegram_id}`

    //insert a new time stamp
    time_stamp = new Date()
    time_stamp = Math.abs(time_stamp)

    query = 'UPDATE command_history SET date_last_used = ? WHERE tg_id = ? AND command = ?'
    params = [time_stamp, telegram_id, command]
    await executeOTNODEQuery(query, params)
      .catch(error => {
        console.error('Error updating data:', error)
      })
  }

  console.log(log_msg)

  return {
    permission: permission
  }
}

