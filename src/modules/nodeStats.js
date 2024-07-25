const mysql = require('mysql');

const pool = mysql.createPool({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.OTHUB_DB
});

const queryNodeStats = (query, tokenSymbol) => {
  return new Promise((resolve, reject) => {
    if (typeof tokenSymbol !== 'string' || tokenSymbol.trim() === '') {
      return reject(new Error('Invalid tokenSymbol'));
    }
        
    pool.query(query, [tokenSymbol], (error, results) => {
      if (error) {
        console.error(`Query error: ${error.message}`);
        return reject(error);
      }
      
      if (results.length === 0) return resolve(null);

      const res = results[0];
      const stats = `
        == Node Stats 📊 ==
🆔nodeId: ${res.nodeId}
🔠tokenSymbol: ${res.tokenSymbol}
🥩nodeStake: ${parseFloat(res.nodeStake).toFixed(0)}
🫰nodeAsk: ${parseFloat(res.nodeAsk).toFixed(3)}
💲nodePayouts: ${parseFloat(res.cumulativePayouts).toFixed(3)}
💰estimatedEarnings: ${parseFloat(res.estimatedEarnings || res.estimatedEarnings1stEpochOnly).toFixed(3)}
🍺newPubs: ${res.pubsCommited1stEpochOnly}`;
        
      resolve(stats);
    });
  });
};

const nodeQueries = {
  lastHour: `SELECT * FROM sync_gnosis_mainnet.v_nodes_stats_last1h WHERE tokenSymbol = ?`,
  lastDay: `SELECT * FROM sync_gnosis_mainnet.v_nodes_stats_last24h WHERE tokenSymbol = ?`,
  lastWeek: `SELECT * FROM sync_gnosis_mainnet.v_nodes_stats_last7d WHERE tokenSymbol = ?`,
  lastMonth: `SELECT * FROM sync_gnosis_mainnet.v_nodes_stats_last30d WHERE tokenSymbol = ?`,
  latest: `SELECT * FROM sync_gnosis_mainnet.v_nodes_stats_latest WHERE tokenSymbol = ?`
};

module.exports = {
  lastHourNodeStats: (tokenSymbol) => queryNodeStats(nodeQueries.lastHour, tokenSymbol),
  lastDayNodeStats: (tokenSymbol) => queryNodeStats(nodeQueries.lastDay, tokenSymbol),
  lastWeekNodeStats: (tokenSymbol) => queryNodeStats(nodeQueries.lastWeek, tokenSymbol),
  lastMonthNodeStats: (tokenSymbol) => queryNodeStats(nodeQueries.lastMonth, tokenSymbol),
  NodeStats: (tokenSymbol) => queryNodeStats(nodeQueries.latest, tokenSymbol)
};