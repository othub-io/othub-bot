const mysql = require('mysql');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.SYNC_DB,
});

function NewPublishers(callback) {
    const query = `
    SELECT newPublisher
    FROM (
      SELECT DISTINCT \`from\` AS newPublisher FROM staging_pub
      UNION ALL
      SELECT DISTINCT \`from\` AS newPublisher FROM staging_pub
      WHERE block_ts <= (NOW() - INTERVAL 24 HOUR)
    ) AS c
    GROUP BY newPublisher
    HAVING COUNT(*) = 1;
    `;
  
    connection.query(query, (error, results) => {
      if (error) {
        console.error('Failed to execute query: ', error);
        return;
      }
  
      const newPublishers = results.map(row => row.newPublisher);
      callback(newPublishers);
    });
  }

  function dailyHighPubs(callback) {
    const query = `SELECT totalPubs
    FROM v_pubs_stats
    WHERE date = (SELECT date FROM v_pubs_stats ORDER BY totalPubs DESC LIMIT 1)
    AND date = CURDATE() - INTERVAL 1 DAY
    LIMIT 1;`;
  
    connection.query(query, (error, results) => {
      if (error) {
        console.error('Failed to execute query: ', error);
        return;
      }
  
      const dailyHighPubs = results.map(row => row.totalPubs);
      callback(dailyHighPubs);
    });
  }

  function contractsChange(callback) {
    const query = "SELECT * FROM v_sys_notif_contracts_change";
  
    connection.query(query, (error, results) => {
      if (error) {
        console.error('Failed to execute query: ', error);
        return;
      }
  
      if (results.length > 0) {
        callback(results);
      }
    });
  }

  function stagingUpdateStatus(callback) {
    const query = "SELECT * FROM v_sys_staging_update_dead";
    connection.query(query, (error, results) => {
      if (error) {
        console.error('Failed to execute query: ', error);
        return;
      }
      if (results.length > 0 && results[0].sync_delta !== null) {
        callback(results);
      } 
    });
  }

  function notifyTelegramContractsChange() {
    const message = `📜DKG V6 Contracts Change Detected!`;
    const adminGroup = process.env.ADMIN_GROUP
    adminGroup.forEach(adminId => {
      bot.telegram.sendMessage(adminId, message);
    });
  }
  
  function notifyTelegramStagingUpdateStatus() {
    const message = `🛠Staging Update process stalled!`;
    const adminGroup = process.env.ADMIN_GROUP
    adminGroup.forEach(adminId => {
      bot.telegram.sendMessage(adminId, message);
    });
  }
  
  function notifyTelegramNewPublisher(newPublishers) {
    const messages = newPublishers.map(publisher => 
      `<a href="https://origintrail.subscan.io/account/${publisher}">${publisher}</a>`
    );
    const message = `🪪New Publisher Detected:\n${messages.join('\n')}`;
    bot.telegram.sendMessage(process.env.OTHUB_ID, message, { parse_mode: 'HTML' })
    bot.telegram.sendMessage(process.env.ORIGINTRAIL_ID, message, { parse_mode: 'HTML' });
  }
  
  function notifyTelegramDailyHighPubs(dailyHighPubs) {
    const message = `🚀🚀 Daily Publishing Record Broken with ${dailyHighPubs} Publishes!! 🚀🚀`;
    bot.telegram.sendMessage(process.env.OTHUB_ID, message);
    bot.telegram.sendMessage(process.env.ORIGINTRAIL_ID, message, { parse_mode: 'HTML' })
  }
  
  module.exports = { NewPublishers, dailyHighPubs, contractsChange, stagingUpdateStatus, notifyTelegramContractsChange, notifyTelegramStagingUpdateStatus, notifyTelegramNewPublisher, notifyTelegramDailyHighPubs };