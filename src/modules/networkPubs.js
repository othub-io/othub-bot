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

    const message = `Last Hour Stats\nTotal pubs: ${totalPubs}\nTRAC spent: ${totalTracSpent}\nPub price: ${avgPubPrice}\nBid: ${avgBid}\nEpochs: ${avgEpochs}`;

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

    const message = `Last Day Stats\nTotal pubs: ${totalPubs}\nTRAC spent: ${totalTracSpent}\nPub price: ${avgPubPrice}\nBid: ${avgBid}\nEpochs: ${avgEpochs}`;

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

    const message = `Last 7 Days Stats\nTotal pubs: ${totalPubs}\nTRAC spent: ${totalTracSpent}\nPub price: ${avgPubPrice}\nBid: ${avgBid}\nEpochs: ${avgEpochs}`;

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

    const message = `Last 30 Days Stats\nTotal pubs: ${totalPubs}\nTRAC spent: ${totalTracSpent}\nPub price: ${avgPubPrice}\nBid: ${avgBid}\nEpochs: ${avgEpochs}`;

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
