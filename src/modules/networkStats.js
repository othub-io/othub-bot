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

    const pubStats = await new Promise((resolve, reject) => {
      connection.query('SELECT SUM(totalTracSpent) AS totalTracSpent, SUM(totalPubs) AS totalPubs, AVG(avgPubPrice) AS avgPubPrice FROM v_pubs_stats WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)', function (err, pubStats, fields) {
        if (err) reject(err);
        resolve(results);
      });
    });

    const nodeStats = await new Promise((resolve, reject) => {
      connection.query('SELECT SUM(nodeStake) AS totalNodeStake FROM v_nodes', function (err, results, fields) {
        if (err) reject(err);
        resolve(results);
      });
    });

    const totalTracSpent = Number(pubStats[0].totalTracSpent).toFixed(0);
    const totalPubs = Number(pubStats[0].totalPubs).toFixed(0);
    const avgPubPrice = Number(pubStats[0].avgPubPrice).toFixed(3);
    const totalNodeStake = Number(nodeStats[0].totalNodeStake).toFixed(0);

    const message = `Network stats\nTotal Pubs: ${totalPubs}\nTotal Stake: ${totalNodeStake}\nTotal TRAC Spent: ${totalTracSpent}\nAverage Pub Price: ${avgPubPrice}`;

    const botmessage = await ctx.reply(message);

    if (botmessage) {
      setTimeout(async () => {
        try {
          await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id)
        } catch (error) {
          console.error('Error deleting message:', error)
        }
      }, process.env.DELETE_TIMER)
    }

  } catch (error) {
    console.error('An error occurred:', error);
    await ctx.reply('An error occurred while retrieving network statistics.');
    return null;
  }
}

module.exports = {
  fetchNetworkStatistics
};