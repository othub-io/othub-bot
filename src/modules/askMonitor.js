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

module.exports = askMonitor = async () => {
  console.log(`Running ask monitoring task.`)
  min = Number(
    process.env.ALLIANCE_RANGE.substring(
      1,
      process.env.ALLIANCE_RANGE.indexOf('-')
    )
  )
  max = Number(process.env.ALLIANCE_RANGE.split('-').pop())

  let member_ids;
  query = 'SELECT distinct tg_id FROM alliance_members WHERE verified = ?'
  await connection.query(query,[1], function (error, results, fields) {
    if (error) throw error;
    member_ids = results;
  });

  console.log(`MEMBER IDS: ` + JSON.stringify(member_ids))

  members_list = []
  for (i = 0; i < member_ids.length; ++i) {
    member_id = member_ids[i]

      let members_node_ids;
      query = 'SELECT network_id FROM alliance_members WHERE verified = ? AND tg_id = ?'
      await connection.query(query,[1,member_id.tg_id], function (error, results, fields) {
        if (error) throw error;
        members_node_ids = results;
      });

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

      console.log(`NODE ID: ` + JSON.stringify(node.network_id))

        let ask;
        query = 'SELECT ask FROM alliance_members WHERE verified = ? AND network_id = ?'
        await connection.query(query,[1,node.network_id], function (error, results, fields) {
          if (error) throw error;
          ask = results;
        });

      ask = Number(ask[0].ask)

      if (ask < min || ask > max) {
        noncompliant.push(node.network_id)
      }
    }

    noncompliant_str = JSON.stringify(noncompliant)

    compliant = 'no'
    if (noncompliant_str == '[]') {
      console.log(`Telegram ID: ${cur_member.member_id.tg_id} IS COMPLIANT`)
      compliant = 'yes'

        query = 'UPDATE node_compliance SET warnings = ? WHERE tg_id = ?'
        await connection.query(query,[0, cur_member.member_id.tg_id], function (error, results, fields) {
          if (error) throw error;
        });
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

        let row;
        query = 'SELECT warnings FROM node_compliance WHERE tg_id = ? AND network_id = ?'
        await connection.query(query,[cur_member.member_id.tg_id, node_id], function (error, results, fields) {
          if (error) throw error;
          row = results;
        });

      console.log(`WARNINGS: ${JSON.stringify(row)}`)

      warnings = 0

      if (row != '') {
        warnings = Number(row[0].warnings)
      }

      if (warnings != 6) {
          query = 'REPLACE INTO node_compliance VALUES (?,?,?,?)'
          await connection.query(query,[node_id,cur_member.member_id.tg_id,'out_of_range', warnings + 1], function (error, results, fields) {
            if (error) throw error;
          });

        await bot.telegram.sendMessage(
          process.env.GROUP,
          `@${tg_member.user.username},
Node ${node_id} is out of the ${process.env.ALLIANCE_RANGE} ask range. ${
            7 - (warnings + 1)
          } days before it is kicked.`
        )

        let bot_id;
        query = 'SELECT bot_id FROM alliance_members WHERE network_id = ? COLLATE NOCASE'
        await connection.query(query,[node_id], function (error, results, fields) {
          if (error) throw error;
          bot_id = results;
        });

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

        let bot_id;
        query = 'SELECT bot_id FROM alliance_members WHERE network_id = ? COLLATE NOCASE'
        await connection.query(query,[node_id], function (error, results, fields) {
          if (error) throw error;
          bot_id = results;
        });

          if(bot_id != ''){
            temp_bot = new Telegraf(bot_id)
              await temp_bot.telegram.sendMessage(
                cur_member.member_id.tg_id,
                `@${tg_member.user.username},
                Node ${node_id} is being kicked for not adhering to the ask range.`
              )
          }

          let nodes;
          query = 'SELECT * FROM alliance_members WHERE verified = ? AND tg_id = ?'
          await connection.query(query,[1, cur_member.member_id.tg_id], function (error, results, fields) {
            if (error) throw error;
            bot_id = results;
          });

        console.log(nodes.length)
        last_node = 'no'
        if (nodes.length == 1) {
          last_node = 'yes'
        }

          query = 'DELETE FROM node_compliance WHERE network_id = ?'
          await connection.query(query,[node_id], function (error, results, fields) {
            if (error) throw error;
            bot_id = results;
          });

        if (last_node == 'yes') {
          await bot.telegram.sendMessage(
            process.env.GROUP,
            `@${tg_member.user.username}, 
There was no node associated with your account. You are being removed from the Allaince.`
          )

          let bot_id;
          query = 'SELECT bot_id FROM alliance_members WHERE network_id = ? COLLATE NOCASE'
          await connection.query(query,[node_id], function (error, results, fields) {
            if (error) throw error;
            bot_id = results;
          });

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

            query = 'DELETE FROM alliance_nodes WHERE network_id = ? COLLATE NOCASE'
            await connection.query(query,[node_id], function (error, results, fields) {
              if (error) throw error;
            });
        }
      }
    }

    console.log(`END`)
  }
};
