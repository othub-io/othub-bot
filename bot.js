require('dotenv').config()
const alliance_db = require('better-sqlite3')(process.env.ALLIANCE_DB)
// const queryTypes = require('./src/util/queryTypes')
// const dailyStats = require('./src/modules/dailyStats.js')
// const profit = require('./src/modules/profit.js')
// const profile = require('./src/modules/profile.js')
// const tip = require('./src/modules/tip.js')
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

bot.use(session({ ttl: 10 }))

//-------------------------------------NO API REQUIRED - AlPHABETICAL --------------------------------------------
bot.on('new_chat_members', async ctx => {
  console.log(ctx.message.new_chat_members)
  telegram_id = ctx.message.new_chat_members[0].id
  console.log(telegram_id)

  node = await alliance_db
    .prepare(`SELECT * FROM member_nodes WHERE tg_id = '?' AND verified = '?'`)
    .all(telegram_id, '1')

  console.log(node)
  console.log(ctx.message.new_chat_members[0].is_bot)

  if (node == '' && ctx.message.new_chat_members[0].is_bot == false) {
    ctx.banChatMember(telegram_id)
    ctx.unbanChatMember(telegram_id)
    return
  }

  if (ctx.message.new_chat_members[0].is_bot == false) {
    return ctx.reply(
      `Welcome to the Alliance, @${ctx.message.new_chat_members[0].first_name}!`
    )
  }
})

//-----------------------END---------------------------

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
