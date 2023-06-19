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
const { isAdmin , commandsHandler } = require('./src/modules/systemCommands.js')
const adminCommandList = require('./src/modules/adminCommandList.js')
const generalCommandList = require('./src/modules/generalCommandList.js')

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

  const messageText = await myNodes(ctx)
  const message = await ctx.reply(messageText)

  // Delete the message after 30 seconds
  setTimeout(async () => {
    try {
      await ctx.telegram.deleteMessage(ctx.chat.id, message.message_id)
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }, 10000)
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

  const message = await networkPubs.fetchAndSendHourlyPubs(ctx)

  // Delete the message after 30 seconds
  setTimeout(async () => {
    try {
      await ctx.telegram.deleteMessage(ctx.chat.id, message.message_id)
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }, 10000)
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

  const messageText = await networkPubs.fetchAndSendDailyPubs(ctx)
  const message = await ctx.reply(messageText)

  // Delete the message after 30 seconds
  setTimeout(async () => {
    await ctx.deleteMessage(message.message_id)
  }, 10000)
})

commandsHandler(bot);

bot.command('commands', (ctx) => {
  let message = 'Here are the general commands:\n\n';

  for (const [command, description] of Object.entries(generalCommandList)) {
    message += `/${command} - ${description}\n`;
  }

  ctx.reply(message);
});

bot.command('admincommands', (ctx) => {
  if (!isAdmin(ctx)) {
    ctx.reply('You are not authorized to view admin commands.');
    return;
  }

  let message = 'Here are the admin commands:\n\n';

  for (const [command, description] of Object.entries(adminCommandList)) {
    message += `/${command} - ${description}\n`;
  }

  ctx.reply(message);
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
