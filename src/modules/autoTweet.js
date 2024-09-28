require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');
const mysql = require('mysql');
const { getCoinPrice, getCoinCap, getCoinVolume } = require('./getCoinPrice.js');
const { fetchDateTotalPubs, KnowledgeAssetsOverTime } = require('./networkStats.js');
const { Readable } = require('stream');

function bufferToStream(buffer) {
  const stream = new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    }
  });
   
  return stream;
}

const pool = mysql.createPool({
  connectionLimit : 10,
  host            : process.env.DBHOST,
  user            : process.env.DBUSER,
  password        : process.env.DBPASSWORD,
  database        : process.env.DKG_DB
});

const connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.DKG_DB,
});

function switchDatabase(dbName) {
return new Promise((resolve, reject) => {
    pool.config.connectionConfig.database = dbName;
    resolve();
});
}

function query(sql, args) {
  return new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
          if (err) {
              reject(err);
          } else {
              connection.query(sql, args, (error, results) => {
                  // Always release the connection to the pool after use
                  connection.release();
                  if (error) reject(error);
                  else resolve(results);
              });
          }
      });
  });
}

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_CONSUMER_KEY,
  appSecret: process.env.TWITTER_CONSUMER_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN_KEY,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

const rwClient = twitterClient.readWrite;

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
  await switchDatabase(process.env.DKG_DB);
  const recordStats = await getRecordStats();

let message = "== DKG Record Statistics \u{1F3C6} ==\n\n";

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

async function fetchNetworkStatistics() {
  await switchDatabase(process.env.DKG_DB);
  const pubStats = await query('SELECT * FROM v_pubs_stats_total;');
  const nodeStats = await query('SELECT ROUND(AVG(nodeAsk), 3) AS avgNodeAsk, SUM(nodeStake) AS totalNodeStake, COUNT(*) AS totalNodes FROM v_nodes WHERE nodeStake >= 50000');
  const symbol = 'TRAC';
  const price = await getCoinPrice(symbol);
  const marketCap = await getCoinCap(symbol);
  const volume = await getCoinVolume(symbol);

  const totalNodes = Number(nodeStats[0].totalNodes);
  const totalNodeStake = Number(nodeStats[0].totalNodeStake);
  const totalTracSpent = Number(pubStats[0].totalTracSpent);

  const totalNodeStakeUsd = (price * totalNodeStake).toFixed(2);
  const totalTracSpentUsd = (price * totalTracSpent).toFixed(2);

  return {
      totalNodes,
      totalNodeStake,
      totalTracSpent,
      totalNodeStakeUsd,
      totalTracSpentUsd,
      price,
      marketCap,
      volume
  };
}

async function fetchPeriodStats(period) {
  await switchDatabase(process.env.DKG_DB);
  let sql;
  switch (period) {
      case 'daily':
          sql = 'SELECT datetime, avgPubSize / 1024 AS avgPubSize, avgEpochsNumber, avgPubPrice, avgBid, totalPubs, totalTracSpent, privatePubsPercentage FROM v_pubs_stats_last24h';
          break;
      case 'weekly':
          sql = 'SELECT datetime, avgPubSize / 1024 AS avgPubSize, avgEpochsNumber, avgPubPrice, avgBid, totalPubs, totalTracSpent, privatePubsPercentage FROM v_pubs_stats_last7d';
          break;
      case 'monthly':
          sql = 'SELECT datetime, avgPubSize / 1024 AS avgPubSize, avgEpochsNumber, avgPubPrice, avgBid, totalPubs, totalTracSpent, privatePubsPercentage FROM v_pubs_stats_last30d';
          break;
      default:
          throw new Error('Invalid period');
  }

  return new Promise((resolve, reject) => {
      connection.query(sql, (error, results) => {
          if (error) {
              reject(error);
          } else {
              resolve(results[0]);
          }
      });
  });
}

async function postStatistics(period) {
  await switchDatabase(process.env.DKG_DB);
  try {
      const networkStats = await fetchNetworkStatistics();

      const periodStats = await fetchPeriodStats(period);

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

      const totalPubs = periodStats.totalPubs.toLocaleString('en-US', { maximumFractionDigits: 0 });
      const totalTracSpent = parseInt(periodStats.totalTracSpent);
      const usdValue = (networkStats.price * totalTracSpent).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

      const periodTracSpentFormatted = formatNumber(totalTracSpent);
      const periodTracSpentUsdFormatted = formatCurrency(Number((networkStats.price * totalTracSpent).toFixed(2)));
      const totalTracSpentFormatted = formatNumber(networkStats.totalTracSpent);
      const totalTracSpentUsdFormatted = formatCurrency(Number(networkStats.totalTracSpentUsd));
      const tvl = networkStats.totalNodeStake + networkStats.totalTracSpent;
      const tvlUsd = Number(networkStats.totalNodeStakeUsd) + Number(networkStats.totalTracSpentUsd);
      const tvlFormatted = formatNumber(tvl);
      const tvlUsdFormatted = formatCurrency(tvlUsd);
      const marketCapFormatted = formatCurrency(networkStats.marketCap);
      const volumeFormatted = formatCurrency(networkStats.volume);
      const totalNodesFormatted = formatNumber(networkStats.totalNodes);

      const message = `== ${period.charAt(0).toUpperCase() + period.slice(1)} $TRAC Stats 📈 ==
💎Assets created: ${totalPubs}
💵TRAC spent ${period === 'daily' ? '24H' : period === 'weekly' ? '7D' : '30D'}: ${periodTracSpentFormatted} ($${periodTracSpentUsdFormatted})
💰TRAC spent total: ${totalTracSpentFormatted} ($${totalTracSpentUsdFormatted})
🥩TVL: ${tvlFormatted} ($${tvlUsdFormatted})
💻Active nodes: ${totalNodesFormatted}
⚖️Mcap: $${marketCapFormatted} | 👥Volume: $${volumeFormatted}\n
💰 ${usdValue} has entered the @origin_trail DKG ecosystem in the last ${period === 'daily' ? '24H' : period === 'weekly' ? '7D' : '30D'}!`;

      console.log(message);
      return message;
  } catch (error) {
      console.error('Error generating statistics message:', error);
      return null;
  }
}

async function postNetworkStatistics() {
  await switchDatabase(process.env.DKG_DB);
  const pubStats = await query('SELECT * FROM v_pubs_stats_total;');
  const nodeStats = await query('SELECT ROUND(AVG(nodeAsk), 3) AS avgNodeAsk, SUM(nodeStake) AS totalNodeStake, COUNT(*) AS totalNodes FROM v_nodes WHERE nodeStake >= 50000');
  const dailyStats = await query('SELECT * FROM v_pubs_stats_last24h');
  
  const dailyTracSpent = Number(dailyStats[0].totalTracSpent);
  const avgEpochsNumber = Number(dailyStats[0].avgEpochsNumber);
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
  
  return {
      avgEpochsNumber,
      dailyTracSpent,
      dailyTracSpentFormatted,
      dailyTracSpentUsdFormatted,
      totalTracSpent,
      totalTracSpentFormatted,
      totalTracSpentUsdFormatted,
      tvlFormatted,
      tvlUsdFormatted,
      totalNodesFormatted,
      marketCapFormatted,
      volumeFormatted
  };
  }

const chainNameMap = {
    [process.env.DKG_DB]: "🌐 Overall Statistics 🌐",
    [process.env.OTP_DB]: "⬛️ NeuroWeb AI Parachain ⬛️",
    [process.env.GNO_DB]: "🟩 Gnosis Chain 🟩",
    [process.env.BASE_DB]: "🟦 Base Chain 🟦"
};
 
async function gatherAndDisplayChainStatsWithImage() {
  const message = await gatherAndDisplayChainStats();

  if (!message) return null;

  try {
    const data = await fetchDateTotalPubs();
    const dates = data.map(row => new Date(row.date));
    const totalPubsValues = data.map(row => row.totalPubs);
    const imageBuffer = await KnowledgeAssetsOverTime(dates, totalPubsValues);

    // Upload the media to Twitter
    const mediaId = await rwClient.v1.uploadMedia(imageBuffer, { mimeType: 'image/png' });
    // Post the tweet with media
    const tweet = await rwClient.v2.tweet({
      text: message,
      media: { media_ids: [mediaId] }
    });

    console.log('Successfully tweeted with image:', tweet.text);
    return message;

  } catch (error) {
    console.error('Error in gatherAndDisplayChainStatsWithImage:', error);
    return null;
  }
}

async function gatherAndDisplayChainStats() {
  const chains = [process.env.DKG_DB, process.env.OTP_DB, process.env.GNO_DB, process.env.BASE_DB];
  const stats = {};

  for (const dbName of chains) {
      if (!dbName) {
          console.log(`Environment variable for chain ${dbName} not set.`);
          continue;
      }

      try {
          await switchDatabase(dbName);

          const pubsStats = await query('SELECT * FROM v_pubs_stats_last24h;');
          const nodeStats = await query(`
              SELECT 
                  ROUND(AVG(nodeAsk), 3) AS avgNodeAsk, 
                  SUM(nodeStake) AS totalNodeStake, 
                  COUNT(*) AS totalNodes 
              FROM v_nodes 
              WHERE nodeStake >= 50000;
          `);
          const totalTracSpentStats = await query('SELECT SUM(totalTracSpent) as totalTracSpent FROM v_pubs_stats_total;');
          const totalPubsStats = await query('SELECT totalPubs FROM v_pubs_stats_total;');

          stats[dbName] = {
              pubs24h: pubsStats[0],
              nodes: nodeStats[0],
              totalPubs: totalPubsStats[0],
              totalTracSpent: totalTracSpentStats[0].totalTracSpent
          };

      } catch (error) {
          console.error(`Failed to fetch stats for database ${dbName}:`, error);
      }
  }

  const formatNumber = (number) => {
    if (number >= 1_000_000) {
        const value = number / 1_000_000;
        return value % 1 === 0 ? `${value}M` : `${value.toFixed(0)}M`;
    } else if (number >= 1_000) {
        const value = number / 1_000;
        return value % 1 === 0 ? `${value}K` : `${value.toFixed(1)}K`;
    } else if (number > 1) {
        return number.toFixed(0);
    } else {
        return number.toFixed(2);
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

      const symbol = 'TRAC';
      const price = await getCoinPrice(symbol);
      const marketCap = await getCoinCap(symbol);
      const volume = await getCoinVolume(symbol);
      const marketCapFormatted = formatCurrency(marketCap);
      const volumeFormatted = formatCurrency(volume);
      const networkStats = await postNetworkStatistics();
      const tracDailyValue = networkStats.dailyTracSpent;
      const avgEpochsNumber = networkStats.avgEpochsNumber;
      const tracYearlyValue = formatNumber(tracDailyValue * 365);
      const tracDailyUsdValue = formatCurrency(price * tracDailyValue);
      const tracYearlyUsdValue = formatCurrency(price * tracDailyValue * 365);
      
  let message = "== Daily $TRAC Overview 📊 ==\n\n";

  for (const [dbName, chainStats] of Object.entries(stats)) {
      const { pubs24h, nodes, totalPubs, totalTracSpent  } = chainStats;
      const chainDisplayName = chainNameMap[dbName] || dbName; // Use dbName if no mapping exists
      const price = await getCoinPrice('TRAC');
      const tvlUsdFormatted = formatCurrency(price * nodes.totalNodeStake);
      const tvlFormatted = formatNumber(nodes.totalNodeStake);
      
      message += `${chainDisplayName}\n`;
      message += `⚙ Nodes: ${nodes.totalNodes}\n`;
      message += `🔒 TVL: ${tvlFormatted} TRAC ($${tvlUsdFormatted})\n`;
      message += `💎 Assets (24H/all): ${formatNumber(pubs24h.totalPubs)} / ${formatNumber(totalPubs.totalPubs)}\n`;
      message += `💰 TRAC spent (24H/all): ${formatNumber(pubs24h.totalTracSpent)} / ${formatNumber(totalTracSpent)}\n\n`;
    }
     
    message += `🪙 Price: $${price} | Volume: $${volumeFormatted}\n`,
    message += `⚖️ Total Supply: 500M | Mcap: $${marketCapFormatted}\n`,
    message += `\n📈 In the last 24H, ${formatNumber(tracDailyValue)} $TRAC ($${tracDailyUsdValue}), equivalent to ${tracYearlyValue} TRAC ($${tracYearlyUsdValue}) yearly, was locked for utility for an average of ${(avgEpochsNumber * 90).toFixed(0)} days!\n`;
    message += "\n👉 Brought to you by OTHub.io 👈";
    
  return message;
}

// TEST FUNCTIONS ABOVE
// gatherAndDisplayChainStats().then(msg => console.log(msg)).catch(err => console.error('Error:', err));

// const ctx = { reply: (message) => console.log(message) }; // Mock a context for testing
// fetchAndSendRecordStats(ctx).then(() => console.log('Test completed')).catch(err => console.error('Error:', err));

// fetchNetworkStatistics().then(stats => {
//   console.log(stats);
// }).catch(err => console.error('Error:', err));

// const periods = ['daily', 'weekly', 'monthly'];
// for (let period of periods) {
//     fetchPeriodStats(period).then(stats => console.log(`${period} stats:`, stats)).catch(err => console.error('Error:', err));
// }

// postStatistics('daily').then(message => console.log(message)).catch(err => console.error('Error:', err));

// postNetworkStatistics().then(data => {
//   console.log('Network Stats:', data);
// }).catch(err => console.error('Error:', err));

  module.exports = {
    gatherAndDisplayChainStats,
    gatherAndDisplayChainStatsWithImage,
    postTweet,
    postStatistics,
    fetchAndSendRecordStats,
    getRecordStats,
    postNetworkStatistics
  };