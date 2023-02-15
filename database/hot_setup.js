const util = require('util')
const exec = util.promisify(require('child_process').exec)
const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(__dirname + '/bot.db')
const command_list = [
  //alphabetical
  'activejobs'
]

async function build_db () {
  try {
    await db.exec(
      'CREATE TABLE IF NOT EXISTS node_compliance (node_id PRIMARY KEY VARCHAR NOT NULL, tg_id, VARCHAR NOT NULL. type VARCHAR, warnings INT)'
    )

    await db.close()
  } catch (e) {
    console.log(e)
    console.log('Database - BLAHRG')
  }
}
build_db()
