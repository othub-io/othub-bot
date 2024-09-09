require('dotenv').config();
const { getCoinPrice } = require('./getCoinPrice.js');
const { postTweet, postStatistics } = require('./autoTweet.js')

const CHAT_IDS = [
  //process.env.TEST_ID
  process.env.OTHUB_ID,
  //process.env.ORIGINTRAIL_ID,
  process.env.OTC_ID
];

let lastKnownRecords = {
  'top_trac_spent_hour': 0,
  'top_trac_spent_day': 0,
  'top_assets_published_hour': 0,
  'top_assets_published_day': 0
};

async function formatNewRecordMessage(record) {
  const date = new Date(record.datetime).toISOString().split('T')[0];
  const value = Number(record.value).toLocaleString();
  const symbol = 'TRAC';
  const price = await getCoinPrice(symbol);
  const usdValue = (price * Number(record.value)).toLocaleString('en-US', {style: 'currency', currency: 'USD', maximumFractionDigits: 0});

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

  // Determine the time resolution (hourly or daily) and pass it to postStatistics
  const period = record.timeResolution === 'hour' ? 'hourly' : 'daily';
  const networkStatsMessage = await postStatistics(period);

  let recordType;
  if (record.event === 'top_trac_spent') {
    recordType = `(${usdValue}) TRAC spent`;
    let annualizedNumber = (record.timeResolution === 'day')
      ? (Number(record.value) * 365 * price)
      : (Number(record.value) * 8760 * price);
    let annualizedEstimateFormatted = `$${formatCurrency(Number(annualizedNumber))}`;
    return `🚨 New $TRAC Record! 🚨
🏆 ${value} ${recordType} ${record.timeResolution}, equivalent to ${annualizedEstimateFormatted} annually!

== Network Stats 📊 ==
💻Active nodes: ${networkStatsMessage.totalNodesFormatted}
🥩TVL: ${networkStatsMessage.tvlFormatted} ($${networkStatsMessage.tvlUsdFormatted})
💵TRAC spent 24H: ${networkStatsMessage.dailyTracSpentFormatted} ($${networkStatsMessage.dailyTracSpentUsdFormatted})
💰TRAC spent total: ${networkStatsMessage.totalTracSpentFormatted} ($${networkStatsMessage.totalTracSpentUsdFormatted})
⚖️Mcap: $${networkStatsMessage.marketCapFormatted} | Volume: $${networkStatsMessage.volumeFormatted}`;
  }

  if (record.event === 'top_assets_published') {
    recordType = `assets published`;
    let annualizedNumber = (record.timeResolution === 'day')
      ? (Number(record.value) * 365)
      : (Number(record.value) * 8760);
    let annualizedEstimateFormatted = `${formatCurrency(Number(annualizedNumber))} assets`;
    return `🚨 New $TRAC Record! 🚨
🏆 ${value} ${recordType} ${record.timeResolution}, equivalent to ${annualizedEstimateFormatted} annually!

== Network Stats 📊 ==
💻Active nodes: ${networkStatsMessage.totalNodesFormatted}
🥩TVL: ${networkStatsMessage.tvlFormatted} ($${networkStatsMessage.tvlUsdFormatted})
💵TRAC spent 24H: ${networkStatsMessage.dailyTracSpentFormatted} ($${networkStatsMessage.dailyTracSpentUsdFormatted})
💰TRAC spent total: ${networkStatsMessage.totalTracSpentFormatted} ($${networkStatsMessage.totalTracSpentUsdFormatted})
⚖️Mcap: $${networkStatsMessage.marketCapFormatted} | Volume: $${networkStatsMessage.volumeFormatted}`;
  }
}


async function broadcastMessage(bot, message) {
  for (const chatId of CHAT_IDS) {
    try {
      await bot.telegram.sendMessage(chatId, message);
      console.log(`Message sent to chat ${chatId}`);
    } catch (error) {
      console.error(`Failed to send message to chat ${chatId}:`, error.message);
    }
  }
}

// async function postTweetAndLog(message) {
//   try {
//     await postTweet(message);
//     console.log('Tweet sent:', message);
//   } catch (error) {
//     console.error(`Failed to post tweet:`, error.message);
//   }
// }

async function checkAndBroadcastNewRecords(bot, currentRecords) {
  for (const record of currentRecords) {
    const recordKey = `${record.event}_${record.timeResolution}`;
    //testing purposes
    // if (record.value > 0 ) {
    if (record.value > lastKnownRecords[recordKey]) {
      // New record detected
      const message = await formatNewRecordMessage(record);
      console.log('New record detected!');
      await broadcastMessage(bot, message);
      await postTweet(message);

      // Update the last known record
      lastKnownRecords[recordKey] = record.value;
    } else {
      console.log(`No new record for ${recordKey}: ${record.value} (current record: ${lastKnownRecords[recordKey]})`);
    }
  }
}

async function initializeLastKnownRecords(initialRecords) {
  for (const record of initialRecords) {
    const recordKey = `${record.event}_${record.timeResolution}`;
    lastKnownRecords[recordKey] = record.value;

    // Post the initial record as a new record
    // const message = await formatNewRecordMessage(record);
    // console.log('New record detected:', message);
    // await postTweet(message);
  }
  // console.log('Initialized last known records:', lastKnownRecords);
}

module.exports = {
  checkAndBroadcastNewRecords,
  initializeLastKnownRecords
};
