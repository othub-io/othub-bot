const axios = require('axios');
const mysql = require('mysql');
const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);
const BigNumber = require('bignumber.js');

const connection = mysql.createConnection({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    database: process.env.PAYMENT_DB,
});

async function executeQuery(query, params) {
    return new Promise((resolve, reject) => {
      connection.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

async function checkTxHash(txHash) {
  try {
    const response = await axios.get(`https://api.etherscan.io/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}&apikey=${process.env.ETHERSCAN_API_KEY}`);
    return response.data.result.status === '1';
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

const fetchTransactions = async () => {
  try {
    const etherscanResponse = await axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&address=${process.env.OTHUB_WALLET}&startblock=0&endblock=27025780&sort=asc&apikey=${process.env.ETHERSCAN_API_KEY}`);
    const transactions = etherscanResponse.data.result;

    const updatedUserIds = new Set();

    for (const txnData of transactions) {
      if (txnData.to.toLowerCase() !== process.env.OTHUB_WALLET.toLowerCase()) {
        continue;
      }
      const isTxComplete = await checkTxHash(txnData.hash);
      if (isTxComplete) {
          if (['TRAC', 'USDC', 'USDT'].includes(txnData.tokenSymbol)) {
            const tokenDecimal = new BigNumber(10).pow(txnData.tokenDecimal);
            const actualValue = new BigNumber(txnData.value).div(tokenDecimal).toString();  
          const query = `
            INSERT IGNORE INTO fund_records (telegram_id, txn_hash, block_number, timestamp, from_address, to_address, value, currency, txn_fee, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          const result = await executeQuery(query, [
            '', txnData.hash, txnData.blockNumber, txnData.timeStamp, txnData.from, txnData.to, actualValue, txnData.tokenSymbol, txnData.gasUsed, 'success'
          ]);      
          if (result.affectedRows > 0) {
            const userIdRows = await executeQuery('SELECT user_id FROM user_profile WHERE public_address = ?', [txnData.from]);
            if (userIdRows.length > 0) {
              updatedUserIds.add(userIdRows[0].user_id);
                await executeQuery(`UPDATE fund_records SET telegram_id = ? WHERE from_address = ?`, [userIdRows[0].user_id, txnData.from]);
            }
          }
        }
      }
    }
    for (const userId of updatedUserIds) {
      const balanceRows = await executeQuery('SELECT balance FROM v_user_balance WHERE userId = ?', [userId]);
      const newBalance = balanceRows[0].balance;
      bot.telegram.sendMessage(userId, `Your new balance is ${newBalance}.\nYou can use your balance to /create Knowledge Assets!`);
    }
  } catch (error) {
    console.error('Error fetching transactions:', error);
  }
};

module.exports = fetchTransactions;