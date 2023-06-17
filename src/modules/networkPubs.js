require('dotenv').config();
const mysql = require('mysql');

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DBHOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.SYNC_DB,
});

// Function to retrieve the last row from the v_pubs_stats_last1h table
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

// Function to retrieve the last row from the v_pubs_stats_last24h table
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

// Function to fetch and send hourly pubs data
async function fetchAndSendHourlyPubs(ctx) {
    try {
      // Delete the command message
      await ctx.deleteMessage();
  
      // Retrieve the last row from the v_pubs_stats_last1h table
      const lastHourStats = await getLastHourStats();
  
      // Extract the desired fields from the last row
      const totalPubs = lastHourStats.totalPubs;
      const totalTracSpent = parseInt(lastHourStats.totalTracSpent);
      const avgPubPrice = parseFloat(lastHourStats.avgPubPrice).toFixed(2);
      const avgBid = parseFloat(lastHourStats.avgBid).toFixed(3);
      const avgEpochs = parseInt(lastHourStats.avgEpochsNumber);
  
      // Generate the formatted message
      const message = `Hourly Stats\nTotal pubs: ${totalPubs}\nTRAC spent: ${totalTracSpent}\nPub price: ${avgPubPrice}\nBid: ${avgBid}\nEpochs: ${avgEpochs}`;
  
      // Send the message as a reply
      ctx.reply(message);
    } catch (error) {
      console.error('An error occurred:', error);
      ctx.reply('An error occurred while retrieving hourly pubs statistics.');
    }
  }
  
  // Function to fetch and send daily pubs data
  async function fetchAndSendDailyPubs(ctx) {
    try {
      // Delete the command message
      await ctx.deleteMessage();
  
      // Retrieve the last row from the v_pubs_stats_last24h table
      const last24HourStats = await getLast24HourStats();
  
      // Extract the desired fields from the last row
      const totalPubs = last24HourStats.totalPubs;
      const totalTracSpent = parseInt(last24HourStats.totalTracSpent);
      const avgPubPrice = parseFloat(last24HourStats.avgPubPrice).toFixed(2);
      const avgBid = parseFloat(last24HourStats.avgBid).toFixed(3);
      const avgEpochs = parseInt(last24HourStats.avgEpochsNumber);
  
      // Generate the formatted message
      const message = `Daily Stats\nTotal pubs: ${totalPubs}\nTRAC spent: ${totalTracSpent}\nPub price: ${avgPubPrice}\nBid: ${avgBid}\nEpochs: ${avgEpochs}`;
  
      // Send the message as a reply
      ctx.reply(message);
    } catch (error) {
      console.error('An error occurred:', error);
      ctx.reply('An error occurred while retrieving daily pubs statistics.');
    }
  }
  

module.exports = {
  fetchAndSendHourlyPubs,
  fetchAndSendDailyPubs,
};
