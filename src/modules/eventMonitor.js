const mysql = require('mysql');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.DKG_DB,
});

const otp_connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.SYNC_OTP_DB,
});

const gnosis_connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.SYNC_GNOSIS_DB,
});

// function NewPublishers(callback) {
//     const query = `
//     SELECT newPublisher
//     FROM (
//       SELECT DISTINCT \`from\` AS newPublisher FROM staging_pub
//       UNION ALL
//       SELECT DISTINCT \`from\` AS newPublisher FROM staging_pub
//       WHERE block_ts <= (NOW() - INTERVAL 24 HOUR)
//     ) AS c
//     GROUP BY newPublisher
//     HAVING COUNT(*) = 1;
//     `;
  
//     connection.query(query, (error, results) => {
//       if (error) {
//         console.error('Failed to execute query: ', error);
//         return;
//       }
  
//       const newPublishers = results.map(row => row.newPublisher);
//       callback(newPublishers);
//     });
//   }

  function dailyHighPubs(callback) {
    const query = `SELECT totalPubs
    FROM v_pubs_stats_daily
    WHERE date = (SELECT date FROM v_pubs_stats_daily ORDER BY totalPubs DESC LIMIT 1)
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

  function otpContractsChange(callback) {
    const query = "SELECT * FROM v_sys_notif_contracts_change";
  
    otp_connection.query(query, (error, results) => {
      if (error) {
        console.error('Failed to execute query: ', error);
        return;
      }
  
      if (results.length > 0) {
        callback(results);
      }
    });
  }

  function gnosisContractsChange(callback) {
    const query = "SELECT * FROM v_sys_notif_contracts_change";
  
    gnosis_connection.query(query, (error, results) => {
      if (error) {
        console.error('Failed to execute query: ', error);
        return;
      }
  
      if (results.length > 0) {
        callback(results);
      }
    });
  }

  function otpStagingUpdateStatus(callback) {
    const query = "SELECT * FROM v_sys_staging_update_dead";
    otp_connection.query(query, (error, results) => {
      if (error) {
        console.error('Failed to execute query: ', error);
        return;
      }
      if (results.length > 0 && results[0].sync_delta !== null) {
        callback(results);
      } 
    });
  }

  function gnosisStagingUpdateStatus(callback) {
    const query = "SELECT * FROM v_sys_staging_update_dead";
    gnosis_connection.query(query, (error, results) => {
      if (error) {
        console.error('Failed to execute query: ', error);
        return;
      }
      if (results.length > 0 && results[0].sync_delta !== null) {
        callback(results);
      } 
    });
  }

  function notifyTelegramOtpContractsChange() {
    const message = `📜DKG V6 Contracts Change Detected for OTP!`;
    const adminGroup = process.env.ADMIN_GROUP
    adminGroup.forEach(adminId => {
      bot.telegram.sendMessage(adminId, message);
    });
  }

  function notifyTelegramGnosisContractsChange() {
    const message = `📜DKG V6 Contracts Change Detected for Gnosis!`;
    const adminGroup = process.env.ADMIN_GROUP
    adminGroup.forEach(adminId => {
      bot.telegram.sendMessage(adminId, message);
    });
  }
  
  function notifyTelegramOtpStagingUpdateStatus() {
    const message = `🛠Staging Update process stalled for OTP!`;
    const adminGroup = process.env.ADMIN_GROUP
    adminGroup.forEach(adminId => {
      bot.telegram.sendMessage(adminId, message);
    });
  }

  function notifyTelegramGnosisStagingUpdateStatus() {
    const message = `🛠Staging Update process stalled for Gnosis!`;
    const adminGroup = process.env.ADMIN_GROUP
    adminGroup.forEach(adminId => {
      bot.telegram.sendMessage(adminId, message);
    });
  }
  
  // function notifyTelegramNewPublisher(newPublishers) {
  //   const messages = newPublishers.map(publisher => 
  //     `<a href="https://origintrail.subscan.io/account/${publisher}">${publisher}</a>`
  //   );
  //   const message = `🪪New Publisher Detected:\n${messages.join('\n')}`;
  //   bot.telegram.sendMessage(process.env.OTHUB_ID, message, { parse_mode: 'HTML' })
  //   bot.telegram.sendMessage(process.env.ORIGINTRAIL_ID, message, { parse_mode: 'HTML' });
  // }

  
  module.exports = { dailyHighPubs, otpContractsChange, gnosisContractsChange, gnosisStagingUpdateStatus, otpStagingUpdateStatus, notifyTelegramOtpContractsChange, notifyTelegramGnosisContractsChange, notifyTelegramOtpStagingUpdateStatus, notifyTelegramGnosisStagingUpdateStatus };