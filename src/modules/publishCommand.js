const { Markup } = require('telegraf')
const axios = require('axios')
const queryTypes = require('../util/queryTypes')

const optionalQuestions = {
  txn_description: 'Transaction Description',
  keywords: 'Keywords',
  trac_fee: 'TRAC Fee',
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
    ctx.reply('Welcome! Let\'s publish an asset on the DKG. Please, provide your public wallet address.', Markup
      .keyboard(['/cancel'])
      .oneTime()
      .resize()
    );
  });

  bot.hears('/cancel', (ctx) => {
    if (ctx.session.publishData && ctx.session.publishData.inProgress) {
      ctx.session.publishData = {};
      ctx.reply('You canceled the operation.');
    }
  });

  bot.on('text', async (ctx) => {
    if (ctx.chat.type !== 'private') return;
    const response = ctx.message.text;
    const data = ctx.session.publishData;

    // Don't proceed if operation is not in progress
    if (!data || !data.inProgress) return;

    if (!data.public_address) {
      data.public_address = response;
      ctx.reply('Please select the network (otp::testnet or otp::mainnet).', Markup
        .keyboard(['otp::testnet', 'otp::mainnet', '/cancel'])
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
      data.txn_data = response === 'skip' ? '{}' : response;
      ctx.reply('Would you like to enter optional fields or proceed to publish?', Markup
        .keyboard(['Publish', ...Object.values(optionalQuestions), '/cancel'])
        .oneTime()
        .resize()
      );
    } else if (response === 'Publish') {
      const { public_address, network, txn_data, txn_description, keywords, trac_fee, epochs } = data;
      const previewText = `Please confirm that you want to make the API call with the following data:\n\nPublic Address: ${public_address}\nNetwork: ${network}\nTransaction Data: ${txn_data}\nTransaction Description: ${txn_description || 'None'}\nKeywords: ${keywords || 'None'}\nTRAC Fee: ${trac_fee || 'Default'}\nEpochs: ${epochs || '5'}\n\nType "yes" to confirm or "no" to cancel.`;
      ctx.reply(previewText, Markup
        .keyboard(['yes', 'no', '/cancel'])
        .oneTime()
        .resize()
      );
    } else if (response === 'yes' || response === 'no') {
        if (response === 'yes') {
          const { public_address, network, txn_data, txn_description, keywords, trac_fee, epochs } = data;
          
          let URL = `https://api.othub.io/otp/dkg/publish?public_address=${public_address}&api_key=${process.env.API_KEY}&txn_data=${txn_data}&network=${network}`;
          
          if(txn_description) {
            URL += `&txn_description=${txn_description}`;
          }
          
          if(keywords) {
            URL += `&keywords=${keywords}`;
          }
          
          if(trac_fee) {
            URL += `&trac_fee=${trac_fee}`;
          }
          
          if(epochs) {
            URL += `&epochs=${epochs}`;
          }
  
          try {
            const res = await axios.get(URL);
            ctx.reply(`Success! The response is: ${JSON.stringify(res.data)}`);
          } catch (err) {
            ctx.reply(`Oops, something went wrong. The error is: ${err.message}`);
          }
          data = {}; // Reset data
        } else {
          // Provide the main optional parameters menu if the user replies 'no'
          ctx.reply('No problem, let\'s continue. Choose the next optional parameter to provide.', Markup
            .keyboard(['Transaction Description', 'Keywords', 'TRAC Fee', 'Epochs', 'Publish', '/cancel'])
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
            .keyboard(['/cancel', 'skip'])
            .oneTime()
            .resize()
          );
        }
      }

      if (data.confirm !== undefined) {
        if (data.confirm) {
        const { public_address, network, txn_data, txn_description, keywords, trac_fee, epochs } = data;

        let URL = `https://api.othub.io/otp/dkg/publish?public_address=${public_address}&api_key=${process.env.API_KEY}&txn_data=${txn_data}&network=${network}`;
        
        if(txn_description) {
          URL += `&txn_description=${txn_description}`;
        }
        
        if(keywords) {
          URL += `&keywords=${keywords}`;
        }
        
        if(trac_fee) {
          URL += `&trac_fee=${trac_fee}`;
        }
        
        if(epochs) {
          URL += `&epochs=${epochs}`;
        }

        try {
          const res = await axios.get(URL);
          ctx.session.publishData = {}; // Reset data
          ctx.reply(`Success! The response is: ${JSON.stringify(res.data)}`);
        } catch (err) {
          ctx.reply(`Oops, something went wrong. The error is: ${err.message}`);
        }
      } else {
        ctx.reply('Operation canceled.');
        data = {};
      }
    }
  });
}