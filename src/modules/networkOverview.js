const fs = require('fs')
require('dotenv').config()
const queryTypes = require('../util/queryTypes')

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
const operationaldb2_connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: 'operationaldb2'
})

const connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.BOT_DB
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

module.exports = networkOverview = async timeFrame => {
  console.log(`Running ${timeFrame} network overview.`)

  querySubscan = queryTypes.querySubscan()
  ext = `evm/erc721/collectibles`
  contract_address = '0x5cAC41237127F94c2D21dAe0b14bFeFa99880630'
  address = null
  row = 1
  page = 0

  result = await querySubscan
    .getData(ext)
    .then(async ({ result }) => {
      return result
    })
    .catch(error => console.log(`Error : ${error}`))

  console.log(result.data.data.count)
  total_publishes = Number(result.data.data.count)

  ext = `evm/account/tokens`
  contract_address = '0xffffffff00000000000000000000000000000001'
  address = '0x61BB5F3Db740a9cb3451049c5166f319a18927eb'
  row = null
  page = null

  result = await querySubscan
    .getData(ext)
    .then(async ({ result }) => {
      //console.log(result)
      return result
    })
    .catch(error => console.log(`Error : ${error}`))

  result = JSON.stringify(result.data.data[0])
  result = JSON.parse(result)
  console.log(result.balance)

  trac_committed = result.balance
  trac_committed = (trac_committed / 1000000000000000000).toFixed(3)
  trac_committed = Number(trac_committed)

  let previous_publishes
  query = `SELECT ${timeFrame} FROM publish_history`
  await connection.query(query, function (error, results, fields) {
    if (error) throw error
    previous_publishes = results
  })

  let previous_committed
  query = `SELECT ${timeFrame} FROM commit_history`
  await connection.query(query, function (error, results, fields) {
    if (error) throw error
    previous_committed = results
  })

  previous_committed = Number(previous_committed[0][timeFrame])
  previous_publishes = Number(previous_publishes[0][timeFrame])
  publishes = total_publishes - previous_publishes
  committed = trac_committed - previous_committed

  query = `UPDATE publish_history SET ${timeFrame} = ?`
  await connection.query(
    query,
    [total_publishes],
    function (error, results, fields) {
      if (error) throw error
    }
  )

  query = `UPDATE commit_history SET ${timeFrame} = ?`
  await connection.query(
    query,
    [trac_committed],
    function (error, results, fields) {
      if (error) throw error
    }
  )

  let member_nodes
  query = 'SELECT * FROM member_nodes WHERE verified = ?'
  await connection.query(
    query,
    [1],
    function (error, results, fields) {
      if (error) throw error
      member_nodes = results
    }
  )

  let shard_nodes
  query = 'SELECT * from operationaldb2.shard'
  await operationaldb2_connection.query(
    query,
    function (error, results, fields) {
      if (error) throw error
      shard_nodes = results
    }
  )

  alliance_nodes_percent = member_nodes.length / shard_nodes.length
  alliance_publishes = publishes * alliance_nodes_percent
  alliance_committed = committed * alliance_nodes_percent

  if (publishes === 0) {
    publish_chng = '0.00'
  } else {
    publish_chng = publishes / total_publishes
    publish_chng = publish_chng * 100
    publish_chng = publish_chng.toFixed(2)
  }

  if (alliance_publishes === 0) {
    alli_publish_chng = '0.00'
  } else {
    alli_publish_chng = alliance_publishes / previous_publishes
    alli_publish_chng = alli_publish_chng * 100
    alli_publish_chng = alli_publish_chng.toFixed(2)
  }

  commit_chng = committed / trac_committed
  commit_chng = commit_chng * 100
  commit_chng = commit_chng.toFixed(2)

  alli_commit_chng = alliance_committed / previous_committed
  alli_commit_chng = alli_commit_chng * 100
  alli_commit_chng = alli_commit_chng.toFixed(2)

  if (timeFrame != 'daily') {
    msg = `${timeFrame} Overview

Average TRAC per Asset: ${(alliance_committed / alliance_publishes).toFixed(2)}

Network:
Assets: ${publishes}(${publish_chng}%)
TRAC Locked: ${committed.toFixed(2)}(${commit_chng}%)

Alliance: 
Assets: ${alliance_publishes.toFixed(0)}(${alli_publish_chng}%)
TRAC Locked: ${alliance_committed.toFixed(2)}(${alli_commit_chng}%)
    `
  } else {
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

    msg = `${timeFrame} Overview

Alliance Ask: ${process.env.ALLIANCE_MIN}
Average Ask: ${(total_ask / all_nodes).toFixed(3)}
      
Assets:
-- Overall --
Total: ${total_publishes}
TRAC Locked: ${trac_committed.toFixed(2)}
Average Trac per Asset: ${(trac_committed / total_publishes).toFixed(2)}
      
-- Last Day --
Average Trac per Asset: ${(committed / publishes).toFixed(2)}
      
Total: ${publishes}(${publish_chng}%)
TRAC Locked: ${committed.toFixed(2)}(${commit_chng}%)
      
Alliance: ${alliance_publishes.toFixed(0)}(${alli_publish_chng}%)
TRAC Locked: ${alliance_committed.toFixed(2)}(${alli_commit_chng}%)
      
      
      
Nodes: 
Alliance: ${alliance_nodes}(${alliance_nodes_percent.toFixed(
      0
    )}%) | TraceLabs: ${TL_nodes}(${TL_nodes_percent.toFixed(
      0
    )}%) | Solo: ${free_nodes}(${free_nodes_percent.toFixed(
      0
    )}%) | Total: ${all_nodes} 
      
Average Asks:  
Alliance: ${alliance_ask.toFixed(4)} | TraceLabs: ${TL_ask.toFixed(
      4
    )} | Solo: ${free_ask.toFixed(4)} | All: ${all_ask.toFixed(4)}
          
Average Stakes: 
Alliance: ${alliance_stake.toFixed(2)} | TraceLabs: ${TL_stake.toFixed(
      2
    )} | Solo: ${free_stake.toFixed(2)} | All: ${all_stake.toFixed(2)}
                 `
  }

  await bot.telegram.sendMessage(process.env.GROUP, msg)
}
