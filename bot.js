require('dotenv').config()

const queryTypes = require('./src/util/queryTypes')
const networkOverview = require('./src/modules/networkOverview.js')
const uptimeMonitor = require('./src/modules/uptimeMonitor.js')
const teamMonitor = require('./src/modules/teamMonitor.js')
const askMonitor = require('./src/modules/askMonitor.js')
const myNodes = require('./src/modules/myNodes.js')
const newMember = require('./src/modules/newMember.js')
const closeProposals = require('./src/modules/closeProposals.js')

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

cron.schedule(process.env.ASK_MONITOR, async function () {
  await askMonitor()
})

cron.schedule(process.env.TEAM_MONITOR, async function () {
  await teamMonitor()
})

cron.schedule(process.env.UPTIME_MONITOR, async function () {
  await uptimeMonitor()
})

cron.schedule(process.env.HOURLY, async function () {
  await networkOverview(`hourly`)
})

cron.schedule(process.env.DAILY, async function () {
  await networkOverview(`daily`)
})

cron.schedule(process.env.WEEKLY, async function () {
  await networkOverview(`weekly`)
})

cron.schedule(process.env.MONTHLY, async function () {
  await networkOverview(`monthly`)
})

cron.schedule(process.env.YEARLY, async function () {
  await networkOverview(`yearly`)
})

// cron.schedule(process.env.ASK_PROPOSAL, async function () {
//   await closeProposals('ask')
// })

//-----------------------END---------------------------

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
