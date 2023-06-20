require('dotenv').config();
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: process.env.DBHOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.SYNC_DB,
});

function query(sql, args) {
  return new Promise((resolve, reject) => {
    connection.query(sql, args, (error, rows) => {
      if (error) return reject(error);
      resolve(rows);
    });
  });
}

async function fetchNetworkStatistics(ctx) {
  try {
    await ctx.deleteMessage();

    const pubStats = await query('SELECT SUM(totalTracSpent) AS totalTracSpent, SUM(totalPubs) AS totalPubs, AVG(avgPubPrice) AS avgPubPrice FROM v_pubs_stats WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)');
    const nodeStats = await query('SELECT SUM(nodeStake) AS totalNodeStake FROM v_nodes');

    const totalTracSpent = Number(pubStats[0].totalTracSpent).toFixed(0);
    const totalPubs = Number(pubStats[0].totalPubs).toFixed(0);
    const avgPubPrice = Number(pubStats[0].avgPubPrice).toFixed(3);
    const totalNodeStake = Number(nodeStats[0].totalNodeStake).toFixed(0);

    const message = `Network stats\nTotal Pubs: ${totalPubs}\nTotal Stake: ${totalNodeStake}\nTotal TRAC Spent: ${totalTracSpent}\nAverage Pub Price: ${avgPubPrice}`;

    await ctx.reply(message);

  } catch (error) {
    console.error('An error occurred:', error);
    await ctx.reply('An error occurred while retrieving network statistics.');
  }
}

module.exports = {
  fetchNetworkStatistics
};
