const { ethers } = require('ethers');
const mysql = require('mysql');
const queryTypes = require('../util/queryTypes');
const axios = require('axios');

const connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.PAYMENT_DB,
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

        //connection to paymentdb view to check the current balance for given tg id

        const input = ctx.message.text.split(' ').slice(1);

        if (input.length === 0) {
            return ctx.reply(
                'To use the /create command, please provide the following parameters:\n\n' +
                'Required:\n' +
                '-A, --data <data_to_publish_in_JSON_format>\n' +
                '-N, --network <otp::mainnet_or_otp::testnet> (default: otp::mainnet)\n' +
                '-W, --wallet <recipient_public_address>\n\n' +
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
        const inputString = input.join(' ');

        const jsonObjects = [];
        const modifiedInputString = inputString.replace(/({[^}]*})/g, (match) => {
            jsonObjects.push(match);
            return 'JSON_PLACEHOLDER';
        });

        const modifiedInput = modifiedInputString.split(' ');

        for (let i = 0; i < modifiedInput.length; i++) {
            const part = modifiedInput[i];
            if (part === 'JSON_PLACEHOLDER') {
                jsonData = jsonObjects.shift();
            } else {
                const flag = part;
                const value = modifiedInput[i + 1];
                switch (flag) {
                    case '-A':
                    case '--asset':
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
                if (flag.startsWith('-') && value !== 'JSON_PLACEHOLDER') i++;
            }
        }

        jsonData = jsonData.trim();

        if (jsonData) {
            try {
                const jsonObject = JSON.parse(jsonData);
                data.txn_data = JSON.stringify(jsonObject);
                //limit the amount of characters in the json to about 10k chars
            } catch (e) {
                return ctx.reply('Invalid JSON data. For help, try /Schema_Markup.');
            }
        }

        if (!data.public_address) {
            return ctx.reply('Missing Recipient EVM public address.');
        } else if (!ethers.isAddress(data.public_address)) {
            return ctx.reply('Invalid EVM public address.');
        }

        if (!data.txn_data || !isValidJSON(data.txn_data)) {
            return ctx.reply('Invalid or missing JSON data. Try /Schema_Markup for help.');
        }

        if (!['otp::testnet', 'otp::mainnet'].includes(data.network)) {
            return ctx.reply('Invalid network. Choose either otp::testnet or otp::mainnet.');
        }

        // Validate optional parameters (only if they are provided)
        if (data.keywords && !isValidKeywords(data.keywords)) {
            return ctx.reply('Keywords should be single words separated by a comma.');
        }

        if (data.epochs && !Number.isInteger(Number(data.epochs))) {
            return ctx.reply('Epoch should be a round number.');
        }

        const { public_address, network, txn_data, txn_description, keywords, epochs } = data;

        let URL = `https://api.othub.io/dkg/create_n_transfer?api_key=${process.env.API_KEY}&network=${network}&public_address=${public_address}&txn_data=${txn_data}`;
        
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
            //await assetHistory search every 5 seconds, add the insert to db here for create_n_transfer_records, or find a way to instantly get asset info
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
}
