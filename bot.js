require('dotenv').config()

const { spamCheck } = require('./src/util/queryTypes')
const networkOverview = require('./src/modules/networkOverview.js')
const uptimeMonitor = require('./src/modules/uptimeMonitor.js')
const teamMonitor = require('./src/modules/teamMonitor.js')
const askMonitor = require('./src/modules/askMonitor.js')
const myNodes = require('./src/modules/myNodes.js')
const newMember = require('./src/modules/newMember.js')
const closeProposals = require('./src/modules/closeProposals.js')
const networkPubs = require('./src/modules/networkPubs.js')
const { isAdmin , adminCommand } = require('./src/modules/systemCommands.js')
const adminCommandList = require('./src/modules/adminCommandList.js')
const generalCommandList = require('./src/modules/generalCommandList.js')
const networkStats = require('./src/modules/networkStats.js')

const {
  Telegraf,
  session
} = require('telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN)

const cron = require('node-cron')

bot.use(session({ ttl: 10 }))

const checkPermission = async (ctx, next) => {
  const command = ctx.message.text.split(' ')[0].substring(1);
  const telegram_id = ctx.message.from.id;
  const { permission } = await spamCheck().getData(command, telegram_id)
    .catch(error => console.log(`Error : ${error}`));
  if (permission !== 'allow') {
    await ctx.deleteMessage();
    return;
  }
  await next();
};

bot.on('new_chat_members', newMember);

const commandHandler = commandAction => async (ctx, next) => {
  const botMessage = await commandAction(ctx);
  if (botMessage) {
    setTimeout(async () => {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, botMessage.message_id)
      } catch (error) {
        console.error('Error deleting message:', error)
      }
    }, process.env.DELETE_TIMER)
  }
};

bot.command('mynodes', checkPermission, commandHandler(myNodes));
bot.command('networkstats', checkPermission, commandHandler(networkStats.fetchNetworkStatistics));
bot.command('hourlypubs', checkPermission, commandHandler(networkPubs.fetchAndSendHourlyPubs));
bot.command('dailypubs', checkPermission, commandHandler(networkPubs.fetchAndSendDailyPubs));

adminCommand(bot);

bot.command('commands', checkPermission, commandHandler(async ctx => {
  let message = 'Here are the general commands:\n\n';
  for (const [command, description] of Object.entries(generalCommandList)) {
    message += `/${command} - ${description}\n`;
  }
  if (await isAdmin(ctx.message.from.id)) {
    message += '\n\nHere are the admin commands:\n\n';
    for (const [command, description] of Object.entries(adminCommandList)) {
      message += `/${command} - ${description}\n`;
    }
  }
  return await ctx.reply(message);
}));

bot.launch()
console.log('Bot is running...')

cron.schedule('0 0 * * *', () => {
  closeProposals(bot)
}, {
  scheduled: true,
  timezone: "Europe/London"
})

cron.schedule('0 * * * *', () => {
  networkOverview(bot)
}, {
  scheduled: true,
  timezone: "Europe/London"
})

cron.schedule('0 0 * * *', () => {
  uptimeMonitor(bot)
}, {
  scheduled: true,
  timezone: "Europe/London"
})

cron.schedule('0 0 * * *', () => {
  teamMonitor(bot)
}, {
  scheduled: true,
  timezone: "Europe/London"
})

cron.schedule('0 0 * * *', () => {
  askMonitor(bot)
}, {
  scheduled: true,
  timezone: "Europe/London"
})

process.on('SIGINT', () => { console.log("Bye bye!"); process.exit(); });
