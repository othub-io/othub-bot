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
const bot = new Telegraf(process.env.BOT_TOKEN)

const keccak256 = require('keccak256')
const mysql = require('mysql')
const connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.OTHUB_DB
})

const op2_connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: 'operationaldb2'
})

function executeOTNODEQuery (query, params) {
  return new Promise((resolve, reject) => {
    connection.query(query, params, (error, results) => {
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

function executeOP2Query (query, params) {
  return new Promise((resolve, reject) => {
    op2_connection.query(query, params, (error, results) => {
      if (error) {
        reject(error)
      } else {
        resolve(results)
      }
    })
  })
}

async function getOP2Data (query, params) {
  try {
    const results = await executeOP2Query(query, params)
    return results
  } catch (error) {
    console.error('Error executing query:', error)
    throw error
  }
}

module.exports = uptimeMonitor = async () => {
  console.log(`Running uptime monitor task.`)

  query = `SELECT * FROM node_operators WHERE nodeGroup = ?`
  params = ['Alliance']
  allianceMembers = await getOTNODEData(query, params)
    .then(results => {
      //console.log('Query results:', results);
      return results
      // Use the results in your variable or perform further operations
    })
    .catch(error => {
      console.error('Error retrieving data:', error)
    })

  allNodes = []
  for (i = 0; i < allianceMembers.length; ++i) {
    allianceMember = allianceMembers[i]
    admin_key = allianceMember.adminKey

    keccak256hash = keccak256(admin_key).toString('hex')
    keccak256hash = '0x' + keccak256hash
    like_keccak256hash = '%' + keccak256hash + '%'

    query = `select networkId from v_nodes where createProfile_adminWallet=? and (removedWalletsHashes not like ? or removedWalletsHashes is null) UNION select nodeId from v_nodes where addedAdminWalletsHashes like ? and (removedWalletsHashes not like ? or removedWalletsHashes is null)  `
    params = [
      admin_key,
      like_keccak256hash,
      like_keccak256hash,
      like_keccak256hash
    ]
    nodeIds = await getOTPData(query, params)
      .then(results => {
        //console.log('Query results:', results);
        return results
        // Use the results in your variable or perform further operations
      })
      .catch(error => {
        console.error('Error retrieving data:', error)
      })

    for (x = 0; x < nodeIds.length; ++x) {
      nodeId = nodeIds[x]
      node_obj = {
        networkId: networkId,
        telegramId: allianceMember.telegramID,
        botToken: allianceMember.botToken
      }
      allNodes.push(node_obj)
    }
  }

  query = `SELECT * from operationaldb2.shard`
  params = []
  operationaldb2 = await getOP2Data(query, params)
    .then(results => {
      //console.log('Query results:', results);
      return results
      // Use the results in your variable or perform further operations
    })
    .catch(error => {
      console.error('Error retrieving data:', error)
    })

  for (i = 0; i < operationaldb2.length; ++i) {
    shardNode = operationaldb2[i]

    member = allNodes.filter(obj => {
      return obj.networkId === shardNode.peer_id
    })

    if (member != '') {
      last_seen = Math.abs(shardNode.last_seen)
      last_dialed = Math.abs(shardNode.last_dialed)
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
      telegramInfo = await bot.telegram.getChatMember(
        process.env.GROUP,
        member.telegramId
      )
      console.log(
        `TG MEMBER ${JSON.stringify(
          telegramInfo.user.username
        )} has not been seen in over an hour.`
      )

      if (member.botToken) {
        member_bot = new Telegraf(member.botToken)

        msg = `@${telegramInfo.user.username}, 
${shardNode.peer_id} has not been seen since ${shardNode.last_seen}.
Last dial attempt was on ${shardNode.last_dialed}.`

        await member_bot.telegram.sendMessage(member.telegramId, msg)
      } else {
        console.log(`MEMBER DID NOT HAVE BOT TOKEN SET.`)
      }
    }
  }
}
