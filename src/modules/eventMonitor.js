const mysql = require('mysql');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.SYNC_DB,
});

function checkForNewPublishers(callback) {
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
  
  module.exports = { checkForNewPublishers };
