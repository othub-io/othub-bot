const fs = require("fs");
require('dotenv').config()
const alliance_db = require('better-sqlite3')(process.env.ALLIANCE_DB)
const queryTypes = require("../util/queryTypes");
const bot_db = require('better-sqlite3')(process.env.BOT_DB, {
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


module.exports = uptimeMonitor = async () => {
  console.log(`Running uptime monitor task.`)

    let members;
    query = 'SELECT * FROM alliance_members WHERE verified = ?'
    await otnodedb_connection.query(query, [1],function (error, results, fields) {
      if (error) throw error;
      members = results;
    });

    let shard_nodes;
    query = 'SELECT * from operationaldb2.shard'
    await operationaldb2_connection.query(query, function (error, results, fields) {
      if (error) throw error;
      shard_nodes = results;
    });

    for (i = 0; i < shard_nodes.length; ++i) {
      shard_node = shard_nodes[i]

      member = members.filter(obj => {
        return obj.node_id === shard_node.peer_id
      })

      if (member != '') {
        last_seen = Math.abs(shard_node.last_seen)
        last_dialed = Math.abs(shard_node.last_dialed)
      }

      let is_down
      if (last_seen) {
        time_stamp = new Date()
        time_stamp = Math.abs(time_stamp)

        is_down =
          last_dialed - last_seen > Number(process.env.UPTIME_FREQ)
            ? 'true'
            : 'false'
      }

      if (is_down == 'true') {
        tg_member = await bot.telegram.getChatMember(
          process.env.GROUP,
          member[0].tg_id
        )
        console.log(
          `TG MEMBER ${JSON.stringify(
            tg_member.user.username
          )} has not been seen in over an hour.`
        )

        if (member[0].bot_id) {
          temp_bot = new Telegraf(member[0].bot_id)

          msg = `@${tg_member.user.username}, 
${shard_node.peer_id} has not been seen since ${shard_node.last_seen}.
Last dial attempt was on ${shard_node.last_dialed}.`

          await temp_bot.telegram.sendMessage(member[0].tg_id, msg)
        } else {
          console.log(`MEMBER DID NOT HAVE BOT TOKEN SET.`)
        }
      }
    }
};
