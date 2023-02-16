const util = require('util')
const exec = util.promisify(require('child_process').exec)
const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(__dirname + '/bot.db')
const command_list = [
  //alphabetical
  'mynodes'
]

async function build_db () {
  try {
    await db.exec(
      'CREATE TABLE IF NOT EXISTS command_history (command VARCHAR NOT NULL, tg_id VARCHAR NOT NULL, date_last_used DATE)'
    )
    // await db.exec(
    //   'CREATE TABLE IF NOT EXISTS stats_history ( ath VARCHAR NOT NULL, eth_jobs VARCHAR NOT NULL, gnosis_jobs VARCHAR NOT NULL, poly_jobs VARCHAR NOT NULL, eth_nodes VARCHAR NOT NULL, gnosis_nodes VARCHAR NOT NULL, poly_nodes VARCHAR NOT NULL)'
    // )
    await db.exec(
      'CREATE TABLE IF NOT EXISTS node_compliance (node_id VARCHAR PRIMARY KEY NOT NULL, tg_id VARCHAR NOT NULL, type VARCHAR, warnings INT)'
    )

    await db.exec(
      'CREATE TABLE IF NOT EXISTS node_operators (peer_id VARCHAR PRIMARY KEY NOT NULL, operator VARCHAR, current_ask INT, previous_ask INT, date_last_changed DATE)'
    )

    // await db.exec(
    //   `INSERT INTO stats_history VALUES ("0","0","0","0","0","0","0")`
    // )

    await db.close()
  } catch (e) {
    console.log(e)
    console.log('Database - BLAHRG')
  }
}
build_db()
