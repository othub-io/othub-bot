const { ethers } = require('ethers');
const mysql = require('mysql');
const queryTypes = require('../util/queryTypes');
const axios = require('axios');
const { getCoinPrice } = require('./getCoinPrice');
const assertionMetadata = require('./assertionMetadata');

const connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.PAYMENT_DB,
});

function cleanJson(jsonString) {
    // Step 1: Remove extra whitespace
    let cleaned = jsonString.trim().replace(/\s+/g, ' ');

    // Step 2: Remove line breaks
    cleaned = cleaned.replace(/(\r\n|\n|\r)/gm, "");

    // Step 3: Remove invisible characters
    cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');

    return cleaned;
}

function extractJSON(str) {
    const stack = [];
    let jsonStartIndex = -1;
    let jsonEndIndex = -1;
    
    for (let i = 0; i < str.length; i++) {
        if (str[i] === '{') {
            if (stack.length === 0) {
                jsonStartIndex = i;
            }
            stack.push('{');
        } else if (str[i] === '}') {
            stack.pop();
            if (stack.length === 0) {
                jsonEndIndex = i;
                break;
            }
        }
    }

    if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        const jsonStr = str.slice(jsonStartIndex, jsonEndIndex + 1);
        const cleanedJson = cleanJson(jsonStr);
        return JSON.parse(cleanedJson);
        //return JSON.parse(jsonStr);
    } else {
        return null;
    }
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
            //consider removing description because that is for the bot, and keywords extract them myself from txn_data
            return ctx.reply(
                '💫 *Knowledge Asset Creation Hub* 💫\n\n' +
                '🛠 To */create* a Knowledge Asset, please provide the following:\n\n' +
                '❗️ *Required:*\n' +
                '-A, --data <data in JSON>\n' +
                '-N, --network <otp::mainnet or otp::testnet> (only otp::testnet available for now)\n' +
                '-W, --wallet <recipient address>\n\n' +
                '⭕️ *Optional:*\n' +
                '-D, --description <transaction description>\n' +
                '-K, --keywords <keywords separated by comma>\n' +
                '-E, --epochs <epochs number> (default: 5)\n\n' +
                '❓ *Example:*\n' +
`/create -A {
    "@context": "https://schema.org",
    "@id": "uuid:1",
    "@type": "NGO",
    "name": "OTHub.io",
    "member": {
        "@id": "uuid:user:1",
        "@type": "Person"
    },
    "location": {
        "@id": "uuid:newyork",
        "@type": "City"
    }
} -N otp::testnet -W 0x39AEE393E69aB9Ed3778f41c616fFb533d7be8B1
`, { disable_web_page_preview: true, parse_mode: 'Markdown'}
            );
        }

        const inputString = ctx.message.text;
        const jsonString = extractJSON(inputString);

        const data = {
            txn_description: '',
            keywords: '',
            epochs: '5',
            network: 'otp::testnet',
            txn_data: jsonString
        };
        
        const flagMatch = inputString.match(/(-A|--asset)(\s+)/i);
        if (!flagMatch) {
            return ctx.reply('Missing -A or --asset flag. For help, try /jsonld.');
        }
        const flagIndex = flagMatch.index;
        const jsonStartIndex = flagIndex + flagMatch[0].length;
        const substring = inputString.slice(jsonStartIndex).trim();
        const modifiedInputString = inputString.slice(0, flagIndex) + substring.slice(substring.lastIndexOf('}') + 1);
        const modifiedInput = modifiedInputString.split(' ').slice(1);

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
            return ctx.reply('Error 3: Invalid or missing JSON data. Try /jsonld for help.');
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

        let URL = 'https://api.othub.io/dkg/create_n_transfer';

        let postData = {
            network: network,
            receiver: public_address,
            asset: txn_data,
            epochs: epochs,
            txn_description: txn_description,
            keywords: keywords
        };

        let config = {
            headers: {
                'x-api-key': process.env.API_KEY
            }
        };

        try {
            const processingMessage = await ctx.reply(`⚖️Your current balance is: ${balance.toFixed(2)}USD.\nProcessing your request, please wait a few minutes...`);

            let bidSuggestionUrl = 'https://api.othub.io/dkg/getBidSuggestion';

            let bidSuggestionPostData = {
                network: network,
                asset: txn_data,
                epochs: epochs
            };
            
            let bidSuggestionConfig = {
                headers: {
                    'x-api-key': process.env.API_KEY
                }
            };
            
            async function getBidSuggestion() {
                try {
                    const response = await axios.post(bidSuggestionUrl, bidSuggestionPostData, bidSuggestionConfig,{ timeout: 0 });
                    return response.data;
                } catch (error) {
                    console.error(error.message);
                }
            }
            const bidSuggestion = await getBidSuggestion();

            const telegram_id = ctx.message.from.id
            const tracPriceUsd = await getCoinPrice('TRAC');
            const assetSize = assertionMetadata.getAssertionSizeInBytes(txn_data);
            const costInTrac = assetSize * bidSuggestion * epochs * 3; 
            const costInUsd = costInTrac * tracPriceUsd;
            const crowdfundInUsd = 0.10 * tracPriceUsd;
            const totalCostInUsd = tracPriceUsd + crowdfundInUsd
            console.log(`Command: create for telegram_id: ${telegram_id}\nAsset info:\ntracPriceUsd: ${tracPriceUsd}, assetSize: ${assetSize}, bidSuggestion: ${bidSuggestion}, costInTrac: ${costInTrac}, costInUsd: ${costInUsd}, crowdfundInUsd: ${crowdfundInUsd}, totalCostInUsd: ${totalCostInUsd}`)
            console.log(txn_data);
            if (costInUsd >= balance) {
                ctx.reply(`🔴🔴 Insufficient balance to create Knowledge Asset !🔴🔴\n\n🪙Cost: ${costInUsd}\n⚖️Current Balance: ${balance.toFixed(2)}\n\nPlease use /start to refill your balance.`);
                return;
            }

            axios.post(URL, postData, config, { timeout: 0 })
                .then(async (res) => {
                    // await ctx.telegram.deleteMessage(ctx.chat.id, processingMessage.message_id);
        
                    const responseData = res.data;
                    const receipt = JSON.stringify(responseData.receipt);
                    const receiptObject = JSON.parse(receipt);

                    if (responseData.status && responseData.status !== '200') {
                        ctx.reply(`API call returned an error: ${responseData}`);
                    } else {
                        const UAL = '';
                        const status = 'pending';
        
                        const insertRecord = () => {
                            return new Promise((resolve, reject) => {
                                const query = `
                                    INSERT INTO create_n_transfer_records
                                    (paymentDate, userId, receipt, recipient, size, epochs, costInTrac, tracPriceUsd, costInUsd, crowdfundInUsd, totalCostInUsd, bid, UAL, status)
                                    VALUES
                                    (NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                `;
            
                                connection.query(query, [
                                    telegram_id,
                                    receiptObject,
                                    public_address,
                                    assetSize,
                                    epochs,
                                    costInTrac,
                                    tracPriceUsd,
                                    costInUsd,
                                    crowdfundInUsd,
                                    totalCostInUsd,
                                    bidSuggestion,
                                    UAL,
                                    status,
                                ], (error, results, fields) => {
                                    if (error) return reject(error);
                                    console.log('Inserted record ID:', results.insertId);
                                    resolve();
                                });
                            });
                        };
                        await insertRecord();            

                        const newBalance = await checkBalance(userId);
                        await ctx.reply(`⚖️New Balance: ${newBalance.toFixed(2)}USD\n🪙Cost: ${costInUsd.toFixed(2)}USD`);
                        await ctx.reply(`🟢 Transaction successfully queued\\!🟢\n\n🧾Here is your receipt\\:\n\`\`\`${receiptObject}\`\`\`\n\nCheck your /receipt or wait while your Knowledge Asset is being created\\.\\.\\.`, { parse_mode: 'MarkdownV2' });
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
            const query = 'SELECT USD_balance FROM v_user_balance WHERE telegram_id = ?';
            connection.query(query, [userId], (error, results, fields) => {
                if (error) return reject(error);
                if (results.length === 0) return resolve(0);
                const balance = results[0].USD_balance;  
                resolve(balance);  
            });
        });
    }
}
