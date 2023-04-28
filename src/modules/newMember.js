const fs = require("fs");
require('dotenv').config()
const alliance_db = require('better-sqlite3')(process.env.ALLIANCE_DB)
const queryTypes = require("../util/queryTypes");
const bot_db = require('better-sqlite3')(`${__dirname}/database/bot.db`, {
  verbose: console.log
})

const {
  Telegraf,
  session,
  Scenes,
  Markup,
  BaseScene,
  Stage
} = require('telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN)

const mysql = require('mysql')
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'admin',
  database: 'operationaldb2'
})

module.exports = newMember = async (ctx) => {
    console.log(`Screening new member.`)
    console.log(ctx.message.new_chat_members)
    telegram_id = JSON.stringify(ctx.message.new_chat_members[0].id)
    console.log(telegram_id)

    node = await alliance_db
        .prepare('SELECT * FROM member_nodes WHERE verified = ? AND tg_id = ?')
        .all(1, telegram_id)

    console.log(node)
    console.log(ctx.message.new_chat_members[0].is_bot)

    if (node == '' && ctx.message.new_chat_members[0].is_bot == false) {
        ctx.banChatMember(telegram_id)
        ctx.unbanChatMember(telegram_id)
        return
    }

    if (ctx.message.new_chat_members[0].is_bot == false) {
        return ctx.reply(
        `Welcome to the Alliance, @${ctx.message.new_chat_members[0].username}!`
        )
    }
};
