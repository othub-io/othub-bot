require('dotenv').config();
const mysql = require('mysql');

const pool = mysql.createPool({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
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

function getLastMonthStats() {
  return new Promise((resolve, reject) => {
    pool.query('SELECT * FROM v_pubs_stats_last30d', (error, results) => {
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
    setTimeout(async () => {
      try {
        await ctx.deleteMessage();
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }, process.env.DELETE_TIMER);

    const lastHourStats = await getLastHourStats();

    const totalPubs = lastHourStats.totalPubs;
    const totalTracSpent = parseInt(lastHourStats.totalTracSpent);
    const avgPubPrice = parseFloat(lastHourStats.avgPubPrice).toFixed(2);
    const avgBid = parseFloat(lastHourStats.avgBid).toFixed(2);
    const avgEpochs = parseInt(lastHourStats.avgEpochsNumber);

    let totalPubsEmoji = totalPubs > 100 ? '🚀' : totalPubs >= 75 ? '✈️' : totalPubs >= 50 ? '🚁' : totalPubs >= 25 ? '🎈' : '☠️';
    let totalTracSpentEmoji = totalTracSpent > 400 ? '🤑' : totalTracSpent >= 300 ? '💰' : totalTracSpent >= 200 ? '💸' : totalTracSpent >= 100 ? '💵' : '🪙';
    let avgPubPriceEmoji = avgPubPrice > 4 ? '😃' : avgPubPrice >= 3 ? '🙂' : avgPubPrice >= 2 ? '😐' : avgPubPrice >= 1 ? '🤕' : '🤮';

    const message = `== Last Hour \u{1F4CA} ==
${totalPubsEmoji}Total pubs: ${totalPubs}
${totalTracSpentEmoji}TRAC spent: ${totalTracSpent}
${avgPubPriceEmoji}Pub price: ${avgPubPrice}
⚖️Bid: ${avgBid}
⏰Epochs: ${avgEpochs}`;

    return await ctx.reply(message);
  } catch (error) {
    console.error('An error occurred:', error);
    await ctx.reply('An error occurred while retrieving hourly pubs statistics.');
    return null;
  }
}

async function fetchAndSendDailyPubs(ctx) {
  try {
    setTimeout(async () => {
      try {
        await ctx.deleteMessage();
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }, process.env.DELETE_TIMER);

    const last24HourStats = await getLast24HourStats();

    const totalPubs = last24HourStats.totalPubs;
    const totalTracSpent = parseInt(last24HourStats.totalTracSpent);
    const avgPubPrice = parseFloat(last24HourStats.avgPubPrice).toFixed(2);
    const avgBid = parseFloat(last24HourStats.avgBid).toFixed(2);
    const avgEpochs = parseInt(last24HourStats.avgEpochsNumber);

    let totalPubsEmoji = totalPubs > 2400 ? '🚀' : totalPubs >= 1800 ? '✈️' : totalPubs >= 1200 ? '🚁' : totalPubs >= 600 ? '🎈' : '☠️';
    let totalTracSpentEmoji = totalTracSpent > 9600 ? '🤑' : totalTracSpent >= 7200 ? '💰' : totalTracSpent >= 4800 ? '💸' : totalTracSpent >= 2400 ? '💵' : '🪙';
    let avgPubPriceEmoji = avgPubPrice > 4 ? '😃' : avgPubPrice >= 3 ? '🙂' : avgPubPrice >= 2 ? '😐' : avgPubPrice >= 1 ? '🤕' : '🤮';

    const message = `== Last Day \u{1F4CA} ==
${totalPubsEmoji}Total pubs: ${totalPubs}
${totalTracSpentEmoji}TRAC spent: ${totalTracSpent}
${avgPubPriceEmoji}Pub price: ${avgPubPrice}
⚖️Bid: ${avgBid}
⏰Epochs: ${avgEpochs}`;

    return await ctx.reply(message);
  } catch (error) {
    console.error('An error occurred:', error);
    const botmessage = await ctx.reply('An error occurred while retrieving daily pubs statistics.');
    if (botmessage) {
      setTimeout(async () => {
        try {
          await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id)
        } catch (error) {
          console.error('Error deleting message:', error)
        }
      }, process.env.DELETE_TIMER)
    }
    return null;
  }
}

async function fetchAndSendWeeklyPubs(ctx) {
  try {
    setTimeout(async () => {
      try {
        await ctx.deleteMessage();
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }, process.env.DELETE_TIMER);

    const lastWeekStats = await getLastWeekStats();

    const totalPubs = lastWeekStats.totalPubs;
    const totalTracSpent = parseInt(lastWeekStats.totalTracSpent);
    const avgPubPrice = parseFloat(lastWeekStats.avgPubPrice).toFixed(2);
    const avgBid = parseFloat(lastWeekStats.avgBid).toFixed(2);
    const avgEpochs = parseInt(lastWeekStats.avgEpochsNumber);

    let totalPubsEmoji = totalPubs > 16800 ? '🚀' : totalPubs >= 12600 ? '✈️' : totalPubs >= 8400 ? '🚁' : totalPubs >= 4200 ? '🎈' : '☠️';
    let totalTracSpentEmoji = totalTracSpent > 67200 ? '🤑' : totalTracSpent >= 50400 ? '💰' : totalTracSpent >= 33600 ? '💸' : totalTracSpent >= 16800 ? '💵' : '🪙';
    let avgPubPriceEmoji = avgPubPrice > 4 ? '😃' : avgPubPrice >= 3 ? '🙂' : avgPubPrice >= 2 ? '😐' : avgPubPrice >= 1 ? '🤕' : '🤮';

    const message = `== Last Week \u{1F4CA} ==
${totalPubsEmoji}Total pubs: ${totalPubs}
${totalTracSpentEmoji}TRAC spent: ${totalTracSpent}
${avgPubPriceEmoji}Pub price: ${avgPubPrice}
⚖️Bid: ${avgBid}
⏰Epochs: ${avgEpochs}`;

    return await ctx.reply(message);
  } catch (error) {
    console.error('An error occurred:', error);
    const botmessage = await ctx.reply('An error occurred while retrieving weekly pubs statistics.');
    if (botmessage) {
      setTimeout(async () => {
        try {
          await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id)
        } catch (error) {
          console.error('Error deleting message:', error)
        }
      }, process.env.DELETE_TIMER)
    }
    return null;
  }
}

async function fetchAndSendMonthlyPubs(ctx) {
  try {
    setTimeout(async () => {
      try {
        await ctx.deleteMessage();
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }, process.env.DELETE_TIMER);

    const lastMonthStats = await getLastMonthStats();

    const totalPubs = lastMonthStats.totalPubs;
    const totalTracSpent = parseInt(lastMonthStats.totalTracSpent);
    const avgPubPrice = parseFloat(lastMonthStats.avgPubPrice).toFixed(2);
    const avgBid = parseFloat(lastMonthStats.avgBid).toFixed(2);
    const avgEpochs = parseInt(lastMonthStats.avgEpochsNumber);

    let totalPubsEmoji = totalPubs > 72000 ? '🚀' : totalPubs >= 54000 ? '✈️' : totalPubs >= 36000 ? '🚁' : totalPubs >= 18000 ? '🎈' : '☠️';
    let totalTracSpentEmoji = totalTracSpent > 288000 ? '🤑' : totalTracSpent >= 216000 ? '💰' : totalTracSpent >= 144000 ? '💸' : totalTracSpent >= 72000 ? '💵' : '🪙';
    let avgPubPriceEmoji = avgPubPrice > 4 ? '😃' : avgPubPrice >= 3 ? '🙂' : avgPubPrice >= 2 ? '😐' : avgPubPrice >= 1 ? '🤕' : '🤮';

    const message = `== Last Month \u{1F4CA} ==
${totalPubsEmoji}Total pubs: ${totalPubs}
${totalTracSpentEmoji}TRAC spent: ${totalTracSpent}
${avgPubPriceEmoji}Pub price: ${avgPubPrice}
⚖️Bid: ${avgBid}
⏰Epochs: ${avgEpochs}`;

    return await ctx.reply(message);
  } catch (error) {
    console.error('An error occurred:', error);
    const botmessage = await ctx.reply('An error occurred while retrieving monthly pubs statistics.');
    if (botmessage) {
      setTimeout(async () => {
        try {
          await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id)
        } catch (error) {
          console.error('Error deleting message:', error)
        }
      }, process.env.DELETE_TIMER)
    }
    return null;
  }
}

module.exports = {
  fetchAndSendHourlyPubs,
  fetchAndSendDailyPubs,
  fetchAndSendWeeklyPubs,
  fetchAndSendMonthlyPubs
};
