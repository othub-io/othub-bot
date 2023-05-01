const fs = require("fs");
require('dotenv').config()

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
const otnodedb_connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: 'otnodedb'
})

module.exports = newMember = async (ctx) => {
    console.log(`Screening new member.`)
    console.log(ctx.message.new_chat_members)
    telegram_id = JSON.stringify(ctx.message.new_chat_members[0].id)

        let node;
        query = 'SELECT * FROM alliance_members WHERE verified = ? AND tg_id = ?'
        await otnodedb_connection.query(query, [1, telegram_id],function (error, results, fields) {
          if (error) throw error;
          node = results;
        });

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
