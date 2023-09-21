const { ethers } = require('ethers');
const mysql = require('mysql');

const connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.OTHUBBOT_DB,
});

bot.command('create', async (ctx) => {
    if (ctx.chat.type !== 'private') {
        command = 'create'
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

        const noResultsMessage = await ctx.reply('The /create command is only available in private chat with @othubbot.');
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

  const input = ctx.message.text.split(' ').slice(1);
  const params = {
    txn_description: '',
    keywords: '',
    epochs: '5',
    network: 'otp::mainnet'
  };

  for (let i = 0; i < input.length; i += 2) {
    const flag = input[i];
    const value = input[i + 1];
    switch (flag) {
      case '-A':
      case '--data':
        params.txn_data = value;
        break;
      case '-N':
      case '--network':
        params.network = value;
        break;
      case '-W':
      case '--wallet':
        params.public_address = value;
        break;
      case '-D':
      case '--description':
        params.txn_description = value;
        break;
      case '-K':
      case '--keywords':
        params.keywords = value;
        break;
      case '-E':
      case '--epochs':
        params.epochs = value;
        break;
    }
  }

  if (!params.public_address) {
    const telegramId = ctx.from.id;
    connection.query('SELECT * FROM publisher_profile WHERE publisher_id = ?', [telegramId], function (error, rows) {
      if (error) {
        console.error('Failed to execute query: ', error);
        return;
      }

      if (rows.length > 0) {
        params.public_address = rows[0].public_address;
      }
    });
  }

  if (!params.txn_data || !isValidJSON(params.txn_data)) {
    return ctx.reply('Invalid or missing JSON data.');
  }

  if (!['otp::testnet', 'otp::mainnet'].includes(params.network)) {
    return ctx.reply('Invalid network. Choose either otp::testnet or otp::mainnet.');
  }

  if (!params.public_address || !ethers.isAddress(data.public_address)) {
    return ctx.reply('Invalid or missing EVM public address.');
  }

  // Validate optional parameters (only if they are provided)
  if (params.keywords && !isValidKeywords(params.keywords)) {
    return ctx.reply('Keywords should be single words separated by a comma.');
  }

  if (params.epochs && !Number.isInteger(Number(params.epochs))) {
    return ctx.reply('Epoch should be a round number.');
  }

  const { public_address, network, txn_data, txn_description, keywords, epochs } = params;

  let URL = `https://api.othub.io/otp/dkg/create?public_address=${public_address}&api_key=${process.env.API_KEY}&txn_data=${txn_data}&network=${network}`;
  
  if(txn_description) {
    URL += `&txn_description=${txn_description}`;
  }
  
  if(keywords) {
    URL += `&keywords=${keywords}`;
  }
  
  if(epochs) {
    URL += `&epochs=${epochs}`;
  }

  try {
    const res = await axios.get(URL);
    ctx.reply(`API call Succeeded! The response is:\n${JSON.stringify(res.data)}`);
  } catch (err) {
    ctx.reply(`Oops, something went wrong. The error is:\n${err.message}`);
  }
});

function isValidJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

function isValidKeywords(keywords) {
  const keywordArray = keywords.split(',');
  return keywordArray.every(keyword => keyword.trim().split(' ').length === 1);
}