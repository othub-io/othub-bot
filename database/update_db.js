const util = require('util')
const exec = util.promisify(require('child_process').exec)
const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(__dirname + '/bot.db')
async function build_db () {
  try {
    await db.exec(
      'CREATE TABLE IF NOT EXISTS publish_history (hourly INT, daily INT, weekly INT, monthly INT, yearly INT, total INT)'
    )

    await db.exec(
      'CREATE TABLE IF NOT EXISTS commit_history (hourly INT, daily INT, weekly INT, monthly INT, yearly INT, total INT)'
    )

    await db.exec(
      `INSERT INTO publish_history VALUES ("0","0","0","0","0","0")`
    )

    await db.exec(`INSERT INTO commit_history VALUES ("0","0","0","0","0","0")`)

    await db.close()
  } catch (e) {
    console.log(e)
    console.log('Database - BLAHRG')
  }
}
build_db()
