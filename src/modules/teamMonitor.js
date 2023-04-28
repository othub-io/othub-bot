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

const team_nodes = [
  'QmZSFcfQ9DesB4ZjkT3qJ3VyCYDLFRYbC5U1VyVPN47dwE',
  'QmZceSUg7vVEXqcHnQbKMihZ4Kn5etLXbHb5wSzT8R4J1K',
  'QmZ7xMtgJ1vBey5ifvD6yFsxH4VmSQVwtKrX8zNuZ2uiKb',
  'QmYCCXqCe5LHHi9ZxZTw1xTcYXZ47cwk8LmTRAcqWW53e1',
  'QmXkL415jBmkuzi183ALtmCsdEfm3XiUNxLdqKwuUjwCtx',
  'QmVWyGofF7fAiKXyAQyyAKg9YEre7xvggMwqjCz1u4vJ7Y',
  'QmVQfYT9c4iaBmiFZsNcQZJJJbDKuodBHUXSexfnwuUnwg',
  'QmUNnGWcQgeat54n3DpLRMHSHpvcGDhjnL2wdEWBno9eEC',
  'QmTEisCvd7eYiANqVGvHd6RGpQ3ru1pd77Qxnn97PZP3i5',
  'QmSHNjGfzapQL6sNrZTSCL6NCDsjH8i65BGqSjmJ4ZDu9T',
  'QmRiWNNEc9WQAfjX7tM2sdsunbKJTiywWdsYGw6W8Uo1Q1',
  'QmQwA2Hz8zNchVjGX4TWvqySCP5cbkLLVjUSvRsCHhQ4SB',
  'QmQHeX9fHNjdBZxHVtuUQDdQDQ2XnvxaxdG7Y5fgiBimLQ',
  'QmPTT7R3rwKUawLJxEXwcerZfqC2rkYWr2uZiXUo6ftFoS',
  'QmPptt8g1bdJbPic8bZPUY3TqGdDPuJC8jtY5pjR3Gkqan',
  'QmPMNPPsr4iyoTEPwKiWUfwHQEDSDL4Fbf457k8deg1zxr',
  'QmNkmydWxHqj9voSjWkcVewefrDxEuwfyBkbGkwh4oZuWY',
  'Qmetd2wyq6yTqYcUG7DiUSiJmSPVVqtg6ZyeKa7Gastf1k',
  'Qmeay8Jy7nMfi7i4ykeEg7qRS5Ba4NpwSH2aQTxXmjCrbL',
  'QmeaeLpQENK5eHHMF6Kt5iqeFtqADV8vUzcp3jYeSghCQy',
  'QmdxdGWjRqtE2wdoaoWQFMqrUPrsnFoLJ3QcCFDJ3fPtTt',
  'QmdS3NwRXqmHpy6yzZ9k49Sau8Eb67zah1CKZ7nNpLMHoD',
  'QmcB3BHQhUzRmLNzo2rAZGjLPFHUTeGhFLji9AgeZfeQWs',
  'QmbUXe8cNfvtUumZr1CZEibGmYHu5kBjhu5Xwm3PeGsjXY',
  'Qmbt6JkNzKhtxJz4CyBCisjbrz39qb1ziWX9kzez6dFkG9',
  'QmbaHGQByXY8TvBwx1R2eQLt6XXpKeRAg4kEbR1yDjmVuM',
  'Qmb7eiBwhE6JqEWFXSJ7qxJdHZGEfBcfmSZUr8uAEbvcFg',
  'QmaVYtFZcraSnVMpzHhdxHXZHb6juXAQWZ5taShWHWQSUh',
  'QmaSu1NT7R5XYSqvYHwxPmaPBYzKMyBfEViXtBsJg9YWae',
  'QmUUdsHQmRfCPXdd84j3JQCFoJHVGmY3847kCkKSq6n7RN'
]

module.exports = teamMonitor = async () => {
  console.log(`Running team node monitoring task.`)
  node_operators = await bot_db
    .prepare(
      'SELECT peer_id, operator, current_ask, previous_ask, date_last_changed FROM node_operators LIMIT 1000'
    )
    .all()

  console.log(node_operators)

  shardTable = []
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
    shardTable = value
    tl_node_count = 0
    tl_node_ask = 0
    tl_node_change_count = 0

    for (i = 0; i < shardTable.length; ++i) {
      shard_operator = shardTable[i]

      let operator
      let previous_ask
      let node_op_index

      tl_node_found = await team_nodes.includes(shard_operator.peer_id)
      if (tl_node_found) {
        operator = 'Trace labs'
        tl_node_count = tl_node_count + 1
        tl_node_ask = tl_node_ask + Number(shard_operator.ask)
      }

      ask_changed = 'no'
      if (node_operators) {
        node_op_index = await node_operators.findIndex(
          noop => noop.peer_id == shard_operator.peer_id
        )
      }

      exec_type = 'INSERT'
      if (node_op_index != -1) {
        exec_type = 'REPLACE'
        if (node_operators[node_op_index].current_ask != shard_operator.ask) {
          previous_ask = node_operators[node_op_index].current_ask
          ask_changed = 'yes'
        }
      }

      timestamp = new Date()
      abs_timestamp = Math.abs(timestamp)

      await bot_db
        .prepare(
          `${exec_type} INTO node_operators (peer_id, operator, current_ask, previous_ask, date_last_changed) VALUES (?, ?, ?, ?, ?)`
        )
        .run(
          shard_operator.peer_id,
          operator,
          shard_operator.ask,
          previous_ask,
          abs_timestamp
        )

      console.log(ask_changed)
      if (ask_changed == 'yes' && tl_node_found) {
        tl_node_change_count = tl_node_change_count + 1
      }
    }

    if (tl_node_change_count > 0) {
      tl_node_avg = tl_node_ask / tl_node_count

      msg = `${tl_node_change_count} Trace Labs hs changed their asks. The average TL node ask is now ${tl_node_avg.toFixed(
        4
      )}`
      await tellBot(msg)
    }
    return
  }

  async function tellBot (msg) {
    bot.telegram.sendMessage(process.env.GROUP, msg)
  }
};
