require('dotenv').config()

const queryTypes = require('./src/util/queryTypes')
const networkOverview = require('./src/modules/networkOverview.js')
const uptimeMonitor = require('./src/modules/uptimeMonitor.js')
const teamMonitor = require('./src/modules/teamMonitor.js')
const askMonitor = require('./src/modules/askMonitor.js')
const myNodes = require('./src/modules/myNodes.js')
const newMember = require('./src/modules/newMember.js')
const closeProposals = require('./src/modules/closeProposals.js')
const networkPubs = require('./src/modules/networkPubs.js');
const { commands, handleCommand, isAdmin } = require('./src/modules/systemCommands.js');

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

bot.use(session({ ttl: 10 }))

bot.on('new_chat_members', async ctx => {
  await newMember(ctx)
})

bot.command('mynodes', async ctx => {
  command = 'mynodes'
  spamCheck = await queryTypes.spamCheck()
  telegram_id = ctx.message.from.id

  permission = await spamCheck
    .getData(command, telegram_id)
    .then(async ({ permission }) => {
      return permission
    })
    .catch(error => console.log(`Error : ${error}`))

  if (permission != `allow`) {
    await ctx.deleteMessage()
    return
  }

  await myNodes(ctx)
})

bot.command('hourlypubs', async ctx => {
  command = 'hourlypubs'
  spamCheck = await queryTypes.spamCheck()
  telegram_id = ctx.message.from.id

  permission = await spamCheck
    .getData(command, telegram_id)
    .then(async ({ permission }) => {
      return permission
    })
    .catch(error => console.log(`Error : ${error}`))

  if (permission != `allow`) {
    await ctx.deleteMessage()
    return
  }

  await networkPubs.fetchAndSendHourlyPubs(ctx)
})

bot.command('dailypubs', async ctx => {
  command = 'dailypubs'
  spamCheck = await queryTypes.spamCheck()
  telegram_id = ctx.message.from.id

  permission = await spamCheck
    .getData(command, telegram_id)
    .then(async ({ permission }) => {
      return permission
    })
    .catch(error => console.log(`Error : ${error}`))

  if (permission != `allow`) {
    await ctx.deleteMessage()
    return
  }

  await networkPubs.fetchAndSendDailyPubs(ctx)
})

const commandsPattern = /^\/(otnode-restart|otnode-stop|otnode-start|otnode-logs|otnode-restart2|otnode-stop2|otnode-start2|otnode-logs2|othubbotrestart|othubbotstop|othubbotstart|othubbotlogs|otp-sync-restart|otp-sync-stop|otp-sync-start|otp-sync-logs|otp-sync2-restart|otp-sync2-stop|otp-sync2-start|otp-sync2-logs|otnode-api-restart|otnode-api-stop|otnode-api-start|otnode-api-logs|otnode-app-restart|otnode-app-stop|otnode-app-start|otnode-app-logs)$/;

bot.hears(commandsPattern, async (ctx) => {
  const chatId = ctx.message.chat.id;
  const senderId = ctx.message.from.id;
  if(await isAdmin(chatId, senderId)){
    const commandText = ctx.message.text;
    const command = commandText.slice(1); // remove the '/' at the start
    if(commands[command]) {
      const result = await handleCommand(commands[command]);
      ctx.reply(`Command "${commandText}" has been executed. Result: ${result}`);
    } else {
      ctx.reply('Command not found');
    }
  }
});


// cron.schedule(process.env.ASK_MONITOR, async function () {
//   await askMonitor()
// })

// cron.schedule(process.env.TEAM_MONITOR, async function () {
//   await teamMonitor()
// })

// cron.schedule(process.env.UPTIME_MONITOR, async function () {
//   await uptimeMonitor()
// })

// cron.schedule(process.env.HOURLY, async function () {
//   await networkOverview(`hourly`)
// })

// cron.schedule(process.env.DAILY, async function () {
//   await networkOverview(`daily`)
// })

// cron.schedule(process.env.WEEKLY, async function () {
//   await networkOverview(`weekly`)
// })

// cron.schedule(process.env.MONTHLY, async function () {
//   await networkOverview(`monthly`)
// })

// cron.schedule(process.env.YEARLY, async function () {
//   await networkOverview(`yearly`)
// })

// cron.schedule(process.env.ASK_PROPOSAL, async function () {
//   await closeProposals('ask')
// })

//-----------------------END---------------------------

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
