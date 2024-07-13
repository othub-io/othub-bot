require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');
const mysql = require('mysql');
const { getCoinPrice, getCoinCap, getCoinVolume } = require('./getCoinPrice.js');

const connection = mysql.createConnection({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    database: process.env.DKG_DB,
});

function query(sql, args) {
  return new Promise((resolve, reject) => {
    connection.query(sql, args, (error, rows) => {
      if (error) return reject(error);
      resolve(rows);
    });
  });
}

const client = new TwitterApi({
    appKey: process.env.TWITTER_CONSUMER_KEY,
    appSecret: process.env.TWITTER_CONSUMER_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN_KEY,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET
  });
  
const bearer = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);

const twitterClient = client.readWrite;

async function postTweet(message) {
    try {
        const { data: createdTweet } = await twitterClient.v2.tweet({ text: message });
        console.log('===\nTweet', createdTweet.id, 'posted :\n', createdTweet.text, '\n===');
    } catch (error) {
        console.error('Error posting tweet:', error);
    }
}

function getRecordStats() {
    return new Promise((resolve, reject) => {
      connection.query(`SELECT * FROM v_pubs_stats_records`, (error, results) => {
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

async function postNetworkStatistics() {
const pubStats = await query('SELECT * FROM v_pubs_stats_total;');
const nodeStats = await query('SELECT ROUND(AVG(nodeAsk), 3) AS avgNodeAsk, SUM(nodeStake) AS totalNodeStake, COUNT(*) AS totalNodes FROM v_nodes WHERE nodeStake >= 50000');
const dailyStats = await query('SELECT totalTracSpent FROM v_pubs_stats_last24h');

const dailyTracSpent = Number(dailyStats[0].totalTracSpent);
const totalTracSpent = Number(pubStats[0].totalTracSpent);
const totalNodes = Number(nodeStats[0].totalNodes);
const totalNodeStake = Number(nodeStats[0].totalNodeStake);

const symbol = 'TRAC';
const price = await getCoinPrice(symbol);
const marketCap = await getCoinCap(symbol);
const volume = await getCoinVolume(symbol);
const totalNodeStakeUsd = (price * totalNodeStake).toFixed(2);
const totalTracSpentUsd = (price * totalTracSpent).toFixed(2);
const dailyTracSpentUsd = (price * dailyTracSpent).toFixed(2);

const formatNumber = (number) => {
    if (number >= 1_000_000) {
    const value = number / 1_000_000;
    return value % 1 === 0 ? `${value}M` : `${value.toFixed(1)}M`;
    } else if (number >= 1_000) {
    const value = number / 1_000;
    return value % 1 === 0 ? `${value}K` : `${value.toFixed(1)}K`;
    } else {
    return number.toString();
    }
};

const formatCurrency = (number) => {
    if (number >= 1_000_000) {
    const value = number / 1_000_000;
    return value % 1 === 0 ? `${value}M` : `${value.toFixed(1)}M`;
    } else if (number >= 1_000) {
    const value = number / 1_000;
    return value % 1 === 0 ? `${value}K` : `${value.toFixed(1)}K`;
    } else {
    return number.toFixed(1);
    }
};

const totalNodesFormatted = formatNumber(totalNodes);
const tvl = totalNodeStake + totalTracSpent;
const tvlUsd = Number(totalNodeStakeUsd) + Number(totalTracSpentUsd);
const dailyTracSpentFormatted = formatNumber(dailyTracSpent);
const dailyTracSpentUsdFormatted = formatCurrency(Number(dailyTracSpentUsd));
const totalTracSpentFormatted = formatNumber(totalTracSpent);
const totalTracSpentUsdFormatted = formatCurrency(Number(totalTracSpentUsd));
const tvlFormatted = formatNumber(tvl);
const tvlUsdFormatted = formatCurrency(tvlUsd);
const marketCapFormatted = formatCurrency(marketCap);
const volumeFormatted = formatCurrency(volume);

const message = `== Network Stats 📊 ==
💻Active nodes: ${totalNodesFormatted}
🥩TVL: ${tvlFormatted} ($${tvlUsdFormatted})
💵TRAC spent 24H: ${dailyTracSpentFormatted} ($${dailyTracSpentUsdFormatted})
💰TRAC spent total: ${totalTracSpentFormatted} ($${totalTracSpentUsdFormatted})
⚖️Mcap: $${marketCapFormatted} | Volume: $${volumeFormatted}`;

return {
    dailyTracSpentFormatted,
    dailyTracSpentUsdFormatted,
    totalTracSpentFormatted,
    totalTracSpentUsdFormatted,
    tvlFormatted,
    tvlUsdFormatted,
    totalNodesFormatted,
    marketCapFormatted,
    volumeFormatted
};
}

function getLast24HourStats() {
    return new Promise((resolve, reject) => {
      connection.query(`SELECT datetime, avgPubSize / 1024 AS avgPubSize, avgEpochsNumber, avgPubPrice, avgBid, totalPubs, totalTracSpent, privatePubsPercentage FROM v_pubs_stats_last24h`, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results[0]);
        }
      });
    });
  }
  
  async function postDailyStatistics() {
    try {
      const networkStats = await postNetworkStatistics();
      const last24HourStats = await getLast24HourStats();
      const totalPubs = last24HourStats.totalPubs;
      const totalTracSpent = parseInt(last24HourStats.totalTracSpent);
      const avgPubSize = parseFloat(last24HourStats.avgPubSize).toFixed(2);

      const message = `== Daily $TRAC Record 📈 ==
💎Assets created: ${totalPubs}
⚖️Avg size: ${avgPubSize}kB
💵TRAC spent 24H: ${networkStats.dailyTracSpentFormatted}
💰TRAC spent total: ${networkStats.totalTracSpentFormatted} ($${networkStats.totalTracSpentUsdFormatted})
🥩TVL: ${networkStats.tvlFormatted} ($${networkStats.tvlUsdFormatted})
💻Active nodes: ${networkStats.totalNodesFormatted}
⚖️Mcap: $${networkStats.marketCapFormatted} | 👥Volume: $${networkStats.volumeFormatted}`;
//💵TRAC spent 24H: ${networkStats.dailyTracSpentFormatted} ($${networkStats.dailyTracSpentUsdFormatted})
      const symbol = 'TRAC';
      const price = await getCoinPrice(symbol);
      const usdValue = (price * totalTracSpent).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  
      const tweetMessage = `${message}\n\n💰 ${usdValue} has entered the @origin_trail DKG ecosystem in the last 24H!`;
      console.log(tweetMessage);
      await postTweet(tweetMessage);
    } catch (error) {
      console.error('Error posting daily publication stats:', error);
    }
  }

// postNetworkStatistics().then(message => {
//       console.log(message);
// });
  
  module.exports = {
    postTweet,
    postNetworkStatistics,
    postDailyStatistics,
    fetchAndSendRecordStats,
    getRecordStats
  };
  