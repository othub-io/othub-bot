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

module.exports = myNodes = async (ctx) => {
    await connection.query(
        'SELECT * from operationaldb2.shard',
        function (error, row) {
          if (error) {
            throw error
          } else {
            setValue(row)
          }
        }
      )
    
      async function setValue (value) {
        telegram_id = JSON.stringify(ctx.message.from.id)
    
        nodes = await alliance_db
          .prepare('SELECT * FROM member_nodes WHERE verified = ? AND tg_id = ?')
          .all(1, telegram_id)
    
        node_count = Number(nodes.length)
        all_nodes = Number(value.length)
    
        total_ask = 0
        total_stake = 0
        for (i = 0; i < nodes.length; ++i) {
          node = nodes[i]
          total_ask = total_ask + Number(node.ask)
          total_stake = total_stake + Number(node.stake)
        }
    
        console.log(all_nodes)
        node_percent = 100 * (node_count / all_nodes)
        avg_stake = total_stake / node_count
    
        msg = `@${ctx.message.from.username}
    Nodes: ${node_count}(${node_percent.toFixed(2)}%)
    Avg. Ask: ${total_ask / node_count}
    Avg. Stake: ${avg_stake.toFixed(2)}
        `
    
        await bot.telegram.sendMessage(process.env.GROUP, msg)
        await ctx.deleteMessage()
      }
};
