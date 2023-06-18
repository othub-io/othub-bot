require('dotenv').config()
const mysql = require('mysql')
const otnodedb_connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: 'otnodedb'
})

function executeOTNODEQuery (query, params) {
  return new Promise((resolve, reject) => {
    otnodedb_connection.query(query, params, (error, results) => {
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
    .then(results => {
      //console.log('Query results:', results);
      return results
      // Use the results in your variable or perform further operations
    })
    .catch(error => {
      console.error('Error retrieving data:', error)
    })

  console.log(commandRecord)
  if (commandRecord == '') {
    console.log(`Vistor:${telegram_id} is allowed to ${command}.`)

    //insert a new time stamp
    time_stamp = new Date()
    time_stamp = Math.abs(time_stamp)

    query = 'INSERT INTO command_history VALUES (?,?,?)'
    await otnodedb_connection.query(
      query,
      [telegram_id, command, time_stamp],
      function (error, results, fields) {
        if (error) throw error
      }
    )

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
  log_msg = `Command: ${command} was blocked. Time remaining: ${remaining} milliseconds.`

  if (timeDif > cooldown) {
    permission = `allow`
    log_msg = `Command: ${command} is allowed from member ${telegram_id}`

    //insert a new time stamp
    time_stamp = new Date()
    time_stamp = Math.abs(time_stamp)

    query = 'UPDATE command_history SET date_last_used = ? WHERE tg_id = ?'
    params = [time_stamp, telegram_id]
    commandRecord = await getOTNODEData(query, params)
      .then(results => {
        //console.log('Query results:', results);
        return results
        // Use the results in your variable or perform further operations
      })
      .catch(error => {
        console.error('Error retrieving data:', error)
      })
  }

  console.log(log_msg)

  return {
    permission: permission
  }
}
