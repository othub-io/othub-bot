require('dotenv').config()

const { Telegraf,session } = require('telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN)
const cron = require('node-cron')

bot.use(session({ ttl: 10 }))

const queryTypes = require('./src/util/queryTypes')
const networkPubs = require('./src/modules/networkPubs.js')
const { isAdmin , adminCommand } = require('./src/modules/systemCommands.js')
const adminCommandList = require('./src/modules/adminCommandList.js')
const generalCommandList = require('./src/modules/generalCommandList.js')
const networkStats = require('./src/modules/networkStats.js')
const nodeStats = require('./src/modules/nodeStats.js')
const eventMonitor = require('./src/modules/eventMonitor.js')
const publishCommand = require('./src/modules/publishCommand.js');

const chatId = process.env.OTHUB_ID;
const adminGroup = process.env.ADMIN_GROUP.split(',');

////////////////New Chat Member Welcome Message
bot.on('new_chat_members', (ctx) => {
  if (ctx.chat.id == chatId) {
    const firstName = ctx.message.new_chat_member.first_name;

    const welcomeMessage = `Hello, ${firstName}! 👋\n\nWelcome to the Official OTHub Channel!\n
Before you start, please take a moment to review the rules:\n
1️⃣ Be respectful: Each member of this community is expected to maintain a respectful and considerate tone when communicating with others.
2️⃣ Keep it professional: This is a professional community focused on OTHub's development. Please keep discussions focused on development topics and refrain from unrelated or inappropriate content.
3️⃣ No spam or self-promotion: Spamming and self-promotion are not allowed. Please do not share irrelevant links or promote personal projects.
4️⃣ Seek to contribute: Aim to contribute positively to the discussions. Your insights and experiences can be of great value to others!

Remember, violation of these rules may result in your removal from the community. By remaining in this community, you agree to abide by these rules.

Useful links:
1️⃣ <a href="https://othub.io">OTHub Official Website</a>
2️⃣ <a href="https://github.com/othub-io">OTHub GitHub</a>
3️⃣ <a href="https://origintrail.io">OriginTrail Official Website</a>
4️⃣ <a href="https://dkg.origintrail.io/">DKG Explorer</a>
5️⃣ <a href="https://origintrail.subscan.io/">OriginTrail Subscan</a>
6️⃣ <a href="https://docs.origintrail.io/">OriginTrail Docs</a>
7️⃣ <a href="https://deepdive.origintrail.club">OriginTrail DeepDive</a>
8️⃣ <a href="https://tracverse.com">TracVerse</a>

For more interactions with @othubbot, please type: /commands`;

  ctx.replyWithHTML(welcomeMessage).then((messageSent) => {
  setTimeout(() => {
      ctx.deleteMessage(messageSent.message_id);
  }, process.env.DELETE_TIMER);
  }).catch(console.error);
  }
});

////////////////eventMonitor
cron.schedule(process.env.DAILY, function() {
  eventMonitor.NewPublishers(eventMonitor.notifyTelegramNewPublisher);
  eventMonitor.contractsChange(eventMonitor.notifyTelegramContractsChange);
  eventMonitor.dailyHighPubs(eventMonitor.notifyTelegramDailyHighPubs);
});

cron.schedule(process.env.HOURLY, function(){
  eventMonitor.stagingUpdateStatus(eventMonitor.notifyTelegramStagingUpdateStatus);
});

////////////////networkStats
bot.command('networkstats', async ctx => {
  command = 'networkstats'
  spamCheck = await queryTypes.spamCheck()
  telegram_id = ctx.message.from.id
  permission = await spamCheck
    .getData(command, telegram_id)
    .then(async ({ permission }) => {
      return permission })
    .catch(error => console.log(`Error : ${error}`))
  if (permission != `allow`) {
    await ctx.deleteMessage()
    return
  }

  await networkStats.fetchNetworkStatistics(ctx)
  await ctx.deleteMessage();
})

bot.command('dailypubsgraph', async ctx => {
  command = 'dailypubsgraph'
  spamCheck = await queryTypes.spamCheck()
  telegram_id = ctx.message.from.id
  permission = await spamCheck
    .getData(command, telegram_id)
    .then(async ({ permission }) => {
      return permission })
    .catch(error => console.log(`Error : ${error}`))
  if (permission != `allow`) {
    await ctx.deleteMessage()
    return
  }

  const data = await networkStats.fetchDateTotalPubs();
  const dates = data.map(row => row.date);
  const totalPubsValues = data.map(row => row.totalPubs);
  const imageBuffer = await networkStats.generateGraph(dates, totalPubsValues);
  const imageStream = networkStats.bufferToStream(imageBuffer);
  await ctx.replyWithPhoto({ source: imageStream });
  await ctx.deleteMessage();
})

////////////////networkPubs
bot.command('hourlypubs', async ctx => {
  command = 'hourlypubs'
  spamCheck = await queryTypes.spamCheck()
  telegram_id = ctx.message.from.id
  permission = await spamCheck
    .getData(command, telegram_id)
    .then(async ({ permission }) => {
      return permission })
    .catch(error => console.log(`Error : ${error}`))
  if (permission != `allow`) {
    await ctx.deleteMessage()
    return
  }
  await ctx.deleteMessage();
  await networkPubs.fetchAndSendHourlyPubs(ctx)
})

bot.command('dailypubs', async ctx => {
  command = 'dailypubs'
  spamCheck = await queryTypes.spamCheck()
  telegram_id = ctx.message.from.id
  permission = await spamCheck
    .getData(command, telegram_id)
    .then(async ({ permission }) => {
      return permission })
    .catch(error => console.log(`Error : ${error}`))
  if (permission != `allow`) {
    await ctx.deleteMessage()
    return
  }
  await ctx.deleteMessage();
  await networkPubs.fetchAndSendDailyPubs(ctx)
})

bot.command('weeklypubs', async ctx => {
  command = 'weeklypubs'
  spamCheck = await queryTypes.spamCheck()
  telegram_id = ctx.message.from.id
  permission = await spamCheck
    .getData(command, telegram_id)
    .then(async ({ permission }) => {
      return permission })
    .catch(error => console.log(`Error : ${error}`))
  if (permission != `allow`) {
    await ctx.deleteMessage()
    return
  }
  await ctx.deleteMessage();
  await networkPubs.fetchAndSendWeeklyPubs(ctx)
})

bot.command('monthlypubs', async ctx => {
  command = 'monthlypubs'
  spamCheck = await queryTypes.spamCheck()
  telegram_id = ctx.message.from.id
  permission = await spamCheck
    .getData(command, telegram_id)
    .then(async ({ permission }) => {
      return permission })
    .catch(error => console.log(`Error : ${error}`))
  if (permission != `allow`) {
    await ctx.deleteMessage()
    return
  }
  await ctx.deleteMessage();
  await networkPubs.fetchAndSendMonthlyPubs(ctx)
})

////////////////systemCommands
bot.command('commands', async (ctx) => {
  command = 'commands'
  spamCheck = await queryTypes.spamCheck()
  telegram_id = ctx.message.from.id
  permission = await spamCheck
    .getData(command, telegram_id)
    .then(async ({ permission }) => {
      return permission })
    .catch(error => console.log(`Error : ${error}`))
  if (permission != `allow`) {
    await ctx.deleteMessage()
    return
  }
  let message = 'Here are the general commands:\n\n';
  for (const [command, description] of Object.entries(generalCommandList)) {
    message += `/${command} - ${description}\n`;
  }
  await ctx.deleteMessage();
  const botmessage = await ctx.reply(message);
  if (botmessage) {
    setTimeout(async () => {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id)
      } catch (error) {
        console.error('Error deleting message:', error)
      }
    }, process.env.DELETE_TIMER)
  }
});

adminCommand(bot);
bot.command('admincommands', async (ctx) => {
  command = 'admincommands'
  spamCheck = await queryTypes.spamCheck()
  telegram_id = ctx.message.from.id
  permission = await spamCheck
    .getData(command, telegram_id)
    .then(async ({ permission }) => {
      return permission })
    .catch(error => console.log(`Error : ${error}`))
  if (permission != `allow`) {
    await ctx.deleteMessage()
    return
  }
  if (!isAdmin(ctx)) {
    const botmessage = await ctx.reply('You are not authorized to execute this command.');
    if (botmessage) {
      setTimeout(async () => {
        try {
          await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id)
        } catch (error) {
          console.error('Error deleting message:', error)
        }
      }, process.env.DELETE_TIMER)
    }    return;
  }
  let message = 'Here are the admin commands:\n\n';
  for (const [commandName, commandDetails] of Object.entries(adminCommandList)) {
    message += `/${commandName} - ${commandDetails.description}\n`;
  }
  await ctx.deleteMessage();
  const botmessage = await ctx.reply(message);
  if (botmessage) {
    setTimeout(async () => {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id)
      } catch (error) {
        console.error('Error deleting message:', error)
      }
    }, process.env.DELETE_TIMER)
  }
});

////////////////nodeStats
bot.command('nodestatslasthour', async ctx => {
  const tokenSymbol = ctx.message.text.split(' ')[1];
  command = 'nodestatslasthour' + '_' + tokenSymbol;
  spamCheck = await queryTypes.spamCheck();
  telegram_id = ctx.message.from.id;
  permission = await spamCheck
    .getData(command, telegram_id)
    .then(({ permission }) => {
      return permission })
    .catch(error => console.log(`Error : ${error}`));
  if (permission != `allow`) {
    await ctx.deleteMessage()
    return
  }
  nodeStats.lastHourNodeStats(tokenSymbol, async (err, result) => {
    if (err) {
      console.error(err);
      return;
    }
    if (result) {
      await ctx.reply(result); 
    } else {
      const noResultsMessage = await ctx.reply('Invalid entry. Please try again with your tokenSymbol.');
      setTimeout(async () => {
        try {
          await ctx.telegram.deleteMessage(ctx.chat.id, noResultsMessage.message_id);
        } catch (error) {
          console.error('Error deleting message:', error);
        }
      }, process.env.DELETE_TIMER);
    }
    await ctx.deleteMessage();
  });
});

bot.command('nodestatslastday', async ctx => {
  const tokenSymbol = ctx.message.text.split(' ')[1];
  command = 'nodestatslastday' + '_' + tokenSymbol;
  spamCheck = await queryTypes.spamCheck();
  telegram_id = ctx.message.from.id;
  permission = await spamCheck
    .getData(command, telegram_id)
    .then(({ permission }) => {
      return permission })
    .catch(error => console.log(`Error : ${error}`));
  if (permission != `allow`) {
    await ctx.deleteMessage()
    return
  }
  nodeStats.lastDayNodeStats(tokenSymbol, async (err, result) => {
    if (err) {
      console.error(err);
      return;
    }
    if (result) {
      await ctx.reply(result); 
    } else {
      const noResultsMessage = await ctx.reply('Invalid entry. Please try again with your tokenSymbol.');
      setTimeout(async () => {
        try {
          await ctx.telegram.deleteMessage(ctx.chat.id, noResultsMessage.message_id);
        } catch (error) {
          console.error('Error deleting message:', error);
        }
      }, process.env.DELETE_TIMER);
    }
    await ctx.deleteMessage();
  });
});

bot.command('nodestatslastweek', async ctx => {
  const tokenSymbol = ctx.message.text.split(' ')[1];
  command = 'nodestatslastweek' + '_' + tokenSymbol;
  spamCheck = await queryTypes.spamCheck();
  telegram_id = ctx.message.from.id;
  permission = await spamCheck
    .getData(command, telegram_id)
    .then(({ permission }) => {
      return permission })
    .catch(error => console.log(`Error : ${error}`));
  if (permission != `allow`) {
    await ctx.deleteMessage()
    return
  }
  nodeStats.lastWeekNodeStats(tokenSymbol, async (err, result) => {
    if (err) {
      console.error(err);
      return;
    }
    if (result) {
      await ctx.reply(result); 
    } else {
      const noResultsMessage = await ctx.reply('Invalid entry. Please try again with your tokenSymbol.');
      setTimeout(async () => {
        try {
          await ctx.telegram.deleteMessage(ctx.chat.id, noResultsMessage.message_id);
        } catch (error) {
          console.error('Error deleting message:', error);
        }
      }, process.env.DELETE_TIMER);
    }
    await ctx.deleteMessage();
  });
});

bot.command('nodestatslastmonth', async ctx => {
  const tokenSymbol = ctx.message.text.split(' ')[1];
  command = 'nodestatslastmonth' + '_' + tokenSymbol;
  spamCheck = await queryTypes.spamCheck();
  telegram_id = ctx.message.from.id;
  permission = await spamCheck
    .getData(command, telegram_id)
    .then(({ permission }) => {
      return permission })
    .catch(error => console.log(`Error : ${error}`));
  if (permission != `allow`) {
    await ctx.deleteMessage()
    return
  }
  nodeStats.lastMonthNodeStats(tokenSymbol, async (err, result) => {
    if (err) {
      console.error(err);
      return;
    }
    if (result) {
      await ctx.reply(result); 
    } else {
      const noResultsMessage = await ctx.reply('Invalid entry. Please try again with your tokenSymbol.');
      setTimeout(async () => {
        try {
          await ctx.telegram.deleteMessage(ctx.chat.id, noResultsMessage.message_id);
        } catch (error) {
          console.error('Error deleting message:', error);
        }
      }, process.env.DELETE_TIMER);
    }
    await ctx.deleteMessage();
  });
});

bot.command('nodestats', async ctx => {
  const tokenSymbol = ctx.message.text.split(' ')[1];
  command = 'nodestats' + '_' + tokenSymbol;
  spamCheck = await queryTypes.spamCheck();
  telegram_id = ctx.message.from.id;
  permission = await spamCheck
    .getData(command, telegram_id)
    .then(({ permission }) => {
      return permission })
    .catch(error => console.log(`Error : ${error}`));
  if (permission != `allow`) {
    await ctx.deleteMessage()
    return
  }
  nodeStats.NodeStats(tokenSymbol, async (err, result) => {
    if (err) {
      console.error(err);
      return;
    }
    if (result) {
      await ctx.reply(result); 
    } else {
      const noResultsMessage = await ctx.reply('Invalid entry. Please try again with your tokenSymbol.');
      setTimeout(async () => {
        try {
          await ctx.telegram.deleteMessage(ctx.chat.id, noResultsMessage.message_id);
        } catch (error) {
          console.error('Error deleting message:', error);
        }
      }, process.env.DELETE_TIMER);
    }
    await ctx.deleteMessage();
  });
});

////////////////Publish Command
publishCommand(bot);

////////////////easterEgg
bot.command('totalpubsovertime', async ctx => {
  command = 'totalpubsovertime'
  spamCheck = await queryTypes.spamCheck()
  telegram_id = ctx.message.from.id
  permission = await spamCheck
    .getData(command, telegram_id)
    .then(async ({ permission }) => {
      return permission })
    .catch(error => console.log(`Error : ${error}`))
  if (permission != `allow`) {
    await ctx.deleteMessage()
    return
  }

  const easterEgg = 'You just reduced the lifetime amount of pubs by 5%.'
  await ctx.reply(easterEgg);
  await ctx.deleteMessage();
})

//-----------------------END---------------------------

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
