require('dotenv').config();
const mysql = require('mysql');

const pool = mysql.createPool({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.DKG_DB,
});

const dbNameMapping = {
  '': process.env.DKG_DB,
  'neuro': process.env.OTP_DB,
  'otp': process.env.OTP_DB,
  'neuroweb': process.env.OTP_DB,
  'neurowebai': process.env.OTP_DB,
  'gnosis': process.env.GNO_DB,
  'gno': process.env.GNO_DB,
};

function fetchStats(dbName, query) {
  return new Promise((resolve, reject) => {
    const selectedDb = dbNameMapping[dbName] || process.env.DKG_DB;
    pool.query(`SELECT datetime, avgPubSize / 1024 AS avgPubSize, avgEpochsNumber, avgPubPrice, avgBid, totalPubs, totalTracSpent, privatePubsPercentage FROM ${selectedDb}.${query}`, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results[0]);
      }
    });
  });
}

function generateMessage(stats, period, dbName) {
  const totalPubs = stats.totalPubs;
  const totalTracSpent = parseInt(stats.totalTracSpent);
  const avgPubPrice = parseFloat(stats.avgPubPrice).toFixed(2);
  const avgPubSize = parseFloat(stats.avgPubSize).toFixed(2);
  const avgBid = parseFloat(stats.avgBid).toFixed(2);
  const avgEpochs = Math.round(stats.avgEpochsNumber);
  const privatePubsPercentage = parseInt(stats.privatePubsPercentage);

  const totalPubsEmoji = totalPubs > 900 ? '🚀' : totalPubs >= 700 ? '✈️' : totalPubs >= 500 ? '🚁' : totalPubs >= 300 ? '🎈' : '☠️';
  const totalTracSpentEmoji = totalTracSpent > 125 ? '🤑' : totalTracSpent >= 100 ? '💰' : totalTracSpent >= 75 ? '💸' : totalTracSpent >= 50 ? '💵' : '🪙';
  const avgPubPriceEmoji = avgPubPrice > 0.2 ? '😃' : avgPubPrice >= 0.1 ? '🙂' : avgPubPrice >= 0.05 ? '😐' : avgPubPrice >= 0.025 ? '🤕' : '🤮';
  const avgPubSizeEmoji = avgPubSize > 4 ? '🐳' : avgPubSize >= 3 ? '🐋' : avgPubSize >= 2 ? '🦭' : avgPubSize >= 1 ? '🐡' : '🐟';

  const dbLabel = dbName === 'gnosis' || dbName === 'gno' ? '(Gnosis)' : dbName === 'neuro' || dbName === 'otp' || dbName === 'neuroweb' || dbName === 'neurowebai' ? '(Neuro)' : '';
    
  return `== ${period} ${dbLabel} \u{1F4CA} ==
${totalPubsEmoji}Total pubs: ${totalPubs}
${totalTracSpentEmoji}TRAC spent: ${totalTracSpent}
${avgPubSizeEmoji}Size: ${avgPubSize}kB
${avgPubPriceEmoji}Pub price: ${avgPubPrice}
⚖️Bid: ${avgBid}
⏰Epochs: ${avgEpochs}
👀Private Pubs: ${privatePubsPercentage}%`;
}

async function fetchAndSendPubs(ctx, period, query, dbName) {
  try {
    const stats = await fetchStats(dbName, query);
    const message = generateMessage(stats, period, dbName);
    await ctx.reply(message);
  } catch (error) {
    await ctx.reply(`Error fetching stats: ${error.message}`);
  }
}

async function fetchAndSendHourlyPubs(ctx, dbName = '') {
  await fetchAndSendPubs(ctx, 'Last Hour', 'v_pubs_stats_last1h', dbName);
}

async function fetchAndSendDailyPubs(ctx, dbName = '') {
  await fetchAndSendPubs(ctx, 'Last 24H', 'v_pubs_stats_last24h', dbName);
}

async function fetchAndSendWeeklyPubs(ctx, dbName = '') {
  await fetchAndSendPubs(ctx, 'Last Week', 'v_pubs_stats_last7d', dbName);
}

async function fetchAndSendMonthlyPubs(ctx, dbName = '') {
  await fetchAndSendPubs(ctx, 'Last Month', 'v_pubs_stats_last30d', dbName);
}

async function fetchAndSendTotalPubs(ctx, dbName = '') {
  await fetchAndSendPubs(ctx, 'Total Pubs', 'v_pubs_stats_total', dbName);
}

module.exports = {
  fetchAndSendHourlyPubs,
  fetchAndSendDailyPubs,
  fetchAndSendWeeklyPubs,
  fetchAndSendMonthlyPubs,
  fetchAndSendTotalPubs
};
