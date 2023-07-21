const fs = require('fs');
const mysql = require('mysql');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.SYNC_DB,
});

let lastCheckedTokenId = 0;
let knownPublishers = new Set();

try {
  const data = fs.readFileSync('knownPublishers.json', 'utf8');
  knownPublishers = new Set(JSON.parse(data));
} catch (err) {
  console.error(`Error reading file from disk: ${err}`);
}

function checkForNewPublishers(callback) {
  connection.query(`SELECT * FROM otp_sync_rpc.v_pubs WHERE token_id > ${lastCheckedTokenId} ORDER BY token_id ASC`, function (error, results, fields) {
    if (error) throw error;

    let newPublishers = [];
    for(let result of results) {
      if (!knownPublishers.has(result.publisher)) {
        newPublishers.push(result.publisher);
        knownPublishers.add(result.publisher);
      }
    }

    fs.writeFile('knownPublishers.json', JSON.stringify(Array.from(knownPublishers)), (err) => {
      if (err) throw err;
      console.log('The file has been saved!');
    });

    if(newPublishers.length > 0) {
      callback(newPublishers);
    }

    if(results.length > 0) {
      lastCheckedTokenId = results[results.length - 1].token_id;
    }
  });
}

module.exports = { checkForNewPublishers };
