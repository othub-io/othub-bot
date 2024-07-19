require('dotenv').config();
const mysql = require('mysql');
const connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.OTHUB_DB,
});

function executeOTNODEQuery(query, params) {
  return new Promise((resolve, reject) => {
    connection.query(query, params, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

async function getOTNODEData(query, params) {
  try {
    const results = await executeOTNODEQuery(query, params);
    return results;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}

async function spamCheck(command, telegram_id) {
  const query = 'SELECT * FROM command_history WHERE command = ? AND tg_id = ?';
  const params = [command, telegram_id];
  const commandRecord = await getOTNODEData(query, params).catch(error => {
    console.error('Error retrieving data:', error);
  });

  if (!commandRecord.length) {
    console.log(`Visitor:${telegram_id} is allowed to ${command}.`);

    // Insert a new timestamp
    let time_stamp = new Date().getTime();

    const insertQuery = 'INSERT INTO command_history (tg_id, command, date_last_used) VALUES (?,?,?)';
    const insertParams = [telegram_id, command, time_stamp];
    await executeOTNODEQuery(insertQuery, insertParams).catch(error => {
      console.error('Error inserting data:', error);
    });

    return {
      permission: 'allow'
    };
  }

  const expireDate = commandRecord[0].date_last_used;
  const currentDate = new Date().getTime();
  const timeDif = currentDate - expireDate;
  const cooldown = Number(process.env.COOLDOWN);

  let permission = 'block';
  const remaining = cooldown - timeDif;
  let log_msg = `Command: ${command} was blocked for member ${telegram_id}. Time remaining: ${remaining} milliseconds.`;

  if (timeDif > cooldown) {
    permission = 'allow';
    log_msg = `Command: ${command} is allowed from member ${telegram_id}`;

    // Update the timestamp
    const time_stamp = new Date().getTime();
    const updateQuery = 'UPDATE command_history SET date_last_used = ? WHERE tg_id = ? AND command = ?';
    const updateParams = [time_stamp, telegram_id, command];
    await executeOTNODEQuery(updateQuery, updateParams).catch(error => {
      console.error('Error updating data:', error);
    });
  }

  console.log(log_msg);

  return {
    permission: permission
  };
}

module.exports = { spamCheck };
