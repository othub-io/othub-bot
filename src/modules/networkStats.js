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

function getReadableTime(days) {
  let remainingDays = days;

  const years = Math.floor(remainingDays / 365);
  remainingDays -= years * 365;

  const months = Math.floor(remainingDays / 30);
  remainingDays -= months * 30;

  let result = '';

  if (years > 0) {
    result += `${years} year${years === 1 ? '' : 's'}, `;
  }
  if (months > 0) {
    result += `${months} month${months === 1 ? '' : 's'}, `;
  }
  if (remainingDays > 0) {
    result += `${remainingDays} day${remainingDays === 1 ? '' : 's'}`;
  }

  return result;
}

async function fetchNetworkStatistics(ctx) {
  try {
    await ctx.deleteMessage();

    const pubStats = await query('SELECT SUM(totalTracSpent) AS totalTracSpent, SUM(totalPubs) AS totalPubs, (SELECT AVG(avgPubPrice) FROM v_pubs_stats WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) AS avgPubPriceLast30Days FROM v_pubs_stats');
    const nodeStats = await query('SELECT SUM(nodeStake) AS totalNodeStake, COUNT(*) AS totalNodes FROM v_nodes; FROM v_nodes');

    const totalTracSpent = Number(pubStats[0].totalTracSpent).toFixed(0);
    const totalPubs = Number(pubStats[0].totalPubs).toFixed(0);
    const avgPubPrice = Number(pubStats[0].avgPubPriceLast30Days).toFixed(3);
    const totalNodes = Number(nodeStats[0],totalNodes).toFixed(0);
    const totalNodeStake = Number(nodeStats[0].totalNodeStake).toFixed(0);

    const startDate = new Date("2022-12-14");
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const timeSinceStartDate = getReadableTime(diffDays);

    const message = `Network stats\nDays: ${timeSinceStartDate}\nTotal Pubs: ${totalPubs}\nTotal Nodes: ${totalNodes}\nTotal Stake: ${totalNodeStake}\nTotal TRAC Spent: ${totalTracSpent}\nAverage Pub Price: ${avgPubPrice}`;

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
  }
}

module.exports = {
  fetchNetworkStatistics
};
