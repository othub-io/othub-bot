const { Markup } = require('telegraf')
const axios = require('axios')
const queryTypes = require('../util/queryTypes')
const { ethers } = require('ethers');
const mysql = require('mysql');
const fs = require('fs');

const connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.PAYMENT_DB,
});

const optionalQuestions = {
  txn_description: 'Transaction Description',
  keywords: 'Keywords',
  epochs: 'Epochs (default: 5)',
};

module.exports = function publishCommand(bot) {

  bot.command('publish', async (ctx) => {
    if (ctx.chat.type !== 'private') {
      command = 'publish'
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

      const noResultsMessage = await ctx.reply('The /publish command is only available in private chat with @othubbot.');
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

    ctx.session.publishData = { inProgress: true };
    const telegramId = ctx.from.id;

    // Query the database to find the user's public wallet address
    connection.query('SELECT * FROM user_profile WHERE user_id = ?', [telegramId], function (error, rows, fields) {
      if (error) {
        console.error('Failed to execute query: ', error);
        return;
      }

    if (rows.length > 0) {
      // The user exists in the database, so use the public wallet address associated with them
      savedPublicAddress = rows[0].public_address;
      ctx.reply('Welcome! Let\'s publish an asset on the DKG. Please provide your public wallet address.', Markup
      .keyboard([`${savedPublicAddress}`, '/cancel'])
      .oneTime()
      .resize()
      );
    } else {
      // The user doesn't exist in the database, so ask for their public wallet address
      ctx.reply('Welcome! Let\'s publish an asset on the DKG. Please provide your public wallet address.', Markup
      .keyboard(['/cancel'])
      .oneTime()
      .resize()
      );  
    }
    })
  });

  bot.hears('/cancel', (ctx) => {
    if (ctx.session.publishData && ctx.session.publishData.inProgress) {
      ctx.session.publishData = {};
      ctx.reply('You canceled the operation.');
    }
  });

  bot.on('text', async (ctx) => {
    if (ctx.chat.type !== 'private') return;
    if (!ctx.session || !ctx.session.publishData) return;
    const response = ctx.message.text;
    const data = ctx.session.publishData;
    const telegramId = ctx.from.id;

    if (!data || !data.inProgress) return;

    if (!data.public_address) {
      data.public_address = response;
      // Check if the public address is in the correct EVM format
      if (!ethers.isAddress(data.public_address)) {
        ctx.reply('Please provide a valid public wallet address in the correct EVM format.', Markup
          .keyboard(['/cancel'])
          .oneTime()
          .resize()
        );
        delete data.public_address
        return;
      } else {
        await connection.query(
          'INSERT INTO user_profile (user_id, command, platform, public_address) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE public_address = ?',
          [telegramId, 'publish', 'telegram', data.public_address, data.public_address]
        );
      };
      ctx.reply('Please select the network (OTP testnet, OTP mainnet, Gnosis testnet, Gnosis mainnet respectively).', Markup
        .keyboard(['otp:20430', 'otp:2043', 'gnosis:10200', 'gnosis:100', '/cancel'])
        .oneTime()
        .resize()
      );
    } else if (!data.network) {
      data.network = response;
      ctx.reply('Please provide the data you want to publish in JSON.', Markup
        .keyboard(['/cancel'])
        .oneTime()
        .resize()
      );
    } else if (!data.txn_data) {
      try {
        JSON.parse(response);
        data.txn_data = response === 'skip' ? '{}' : response;
        ctx.reply('Would you like to enter optional fields or proceed to publish?', Markup
        .keyboard(['Publish', ...Object.values(optionalQuestions), '/cancel'])
        .oneTime()
        .resize()
      );
      } catch (error) {
      // If it's not valid JSON, send a message to the user
        ctx.reply('Please provide the data in correct JSON format or type /cancel to abort.', Markup
          .keyboard(['/cancel'])
          .oneTime()
          .resize()
        );
      }
    } else if (response === 'Publish') {
      // If txn_description is not provided, set the default description with the current timestamp
      if (!data.txn_description) {
        data.txn_description = `Asset publishing requested via Telegram on ${new Date().toISOString()}`;
      }
      const { public_address, network, txn_data, txn_description, keywords, trac_fee, epochs } = data;
      const formattedTxnData = JSON.stringify(JSON.parse(txn_data), null, 2)

      const previewText = `
Please confirm the following data before publishing:
      
Approver: ${public_address}
Network: ${network}
Asset:
${formattedTxnData}
Transaction Description: ${txn_description || 'None'}
Keywords: ${keywords || 'None'}
Epochs: ${epochs || '5'}`;
      ctx.reply(previewText, Markup
        .keyboard(['yes', 'no', '/cancel'])
        .oneTime()
        .resize()
      );
    } else if (response === 'yes' || response === 'no') {
        if (response === 'yes') {
          const { public_address, network, txn_data, txn_description, keywords, epochs } = data;
          
          let URL = `https://api.othub.io/dkg/create`;
          
          let postData = {
            approver: public_address,
            asset: txn_data,
            network: network
          };

          if(txn_description) {
            URL += `&txn_description=${txn_description}`;
          }
          
          if(keywords) {
            URL += `&keywords=${keywords}`;
          }
          
          if(epochs) {
            URL += `&epochs=${epochs}`;
          }

          let config = {
            headers: {
              'x-api-key': process.env.API_KEY
            }
          };
  
          try {
            const res = await axios.post(URL, postData, config);
            ctx.reply(`API call Succeeded! The response is:\n${JSON.stringify(res.data)}`);
          } catch (err) {
            ctx.reply(`Oops, something went wrong. The error is: ${err.message}`);
          }
          ctx.session.publishData = {};
        } else {
          ctx.reply('No problem, let\'s continue. Choose the next optional parameter to change.', Markup
            .keyboard(['Publish', ...Object.values(optionalQuestions), '/cancel'])
            .oneTime()
            .resize()
          );
          delete data.confirm;
        }
      } else if (data.lastQuestion) {
        data[data.lastQuestion] = response === 'skip' ? '' : response;
        data.lastQuestion = undefined;
        ctx.reply('Would you like to enter other optional fields or proceed with publishing?', Markup
          .keyboard(['Publish', ...Object.values(optionalQuestions), '/cancel'])
          .oneTime()
          .resize()
        );
      } else {
        const questionKey = Object.keys(optionalQuestions).find(key => optionalQuestions[key] === response);
        if (questionKey) {
          data.lastQuestion = questionKey;
          ctx.reply(`Please provide ${response} (optional).`, Markup
            .keyboard(['skip', '/cancel'])
            .oneTime()
            .resize()
          );
        }
      }

      if (data.confirm !== undefined) {
        if (data.confirm) {
        const { public_address, network, txn_data, txn_description, keywords, epochs } = data;

        let URL = `https://api.othub.io/dkg/create`;
          
          let postData = {
            approver: public_address,
            asset: txn_data,
            network: network
          };

          if(txn_description) {
            URL += `&txn_description=${txn_description}`;
          }
          
          if(keywords) {
            URL += `&keywords=${keywords}`;
          }
          
          if(epochs) {
            URL += `&epochs=${epochs}`;
          }

          let config = {
            headers: {
              'x-api-key': process.env.API_KEY
            }
          };
  
          try {
            const res = await axios.post(URL, postData, config);
          ctx.session.publishData = {};
          ctx.reply(`API call Succeeded! The response is:\n${JSON.stringify(res.data)}`);
        } catch (err) {
          ctx.reply(`Oops, something went wrong. The error is:\n${err.message}`);
        }
      } else {
        ctx.reply('Operation canceled.');
        data = {};
      }
    }
  });
}