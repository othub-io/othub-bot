const mysql = require('mysql');
const connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.OTHUB_DB
});

exports.lastHourNodeStats = (tokenSymbol, callback) => {
    connection.query(
      `SELECT * FROM otp_sync_rpc.v_nodes_stats_last1h WHERE tokenSymbol = ?`,
      [tokenSymbol],
      (error, results, fields) => {
        if (error) {
          return callback(error);
        }
  
        if (results.length > 0) {
          let res = results[0];
          let stats = `
            == Last Hour Node 📊 ==
🆔nodeId: ${res.nodeId}
🔠tokenSymbol: ${res.tokenSymbol}
🥩nodeStake: ${parseFloat(res.nodeStake).toFixed(0)}
🫰nodeAsk: ${parseFloat(res.nodeAsk).toFixed(3)}
💲nodePayouts: ${parseFloat(res.cumulativePayouts).toFixed(3)}
💰estimatedPayout: ${parseFloat(res.estimatedEarnings).toFixed(3)}
🍺newPubs: ${res.pubsCommited1stEpochOnly}`;
          return callback(null, stats);
        } else {
          return callback();
        }
      }
    );
  };  

exports.lastDayNodeStats = (tokenSymbol, callback) => {
    connection.query(
      `SELECT * FROM otp_sync_rpc.v_nodes_stats_last24h WHERE tokenSymbol = ?`,
      [tokenSymbol],
      (error, results, fields) => {
        if (error) {
          return callback(error);
        }
  
        if (results.length > 0) {
          let res = results[0];
          let stats = `
            == Last Day Node 📊 ==
🆔nodeId: ${res.nodeId}
🔠tokenSymbol: ${res.tokenSymbol}
🥩nodeStake: ${parseFloat(res.nodeStake).toFixed(0)}
🫰nodeAsk: ${parseFloat(res.nodeAsk).toFixed(3)}
💲nodePayouts: ${parseFloat(res.cumulativePayouts).toFixed(3)}
💰estimatedPayout: ${parseFloat(res.estimatedEarnings).toFixed(3)}
🍺newPubs: ${res.pubsCommited1stEpochOnly}`;
          return callback(null, stats);
        } else {
          return callback();
        }
      }
    );
  };
  
exports.lastWeekNodeStats = (tokenSymbol, callback) => {
  connection.query(
    `SELECT * FROM otp_sync_rpc.v_nodes_stats_last7d WHERE tokenSymbol = ?`,
    [tokenSymbol],
    (error, results, fields) => {
      if (error) {
        return callback(error);
      }

      if (results.length > 0) {
        let res = results[0];
        let stats = `
          == Last 7 Days Node 📊 ==
🆔nodeId: ${res.nodeId}
🔠tokenSymbol: ${res.tokenSymbol}
🥩nodeStake: ${parseFloat(res.nodeStake).toFixed(0)}
🫰nodeAsk: ${parseFloat(res.nodeAsk).toFixed(3)}
💲nodePayouts: ${parseFloat(res.cumulativePayouts).toFixed(3)}
💰estimatedPayout: ${parseFloat(res.estimatedEarnings).toFixed(3)}
🍺newPubs: ${res.pubsCommited1stEpochOnly}`;
        return callback(null, stats);
      } else {
        return callback();
      }
    }
  );
};
  
exports.lastMonthNodeStats = (tokenSymbol, callback) => {
  connection.query(
    `SELECT * FROM otp_sync_rpc.v_nodes_stats_last30d WHERE tokenSymbol = ?`,
    [tokenSymbol],
    (error, results, fields) => {
      if (error) {
        return callback(error);
      }

      if (results.length > 0) {
        let res = results[0];
        let stats = `
          == Last 30 Days Node 📊 ==
🆔nodeId: ${res.nodeId}
🔠tokenSymbol: ${res.tokenSymbol}
🥩nodeStake: ${parseFloat(res.nodeStake).toFixed(0)}
🫰nodeAsk: ${parseFloat(res.nodeAsk).toFixed(3)}
💲nodePayouts: ${parseFloat(res.cumulativePayouts).toFixed(3)}
💰estimatedPayout: ${parseFloat(res.estimatedEarnings).toFixed(3)}
🍺newPubs: ${res.pubsCommited1stEpochOnly}`;
        return callback(null, stats);
      } else {
        return callback();
      }
    }
  );
};
