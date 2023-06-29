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

const keccak256 = require('keccak256')
const mysql = require('mysql')
const connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.OTHUB_DB
})

const otp_connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: 'otp'
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

module.exports = askMonitor = async () => {
  try {
    console.log(`Running ask monitoring task.`)
    min = Number(process.env.ALLIANCE_MIN)

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

      for (x = 0; x < nodeIds.length; ++x) {
        nodeId = nodeIds[x]
        node_obj = {
          node: nodeId,
          telegramId: allianceMember.telegramID,
          botToken: allianceMember.botToken
        }
        allNodes.push(node_obj)
      }
    }

    nonCompliant = []
    for (i = 0; i < allNodes.length; ++i) {
      thisNode = allNodes[i]

      query = `select * from otp.v_nodes_stats as vns
    where vns.nodeId = ?
    order by vns.date desc
    LIMIT 1`
      params = [thisNode.nodeId]
      nodeInfo = await getOTPData(query, params)
        .then(results => {
          //console.log('Query results:', results);
          return results
          // Use the results in your variable or perform further operations
        })
        .catch(error => {
          console.error('Error retrieving data:', error)
        })

      if (nodeInfo[0].Ask < min) {
        nonCompliant.push(thisNode)
      }
    }

    for (i = 0; i < nonCompliant.length; ++i) {
      nonCompliantNode = nonCompliant[i]
      reachable = 'yes'

      if (
        nonCompliantNode.botToken == '' ||
        nonCompliantNode.telegramId == ''
      ) {
        reachable = 'no'
      }

      alliance_bot = new Telegraf(process.env.BOT_TOKEN)
      members_bot = new Telegraf(nonCompliantNode.botToken)

      telegramInfo = await bot.telegram.getChatMember(
        process.env.ALLIANCE_ID,
        nonCompliantNode.telegramId
      )

      query = 'SELECT * from compliance where nodeId =?'
      params = [nonCompliantNode.nodeId]
      complianceInfo = await getOTPData(query, params)
        .then(results => {
          //console.log('Query results:', results);
          return results
          // Use the results in your variable or perform further operations
        })
        .catch(error => {
          console.error('Error retrieving data:', error)
        })

      if (complianceInfo != '') {
        query = 'INSERT INTO compliance (nodeId,warnings) VALUES (?,?)'
        await connection.query(
          query,
          [nonCompliantNode.nodeId, 1],
          function (error, results, fields) {
            if (error) throw error
          }
        )

        await members_bot.telegram.sendMessage(
          nonCompliantNode.telegramId,
          `@${telegramInfo.user.username}, 
            Node ${nonCompliantNode.nodeId} was found to have an ask lower than the alliance minimum and recieved 1 warning.`
        )
      }

      if (complianceInfo[0].warnings + 1 >= process.env.WARNING_LIMIT) {
        query = 'UPDATE node_operators SET nodeGroup =? WHERE telegramID = ?'
        await connection.query(
          query,
          ['Solo', nonCompliantNode.telegramID],
          function (error, results, fields) {
            if (error) throw error
          }
        )

        await alliance_bot.telegram.sendMessage(
          process.env.ALLIANCE_ID,
          `@${telegramInfo.user.username}, is being removed from the alliance for having a node that is non compliant.`
        )

        await alliance_bot.telegram.kickChatMember(
          process.env.ALLIANCE_ID,
          nonCompliantNode.telegramId
        )

        await alliance_bot.telegram.unbanChatMember(
          process.env.ALLIANCE_ID,
          nonCompliantNode.telegramId
        )

        if (reachable == 'yes') {
          await members_bot.telegram.sendMessage(
            nonCompliantNode.telegramId,
            `@${telegramInfo.user.username}, you have been removed from the alliance for having a node that is non compliant. Please ensure all nodes remain equal to or above the alliance minimum ask.`
          )
        }
      } else {
        query = 'UPDATE compliance (nodeId,warnings) VALUES (?,?)'
        await connection.query(
          query,
          [nonCompliantNode.nodeId, complianceInfo[0].warnings + 1],
          function (error, results, fields) {
            if (error) throw error
          }
        )

        if (reachable == 'yes') {
          await members_bot.telegram.sendMessage(
            nonCompliantNode.telegramId,
            `@${telegramInfo.user.username}, Node ${nonCompliantNode.nodeId} has received a warning for being non compliant. WARNINGS (${complianceInfo[0].warnings}/${process.env.WARNING_LIMIT})`
          )
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
}
