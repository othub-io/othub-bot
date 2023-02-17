require('dotenv').config()
const alliance_db = require('better-sqlite3')(process.env.ALLIANCE_DB, {
  verbose: console.log
})
const bot_db = require('better-sqlite3')(`${__dirname}/database/bot.db`, {
  verbose: console.log
})
const queryTypes = require('./src/util/queryTypes')
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
const express = require('express')
const shell = require('shelljs')

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
  'QmaSu1NT7R5XYSqvYHwxPmaPBYzKMyBfEViXtBsJg9YWae'
]

bot.use(session({ ttl: 10 }))

//-------------------------------------NO API REQUIRED - AlPHABETICAL --------------------------------------------
bot.on('new_chat_members', async ctx => {
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
      `Welcome to the Alliance, ${ctx.message.new_chat_members[0].first_name}!`
    )
  }
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

    msg = `${ctx.message.from.first_name}'s Nodes:
        Nodes: ${node_count}(${node_percent.toFixed(2)}%)
        Avg. Ask: ${total_ask / node_count}
        Avg. Stake: ${avg_stake.toFixed(2)}
    `

    await bot.telegram.sendMessage(process.env.GROUP, msg)
    await ctx.deleteMessage()
  }
})

cron.schedule(process.env.ASK_RECONCILIATION, async function () {
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
})

cron.schedule(process.env.ASK_MONITOR, async function () {
  console.log(`Running ask monitoring task.`)
  min = Number(
    process.env.ALLIANCE_RANGE.substring(
      1,
      process.env.ALLIANCE_RANGE.indexOf('-')
    )
  )
  max = Number(process.env.ALLIANCE_RANGE.split('-').pop())

  console.log(`min-max set:`)

  member_ids = await alliance_db
    .prepare('SELECT distinct tg_id FROM member_nodes WHERE verified = ?')
    .all(1)

  console.log(`MEMBER IDS: ` + JSON.stringify(member_ids))

  members_list = []
  for (i = 0; i < member_ids.length; ++i) {
    member_id = member_ids[i]

    members_node_ids = await alliance_db
      .prepare(
        'SELECT node_id FROM member_nodes WHERE verified = ? AND tg_id = ?'
      )
      .all(1, member_id.tg_id)

    console.log(`MEMBERS NODE IDS: ` + members_node_ids)

    if (members_node_ids == '') {
      console.log(`No nodes found for sure. Kicking...`)
      await bot.telegram.sendMessage(
        process.env.GROUP,
        `There was no node found associated with telegram id ${member_id}. Banning member until a node is registed.`
      )
      bot.telegram.banChatMember(telegram_id)
      bot.telegram.unbanChatMember(telegram_id)

      return
    }

    obj = {
      member_id: member_id,
      node_ids: members_node_ids
    }

    members_list.push(obj)
  }

  console.log(`MEMBERS LIST: ` + JSON.stringify(members_list))

  console.log(members_list.length)
  for (a = 0; a < Number(members_list.length); ++a) {
    cur_member = members_list[a]
    console.log(`MEMBER COUNT: ` + a)

    console.log(`CURRENT MEMBER: ` + JSON.stringify(cur_member))
    noncompliant = []
    for (b = 0; b < cur_member.node_ids.length; ++b) {
      node = cur_member.node_ids[b]

      console.log(`NODE ID: ` + JSON.stringify(node.node_id))
      ask = await alliance_db
        .prepare(
          'SELECT ask FROM member_nodes WHERE verified = ? AND node_id = ?'
        )
        .all(1, node.node_id)

      console.log(`NODE ASK: ` + JSON.stringify(ask))
      ask = Number(ask[0].ask)

      console.log(ask)
      console.log(min)
      console.log(max)

      if (ask < min || ask > max) {
        noncompliant.push(node.node_id)
      }
    }

    console.log(`NONCOMPLAINT: ` + JSON.stringify(noncompliant))

    if (noncompliant == '') {
      console.log(`Clearing warnings.`)

      previous_offender = await bot_db
        .prepare('SELECT * FROM node_compliance WHERE tg_id = ?')
        .all(cur_member.member_id.tg_id)
      console.log(warnings)
    }

    if (previous_offender != []) {
      await alliance_db
        .prepare(`UPDATE node_compliance (warnings) VALUES (?) WHERE tg_id = ?`)
        .run(0, cur_member.member_id.tg_id)
    }

    tg_member = await bot.telegram.getChatMember(
      process.env.GROUP,
      cur_member.member_id.tg_id
    )

    console.log(`TG MEMBER: ` + tg_member)
    for (c = 0; c < Number(noncompliant.length); ++c) {
      node_id = noncompliant[c]

      console.log(`thththth ` + cur_member.member_id.tg_id)

      row = await bot_db
        .prepare(
          'SELECT warnings FROM node_compliance WHERE tg_id = ? AND node_id = ?'
        )
        .all(cur_member.member_id.tg_id, node_id)

      console.log(`WARNINGS: ${JSON.stringify(row)}`)

      warnings = 0

      if (row != '') {
        warnings = Number(row[0].warnings)
      }

      if (warnings != 6) {
        await bot_db
          .prepare(`REPLACE INTO node_compliance VALUES (?,?,?,?)`)
          .run(
            node_id,
            cur_member.member_id.tg_id,
            'out_of_range',
            warnings + 1
          )

        await bot.telegram.sendMessage(
          process.env.GROUP,
          `Node ${node_id} is outside of the Alliance ask range. You have ${
            7 - (warnings + 1)
          } days to comply before being kicked.`
        )
      }

      if (warnings == 6) {
        await bot.telegram.sendMessage(
          process.env.GROUP,
          `Node ${node_id} is being kicked from the Alliance for not adhering to the ask range. Please reverify and stay within the ask range.`
        )

        await alliance_db
          .prepare(`DELETE FROM member_nodes node_id = ? COLLATE NOCASE`)
          .run(node_id)
      }
    }

    console.log(`END`)
  }
})

cron.schedule(process.env.TEAM_MONITOR, async function () {
  console.log(`Running team node monitoring task.`)
  node_operators = await db
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

      await db
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
})

cron.schedule(process.env.ALLIANCE_INFO, async function () {
  console.log(`Running daily alliance task.`)
  nodes = await alliance_db
    .prepare('SELECT * FROM member_nodes WHERE verified = ?')
    .all(1)

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
    console.log(shardTable)
    peer_ids = []
    asks = []
    stakes = []
    last_seen = []
    total_nodes = Number(shardTable.length)

    total_TL_ask = 0
    total_TL_stake = 0
    total_free_ask = 0
    total_free_stake = 0

    for (i = 0; i < shardTable.length; ++i) {
      node_runner = shardTable[i]

      peer_ids.push(node_runner.peer_id)
      asks.push(node_runner.ask)
      stakes.push(node_runner.stake)
      last_seen.push(node_runner.last_seen)

      tl_node_found = await team_nodes.includes(node_runner.peer_id)
      alliance_node_found = await nodes.includes(node_runner.peer_id)

      if (tl_node_found) {
        total_TL_ask = total_TL_ask + Number(node_runner.ask)
        total_TL_stake = total_TL_stake + Number(node_runner.stake)
      }

      if (!tl_node_found && !alliance_node_found) {
        total_free_ask = total_free_ask + Number(node_runner.ask)
        total_free_stake = total_free_stake + Number(node_runner.stake)
      }
    }

    total_alliance_ask = 0
    total_alliance_stake = 0
    for (i = 0; i < nodes.length; ++i) {
      node = nodes[i]
      total_alliance_ask = total_alliance_ask + Number(node.ask)
      total_alliance_stake = total_alliance_stake + Number(node.stake)
    }

    total_ask = 0
    total_stake = 0
    for (i = 0; i < asks.length; ++i) {
      ask = Number(asks[i])
      total_ask = total_ask + ask
    }

    for (i = 0; i < stakes.length; ++i) {
      stake = Number(stakes[i])
      total_stake = total_stake + stake
    }

    alliance_nodes = Number(nodes.length)
    TL_nodes = Number(team_nodes.length)
    free_nodes = total_nodes - (alliance_nodes + TL_nodes)
    all_nodes = total_nodes

    console.log(total_alliance_ask)
    console.log(total_alliance_stake)
    console.log(alliance_nodes)

    console.log(total_TL_ask)
    console.log(total_TL_stake)
    console.log(TL_nodes)

    alliance_nodes_percent = 100 * (alliance_nodes / all_nodes)
    TL_nodes_percent = 100 * (TL_nodes / all_nodes)
    free_nodes_percent = 100 * (free_nodes / all_nodes)

    alliance_ask = total_alliance_ask / alliance_nodes
    TL_ask = total_TL_ask / TL_nodes
    free_ask = total_free_ask / free_nodes
    all_ask = total_ask / total_nodes

    alliance_stake = total_alliance_stake / alliance_nodes
    TL_stake = total_TL_stake / TL_nodes
    free_stake = total_free_stake / free_nodes
    all_stake = total_stake / total_nodes

    msg = `-OriginTrail Node Ops Alliance- 

->Current ask range: ${process.env.ALLIANCE_RANGE}

->Nodes: 
Alliance: ${alliance_nodes}(${alliance_nodes_percent.toFixed(
      0
    )}%) | TraceLabs: ${TL_nodes}(${TL_nodes_percent.toFixed(
      0
    )}%) | Solo: ${free_nodes}(${free_nodes_percent.toFixed(
      0
    )}%) | Total: ${all_nodes} 

->Avg. Asks:  
Alliance: ${alliance_ask.toFixed(4)} | TraceLabs: ${TL_ask.toFixed(
      4
    )} | Solo: ${free_ask.toFixed(4)} | All: ${all_ask.toFixed(4)}
    
-> Avg. Stakes: 
Alliance: ${alliance_stake.toFixed(2)} | TraceLabs: ${TL_stake.toFixed(
      2
    )} | Solo: ${free_stake.toFixed(2)} | All: ${all_stake.toFixed(2)}
           `

    console.log(msg)
    await bot.telegram.sendMessage(process.env.GROUP, msg)
  }
})

//-----------------------END---------------------------

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
