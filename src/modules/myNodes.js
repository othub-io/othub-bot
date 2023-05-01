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
const operationaldb2_connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: 'operationaldb2'
})

const otnodedb_connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: 'otnodedb'
})

module.exports = myNodes = async (ctx) => {
  let shard_nodes;
  query = 'SELECT * from operationaldb2.shard'
  await operationaldb2_connection.query(query, function (error, results, fields) {
    if (error) throw error;
    shard_nodes = results;
  });
    
  telegram_id = JSON.stringify(ctx.message.from.id)
          let nodes;
          query = 'SELECT * FROM member_nodes WHERE verified = ? AND tg_id = ?'
          await otnodedb_connection.query(query, [1, telegram_id],function (error, results, fields) {
            if (error) throw error;
            nodes = results;
          });
    
        node_count = Number(nodes.length)
        all_nodes = Number(shard_nodes.length)
    
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
};
