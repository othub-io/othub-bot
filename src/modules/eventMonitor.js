require('dotenv').config();
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    database: process.env.SYNC_DB,
});

let lastCheckedTokenId = 0;
let knownPublishers = new Set();

function checkForNewPublishers(callback) {
  connection.query(`SELECT * FROM otp_sync_rpc.v_pubs WHERE token_id > ${lastCheckedTokenId} ORDER BY token_id ASC`, function (error, results, fields) {
    if (error) throw error;

    for(let result of results) {
      if (!knownPublishers.has(result.publisher)) {
        callback(result.publisher);
        knownPublishers.add(result.publisher);
      }
    }

    if(results.length > 0) {
      lastCheckedTokenId = results[results.length - 1].tokenId;
    }
  });
}

module.exports = { checkForNewPublishers };
