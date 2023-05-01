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
const operationaldb2_connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: 'operationaldb2'
})

const otnodedb_connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: 'otnodedb'
})


module.exports = askReconciliation = async () => {
  console.log(`Running ask reconciliation task.`)

    let members;
    query = 'SELECT * FROM alliance_members WHERE verified = ?'
    await otnodedb_connection.query(query,[1], function (error, results, fields) {
      if (error) throw error;
      members = results;
    });

  let shard_nodes;
    query = 'SELECT * from operationaldb2.shard'
    await operationaldb2_connection.query(query, function (error, results, fields) {
      if (error) throw error;
      shard_nodes = results;
    });

    for (i = 0; i < shard_nodes.length; ++i) {
      shard_node = shard_nodes[i]

      member = members.filter(obj => {
        return obj.node_id === shard_node.peer_id
      })

        query = 'UPDATE alliance_members SET ask = ?, stake = ? WHERE network_id = ? COLLATE NOCASE'
        await otnodedb_connection.query(query, [shard_node.ask, shard_node.stake, shard_node.peer_id],function (error, results, fields) {
          if (error) throw error;
        });
    }
};
