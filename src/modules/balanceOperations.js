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

function queryAsync(sql, params) {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (error, rows, fields) => {
      if (error) {
        reject(error);
      } else {
        resolve([rows, fields]);
      }
    });
  });
}

module.exports = function start(bot) {
  bot.command('fund', async (ctx) => {
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

    const max = 9999999;
    const randomInt = Math.floor(Math.random() * (max + 1));
    
    telegram_id = ctx.message.from.id;
    const username = ctx.from.username;

    const query = `
    INSERT IGNORE INTO fund_records (telegram_id, txn_hash, block_number, timestamp, from_address, to_address, value, currency, txn_fee, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
    const result = await executeQuery(query, [
      telegram_id, randomInt, '', '', '', '', '1000000', 'USDC', '', 'success'
    ]);
      try {
        const [rows, fields] = await queryAsync('SELECT USD_balance FROM v_user_balance WHERE telegram_id = ?', [telegram_id]);
        if (rows.length > 0) {
          const balance = rows[0].USD_balance;
          await ctx.reply(`⚖️ @${username}, your test balance is now $${balance.toFixed(2)}\n\n🟢 /create Knowledge Assets now with @othubbot!`);
        } else {
          ctx.reply('No balance found.');
        }
      } catch (error) {
        console.error('Failed to execute query: ', error);
      }
  });

  bot.command('balance', async (ctx) => {
    command = 'balance'
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

    telegram_id = ctx.message.from.id

    try {
      const [rows, fields] = await queryAsync('SELECT USD_balance FROM v_user_balance WHERE telegram_id = ?', [telegram_id]);
      if (rows.length > 0) {
        const balance = rows[0].USD_balance;
        ctx.reply(`⚖️ Current Balance: *$${balance.toFixed(2)}*\n\n*/create* Knowledge Assets now!`, { parse_mode: 'Markdown' });
      } else {
        ctx.reply('No balance found.');
      }
    } catch (error) {
      console.error('Failed to execute query: ', error);
    }
  });

  bot.command('receipt', async (ctx) => {
    const receiptNumber = ctx.message.text.split(' ')[1];
    command = 'receipt' + ' ' + receiptNumber;
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

    if (!receiptNumber) {
      ctx.reply('Please enter a receipt number with the command.');
      return;
    }

    try {
      connection.query('SELECT * FROM paymentdb.create_n_transfer_records WHERE receipt = ?', [receiptNumber], (err, res) => {
        if (err) throw err;

        if (res.length > 0) {
          const status = res[0].status;
          ctx.reply(`The transaction with receipt number ${receiptNumber} is ${status}.`);
        } else {
          ctx.reply(`The transaction with receipt number ${receiptNumber} does not exist.`);
        }
      });
    } catch (error) {
      console.error('Failed to execute query: ', error);
    }
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
OTHub wallet not available yet.
For testing, use /fund

⚠️ *WARNING:* ⚠️
- After beta phase, @othubbot only accepts USDC and USDT (ETH Blockchain)

🔍 *What You Get:*
- OTHub credits to create Knowledge Assets
- Exclusive features on @othubbot
- Access to create and transfer API for App Developers
- And Much More!

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
    spamCheck = await queryTypes.spamCheck()
      
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
      
    bot.telegram.sendMessage(telegram_id, `📗 Knowledge is Power.\n📚 Shared Knowledge is Power Multipled.\n💪 Bring the Power of Knowledge\n👥 Back to the People\n\n➡️ Press */wallet* to begin.`,{parse_mode: 'Markdown'});
  });

  bot.command('wallet', async (ctx) => {
    if (ctx.chat.type !== 'private') {
      command = 'wallet'
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

      const noResultsMessage = await ctx.reply('🟡The /wallet command is only available in private chat with @othubbot.');
      setTimeout(async () => {
        try {
          await ctx.telegram.deleteMessage(ctx.chat.id, noResultsMessage.message_id);
        } catch (error) {
          console.error('Error deleting message:', error);
        }
      }, process.env.DELETE_TIMER);
      return;
    }

    telegram_id = ctx.message.from.id
    const inputText = ctx.message.text.split(' ');

    if (inputText.length < 2) {
      const query = 'SELECT * FROM user_profile WHERE user_id = ?';
      const [rows] = await queryAsync(query, [telegram_id]);
      if (rows.length > 0) {
        const savedPublicAddress = rows[0].public_address;
        ctx.reply(`👝 Your current wallet address is\n${savedPublicAddress} 👝\nUse /wallet <new_public_address> to update.\n\n💰 Fund your Telegram account to create Knowledge Assets!💰`);
      } else {
        ctx.reply('🟡You don\'t have a wallet associated. Please use /wallet <public_address> to set one.');
      }
      return;
    }
  
    const newAddress = inputText[1];
  
    // Validate the new address
    if (!ethers.isAddress(newAddress)) {
      ctx.reply('🔴Invalid address. Please provide a valid EVM public wallet address.');
      return;
    }
  
    // SQL query to insert or update the wallet address
    const query = `
      INSERT INTO user_profile (user_id, public_address, platform) 
      VALUES (?, ?, ?) 
      ON DUPLICATE KEY UPDATE public_address = VALUES(public_address);    
    `;
  
    try {
      await connection.query(query, [telegram_id, newAddress, 'telegram', newAddress]);
      ctx.reply(`✅Wallet address updated to ${newAddress}`);
    } catch (error) {
      console.error('Failed to update the wallet address:', error);
      ctx.reply('🔴An error occurred while updating your wallet address.');
    }
  });
};
