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

module.exports = askReconciliation = async () => {
  console.log(`Running ask reconciliation task.`)
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

      await alliance_db
        .prepare(
          `UPDATE member_nodes SET ask = ?, stake = ? WHERE node_id = ? COLLATE NOCASE`
        )
        .run(shard_node.ask, shard_node.stake, shard_node.peer_id)
    }
  }
};
