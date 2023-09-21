const { ethers } = require('ethers');
const mysql = require('mysql');
const queryTypes = require('../util/queryTypes');
const axios = require('axios');

const connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.OTHUBBOT_DB,
});

module.exports = function createCommand(bot) {
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

    const input = ctx.message.text.split(' ').slice(1);

    if (input.length === 0) {
        return ctx.reply(
        'To use the /create command, please provide the following parameters:\n\n' +
        'Required:\n' +
        '-A, --data <publish_data_in_JSON>\n' +
        '-N, --network <otp::mainnet_or_otp::testnet> (default: otp::mainnet)\n' +
        '-W, --wallet <public_address>\n\n' +
        'Optional:\n' +
        '-D, --description <transaction_description>\n' +
        '-K, --keywords <keywords_separated_by_comma>\n' +
        '-E, --epochs <epochs_number> (default: 5)'
        );
    }

    const data = {
        txn_description: '',
        keywords: '',
        epochs: '5',
        network: 'otp::mainnet'
    };

    let jsonData = "";
    let isJsonStarted = false;
    
    for (let i = 0; i < input.length; i++) {
        const part = input[i];
        if (part.startsWith('{')) {
            isJsonStarted = true;
        }
        if (isJsonStarted) {
            jsonData += part + " ";
        }
        if (part.endsWith('}')) {
            isJsonStarted = false;
        }
    }
    
    jsonData = jsonData.trim();
    
    if (jsonData) {
        try {
            const jsonObject = JSON.parse(jsonData);
            data.txn_data = JSON.stringify(jsonObject);  // Convert it to single line
        } catch (e) {
            return ctx.reply('Invalid JSON data.');
        }
    } else {
        for (let i = 0; i < input.length; i += 2) {
            const flag = input[i];
            const value = input[i + 1];
            switch (flag) {
        case '-A':
        case '--data':
            data.txn_data = value;
            break;
        case '-N':
        case '--network':
            data.network = value;
            break;
        case '-W':
        case '--wallet':
            data.public_address = value;
            break;
        case '-D':
        case '--description':
            data.txn_description = value;
            break;
        case '-K':
        case '--keywords':
            data.keywords = value;
            break;
        case '-E':
        case '--epochs':
            data.epochs = value;
            break;
        }
    }
    }

    if (!data.public_address) {
        const telegramId = ctx.from.id;
        try {
            const rows = await queryDatabase(telegramId);
            if (rows.length > 0) {
                data.public_address = rows[0].public_address;
            }
        } catch (error) {
            console.error('Failed to execute query: ', error);
            return;
        }
    }

    if (!data.txn_data || !isValidJSON(data.txn_data)) {
        return ctx.reply('Invalid or missing JSON data. Try /Schema_Markup for help.');
    }

    if (!['otp::testnet', 'otp::mainnet'].includes(data.network)) {
        return ctx.reply('Invalid network. Choose either otp::testnet or otp::mainnet.');
    }

    if (!data.public_address || !ethers.isAddress(data.public_address)) {
        return ctx.reply('Invalid or missing EVM public address.');
    } else {
        const telegramId = ctx.from.id;
        await connection.query(
          'INSERT INTO publisher_profile (publisher_id, command, platform, public_address) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE public_address = ?',
          [telegramId, 'create', 'telegram', data.public_address, data.public_address]
        );
      };

    // Validate optional parameters (only if they are provided)
    if (data.keywords && !isValidKeywords(data.keywords)) {
        return ctx.reply('Keywords should be single words separated by a comma.');
    }

    if (data.epochs && !Number.isInteger(Number(data.epochs))) {
        return ctx.reply('Epoch should be a round number.');
    }

    const { public_address, network, txn_data, txn_description, keywords, epochs } = data;

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

    const previewMessage = `
Publish preview:
Public Address: ${public_address}
Network: ${network}
Data: ${txn_data}
Description: ${txn_description}
Keywords: ${keywords}
Epochs: ${epochs}`;

ctx.reply(previewMessage);

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

    function queryDatabase(telegramId) {
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM publisher_profile WHERE publisher_id = ?', [telegramId], function (error, rows) {
                if (error) {
                    reject(error);
                } else {
                    resolve(rows);
                }
            });
        });
    }
}