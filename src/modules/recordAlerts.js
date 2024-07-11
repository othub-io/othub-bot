const { TwitterApi } = require('twitter-api-v2');
require('dotenv').config();

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
      console.log('Tweet', createdTweet.id, ':', createdTweet.text);
  } catch (error) {
      console.error('Error posting tweet:', error);
  }
}

const CHAT_IDS = [
    process.env.OTHUB_ID,
    process.env.ORIGINTRAIL_ID,
    process.env.OTC_ID
  ];
  
  let lastKnownRecords = {
    'top_trac_spent_hour': 0,
    'top_trac_spent_day': 0,
    'top_assets_published_hour': 0,
    'top_assets_published_day': 0
  };
  
  function formatNewRecordMessage(record) {
    const date = new Date(record.datetime).toISOString().split('T')[0];
    const time = new Date(record.datetime).toISOString().split('T')[1].slice(0, 5);
    const value = record.value.toLocaleString();
    
    let recordType;
    if (record.event === 'top_trac_spent') {
      recordType = `$TRAC spent (${record.timeResolution})`;
    } else if (record.event === 'top_assets_published') {
      recordType = `assets published (${record.timeResolution})`;
    }
  
    return `🚨 New @origin_trail Record Alert! 🚨\n\n🏆 New record for ${recordType}:\n${value} on ${date} at ${time}\n\n👉 Visit OTHub.io for more statistics!`;
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

  async function postTweetAndLog(message) {
    try {
        postTweet(message);
        console.log('Tweet sent:', message);
    } catch (error) {
        console.error(`Failed to post tweet:`, error.message);
    }
}
  
  function checkAndBroadcastNewRecords(bot, currentRecords) {
    for (const record of currentRecords) {
      const recordKey = `${record.event}_${record.timeResolution}`;
      if (record.value > lastKnownRecords[recordKey]) {
        // New record detected
        const message = formatNewRecordMessage(record);
        console.log('New record detected:', message);
        broadcastMessage(bot, message);
        postTweetAndLog(message);
        
        // Update the last known record
        lastKnownRecords[recordKey] = record.value;
      } else {
        console.log(`No new record for ${recordKey}: ${record.value} (current record: ${lastKnownRecords[recordKey]})`);
      }
    }
  }
  
  function initializeLastKnownRecords(initialRecords) {
    initialRecords.forEach(record => {
        const recordKey = `${record.event}_${record.timeResolution}`;
        lastKnownRecords[recordKey] = record.value;
        
        // Post the initial record as a new record
        // const message = formatNewRecordMessage(record);
        // console.log('Posting initial record:', message);
        // postTweet(message);
    });
    console.log('Initialized last known records:', lastKnownRecords);
}
  module.exports = {
    checkAndBroadcastNewRecords,
    initializeLastKnownRecords
  };