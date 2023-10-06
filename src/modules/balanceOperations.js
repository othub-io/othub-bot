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


module.exports = function fund(bot) {
    bot.command('fund', async (ctx) => {
        if (ctx.chat.type !== 'private') {
            command = 'fund'
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
      
            const noResultsMessage = await ctx.reply('The /fund command is only available in private chat with @othubbot.');
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

        const description = `
🌟 *Welcome to OTHub.io!* 🌟

Create */Knowledge_Assets* to harness the power of structured AI-ready data!

🔽 Send *USDC* or *USDT* to: 🔽
*${process.env.OTHUB_WALLET}*

⚠️ *WARNING: @othubbot only accepts USDC and USDT on the Ethereum blockchain*

🔍 *What You Get:*
- OTHub credits to create Knowledge Assets
- Exclusive features on @othubbot
- Access to create and transfer API for App Developers
- And Much More!

By continuing, you accept our /Terms.`

        await ctx.replyWithPhoto('https://runtime.othub.io/images?src=OTHub-Logo.png', {
            width: 200,
            height: 200,
        });

        telegramId = ctx.message.from.id

        await ctx.reply(description, {parse_mode: 'Markdown'});

        connection.query('SELECT * FROM user_profile WHERE user_id = ?', [telegramId], async function (error, rows, fields) {
            if (error) {
                console.error('Failed to execute query: ', error);
                return;
            }

            if (rows.length > 0) {
                // The user exists in the database, so use the public wallet address associated with them
                savedPublicAddress = rows[0].public_address;
                await ctx.reply('💰 Please enter your funding public address:', Markup
                        .keyboard([`${savedPublicAddress}`, '/cancel'])
                        .oneTime()
                        .resize()
                );
            } else {
                // The user doesn't exist in the database, so ask for their public wallet address
                await ctx.reply('💰 Please enter your funding public address:', Markup
                        .keyboard(['/cancel'])
                        .oneTime()
                        .resize()
                );
            }
        });
    });

    bot.hears('/cancel', (ctx) => {
        if (ctx.session.balanceOperations && ctx.session.balanceOperations.inProgress) {
          ctx.session.balanceOperations = {};
          ctx.reply('You canceled the operation.');
        }
      });

    bot.on('text', async (ctx) => {
        if (ctx.chat.type !== 'private') return;
        if (!ctx.session || !ctx.session.balanceOperations) return;
        const response = ctx.message.text;
        const data = ctx.session.balanceOperations;
        const telegramId = ctx.from.id;
    
        if (!data || !data.inProgress) return;

        if (!data.public_address) {
            data.public_address = response;
            if (!ethers.isAddress(data.public_address)) {
              ctx.reply('Invalid address. Please provide a valid EVM public wallet address.', Markup
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
                ctx.reply('Please enter the transaction hash:', Markup
    //[transaction hash](https://etherscan.io/address/${data.public_address}#tokentxns) 
                    .keyboard(['/cancel'])
                    .oneTime()
                    .resize()
                );
            }
        } else if (!data.txn_hash) {
            data.txn_hash = response;
            if (!await checkTxHash(data.txn_hash)) {
                ctx.reply('Invalid or failed transaction hash. Please make sure the transaction is complete and provide the transaction hash again.', Markup
                .keyboard(['/cancel'])
                .oneTime()
                .resize()
                );
                delete data.txn_hash;
                return;
            } else {
                try {
                    const etherscanResponse = await axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&address=${data.public_address}&startblock=0&endblock=27025780&sort=asc&apikey=${process.env.ETHERSCAN_API_KEY}`);
                    const transactions = etherscanResponse.data.result;
                    
                    const txnData = transactions.find(txn => txn.hash === data.txn_hash);
                    if (!txnData) {
                        ctx.reply('Transaction not found. Please check the transaction hash and try again.', Markup
                        .keyboard(['/cancel'])
                        .oneTime()
                        .resize()
                        );
                        return;
                    }

                    if (txnData.to.toLowerCase() !== process.env.OTHUB_WALLET.toLowerCase()) {
                        ctx.reply('Transaction was not sent to the correct address. Please check and try again.', Markup
                        .keyboard(['/cancel'])
                        .oneTime()
                        .resize()
                        );
                        return;
                    }

                    if (txnData.from.toLowerCase() !== data.public_address.toLowerCase()) {
                      ctx.reply('Transaction was not initiated from the provided address. Please check and try again.', Markup
                      .keyboard(['/cancel'])
                      .oneTime()
                      .resize()
                      );
                      return;
                  }

                    connection.query('SELECT * FROM fund_records WHERE txn_hash = ?', [data.txn_hash], function(error, results, fields) {
                        if (error) {
                            console.error('Error fetching transaction data:', error);
                            return;
                        }
                    
                        if (results.length !== 0 || !results.every(row => Object.values(row).every(value => value === null))) {
                            ctx.reply('This transaction has already been processed and credited.');
                            return;
                        } else {
                        ctx.reply('Your credit has been added to your balance.');

                        const tokenSymbol = txnData.tokenSymbol;

                        const query = `
                            INSERT INTO fund_records (telegram_id, txn_hash, block_number, timestamp, from_address, to_address, value, currency, txn_fee, status)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `;
                        connection.query(query, [
                            telegramId, 
                            data.txn_hash, 
                            txnData.blockNumber, 
                            txnData.timeStamp, 
                            txnData.from, 
                            txnData.to, 
                            txnData.value, 
                            tokenSymbol,
                            txnData.gasUsed,
                            'success'
                        ]);
                        }
                    });
                    
                    ctx.session.balanceOperations = {};

                } catch (error) {
                    console.error('Error fetching transaction data:', error);
                    ctx.reply('There was an error processing your request. Please try again.');
                }
            }
        } 
        
    })

    async function checkTxHash(txHash) {
        try {
            const response = await axios.get(`https://api.etherscan.io/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}&apikey=${process.env.ETHERSCAN_API_KEY}`);
            return response.data.result.status === '1';
        } catch (error) {
            console.error('Error:', error);
            return false;
        }
    }
};