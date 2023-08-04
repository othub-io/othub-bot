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

  module.exports = { NewPublishers, dailyHighPubs, contractsChange, stagingUpdateStatus };