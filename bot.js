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
const express = require('express')
const shell = require('shelljs')

const mysql = require('mysql')
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'admin',
  database: 'operationaldb2'
})

bot.use(session({ ttl: 10 }))

//-------------------------------------NO API REQUIRED - AlPHABETICAL --------------------------------------------
bot.on('new_chat_members', async ctx => {
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
      `Welcome to the Alliance, @${ctx.message.new_chat_members[0].first_name}!`
    )
  }
})

cron.schedule(process.env.ASK_RECONCILIATION, async function () {
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
    console.log(shard_nodes)

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
  min = Number(
    process.env.ALLIANCE_RANGE.substring(
      0,
      process.env.ALLIANCE_RANGE.indexOf('-')
    )
  )
  max = Number(
    process.env.ALLIANCE_RANGE.substring(
      1,
      process.env.ALLIANCE_RANGE.indexOf('-')
    )
  )

  member_ids = await alliance_db
    .prepare('SELECT distinct tg_id FROM member_nodes WHERE verified = ?')
    .all(1)

  members_list = []
  for (i = 0; i < member_ids.length; ++i) {
    member_id = JSON.stringify(member_ids[i])

    members_node_ids = await alliance_db
      .prepare(
        'SELECT node_id FROM member_nodes WHERE verified = ? AND tg_id = ?'
      )
      .all(1, member_id)

    obj = {
      member_id: member_id,
      node_ids: members_node_ids
    }

    members_list.push(obj)
  }

  for (i = 0; i < members_list.length; ++i) {
    cur_member = members_list[i]

    noncompliant = []
    for (i = 0; i < cur_member.node_ids.length; ++i) {
      node_id = JSON.stringify(cur_member.node_ids[i])

      node_ask = await alliance_db
        .prepare(
          'SELECT ask FROM member_nodes WHERE verified = ? AND node_id = ?'
        )
        .all(1, node_id)

      if (node_ask < min || node_ask > max) {
        noncompliant.push(node_id)
      }
    }

    if (noncompliant != '') {
      for (i = 0; i < noncompliant.length; ++i) {
        node_id = JSON > stringify(noncompliant[i])

        warnings = await alliance_db
          .prepare(
            'SELECT warnings FROM node_compliance WHERE tg_id = ? AND node_id = ?'
          )
          .all(cur_member.member_id, node_id)

        if (warnings == '') {
          warnings = 0
        }

        if (warnings == '6') {
          await bot.telegram.sendMessage(
            cur_member.member_id,
            `Node ${node_id} is being kicked from the Alliance for not adhering to the ask range. Please reverify and stay within the ask range.`
          )

          await alliance_db
            .prepare(`DELETE FROM member_nodes node_id = ? COLLATE NOCASE`)
            .run(node_id)
        } else {
          await alliance_db
            .prepare(`REPLACE INTO node_compliance VALUES (?,?,?,?)`)
            .run(node_id, member_id, 'out_of_range', warnings + 1)

          await bot.telegram.sendMessage(
            cur_member.member_id,
            `Node ${node_id} is outside of the Alliance ask range. You have ${
              7 - (warnings + 1)
            } days to comply before being kicked.`
          )
        }
      }
    } else {
      await alliance_db
        .prepare(`UPDATE member_incidents SET warnings = ? WHERE tg_id = ?`)
        .run(0, member.tg_id)
    }

    exists = await alliance_db
      .prepare('SELECT * FROM member_nodes WHERE tg_id = ?')
      .all(cur_member.member_id)

    if (exists == '') {
      await bot.telegram.sendMessage(
        cur_member.member_id,
        `You have no registered nodes with the Alliance. Please verify a node to become a member again.`
      )

      bot.telegram.banChatMember(cur_member.member_id)
      bot.telegram.unbanChatMember(cur_member.member_id)
    }
  }
})

//-----------------------END---------------------------

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
