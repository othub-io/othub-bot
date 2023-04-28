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

module.exports = askMonitor = async () => {
  console.log(`Running ask monitoring task.`)
  min = Number(
    process.env.ALLIANCE_RANGE.substring(
      1,
      process.env.ALLIANCE_RANGE.indexOf('-')
    )
  )
  max = Number(process.env.ALLIANCE_RANGE.split('-').pop())

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

    console.log(i + `--MEMBERS NODE IDS: ` + JSON.stringify(members_node_ids))

    if (members_node_ids == '') {
      console.log(`No nodes found for sure. Kicking...`)
      tg_member = await bot.telegram.getChatMember(process.env.GROUP, member_id)
      await bot.telegram.sendMessage(
        process.env.GROUP,
        `@${tg_member.user.username}, 
There was no node associated with your account. You are being removed from the Allaince.`
      )
      await bot.telegram.kickChatMember(process.env.GROUP, member_id.tg_id)
      await bot.telegram.unbanChatMember(process.env.GROUP, member_id.tg_id)

      return
    }

    obj = {
      member_id: member_id,
      node_ids: members_node_ids
    }

    members_list.push(obj)
  }

  console.log(`MEMBERS LIST: ` + JSON.stringify(members_list))

  for (a = 0; a < Number(members_list.length); ++a) {
    cur_member = members_list[a]

    noncompliant = []
    for (b = 0; b < cur_member.node_ids.length; ++b) {
      node = cur_member.node_ids[b]

      console.log(`NODE ID: ` + JSON.stringify(node.node_id))
      ask = await alliance_db
        .prepare(
          'SELECT ask FROM member_nodes WHERE verified = ? AND node_id = ?'
        )
        .all(1, node.node_id)

      ask = Number(ask[0].ask)

      if (ask < min || ask > max) {
        noncompliant.push(node.node_id)
      }
    }

    noncompliant_str = JSON.stringify(noncompliant)

    compliant = 'no'
    if (noncompliant_str == '[]') {
      console.log(`Telegram ID: ${cur_member.member_id.tg_id} IS COMPLIANT`)
      compliant = 'yes'

      await bot_db
        .prepare(`UPDATE node_compliance SET warnings = ? WHERE tg_id = ?`)
        .run(0, cur_member.member_id.tg_id)
    }

    if (compliant == 'no') {
      tg_member = await bot.telegram.getChatMember(
        process.env.GROUP,
        cur_member.member_id.tg_id
      )
      console.log(`TG MEMBER: ` + JSON.stringify(tg_member))
    }

    for (c = 0; c < Number(noncompliant.length); ++c) {
      node_id = noncompliant[c]

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
          `@${tg_member.user.username},
Node ${node_id} is out of the ${process.env.ALLIANCE_RANGE} ask range. ${
            7 - (warnings + 1)
          } days before it is kicked.`
        )

        bot_id = await alliance_db
        .prepare('SELECT bot_id FROM member_nodes WHERE node_id = ? COLLATE NOCASE')
        .all(node_id)

        if(bot_id != ''){
          temp_bot = new Telegraf(bot_id)
            await temp_bot.telegram.sendMessage(
              cur_member.member_id.tg_id,
              `@${tg_member.user.username},
    Node ${node_id} is out of the ${process.env.ALLIANCE_RANGE} ask range. ${
                7 - (warnings + 1)
              } days before it is kicked.`
            )
        }
      }

      if (warnings >= 6) {
        await bot.telegram.sendMessage(
          process.env.GROUP,
          `@${tg_member.user.username}, 
Node ${node_id} is being kicked for not adhering to the ask range.`
        )

        bot_id = await alliance_db
          .prepare('SELECT bot_id FROM member_nodes WHERE node_id = ? COLLATE NOCASE')
          .all(node_id)

          if(bot_id != ''){
            temp_bot = new Telegraf(bot_id)
              await temp_bot.telegram.sendMessage(
                cur_member.member_id.tg_id,
                `@${tg_member.user.username},
                Node ${node_id} is being kicked for not adhering to the ask range.`
              )
          }

        nodes = await alliance_db
          .prepare(
            'SELECT * FROM member_nodes WHERE verified = ? AND tg_id = ?'
          )
          .all(1, cur_member.member_id.tg_id)

        console.log(nodes.length)
        last_node = 'no'
        if (nodes.length == 1) {
          last_node = 'yes'
        }

        await bot_db
          .prepare(`DELETE FROM node_compliance WHERE node_id = ?`)
          .run(node_id)

        if (last_node == 'yes') {
          await bot.telegram.sendMessage(
            process.env.GROUP,
            `@${tg_member.user.username}, 
There was no node associated with your account. You are being removed from the Allaince.`
          )

          bot_id = await alliance_db
          .prepare('SELECT bot_id FROM member_nodes WHERE node_id = ? COLLATE NOCASE')
          .all(node_id)

          if(bot_id != ''){
            temp_bot = new Telegraf(bot_id)
              await temp_bot.telegram.sendMessage(
                cur_member.member_id.tg_id,
                `@${tg_member.user.username},
                There was no node associated with your account. You are being removed from the Allaince.`
              )
          }

          await bot.telegram.kickChatMember(
            process.env.GROUP,
            cur_member.member_id.tg_id
          )
          await bot.telegram.unbanChatMember(
            process.env.GROUP,
            cur_member.member_id.tg_id
          )

          await alliance_db
            .prepare(
              `DELETE FROM member_nodes WHERE node_id = ? COLLATE NOCASE`
            )
            .run(node_id)
        }
      }
    }

    console.log(`END`)
  }
};
