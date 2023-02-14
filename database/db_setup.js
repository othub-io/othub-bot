const util = require('util');
const exec = util.promisify(require('child_process').exec);
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(__dirname+'/bot.db');
const command_list = [//alphabetical
  "activejobs",
  "avgreward",
  "backup",
  "bothelp",
  "dailystats",
  "dockerless",
  "dotjobs",
  "ethjobs",
  "ethlocked",
  "ethnodes",
  "ethpayouts",
  "ethstaked",
  "freespace",
  "gnosisjobs",
  "gnosislocked",
  "gnosisnodes",
  "gnosispayouts",
  "gnosisstaked",
  "jobs",
  "locked",
  "myprofile",
  "mynodeids",
  "nodehelp",
  "nodes",
  "overlay",
  "payouts",
  "polyjobs",
  "polylocked",
  "polynodes",
  "polypayouts",
  "polystaked",
  "profit",
  "pruning",
  "staked",
  "top",
  "tst"
]

async function build_db(){
      try {
        await db.exec("CREATE TABLE IF NOT EXISTS node_header (chat_id VARCHAR NOT NULL, node_id VARCHAR NOT NULL)");
        await db.exec("CREATE TABLE IF NOT EXISTS user_header (chat_id VARCHAR PRIMARY KEY NOT NULL, user_name VARCHAR, tip_address VARCHAR, last_tip_date DATE)");
        await db.exec("CREATE TABLE IF NOT EXISTS command_history (command VARCHAR PRIMARY KEY NOT NULL, date_last_used DATE)");
        await db.exec("CREATE TABLE IF NOT EXISTS stats_history ( ath VARCHAR NOT NULL, eth_jobs VARCHAR NOT NULL, gnosis_jobs VARCHAR NOT NULL, poly_jobs VARCHAR NOT NULL, eth_nodes VARCHAR NOT NULL, gnosis_nodes VARCHAR NOT NULL, poly_nodes VARCHAR NOT NULL)");
        await db.exec(`INSERT INTO stats_history VALUES ("0","0","0","0","0","0","0")`);
        for(var i = 0; i < command_list.length; i++) {
            command = command_list[i]
            await db.exec(`INSERT INTO command_history VALUES ("${command}", "1")`)
          }

        await db.close();

      } catch (e) {
        console.log(e)
        console.log('Database - BLAHRG')
      }
    }
  build_db()
