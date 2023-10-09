const queryTypes = require('../util/queryTypes');
const { Markup } = require('telegraf')
const axios = require('axios');
const mysql = require('mysql');
const { ethers } = require('ethers');

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

module.exports = function start(bot) {
  bot.command('fund', async (ctx) => {
    // command = 'balance'
    // spamCheck = await queryTypes.spamCheck()
    // telegram_id = ctx.message.from.id
    
    // permission = await spamCheck
    //   .getData(command, telegram_id)
    //   .then(async ({ permission }) => {
    //     return permission
    //   })
    //   .catch(error => console.log(`Error : ${error}`))
  
    // if (permission != `allow`) {
    //   await ctx.deleteMessage()
    //   return
    // }
    // setTimeout(async () => {
    //   try {
    //     await ctx.deleteMessage();
    //   } catch (error) {
    //     console.error('Error deleting message:', error);
    //   }
    // }, process.env.DELETE_TIMER);

    telegram_id = ctx.message.from.id;
    const username = ctx.from.username;

    const query = `
    INSERT IGNORE INTO fund_records (telegram_id, txn_hash, block_number, timestamp, from_address, to_address, value, currency, txn_fee, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
    const result = await executeQuery(query, [
      telegram_id, '', '', '', '', '', '100', 'USDC', '', 'success'
    ]);
    if (result.affectedRows > 0) {
      connection.query('SELECT USD_balance FROM v_user_balance WHERE telegram_id = ?', [telegram_id], async function (error, rows, fields) {
        if (error) {
          console.error('Failed to execute query: ', error);
          return;
        }
        if (rows.length > 0) {
          const balance = rows[0].balance;
          ctx.reply(`⚖️ ${username}, your new test balance is: *$${balance.toFixed(2)}*`,{parse_mode: 'Markdown'});
        } else {
          ctx.reply('No balance found.');
        }
      });
    }
  });

  bot.command('balance', async (ctx) => {
    // command = 'balance'
    // spamCheck = await queryTypes.spamCheck()
    // telegram_id = ctx.message.from.id
    
    // permission = await spamCheck
    //   .getData(command, telegram_id)
    //   .then(async ({ permission }) => {
    //     return permission
    //   })
    //   .catch(error => console.log(`Error : ${error}`))
  
    // if (permission != `allow`) {
    //   await ctx.deleteMessage()
    //   return
    // }
    // setTimeout(async () => {
    //   try {
    //     await ctx.deleteMessage();
    //   } catch (error) {
    //     console.error('Error deleting message:', error);
    //   }
    // }, process.env.DELETE_TIMER);

    telegram_id = ctx.message.from.id

    connection.query('SELECT USD_balance FROM v_user_balance WHERE telegram_id = ?', [telegram_id], async function (error, rows, fields) {
      if (error) {
        console.error('Failed to execute query: ', error);
        return;
      }
      if (rows.length > 0) {
        const balance = rows[0].balance;
        ctx.reply(`⚖️ Current Balance: *$${balance.toFixed(2)}*`,{parse_mode: 'Markdown'});
      } else {
        ctx.reply('No balance found.');
      }
    });
  });

  bot.command('othub', async (ctx) => {
      command = 'othub'
      spamCheck = await queryTypes.spamCheck()
      telegram_id = ctx.message.from.id
      
      permission = await spamCheck
        .getData(command, telegram_id)
        .then(async ({ permission }) => {
          return permission
        })
        .catch(error => console.log(`Error : ${error}`))
    
      if (permission != `allow`) {
        await ctx.deleteMessage()
        return
      }
      setTimeout(async () => {
        try {
          await ctx.deleteMessage();
        } catch (error) {
          console.error('Error deleting message:', error);
        }
      }, process.env.DELETE_TIMER);

    const description = `
🌟 *Welcome to OTHub.io!* 🌟

Create */Knowledge_Assets* to harness the power of structured AI-ready data!

🔽 Send *USDC* or *USDT* to: 🔽
*${process.env.OTHUB_WALLET}*

🔍 *What You Get:*
- OTHub credits to create Knowledge Assets
- Exclusive features on @othubbot
- Access to create and transfer API for App Developers
- And Much More!

⚠️ *WARNING:* ⚠️
- @othubbot only accepts USDC and USDT (ETH Blockchain)
- Before sending funds, please enter your /profile

📝 By continuing, you accept our /Terms.

👤 Press */knowledge* to begin...
⚖️ Press */balance* for current balance...`

    await ctx.replyWithPhoto('https://runtime.othub.io/images?src=OTHub-Logo.png', {
        width: 200,
        height: 200,
    });

    await ctx.reply(description, {parse_mode: 'Markdown'});

  });

  bot.command('knowledge', async (ctx) => {
    command = 'knowledge'
    telegram_id = ctx.message.from.id  
    bot.telegram.sendMessage(telegram_id, `📗 Knowledge is Power.\n📚 Shared Knowledge is Power Multipled.\n💪 Bring the Power of Knowledge\n👥 Back to the People\n\n➡️ */start* making a difference`,{parse_mode: 'Markdown'});
  });

  bot.hears('/cancel', (ctx) => {
    if (ctx.session.balanceOperations && ctx.session.balanceOperations.inProgress) {
      ctx.session.balanceOperations = {};
      ctx.reply('🛑 You canceled the operation.');
    }
  });

  bot.command('start', async (ctx) => {
    if (ctx.chat.type !== 'private') {
      command = 'start'
      spamCheck = await queryTypes.spamCheck()
      telegram_id = ctx.message.from.id
    
      permission = await spamCheck
        .getData(command, telegram_id)
        .then(async ({ permission }) => {
          return permission
        })
        .catch(error => console.log(`Error : ${error}`))
    
      if (permission != `allow`) {
        await ctx.deleteMessage()
        return
      }
      setTimeout(async () => {
        try {
          await ctx.deleteMessage();
        } catch (error) {
          console.error('Error deleting message:', error);
        }
      }, process.env.DELETE_TIMER);

      const noResultsMessage = await ctx.reply('The /start command is only available in private chat with @othubbot.');
      setTimeout(async () => {
        try {
          await ctx.telegram.deleteMessage(ctx.chat.id, noResultsMessage.message_id);
        } catch (error) {
          console.error('Error deleting message:', error);
        }
      }, process.env.DELETE_TIMER);
      return;
    }
  
    if (!ctx.session) {
      ctx.session = {};
    }
    ctx.session.balanceOperations = { inProgress: true };

    telegram_id = ctx.message.from.id

    connection.query('SELECT * FROM user_profile WHERE user_id = ?', [telegram_id], async function (error, rows, fields) {
      if (error) {
        console.error('Failed to execute query: ', error);
        return;
      }

    if (rows.length > 0) {
      savedPublicAddress = rows[0].public_address;
      ctx.reply(`💰 Please enter your public address used for funding:`, Markup.keyboard([`${savedPublicAddress}`, '/cancel'])
      .oneTime()
      .resize());
    } else {
        ctx.reply(`💰 Please enter your funding public address used for funding:`, Markup.keyboard(['/cancel'])
        .oneTime()
        .resize());
      }
    });
  });

  bot.on('text', async (ctx) => {
    if (!ctx.session || !ctx.session.balanceOperations) return;
    const response = ctx.message.text;
    const data = ctx.session.balanceOperations;
    const telegramId = ctx.from.id;
  
    if (!data || !data.inProgress) return;

    if (!data.public_address) {
      data.public_address = response;
      if (!ethers.isAddress(data.public_address)) {
        ctx.reply('🚫 Invalid address. Please provide a valid EVM public wallet address.', Markup
          .keyboard(['/cancel'])
          .oneTime()
          .resize()
        );
        delete data.public_address;
        return;
      } else {
        await connection.query(
          'INSERT INTO user_profile (user_id, platform, public_address) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE public_address = ?',
          [telegramId, 'telegram', data.public_address, data.public_address]
        );
        ctx.session.balanceOperations = {}
        ctx.reply(`✅ User profile updated with your public address!\n\nFunding address:\n\n${process.env.OTHUB_WALLET}\n\nPlease double check the address and only send USDC or USDT (ETH blockchain).\n\nOnce the funding is complete, please wait a minute before you check your /balance.`)
        }
    }
  });
};

//           ctx.reply('Please enter the transaction hash:', Markup
//   //[transaction hash](https://etherscan.io/address/${data.public_address}#tokentxns) 
//           .keyboard(['/cancel'])
//           .oneTime()
//           .resize()
//           );
//         }
//       } else if (!data.txn_hash) {
//         data.txn_hash = response;
//         if (!await checkTxHash(data.txn_hash)) {
//             ctx.reply('Invalid or failed transaction hash. Please make sure the transaction is complete and provide the transaction hash again.', Markup
//             .keyboard(['/cancel'])
//             .oneTime()
//             .resize()
//             );
//             delete data.txn_hash;
//             return;
//         } else {
//           const etherscanResponse = await axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&address=${data.public_address}&startblock=0&endblock=27025780&sort=asc&apikey=${process.env.ETHERSCAN_API_KEY}`);
//           const transactions = etherscanResponse.data.result;
//           const txnData = transactions.find(txn => txn.hash === data.txn_hash);
//           const toAddressCheck = await txnData.to.toLowerCase() === process.env.OTHUB_WALLET.toLowerCase()
//           const fromAddressCheck = await txnData.from.toLowerCase() === data.public_address.toLowerCase()
//           if (!await txnData) {
//             ctx.reply('Transaction not found. Please check the transaction hash and try again.', Markup
//             .keyboard(['/cancel'])
//             .oneTime()
//             .resize()
//             );
//             delete txnData;
//             return;
//           } else if (!toAddressCheck) {
//               ctx.reply('Transaction was not sent to the correct address. Please check and try again.', Markup
//               .keyboard(['/cancel'])
//               .oneTime()
//               .resize()
//               );
//               delete txnData;
//               return;
//             } else if (!fromAddressCheck) {
//                 ctx.reply('Transaction was not initiated from the provided address. Please check and try again.', Markup
//                 .keyboard(['/cancel'])
//                 .oneTime()
//                 .resize()
//                 );
//                 delete txnData;
//                 return;
//               } else {
//                 connection.query('SELECT * FROM fund_records WHERE txn_hash = ?', [data.txn_hash], function(error, results, fields) {
//                 if (error) {
//                   console.error('Error fetching transaction data:', error);
//                   return;
//                 }
//                 });
//                 if (results.length !== 0 || !results.every(row => Object.values(row).every(value => value === null))) {
//                   ctx.reply('This transaction has already been processed and credited.');
//                   return;
//                 } else {
//                   ctx.reply('Your credit has been added to your balance.');

//                   const tokenSymbol = txnData.tokenSymbol;

//                   const query = `
//                     INSERT INTO fund_records (telegram_id, txn_hash, block_number, timestamp, from_address, to_address, value, currency, txn_fee, status)
//                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
//                   connection.query(query, [
//                     telegramId, 
//                     data.txn_hash, 
//                     txnData.blockNumber, 
//                     txnData.timeStamp, 
//                     txnData.from, 
//                     txnData.to, 
//                     txnData.value, 
//                     tokenSymbol,
//                     txnData.gasUsed,
//                     'success'
//                   ]);

//                   ctx.session.balanceOperations = {};
//                 }
//               }
            
          
//         }
//       }
//     });
//   async function checkTxHash(txHash) {
//     try {
//       const response = await axios.get(`https://api.etherscan.io/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}&apikey=${process.env.ETHERSCAN_API_KEY}`);
//       return response.data.result.status === '1';
//     } catch (error) {
//       console.error('Error:', error);
//       return false;
//     }
//   }
// };