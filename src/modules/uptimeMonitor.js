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
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'admin',
  database: 'operationaldb2'
})


module.exports = uptimeMonitor = async () => {
  console.log(`Running uptime monitor task.`)
  members = await alliance_db
    .prepare('SELECT * FROM member_nodes WHERE verified = ?')
    .all(1)

  shard_nodes = []
  await connection.query(
    `SELECT * from operationaldb2.shard`,
    async function (error, row) {
      if (error) {
        console.log(error)
        return
      } else {
        setValue(row)
      }
    }
  )

  async function setValue (value) {
    shard_nodes = value
    //console.log(shard_nodes)

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
  }
};
