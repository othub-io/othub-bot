const mysql = require('mysql');

const paymentDb = mysql.createConnection({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    database: process.env.PAYMENT_DB,
  });

const txnHeader = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.OTHUB_DB,
});


module.exports = function checkReceipt(bot) {
        paymentDb.query('SELECT * FROM paymentdb.create_n_transfer_records WHERE status = "pending"', (err, results) => {
          if (err) throw err;
      
          results.forEach((row) => {
            const receiptNumber = row.receipt;
            const chatId = row.userId;
      
            txnHeader.query('SELECT * FROM othubdb.txn_header WHERE txn_id = ?', [receiptNumber], (err, txnResults) => {
              if (err) throw err;
      
              if (txnResults.length > 0) {
                const txnProgress = txnResults[0].progress;
                const ual = txnResults[0].ual;
                const network = txnResults[0].network;
      
                if (txnProgress === 'COMPLETE') {
                    const baseUrl = network === 'otp::testnet' ? 'https://dkg-testnet.origintrail.io' : 'https://dkg.origintrail.io';
                  // Update the create_n_transfer_records table
                  paymentDb.query(
                    'UPDATE paymentdb.create_n_transfer_records SET status = ?, UAL = ? WHERE receipt = ?',
                    ['complete', ual, receiptNumber],
                    (updateError) => {
                      if (updateError) throw updateError;
                      bot.telegram.sendMessage(chatId, `✅Your transaction is complete!✅\n\n🧾Receipt: ${receiptNumber}\n\n🔎Use this link to view your Knowledge Asset: ${baseUrl}/explore?ual=${ual}`);
                    }
                  );
                } else if (txnProgress === 'ABANDONED') {
                  // Update the create_n_transfer_records table
                  paymentDb.query(
                    'UPDATE paymentdb.create_n_transfer_records SET status = ? WHERE receipt = ?',
                    ['abandoned', receiptNumber],
                    (updateError) => {
                      if (updateError) throw updateError;
                      bot.telegram.sendMessage(chatId, `❌Your transaction failed!❌\n\nReceipt number ${receiptNumber} has been abandoned due to an error. Please try again.`);
                    }
                  );
                } else {
                  //bot.telegram.sendMessage(chatId, `Your transaction with receipt number ${receiptNumber} is still pending...`);
                }
              }
            });
          });
        });
}

  