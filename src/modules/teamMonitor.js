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
const mysql = require('mysql')

const otnodedb_connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.BOT_DB
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

const op2_connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: 'operationaldb2'
})

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

  query = `SELECT * from monitor`
  params = []
  monitor = await getOTNODEData(query, params)
    .then(results => {
      //console.log('Query results:', results);
      return results
      // Use the results in your variable or perform further operations
    })
    .catch(error => {
      console.error('Error retrieving data:', error)
    })

  ask = 0
  changedNodes = []
  for (i = 0; i < operationaldb2.length; ++i) {
    shardNode = operationaldb2[i]
    found = await team_node.includes(shardNode.peer_id)

    if (found) {
      monitor_index = await monitor.findIndex(mon => mon.networkId == team_node)
      ask = ask + Number(shardNode.ask)
      monitor_ask = monitor[monitor_index].ask
      shard_ask = shardNode.ask

      if (monitor_ask != shard_ask) {
        query =
          'INSERT INTO monitor (networkId,ask) VALUES (?,?) ON DUPLICATE KEY UPDATE ask = ?'
        await otnodedb_connection.query(
          query,
          [shardNode.peer_id, shardNode.ask, shardNode.ask],
          function (error, results, fields) {
            if (error) throw error
          }
        )

        changedNodes.push(shardNode)
      }
    }
  }

  if (changedNodes.length > 0) {
    msg = `${
      changedNodes.length
    } Trace Labs nodes have changed their asks. The average TL node ask is now ${(
      ask / Number(changedNodes.length)
    ).toFixed(4)}`
    await tellBot(msg)
  }

  async function tellBot (msg) {
    bot.telegram.sendMessage(process.env.GROUP, msg)
  }
}
