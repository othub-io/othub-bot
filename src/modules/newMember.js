const fs = require('fs')
require('dotenv').config()

const {
  Telegraf,
  session,
  Scenes,
  Markup,
  BaseScene,
  Stage
} = require('telegraf')

const mysql = require('mysql')
const otnodedb_connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: 'otnodedb'
})

function executeOTNODEQuery (query, params) {
  return new Promise((resolve, reject) => {
    otnodedb_connection.query(query, params, (error, results) => {
      if (error) {
        reject(error)
      } else {
        resolve(results)
      }
    })
  })
}

async function getOTNODEData (query, params) {
  try {
    const results = await executeOTNODEQuery(query, params)
    return results
  } catch (error) {
    console.error('Error executing query:', error)
    throw error
  }
}

module.exports = newMember = async ctx => {
  try {
    console.log(`Screening new member.`)
    telegramId = JSON.stringify(ctx.message.new_chat_members[0].id)

    query = `SELECT * FROM node_operators WHERE nodeGroup = ? AND telegramId =?`
    params = ['Alliance', telegramId]
    allianceMember = await getOTNODEData(query, params)
      .then(results => {
        //console.log('Query results:', results);
        return results
        // Use the results in your variable or perform further operations
      })
      .catch(error => {
        console.error('Error retrieving data:', error)
      })

    if (
      allianceMember == '' &&
      ctx.message.new_chat_members[0].is_bot == false
    ) {
      ctx.banChatMember(telegramId)
      ctx.unbanChatMember(telegramId)
      return
    }

    if (ctx.message.new_chat_members[0].is_bot == false) {
      return ctx.reply(
        `Welcome to the Alliance, @${ctx.message.new_chat_members[0].username}!`
      )
    }
  } catch (e) {
    console.log(e)
  }
}
