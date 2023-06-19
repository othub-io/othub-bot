require('dotenv').config();
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: process.env.DBHOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.SYNC_DB,
});

async function fetchNetworkStatistics(ctx) {
  try {
    await ctx.deleteMessage();

    connection.query('SELECT SUM(totalTracSpent) AS totalTracSpent, SUM(totalPubs) AS totalPubs, AVG(avgPubPrice) AS avgPubPrice FROM v_pubs_stats', function (err, pubStats, fields) {
      if (err) throw err;

      connection.query('SELECT SUM(nodeStake) AS totalNodeStake FROM v_nodes', function (err, nodeStats, fields) {
        if (err) throw err;

        const totalTracSpent = Number(pubStats[0].totalTracSpent).toFixed(0);
        const totalPubs = Number(pubStats[0].totalPubs).toFixed(0);
        const avgPubPrice = Number(pubStats[0].avgPubPrice).toFixed(3);
        const totalNodeStake = Number(nodeStats[0].totalNodeStake).toFixed(0);

        const message = `Network stats\nTotal Pubs: ${totalPubs}\nTotal Stake: ${totalNodeStake}\nTotal TRAC Spent: ${totalTracSpent}\nAverage Pub Price: ${avgPubPrice}`;
      });
    });
    return await ctx.reply(message);
  } catch (error) {
    console.error('An error occurred:', error);
    await ctx.reply('An error occurred while retrieving hourly pubs statistics.');
    return null;
  }
}

module.exports = {
  fetchNetworkStatistics
};