require('dotenv').config();
const mysql = require('mysql');

const pool = mysql.createPool({
  host: process.env.DBHOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.SYNC_DB,
});

function getLastHourStats() {
  return new Promise((resolve, reject) => {
    pool.query('SELECT * FROM v_pubs_stats_last1h', (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results[0]);
      }
    });
  });
}

function getLast24HourStats() {
  return new Promise((resolve, reject) => {
    pool.query('SELECT * FROM v_pubs_stats_last24h', (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results[0]);
      }
    });
  });
}

function getLastWeekStats() {
  return new Promise((resolve, reject) => {
    pool.query('SELECT * FROM v_pubs_stats_last7d', (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results[0]);
      }
    });
  });
}

async function fetchAndSendHourlyPubs(ctx) {
  try {
    await ctx.deleteMessage();

    const lastHourStats = await getLastHourStats();

    const totalPubs = lastHourStats.totalPubs;
    const totalTracSpent = parseInt(lastHourStats.totalTracSpent);
    const avgPubPrice = parseFloat(lastHourStats.avgPubPrice).toFixed(2);
    const avgBid = parseFloat(lastHourStats.avgBid).toFixed(3);
    const avgEpochs = parseInt(lastHourStats.avgEpochsNumber);

    const message = `Hourly Stats\nTotal pubs: ${totalPubs}\nTRAC spent: ${totalTracSpent}\nPub price: ${avgPubPrice}\nBid: ${avgBid}\nEpochs: ${avgEpochs}`;

    return await ctx.reply(message);
  } catch (error) {
    console.error('An error occurred:', error);
    await ctx.reply('An error occurred while retrieving hourly pubs statistics.');
    return null;
  }
}

async function fetchAndSendDailyPubs(ctx) {
  try {
    await ctx.deleteMessage();

    const last24HourStats = await getLast24HourStats();

    const totalPubs = last24HourStats.totalPubs;
    const totalTracSpent = parseInt(last24HourStats.totalTracSpent);
    const avgPubPrice = parseFloat(last24HourStats.avgPubPrice).toFixed(2);
    const avgBid = parseFloat(last24HourStats.avgBid).toFixed(3);
    const avgEpochs = parseInt(last24HourStats.avgEpochsNumber);

    const message = `Daily Stats\nTotal pubs: ${totalPubs}\nTRAC spent: ${totalTracSpent}\nPub price: ${avgPubPrice}\nBid: ${avgBid}\nEpochs: ${avgEpochs}`;

    return await ctx.reply(message);
  } catch (error) {
    console.error('An error occurred:', error);
    await ctx.reply('An error occurred while retrieving daily pubs statistics.');
    return null;
  }
}

async function fetchAndSendWeeklyPubs(ctx) {
  try {
    await ctx.deleteMessage();

    const lastWeekStats = await getLastWeekStats();

    const totalPubs = lastWeekStats.totalPubs;
    const totalTracSpent = parseInt(lastWeekStats.totalTracSpent);
    const avgPubPrice = parseFloat(lastWeekStats.avgPubPrice).toFixed(2);
    const avgBid = parseFloat(lastWeekStats.avgBid).toFixed(3);
    const avgEpochs = parseInt(lastWeekStats.avgEpochsNumber);

    const message = `Weekly Stats\nTotal pubs: ${totalPubs}\nTRAC spent: ${totalTracSpent}\nPub price: ${avgPubPrice}\nBid: ${avgBid}\nEpochs: ${avgEpochs}`;

    return await ctx.reply(message);
  } catch (error) {
    console.error('An error occurred:', error);
    await ctx.reply('An error occurred while retrieving weekly pubs statistics.');
    return null;
  }
}

module.exports = {
  fetchAndSendHourlyPubs,
  fetchAndSendDailyPubs,
  fetchAndSendWeeklyPubs
};
