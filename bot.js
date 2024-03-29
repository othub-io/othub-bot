require('dotenv').config()

const { Telegraf,session,Markup } = require('telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN, { handlerTimeout: 1000_000 });
const cron = require('node-cron')
const fs = require('fs');
const path = require('path');

bot.use(session({ ttl: 10 }))

const queryTypes = require('./src/util/queryTypes')
const networkPubs = require('./src/modules/networkPubs.js')
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
const fetchTransactions = require('./src/modules/transactionSync');
const checkReceipt = require('./src/modules/checkReceipt');


////////////////easterEgg
bot.command('whereisamos', async ctx => {
  if (ctx.message.chat.id === process.env.ORIGINTRAIL_ID) {
    ctx.deleteMessage(ctx.message.message_id); 
    return;
  }
  command = 'whereisamos'
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

  const easterEgg = 'Locating @TriniZoneAmos...\n...\n...\n...\nRequesting next vlog update...'
  const botmessage = await ctx.reply(easterEgg);
  if (botmessage) {
    setTimeout(async () => {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id)
      } catch (error) {
        console.error('Error deleting message:', error)
      }
    }, process.env.DELETE_TIMER)
  }
})

bot.command('totalpubsovertime', async ctx => {
  if (ctx.message.chat.id === process.env.ORIGINTRAIL_ID) {
    ctx.deleteMessage(ctx.message.message_id); 
    return;
  }
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
  const botmessage = await ctx.reply(easterEgg);
  if (botmessage) {
    setTimeout(async () => {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id)
      } catch (error) {
        console.error('Error deleting message:', error)
      }
    }, process.env.DELETE_TIMER)
  }
})

bot.command('cumgraph', async ctx => {
  if (ctx.message.chat.id === process.env.ORIGINTRAIL_ID) {
    ctx.deleteMessage(ctx.message.message_id); 
    return;
  }
  command = 'cumgraph'
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
  const easterEgg = `⠀⠀⠀⠀⢀⣠⠤⠤⠤⠤⣄
⠀⠀⢀⣴⠋⠀⠀⠀⠀⠀⠈⢳⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⣾⣿⠟⣧⠄⢠⣶⣿⠟⡆⢨⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⡟⠉⠹⣥⣶⣈⣙⣾⣾⠅⢸⠇⠀⠀⠀⠀⠀⠀⠀⣀⠀⠀⠀⠀
⠠⡏⠉⠉⠉⠉⠁⠀⠀⠀⠀⢸⡆⠀⠀⠀⠀⠀⠀⣼⠉⠙⡆⠀⠀
⠸⡇⠀⠀⠀⠀⠀⠀⢰⡖⡆⠈⣇⠀⠀⣀⣀⠀⡼⠃⢀⣲⠇⠀⠀
⠀⣧⠀⠀⠀⠀⠀⠀⢸⡇⡇⠀⢻⠊⣻⣥⡤⣿⣁⡀⠴⠿⢲⣄⡀
⠀⠸⣆⠀⠀⠀⠀⠀⢨⣟⣧⣀⠀⠀⠉⠀⠀⠀⠀⠈⢳⣈⣹⣿⠀
⠀⠀⠘⢦⡀⠀⠀⠀⠻⠿⠏⠉⠁⠀⠀⣀⠂⠀⠀⠀⣰⠏⠉⠁⠀
⠀⠀⠀⠀⠙⠦⣄⣀⡀⠀⠀⠀⠀⠀⢀⡀⢃⣀⣤⠞⠁⠀⠀⠀⠀
⠀⠀⠀⢀⣀⠀⢠⢿⡏⠙⠛⣾⣉⣿⢸⡏⠉⠁⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠈⢯⣙⢏⡞⠀⠀⠀⠙⠦⣍⣸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠈⠉⠀⠀⠀⠀⠀⠀⠀⠉`
  const botmessage = await ctx.reply(easterEgg);
  if (botmessage) {
  setTimeout(async () => {
    try {
      await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id)
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }, process.env.DELETE_TIMER)
}
})

bot.command('kitty', async ctx => {
  if (ctx.message.chat.id === process.env.ORIGINTRAIL_ID) {
    ctx.deleteMessage(ctx.message.message_id); 
    return;
  }
  command = 'kitty'
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
  const easterEgg = `⠀⠀⠀⠀⠀⠀⣠⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
  ⠀⠀⠀⠀⣠⠎⠀⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
  ⢀⣀⡀⠞⠁⠀⠀⠁⠁⠐⠒⠒⠋⡹⠀⠀⠀⠀
  ⠈⢢⠀⠾⠃⠀⠀⠀⠀⠀⠀⠀⡰⠁⠀⠀⠀⠀
  ⢰⠣⡄⠠⢄⠀⠾⠅⠀⠀⢠⣰⠁⠀⠀⠀⠀⠀
  ⠀⠀⠐⢤⣀⠀⣀⣆⢰⠉⠢⡇⠀⢀⠤⠤⣀⠀
  ⠀⠀⢸⠀⠀⠀⠀⠀⠙⠀⠈⠳⡀⠘⠤⡀⠀⢆
  ⠀⠀⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢄⡀⢸⠀⠸
  ⠀⠀⠁⠀⢥⠀⠀⡇⠀⠀⠀⠀⠀⠀⣱⠼⠀⡘
  ⠀⢀⡇⠀⠢⠄⢀⠃⠀⢐⠀⠀⠀⠀⡇⠤⠋⠀
  ⠀⠸⢄⣀⠜⠀⢸⡀⠴⠋⠀⠉⠁⠁`
  const botmessage = await ctx.reply(easterEgg);
  if (botmessage) {
  setTimeout(async () => {
    try {
      await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id)
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }, process.env.DELETE_TIMER)
}
})

////////////////New Chat Member Welcome Message
bot.on('new_chat_members', (ctx) => {
  if ( ctx.chat.id == process.env.OTHUB_ID ) {
    const firstName = ctx.message.new_chat_member.first_name;

    const welcomeMessage = `👋Hello, @${firstName}\n\nWelcome to the Official OTHub Channel!\n
📋Please take a moment to review the rules:\n
📋<b>Please review the rules:</b>
1️⃣ Be respectful: Zero tolerance to verbal harassment.
2️⃣ Stay on topic: Keep discussions focused on OriginTrail.
3️⃣ No spam or self-promotion.

❗️By remaining in this channel, you agree to abide by these rules.

🎙️For our latest news, you can follow our Twitter!

🤖For more interactions with @othubbot, press /commands`;

ctx.replyWithHTML(welcomeMessage,Markup.inlineKeyboard([
  [
    Markup.button.url('OTHub', 'https://othub.io'),
    Markup.button.url('Github', 'https://github.com/othub-io'),
    Markup.button.url('Twitter', 'https://twitter.com/OTHub_io'),
  ],
  [
    Markup.button.url('Postman', 'https://www.postman.com/crimson-crescent-721757/workspace/othub-api'),
    Markup.button.url('Charts', 'https://othub.io/charts'),
    Markup.button.url('Donations', 'https://othub.io/donations')
  ],
])).then((messageSent) => {
  setTimeout(() => {
      ctx.deleteMessage(messageSent.message_id);
  }, process.env.DELETE_TIMER);
  }).catch(console.error);
  } else if (ctx.chat.id == process.env.ORIGINTRAIL_ID ) {
    const firstName = ctx.message.new_chat_member.first_name;

    const welcomeMessage = `👋Hello, @${firstName}\n\n<b>Welcome to the Official OriginTrail Channel!</b>\n
📋<b>Please review the rules:</b>
1️⃣ Be respectful: Zero tolerance to verbal harassment.
2️⃣ Stay on topic: Keep discussions focused on OriginTrail.
3️⃣ No spam or self-promotion.
4️⃣ No price talk.

❗️By remaining in this channel, you agree to abide by these rules.

🎙️For our latest news, you can follow our Twitter or Announcement Channel.`;

ctx.replyWithHTML(welcomeMessage,Markup.inlineKeyboard([
  [
    Markup.button.url('Official', 'https://origintrail.io'),
    Markup.button.url('Parachain', 'https://parachain.origintrail.io/'),
    Markup.button.url('Whitepaper', 'https://www.origintrail.io/ecosystem/whitepaper')
  ],
  [
    Markup.button.url('Docs', 'https://docs.origintrail.io'),
    Markup.button.url('GitHub', 'https://github.com/origintrail'),
    Markup.button.url('Explorer', 'https://dkg.origintrail.io/')
  ],
  [
    Markup.button.url('Trace Labs', 'https://tracelabs.io/'),
    Markup.button.url('Medium', 'https://medium.com/origintrail'),
    Markup.button.url('YouTube', 'https://www.youtube.com/c/OriginTrail')
  ],
  [
    Markup.button.url('Twitter', 'https://twitter.com/origin_trail'),
    Markup.button.url('Discord', 'https://discord.com/invite/FCgYk2S'),
    Markup.button.url('Reddit', 'https://www.reddit.com/r/OriginTrail/')
  ],
  [
    Markup.button.url('Deepdive', 'https://deepdive.origintrail.club/'),
    Markup.button.url('TracVerse', 'https://tracverse.com/'),
    Markup.button.url('OTHub', 'https://othub.io')
  ]
])).then((messageSent) => {
  setTimeout(() => {
      ctx.deleteMessage(messageSent.message_id);
  }, process.env.DELETE_TIMER);
  }).catch(console.error);
  } else if (ctx.chat.id == process.env.OTC_ID) {
    const firstName = ctx.message.new_chat_member.first_name;
    const welcomeMessage = `👋Hello, @${firstName}\n\n<b>Welcome to the OriginTrail Club Community Channel!</b>\n
📋<b>Please review the rules:</b>
1️⃣ Be respectful: Zero tolerance to verbal harassment.
2️⃣ Stay on topic: Keep discussions focused on OriginTrail.
3️⃣ No spam or self-promotion.

❗️By remaining in this channel, you agree to abide by these rules.

🤖For more interactions with @othubbot, press /commands`;
ctx.replyWithHTML(welcomeMessage,Markup.inlineKeyboard([
  [
    Markup.button.url('Whitepaper', 'https://www.origintrail.io/ecosystem/whitepaper'),
    Markup.button.url('$TRAC', 'https://www.coingecko.com/en/coins/origintrail'),
    Markup.button.url('Official', 'https://origintrail.io'),
  ],
  [
    Markup.button.url('DeepDive', 'https://deepdive.origintrail.club/'),
    Markup.button.url('TracVerse', 'https://tracverse.com/'),
    Markup.button.url('OTHub', 'https://othub.io')
  ],
  [
    Markup.button.url('Etherscan', 'https://etherscan.io/token/0xaa7a9ca87d3694b5755f213b5d04094b8d0f0a6f'),
    Markup.button.url('Gnosis', 'https://gnosisscan.io/token/0xeddd81e0792e764501aae206eb432399a0268db5'),
    Markup.button.url('Subscan', 'https://origintrail.subscan.io/token/0xffffffff00000000000000000000000000000001')
  ],
  [
    Markup.button.url('UniSwap', 'https://app.uniswap.org/swap?inputCurrency=0xaa7a9ca87d3694b5755f213b5d04094b8d0f0a6f&outputCurrency=ETH'),
    Markup.button.url('Coinbase', 'https://pro.coinbase.com/trade/TRAC-USD'),
    Markup.button.url('Kucoin', 'https://www.kucoin.com/trade/TRAC-USDT'),
  ]
])).then((messageSent) => {
    setTimeout(() => {
        ctx.deleteMessage(messageSent.message_id);
    }, process.env.DELETE_TIMER);
    }).catch(console.error);
    } 
});

////////////////Glossary
bot.command('glossary', async (ctx) => {
  command = 'glossary'
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
  let message = "📃Here's a list of OriginTrail terms:\n";
  for (let term in glossary) {
    message += `/${term.replace(" ", "_")}\n`;
  }
  const lines = message.split('\n');
  lines.splice(-4, 4); // This removes the last two elements of the array
  message = lines.join('\n');

  const botmessage = await ctx.reply(message);
});

for (let term in glossary) {
  const commandName = term.replace(" ", "_");
  bot.command(commandName, async (ctx) => {
    command = commandName
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

////////////////eventMonitor
cron.schedule(process.env.DAILY, function() {
  eventMonitor.otpContractsChange(eventMonitor.notifyTelegramOtpContractsChange);
  eventMonitor.gnosisContractsChange(eventMonitor.notifyTelegramGnosisContractsChange);
  eventMonitor.dailyHighPubs(eventMonitor.notifyTelegramDailyHighPubs);
});

cron.schedule(process.env.HOURLY, function(){
  eventMonitor.gnosisStagingUpdateStatus(eventMonitor.notifyTelegramGnosisStagingUpdateStatus);
  eventMonitor.otpStagingUpdateStatus(eventMonitor.notifyTelegramOtpStagingUpdateStatus);
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

bot.command('pubsgraph', async ctx => {
  command = 'pubsgraph'
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
  const imageBuffer = await networkStats.KnowledgeAssetsOverTime(dates, totalPubsValues);
  const imageStream = networkStats.bufferToStream(imageBuffer);
  await ctx.replyWithPhoto({ source: imageStream });
  await ctx.deleteMessage();
})

bot.command('networkgraph', async ctx => {
  command = 'networkgraph'
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
  await ctx.deleteMessage();
})

////////////////networkPubs
bot.command('totalpubs', async ctx => {
  command = 'totalpubs'
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
  await networkPubs.fetchAndSendTotalPubs(ctx)
})

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
createCommand(bot);
sendInvoice(bot);
balanceOperations(bot);
//publishCommand(bot);

schedule.scheduleJob('*/1 * * * *', () => {
  checkReceipt(bot);
});

schedule.scheduleJob('*/1 * * * *', fetchTransactions);

//-----------------------END---------------------------

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
