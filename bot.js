require('dotenv').config()

const { Telegraf,session,Markup } = require('telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN, { handlerTimeout: 1000_000 });
const cron = require('node-cron')
const fs = require('fs');
const path = require('path');

bot.use(session({ ttl: 10 }))

const queryTypes = require('./src/util/queryTypes');
const networkPubs = require('./src/modules/networkPubs.js')
const autoTweet = require ('./src/modules/autoTweet.js')
const { isAdmin , adminCommand } = require('./src/modules/systemCommands.js')
const adminCommandList = require('./src/modules/adminCommandList.js')
const generalCommandList = require('./src/modules/generalCommandList.js')
const networkStats = require('./src/modules/networkStats.js')
const nodeStats = require('./src/modules/nodeStats.js')
const eventMonitor = require('./src/modules/eventMonitor.js')
//const publishCommand = require('./src/modules/publishCommand.js');
const createCommand = require('./src/modules/createCommand.js');
const glossary = require ('./glossary.js');
const sendInvoice = require('./src/modules/sendInvoice');
const balanceOperations = require('./src/modules/balanceOperations');
const schedule = require('node-schedule');
//const fetchTransactions = require('./src/modules/transactionSync');
const checkReceipt = require('./src/modules/checkReceipt');
const recordAlerts = require('./src/modules/recordAlerts.js');

const handleCommand = async (ctx, command, actionFunction) => {
  try {
    const telegramId = ctx.message.from.id;
    const { permission } = await queryTypes.spamCheck().getData(command, telegramId);

    if (permission !== 'allow') {
      await ctx.deleteMessage();
      return;
    }

    const userInput = ctx.message.text.split(' ')[1]?.toLowerCase();

    // if (!userInput || typeof userInput !== 'string' || userInput.trim() === '') {
    //   await ctx.reply('Please provide a valid token symbol.');
    //   return;
    // }

    if (Array.isArray(actionFunction)) {
      for (const action of actionFunction) {
        await action(ctx, userInput);
      }
    } else {
      await actionFunction(ctx, userInput);
    }
  } catch (error) {
    console.error(`Error handling command: ${error.message}`);
    await ctx.reply(`Error handling command: ${error.message}`);
  } finally {
    await ctx.deleteMessage();
  }
};

async function postTelegramMessage(message, chatId, threadId) {
  try {
    await bot.telegram.sendMessage(chatId, message, {
      message_thread_id: threadId
    });
    console.log('Message sent to Telegram');
  } catch (error) {
    console.error('Error sending message to Telegram:', error);
  }
}

const createNodeStatsCommand = (commandName, nodeStatsFunction) => {
  bot.command(commandName, ctx => handleCommand(ctx, commandName, async (ctx, tokenSymbol) => {
    try {
      const stats = await nodeStatsFunction(tokenSymbol);
      if (stats) {
        await ctx.reply(stats);
      } else {
        await ctx.reply('No data found for the given token symbol.');
      }
    } catch (error) {
      console.error(`Error retrieving node stats: ${error.message}`);
      await ctx.reply(`Error retrieving node stats: ${error.message}`);
    }
  }));
};

bot.command('networkstats', ctx => handleCommand(ctx, 'networkstats', networkStats.fetchNetworkStatistics));

////////////////Auto Tweets
autoTweet.getRecordStats().then(initialRecords => {
  recordAlerts.initializeLastKnownRecords(initialRecords);
});

cron.schedule(process.env.HOURLY, async () => {
  const currentRecords = await autoTweet.getRecordStats();
  recordAlerts.checkAndBroadcastNewRecords(bot, currentRecords);
});

cron.schedule(process.env.DAILY, async () => {
  console.log('Running daily publication stats...');
  const message = await autoTweet.postStatistics('daily');
  if (message) {
    await autoTweet.postTweet(message);
    await postTelegramMessage(message, process.env.OTC_ID, process.env.OTC_THREAD_ID);
  } else {
    console.error('Failed to generate daily statistics message.');
  }
}, {
  timezone: 'America/New_York'
});

cron.schedule(process.env.WEEKLY, async () => {
  console.log('Running weekly publication stats...');
  const message = await autoTweet.postStatistics('weekly');
  if (message) {
    await autoTweet.postTweet(message);
    await postTelegramMessage(message, process.env.OTC_ID, process.env.OTC_THREAD_ID);
  } else {
    console.error('Failed to generate weekly statistics message.');
  }
}, {
  timezone: 'America/New_York'
});

cron.schedule(process.env.MONTHLY, async () => {
  console.log('Running monthly publication stats...');
  const message = await autoTweet.postStatistics('monthly');
  if (message) {
    await autoTweet.postTweet(message);
    await postTelegramMessage(message, process.env.OTC_ID, process.env.OTC_THREAD_ID);
  } else {
    console.error('Failed to generate monthly statistics message.');
  }
}, {
  timezone: 'America/New_York'
});

// (async () => {
//   try {
//     console.log('Running daily publication stats test...');
//     const message = await autoTweet.postStatistics('monthly');
//     if (message) {
//       await autoTweet.postTweet(message);
//       await postTelegramMessage(message, process.env.OTC_ID, process.env.OTC_THREAD_ID);
//       console.log('Messages posted successfully.');
//     } else {
//       console.error('Failed to generate daily statistics message.');
//     }
//   } catch (error) {
//     console.error('Error during test execution:', error);
//   }
// })();

bot.command('glossary', async (ctx) => {
  const command = 'glossary'
  const telegramId = ctx.message.from.id
  const { permission } = await spamCheck(command, telegramId);

  if (permission !== 'allow') {
    await ctx.deleteMessage();
    return;
  }
  let message = "📃Here's a list of OriginTrail terms:\n";
  for (let term in glossary) {
    message += `/${term.replace(" ", "_")}\n`;
  }
  const lines = message.split('\n');
  lines.splice(-4, 4); // This removes the last two elements of the array
  message = lines.join('\n');
});

for (let term in glossary) {
  const commandName = term.replace(" ", "_");
  bot.command(commandName, async (ctx) => {
    const command = commandName
    const telegramId = ctx.message.from.id
    const { permission } = await spamCheck(command, telegramId);

    if (permission != `allow`) {
      await ctx.deleteMessage()
      return
    }
    const botmessage = await ctx.reply(glossary[term]);
    
    const gifPath = path.join(__dirname, 'glossary', `${term}.gif`);
    const imagePath = path.join(__dirname, 'glossary', `${term}`);
    
    if (fs.existsSync(gifPath)) {
      await ctx.replyWithAnimation({ source: gifPath });
    } else if (fs.existsSync(imagePath)) {
      await ctx.replyWithPhoto({ source: imagePath });
    }
  });
}

cron.schedule(process.env.DAILY, function() {
  eventMonitor.otpContractsChange(eventMonitor.notifyTelegramOtpContractsChange);
  eventMonitor.gnosisContractsChange(eventMonitor.notifyTelegramGnosisContractsChange);
  eventMonitor.dailyHighPubs(eventMonitor.notifyTelegramDailyHighPubs);
});

cron.schedule(process.env.HOURLY, function(){
  eventMonitor.gnosisStagingUpdateStatus(eventMonitor.notifyTelegramGnosisStagingUpdateStatus);
  eventMonitor.otpStagingUpdateStatus(eventMonitor.notifyTelegramOtpStagingUpdateStatus);
});
bot.command('pubsgraph', ctx => handleCommand(ctx, 'pubsgraph', [
  async ctx => {
    const data = await networkStats.fetchDateTotalPubs();
    const dates = data.map(row => row.date);
    const totalPubsValues = data.map(row => row.totalPubs);
    const imageBuffer = await networkStats.KnowledgeAssetsOverTime(dates, totalPubsValues);
    const imageStream = networkStats.bufferToStream(imageBuffer);
    await ctx.replyWithPhoto({ source: imageStream });
  },
]));
bot.command('networkgraph', ctx => handleCommand(ctx, 'networkgraph', [
  async ctx => {
    const cumulativeTracSpentData = await networkStats.fetchDateCumulativeTracSpent();
    const cumulativePubsData = await networkStats.fetchDateCumulativePubs();
    const cumulativePayoutsData = await networkStats.fetchDateCumulativePayouts();
    const dates = cumulativeTracSpentData.map(row => row.date);
    const cumulativePubsValues = cumulativePubsData.map(row => row.cumulativePubs);
    const cumulativePayoutsValues = cumulativePayoutsData.map(row => row.cumulativePayout);
    const cumulativeTotalTracSpentValues = cumulativeTracSpentData.map(row => row.cumulativeTotalTracSpent);
    const imageBuffer = await networkStats.cumulativeGraph(dates, cumulativeTotalTracSpentValues, cumulativePubsValues, cumulativePayoutsValues);
    const imageStream = networkStats.bufferToStream(imageBuffer);
    await ctx.replyWithPhoto({ source: imageStream });
  }
]));
bot.command('record', ctx => handleCommand(ctx, 'record', autoTweet.fetchAndSendRecordStats));
bot.command('hourlypubs', ctx => handleCommand(ctx, 'hourlypubs', networkPubs.fetchAndSendHourlyPubs));
bot.command('dailypubs', ctx => handleCommand(ctx, 'dailypubs', networkPubs.fetchAndSendDailyPubs));
bot.command('weeklypubs', ctx => handleCommand(ctx, 'weeklypubs', networkPubs.fetchAndSendWeeklyPubs));
bot.command('monthlypubs', ctx => handleCommand(ctx, 'monthlypubs', networkPubs.fetchAndSendMonthlyPubs));
bot.command('totalpubs', ctx => handleCommand(ctx, 'totalpubs', networkPubs.fetchAndSendTotalPubs));

createNodeStatsCommand('nodestatslasthour', nodeStats.lastHourNodeStats);
createNodeStatsCommand('nodestatslastday', nodeStats.lastDayNodeStats);
createNodeStatsCommand('nodestatslastweek', nodeStats.lastWeekNodeStats);
createNodeStatsCommand('nodestatslastmonth', nodeStats.lastMonthNodeStats);
createNodeStatsCommand('nodestats', nodeStats.NodeStats);

createCommand(bot);
sendInvoice(bot);
balanceOperations(bot);
//publishCommand(bot);

schedule.scheduleJob('*/1 * * * *', () => {
  checkReceipt(bot);
});

//schedule.scheduleJob('*/1 * * * *', fetchTransactions);

//-----------------------END---------------------------

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
