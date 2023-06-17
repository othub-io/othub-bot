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
const otnodedb_connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.BOT_DB
})

const otp_connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.SYNC_DB
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

function executeOTPQuery (query, params) {
  return new Promise((resolve, reject) => {
    otp_connection.query(query, params, (error, results) => {
      if (error) {
        reject(error)
      } else {
        resolve(results)
      }
    })
  })
}

async function getOTPData (query, params) {
  try {
    const results = await executeOTPQuery(query, params)
    return results
  } catch (error) {
    console.error('Error executing query:', error)
    throw error
  }
}

module.exports = myNodes = async ctx => {
  try {
    query = `SELECT * FROM node_operators WHERE telegramId = ?`
    params = [ctx.message.from.id]
    member = await getOTNODEData(query, params)
      .then(results => {
        //console.log('Query results:', results);
        return results
        // Use the results in your variable or perform further operations
      })
      .catch(error => {
        console.error('Error retrieving data:', error)
      })

    query = `select networkId from v_nodes`
    params = []
    v_nodes = await getOTPData(query, params)
      .then(results => {
        //console.log('Query results:', results);
        return results
        // Use the results in your variable or perform further operations
      })
      .catch(error => {
        console.error('Error retrieving data:', error)
      })

    query = `select * from v_avgNode`
    params = []
    v_avgNode = await getOTPData(query, params)
      .then(results => {
        //console.log('Query results:', results);
        return results
        // Use the results in your variable or perform further operations
      })
      .catch(error => {
        console.error('Error retrieving data:', error)
      })

    adminKey = member.adminKey
    keccak256hash = keccak256(adminKey).toString('hex')
    keccak256hash = '0x' + keccak256hash
    like_keccak256hash = '%' + keccak256hash + '%'

    query = `select nodeId from v_nodes where createProfile_adminWallet=? and (removedWalletsHashes not like ? or removedWalletsHashes is null) UNION select nodeId from v_nodes where addedAdminWalletsHashes like ? and (removedWalletsHashes not like ? or removedWalletsHashes is null)  `
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

    nodeResults = []
    for (i = 0; i < nodeIds.length; ++i) {
      nodeId = nodeIds[i]

      query = `select * from v_nodes_stats where nodeId=? order by date desc LIMIT 1`
      params = [nodeId]
      node = await getOTPData(query, params)
        .then(results => {
          //console.log('Query results:', results);
          return results
          // Use the results in your variable or perform further operations
        })
        .catch(error => {
          console.error('Error retrieving data:', error)
        })

      nodeResults.push(node[0])
    }

    totalStake = 0
    ask = 0
    potentialPayouts24h = 0
    potentialPayoutsTotal = 0
    payouts24h = 0
    payoutsTotal = 0
    pubsCommitted = 0

    for (i = 0; i < nodeResults.length; ++i) {
      results = nodeResults[i]
      totalStake = totalStake + Number(results.nodeStake)
      ask = ask + Number(results.Ask)
      potentialPayouts24h =
        potentialPayouts24h + Number(results.potentialPayouts24h)
      potentialPayoutsTotal =
        potentialPayoutsTotal + Number(results.potentialPayoutsTotal)
      payouts24h = payouts24h + Number(results.payouts24h)
      payoutsTotal = payoutsTotal + Number(results.payoutsTotal)
      pubsCommitted = pubsCommitted + Number(results.pubsCommitted)
    }

    avgStake = (totalStake / Number(nodeResults.length)).toFixed(2)
    avgAsk = (ask / Number(nodeResults.length)).toFixed(2)
    nodePercent = (Number(nodeResults.length) / Number(v_nodes.length)) * 100

    benchmarkPubs = Number(v_avgNode[0].pubsCommitted)
    performance = ''

    if (benchmarkPubs + 25 < pubsCommitted / Number(results.pubsCommitted)) {
      performance = 'Good'
    }

    if (benchmarkPubs + 50 < pubsCommitted / Number(results.pubsCommitted)) {
      performance = 'Great'
    }

    if (
      benchmarkPubs - 10 > pubsCommitted / Number(results.pubsCommitted) ||
      benchmarkPubs + 10 < pubsCommitted / Number(results.pubsCommitted)
    ) {
      performance = 'Average'
    }

    if (benchmarkPubs - 25 > pubsCommitted / Number(results.pubsCommitted)) {
      performance = 'Poor'
    }

    if (benchmarkPubs - 50 > pubsCommitted / Number(results.pubsCommitted)) {
      performance = 'Bad'
    }

    msg = `@${ctx.message.from.username}
    Nodes: ${Number(nodeResults.length)}(${nodePercent.toFixed(2)}%)
    Avg. Ask: ${avgAsk}
    Avg. Stake: ${avgStake}
    24h Pubs Won: ${pubsCommitted}
    
    24h Payouts: ${payouts24h}
    Total Payouts: ${payoutsTotal}

    Pending 24h Payouts: ${potentialPayouts24h}
    Pending Payouts: ${potentialPayoutsTotal}

    Overall Performance: ${performance}
        `

    await bot.telegram.sendMessage(process.env.GROUP, msg)
    await ctx.deleteMessage()
  } catch (e) {
    console.log(e)
  }
}
