require('dotenv').config();
const mysql = require('mysql');

const pool = mysql.createPool({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.DKG_DB,
});

function getLastHourStats() {
  return new Promise((resolve, reject) => {
    pool.query(`SELECT datetime, avgPubSize / 1024 AS avgPubSize, avgEpochsNumber, avgPubPrice, avgBid, totalPubs, totalTracSpent, privatePubsPercentage FROM v_pubs_stats_last1h`, (error, results) => {
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
    pool.query(`SELECT datetime, avgPubSize / 1024 AS avgPubSize, avgEpochsNumber, avgPubPrice, avgBid, totalPubs, totalTracSpent, privatePubsPercentage FROM v_pubs_stats_last24h`, (error, results) => {
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
    pool.query(`SELECT datetime, avgPubSize / 1024 AS avgPubSize, avgEpochsNumber, avgPubPrice, avgBid, totalPubs, totalTracSpent, privatePubsPercentage FROM v_pubs_stats_last7d`, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results[0]);
      }
    });
  });
}

function getLastMonthStats() {
  return new Promise((resolve, reject) => {
    pool.query(`SELECT datetime, avgPubSize / 1024 AS avgPubSize, avgEpochsNumber, avgPubPrice, avgBid, totalPubs, totalTracSpent, privatePubsPercentage FROM v_pubs_stats_last30d`, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results[0]);
      }
    });
  });
}

function getTotalStats() {
  return new Promise((resolve, reject) => {
    pool.query(`SELECT * FROM v_pubs_stats_total`, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results[0]);
      }
    });
  });
}

function getRecordStats() {
  return new Promise((resolve, reject) => {
    pool.query(`SELECT * FROM v_pubs_stats_records`, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

async function fetchAndSendRecordStats(ctx) {
  const recordStats = await getRecordStats();
  
  let message = "== DKG Record Statistics \u{1F3C6} ==\n\n";
  
  // Create an object to store the formatted records
  let formattedRecords = {
    'Top TRAC spent (hour)': '',
    'Top TRAC spent (day)': '',
    'Top assets published (hour)': '',
    'Top assets published (day)': ''
  };
  
  recordStats.forEach(record => {
    const date = new Date(record.datetime).toISOString().split('T')[0];
    const time = new Date(record.datetime).toISOString().split('T')[1].slice(0, 5);
    const value = record.value.toLocaleString();
    
    let key;
    if (record.event === 'top_trac_spent') {
      key = `Top TRAC spent (${record.timeResolution})`;
    } else if (record.event === 'top_assets_published') {
      key = `Top assets published (${record.timeResolution})`;
    }
    
    if (key) {
      if (record.timeResolution === 'hour') {
        formattedRecords[key] = `${value} on ${date} at ${time}`;
      } else {
        formattedRecords[key] = `${value} on ${date}`;
      }
    }
  });
  
  // Add the formatted records to the message in the desired order with line breaks
  message += `💰 Top TRAC spent (hour):\n${formattedRecords['Top TRAC spent (hour)']}\n\n`;
  message += `💰 Top TRAC spent (day):\n${formattedRecords['Top TRAC spent (day)']}\n\n`;
  message += `📊 Top assets published (hour):\n${formattedRecords['Top assets published (hour)']}\n\n`;
  message += `📊 Top assets published (day):\n${formattedRecords['Top assets published (day)']}`;
  
  await ctx.reply(message);
}


async function fetchAndSendHourlyPubs(ctx) {
  const lastHourStats = await getLastHourStats();

  const totalPubs = lastHourStats.totalPubs;
  const totalTracSpent = parseInt(lastHourStats.totalTracSpent);
  const avgPubPrice = parseFloat(lastHourStats.avgPubPrice).toFixed(2);
  const avgPubSize = parseFloat(lastHourStats.avgPubSize).toFixed(2);
  const avgBid = parseFloat(lastHourStats.avgBid).toFixed(2);
  const avgEpochs = Math.round(lastHourStats.avgEpochsNumber);
  const privatePubsPercentage = parseInt(lastHourStats.privatePubsPercentage);

  let totalPubsEmoji = totalPubs > 900 ? '🚀' : totalPubs >= 700 ? '✈️' : totalPubs >= 500 ? '🚁' : totalPubs >= 300 ? '🎈' : '☠️';
  let totalTracSpentEmoji = totalTracSpent > 125 ? '🤑' : totalTracSpent >= 100 ? '💰' : totalTracSpent >= 75 ? '💸' : totalTracSpent >= 50 ? '💵' : '🪙';
  let avgPubPriceEmoji = avgPubPrice > 0.2 ? '😃' : avgPubPrice >= 0.1 ? '🙂' : avgPubPrice >= 0.05 ? '😐' : avgPubPrice >= 0.025 ? '🤕' : '🤮';
  let avgPubSizeEmoji = avgPubSize > 4 ? '🐳' : avgPubSize >= 3 ? '🐋' : avgPubSize >= 2 ? '🦭' : avgPubSize >= 1 ? '🐡' : '🐟';

  const message = `== Last Hour \u{1F4CA} ==
${totalPubsEmoji}Total pubs: ${totalPubs}
${totalTracSpentEmoji}TRAC spent: ${totalTracSpent}
${avgPubSizeEmoji}Size: ${avgPubSize}kB
${avgPubPriceEmoji}Pub price: ${avgPubPrice}
⚖️Bid: ${avgBid}
⏰Epochs: ${avgEpochs}
👀Private Pubs: ${privatePubsPercentage}%`;

  await ctx.reply(message);
}

async function fetchAndSendDailyPubs(ctx) {
  const last24HourStats = await getLast24HourStats();
  const totalPubs = last24HourStats.totalPubs;
  const totalTracSpent = parseInt(last24HourStats.totalTracSpent);
  const avgPubPrice = parseFloat(last24HourStats.avgPubPrice).toFixed(2);
  const avgPubSize = parseFloat(last24HourStats.avgPubSize).toFixed(2);
  const avgBid = parseFloat(last24HourStats.avgBid).toFixed(2);
  const avgEpochs = Math.round(last24HourStats.avgEpochsNumber);
  const privatePubsPercentage = parseInt(last24HourStats.privatePubsPercentage);

  let totalPubsEmoji = totalPubs > 20000 ? '🚀' : totalPubs >= 15000 ? '✈️' : totalPubs >= 10000 ? '🚁' : totalPubs >= 5000 ? '🎈' : '☠️';
  let totalTracSpentEmoji = totalTracSpent > 3000 ? '🤑' : totalTracSpent >= 2400 ? '💰' : totalTracSpent >= 1800 ? '💸' : totalTracSpent >= 1200 ? '💵' : '🪙';
  let avgPubPriceEmoji = avgPubPrice > 0.2 ? '😃' : avgPubPrice >= 0.1 ? '🙂' : avgPubPrice >= 0.05 ? '😐' : avgPubPrice >= 0.025 ? '🤕' : '🤮';
  let avgPubSizeEmoji = avgPubSize > 4 ? '🐳' : avgPubSize >= 3 ? '🐋' : avgPubSize >= 2 ? '🦭' : avgPubSize >= 1 ? '🐡' : '🐟';

  const message = `== Last 24H \u{1F4CA} ==
${totalPubsEmoji}Total pubs: ${totalPubs}
${totalTracSpentEmoji}TRAC spent: ${totalTracSpent}
${avgPubSizeEmoji}Size: ${avgPubSize}kB
${avgPubPriceEmoji}Pub price: ${avgPubPrice}
⚖️Bid: ${avgBid}
⏰Epochs: ${avgEpochs}
👀Private Pubs: ${privatePubsPercentage}%`;

  await ctx.reply(message);
}

async function fetchAndSendWeeklyPubs(ctx) {
  const lastWeekStats = await getLastWeekStats();
  const totalPubs = lastWeekStats.totalPubs;
  const totalTracSpent = parseInt(lastWeekStats.totalTracSpent);
  const avgPubPrice = parseFloat(lastWeekStats.avgPubPrice).toFixed(2);
  const avgPubSize = parseFloat(lastWeekStats.avgPubSize).toFixed(2);
  const avgBid = parseFloat(lastWeekStats.avgBid).toFixed(2);
  const avgEpochs = Math.round(lastWeekStats.avgEpochsNumber);
  const privatePubsPercentage = parseInt(lastWeekStats.privatePubsPercentage);

  let totalPubsEmoji = totalPubs > 140000 ? '🚀' : totalPubs >= 105000 ? '✈️' : totalPubs >= 70000 ? '🚁' : totalPubs >= 35000 ? '🎈' : '☠️';
  let totalTracSpentEmoji = totalTracSpent > 21000 ? '🤑' : totalTracSpent >= 16800 ? '💰' : totalTracSpent >= 12600 ? '💸' : totalTracSpent >= 8400 ? '💵' : '🪙';
  let avgPubPriceEmoji = avgPubPrice > 0.2 ? '😃' : avgPubPrice >= 0.1 ? '🙂' : avgPubPrice >= 0.05 ? '😐' : avgPubPrice >= 0.025 ? '🤕' : '🤮';
  let avgPubSizeEmoji = avgPubSize > 4 ? '🐳' : avgPubSize >= 3 ? '🐋' : avgPubSize >= 2 ? '🦭' : avgPubSize >= 1 ? '🐡' : '🐟';

  const message = `== Last Week \u{1F4CA} ==
${totalPubsEmoji}Total pubs: ${totalPubs}
${totalTracSpentEmoji}TRAC spent: ${totalTracSpent}
${avgPubSizeEmoji}Size: ${avgPubSize}kB
${avgPubPriceEmoji}Pub price: ${avgPubPrice}
⚖️Bid: ${avgBid}
⏰Epochs: ${avgEpochs}
👀Private Pubs: ${privatePubsPercentage}%`;

  await ctx.reply(message);
}

async function fetchAndSendMonthlyPubs(ctx) {
  const lastMonthStats = await getLastMonthStats();
  const totalPubs = lastMonthStats.totalPubs;
  const totalTracSpent = parseInt(lastMonthStats.totalTracSpent);
  const avgPubPrice = parseFloat(lastMonthStats.avgPubPrice).toFixed(2);
  const avgPubSize = parseFloat(lastMonthStats.avgPubSize).toFixed(2);
  const avgBid = parseFloat(lastMonthStats.avgBid).toFixed(2);
  const avgEpochs = Math.round(lastMonthStats.avgEpochsNumber);
  const privatePubsPercentage = parseInt(lastMonthStats.privatePubsPercentage);

  let totalPubsEmoji = totalPubs > 600000 ? '🚀' : totalPubs >= 450000 ? '✈️' : totalPubs >= 300000 ? '🚁' : totalPubs >= 150000 ? '🎈' : '☠️';
  let totalTracSpentEmoji = totalTracSpent > 90000 ? '🤑' : totalTracSpent >= 72000 ? '💰' : totalTracSpent >= 54000 ? '💸' : totalTracSpent >= 36000 ? '💵' : '🪙';
  let avgPubPriceEmoji = avgPubPrice > 0.2 ? '😃' : avgPubPrice >= 0.1 ? '🙂' : avgPubPrice >= 0.05 ? '😐' : avgPubPrice >= 0.025 ? '🤕' : '🤮';
  let avgPubSizeEmoji = avgPubSize > 4 ? '🐳' : avgPubSize >= 3 ? '🐋' : avgPubSize >= 2 ? '🦭' : avgPubSize >= 1 ? '🐡' : '🐟';

  const message = `== Last Month \u{1F4CA} ==
${totalPubsEmoji}Total pubs: ${totalPubs}
${totalTracSpentEmoji}TRAC spent: ${totalTracSpent}
${avgPubSizeEmoji}Size: ${avgPubSize}kB
${avgPubPriceEmoji}Pub price: ${avgPubPrice}
⚖️Bid: ${avgBid}
⏰Epochs: ${avgEpochs}
👀Private Pubs: ${privatePubsPercentage}%`;

  await ctx.reply(message);
}

async function fetchAndSendTotalPubs(ctx) {
  const TotalStats = await getTotalStats();
  const totalPubs = TotalStats.totalPubs;
  const totalTracSpent = parseInt(TotalStats.totalTracSpent);
  const avgPubPrice = parseFloat(TotalStats.avgPubPrice).toFixed(2);
  const avgPubSize = parseFloat(TotalStats.avgPubSize).toFixed(2);
  const avgBid = parseFloat(TotalStats.avgBid).toFixed(2);
  const avgEpochs = Math.round(TotalStats.avgEpochsNumber);
  const privatePubsPercentage = TotalStats.privatePubsPercentage;

  let totalPubsEmoji = totalPubs > 700000 ? '🚀' : totalPubs >= 600000 ? '✈️' : totalPubs >= 500000 ? '🚁' : totalPubs >= 400000 ? '🎈' : '☠️';
  let totalTracSpentEmoji = totalTracSpent > 800000 ? '🤑' : totalTracSpent >= 700000 ? '💰' : totalTracSpent >= 600000 ? '💸' : totalTracSpent >= 500000 ? '💵' : '🪙';
  let avgPubPriceEmoji = avgPubPrice > 0.2 ? '😃' : avgPubPrice >= 0.1 ? '🙂' : avgPubPrice >= 0.05 ? '😐' : avgPubPrice >= 0.025 ? '🤕' : '🤮';
  let avgPubSizeEmoji = avgPubSize > 4 ? '🐳' : avgPubSize >= 3 ? '🐋' : avgPubSize >= 2 ? '🦭' : avgPubSize >= 1 ? '🐡' : '🐟';

  const message = `== Total Pubs \u{1F4CA} ==
${totalPubsEmoji}Total pubs: ${totalPubs}
${totalTracSpentEmoji}TRAC spent: ${totalTracSpent}
${avgPubSizeEmoji}Size: ${avgPubSize}kB
${avgPubPriceEmoji}Pub price: ${avgPubPrice}
⚖️Bid: ${avgBid}
⏰Epochs: ${avgEpochs}
👀Private Pubs: ${privatePubsPercentage}%`;

  await ctx.reply(message);
}

module.exports = {
  fetchAndSendHourlyPubs,
  fetchAndSendDailyPubs,
  fetchAndSendWeeklyPubs,
  fetchAndSendMonthlyPubs,
  fetchAndSendTotalPubs,
  fetchAndSendRecordStats
};
