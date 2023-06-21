require('dotenv').config()

const queryTypes = require('./src/util/queryTypes')
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
  session,
  Scenes,
  Markup,
  BaseScene,
  Stage
} = require('telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)

const os = require('os')
const fs = require('fs')
const cron = require('node-cron')
const express = require('express')
const shell = require('shelljs')

const checkPermission = async (ctx, next) => {
  const command = ctx.message.text.split(' ')[0].substring(1);
  const telegram_id = ctx.message.from.id;
  const spamCheck = await queryTypes.spamCheck();

  const { permission } = await spamCheck.getData(command, telegram_id)
    .catch(error => console.log(`Error : ${error}`));

  if (permission !== 'allow') {
    await ctx.deleteMessage();
    return;
  }
  await next();
};

const deleteMessageAfterDelay = async (ctx, botmessage) => {
  if (botmessage) {
    setTimeout(async () => {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id);
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }, process.env.DELETE_TIMER);
  }
};

bot.use(checkPermission);
bot.use(session({ ttl: 10 }));

bot.on('new_chat_members', async ctx => {
  await newMember(ctx)
})

bot.command('mynodes', async ctx => {
  const botmessage = await myNodes(ctx);
  deleteMessageAfterDelay(ctx, botmessage);
})

bot.command('networkstats', async ctx => {
  const botmessage = await networkStats.fetchNetworkStatistics(ctx);
  deleteMessageAfterDelay(ctx, botmessage);
})

bot.command('hourlypubs', async ctx => {
  const botmessage = await networkPubs.fetchAndSendHourlyPubs(ctx);
  deleteMessageAfterDelay(ctx, botmessage);
})

bot.command('dailypubs', async ctx => {
  const botmessage = await networkPubs.fetchAndSendDailyPubs(ctx);
  deleteMessageAfterDelay(ctx, botmessage);
})

adminCommand(bot);

bot.command('commands', async (ctx) => {
  await ctx.deleteMessage()

  let message = 'Here are the general commands:\n\n';

  for (const [command, description] of Object.entries(generalCommandList)) {
    message += `/${command} - ${description}\n`;
  }

  const botmessage = await ctx.reply(message);
  deleteMessageAfterDelay(ctx, botmessage);
});

bot.command('admincommands', async (ctx) => {
  if (!isAdmin(ctx)) {
    const botmessage = await ctx.reply('You are not authorized to execute this command.');
    deleteMessageAfterDelay(ctx, botmessage);
    return;
  }

  await ctx.deleteMessage()

  let message = 'Here are the admin commands:\n\n';

  for (const [commandName, commandDetails] of Object.entries(adminCommandList)) {
    message += `/${commandName} - ${commandDetails.description}\n`;
  }

  const botmessage = await ctx.reply(message);
  deleteMessageAfterDelay(ctx, botmessage);
});

cron.schedule(process.env.ASK_MONITOR, askMonitor);
cron.schedule(process.env.TEAM_MONITOR, teamMonitor);
cron.schedule(process.env.UPTIME_MONITOR, uptimeMonitor);
cron.schedule(process.env.HOURLY, () => networkOverview(`hourly`));
cron.schedule(process.env.DAILY, () => networkOverview(`daily`));
cron.schedule(process.env.WEEKLY, () => networkOverview(`weekly`));
cron.schedule(process.env.MONTHLY, () => networkOverview(`monthly`));
cron.schedule(process.env.YEARLY, () => networkOverview(`yearly`));

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
