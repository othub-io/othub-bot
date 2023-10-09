const { ethers } = require('ethers');
const mysql = require('mysql');
const queryTypes = require('../util/queryTypes');
const axios = require('axios');
const assertionMetadata = require('./assertionMetadata');
const { getCoinPrice } = require('./getCoinPrice');
const DKG = require('dkg.js');

const connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.PAYMENT_DB,
});
  
async function dkg(txn_data, epochs) {
    const dkgInstance = new DKG({
        endpoint: process.env.OT_NODE_HOSTNAME,
        port: process.env.OT_NODE_TESTNET_PORT,
        useSSL: true,
        maxNumberOfRetries: 100,
        blockchain: {
            name: 'otp::testnet',
            publicKey: process.env.PUBLIC_KEY,
            privateKey: process.env.PRIVATE_KEY,
        },
    });

    const knowledgeAssetContent = txn_data
    const assertionId = await dkgInstance.assertion.getPublicAssertionId(knowledgeAssetContent);
    const size = await dkgInstance.assertion.getSizeInBytes(knowledgeAssetContent);
    const bidSuggestion = await dkgInstance.network.getBidSuggestion(assertionId, size, { epochsNum: epochs });
  
    return { assertionId, size, bidSuggestion };
}

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

        const userId = ctx.message.from.id;
        const balance = await checkBalance(userId);
        if (balance <= 0) {
            return ctx.reply('Insufficient balance to create a Knowledge Asset. Please use command /invoice to continue.');
        }

        const input = ctx.message.text.split(' ').slice(1);
        if (input.length === 0) {
            return ctx.reply(
                'To use the /create command, please provide the following parameters:\n\n' +
                'Required:\n' +
                '-A, --data <data_to_publish_in_JSON_format>\n' +
                '-N, --network <otp::mainnet_or_otp::testnet> (only otp::testnet available for now)\n' +
                '-W, --wallet <recipient_public_address>\n\n' +
                'Optional:\n' +
                '-D, --description <transaction_description>\n' +
                '-K, --keywords <keywords_separated_by_comma>\n' +
                '-E, --epochs <epochs_number> (default: 5)'
            );
        }

        const inputString = ctx.message.text;
        const flagMatch = inputString.match(/(-A|--asset)(\s+)/i);

        if (!flagMatch) {
            return ctx.reply('Missing -A or --asset flag. For help, try /Schema_Markup.');
        }

        const flagIndex = flagMatch.index;
        const jsonStartIndex = flagIndex + flagMatch[0].length;
        const substring = inputString.slice(jsonStartIndex).trim();
        let openIndex = substring.indexOf('{');
        let closeIndex = substring.lastIndexOf('}');

        if (openIndex === -1 || closeIndex === -1 || closeIndex <= openIndex) {
            return ctx.reply('Invalid JSON data. For help, try /Schema_Markup.');
        }

        const jsonObjectString = substring.slice(openIndex, closeIndex + 1).trim();
        const modifiedInputString = inputString.slice(0, flagIndex) + substring.slice(closeIndex + 1);
        const modifiedInput = modifiedInputString.split(' ').slice(1);  // Split into array and remove the command name

        const txndata = {
            public: {
                ...JSON.parse(jsonObjectString),
            },
        };
        
        const data = {
            txn_description: '',
            keywords: '',
            epochs: '5',
            network: 'otp::testnet',
            txn_data: txndata
        };

        for (let i = 0; i < modifiedInput.length; i++) {
            const flag = modifiedInput[i];
            const value = modifiedInput[i + 1];

            switch (flag) {
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

            if (flag.startsWith('-')) i++;
        }

        if (!data.public_address) {
            return ctx.reply('Missing Recipient EVM public address.');
        } else if (!ethers.isAddress(data.public_address)) {
            return ctx.reply('Invalid EVM public address.');
        }

        if (!data.txn_data || !isValidJSON(data.txn_data)) {
            return ctx.reply('Error 3: Invalid or missing JSON data. Try /Schema_Markup for help.');
        }

        if (!['otp::testnet', 'otp::mainnet'].includes(data.network)) {
            return ctx.reply('Invalid network. Choose either otp::testnet or otp::mainnet.');
        }

        if (data.keywords && !isValidKeywords(data.keywords)) {
            return ctx.reply('Keywords should be single words separated by a comma.');
        }

        if (data.epochs && !Number.isInteger(Number(data.epochs))) {
            return ctx.reply('Epoch should be a round number.');
        }

        const { public_address, network, txn_data, txn_description, keywords, epochs } = data;

        let URL = `https://api.othub.io/dkg/create_n_transfer`;

        let postData = {
            network: network,
            public_address: public_address,
            txn_data: txn_data
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
            },
            timeout: 0
        };

//         const previewMessage = `
// Publish preview:
// Public Address: ${public_address}
// Network: ${network}
// Data: ${txn_data}
// Description: ${txn_description}
// Keywords: ${keywords}
// Epochs: ${epochs}
// Asset size: ${assertionMetadata.getAssertionSizeInBytes(txn_data)}`;

//         ctx.reply(previewMessage);

        try {
            const processingMessage = await ctx.reply(`Your current balance is: ${balance.toFixed(2)}USD.\nProcessing your request, please wait a few minutes...`);

            const telegram_id = ctx.message.from.id
            const tracPriceUsd = await getCoinPrice('TRAC');
            const dkgResult = await dkg(txn_data, epochs);
            console.log(dkgResult);
            const assertionId = dkgResult.assertionId;
            const bidSuggestionBigInt = dkgResult.bidSuggestion;
            const bidSuggestionNumber = Number(bidSuggestionBigInt);  // Convert to a Number
            const bidSuggestionString = bidSuggestionNumber.toString();  // Convert to a String
            const assetSize = dkgResult.size;

            //const assertionId = await dkg(txn_data, epochs).assertionId;
            //const assetSize = await dkg(txn_data, epochs).size;
            const costInTrac = assetSize * bidSuggestionString * epochs * 3; 
            const costInUsd = costInTrac * tracPriceUsd;
            const crowdfundInUsd = 0.10 * tracPriceUsd;
            const totalCostInUsd= tracPriceUsd + crowdfundInUsd
            console.log(telegram_id, tracPriceUsd, assertionId, assetSize, bidSuggestionString, costInTrac, costInUsd, crowdfundInUsd, totalCostInUsd)
            
            axios.post(URL, postData, config)
                .then(async (res) => {
                    await ctx.telegram.deleteMessage(ctx.chat.id, processingMessage.message_id);
        
                    const responseData = res.data;
        
                    if (responseData.status && responseData.status !== '200') {
                        ctx.reply(`API call returned an error: ${responseData.result}`);
                    } else {
                        // ctx.reply(`API call Succeeded! The response is:\n${JSON.stringify(responseData)}`);
                        const baseUrl = data.network === 'otp::testnet' ? 'https://dkg-testnet.origintrail.io' : 'https://dkg.origintrail.io';
                        const responseMessage = `
The Knowledge Asset has been created successfully!
Use this link to view your asset: ${baseUrl}/explore?ual=${responseData.ual}`;
                        ctx.reply(responseMessage);
    
                        const UAL = responseData.ual;
                        const status = 'Completed';

        
                        const query = `
                            INSERT INTO create_n_transfer_records
                            (paymentDate, userId, recipient, assertionId, size, epochs, costInTrac, tracPriceUsd, costInUsd, crowdfundInUsd, totalCostInUsd, bid, UAL, status)
                            VALUES
                            (NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `;
        
                        connection.query(query, [
                            telegram_id,
                            public_address,
                            assertionId,
                            assetSize,
                            epochs,
                            costInTrac,
                            tracPriceUsd,
                            costInUsd,
                            crowdfundInUsd,
                            totalCostInUsd,
                            bidSuggestionString,
                            UAL,
                            status,
                        ], (error, results, fields) => {
                            if (error) throw error;
                            console.log('Inserted record ID:', results.insertId);
                        });

                        const newBalance = await checkBalance(telegram_id);
                        ctx.reply(`Your new balance is: ${newBalance.toFixed(2)}USD`);

                    }
                })
                .catch(async (err) => {
                    ctx.reply(`Oops, something went wrong. Error:\n${err.message}`);
                });
        } catch (err) {
            ctx.reply(`Oops, something went wrong. The error is:\n${err.message}`);
        }        
    });

    function isValidJSON(input) {
        if (typeof input === 'object') {
            try {
                JSON.stringify(input);
                return true;
            } catch (e) {
                return false;
            }
        } else if (typeof input === 'string') {
            try {
                JSON.parse(input);
                return true;
            } catch (e) {
                return false;
            }
        } else {
            return false;
        }
    }

    function isValidKeywords(keywords) {
        const keywordArray = keywords.split(',');
        return keywordArray.every(keyword => keyword.trim().split(' ').length === 1);
    }
    
    async function checkBalance(userId) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT balance FROM v_user_balance WHERE userId = ?';
            connection.query(query, [userId], (error, results, fields) => {
                if (error) return reject(error);
                if (results.length === 0) return resolve(0);
                const balance = results[0].balance;  
                resolve(balance);  
            });
        });
    }
}
