const queryTypes = require('../util/queryTypes');
const axios = require('axios');
const mysql = require('mysql');
const { ethers } = require('ethers');

const connection = mysql.createConnection({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    database: process.env.PAYMENT_DB,
});

function addTransaction(transaction) {
const {
    orderNumber,
    userId,
    productId,
    amountPaid,
    currency,
    telegramPaymentChargeId,
    providerPaymentChargeId,
    paymentStatus,
    notes,
} = transaction;

const query = `
    INSERT INTO invoice_records (
    orderNumber,
    userId,
    productId,
    amountPaid,
    currency,
    telegramPaymentChargeId,
    providerPaymentChargeId,
    paymentStatus,
    notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

connection.query(query, [
    orderNumber,
    userId,
    productId,
    amountPaid,
    currency,
    telegramPaymentChargeId,
    providerPaymentChargeId,
    paymentStatus,
    notes,
], (error, results, fields) => {
    if (error) {
    console.error('Error inserting transaction:', error);
    return;
    }
    console.log('Transaction inserted with ID:', results.insertId);
});
}

module.exports = function sendInvoice(bot) {
    const options = [
        { label: '$1', amount: 100 },
        { label: '$2', amount: 200 },
        { label: '$5', amount: 500 },
        { label: '$10', amount: 1000 },
        { label: '$50', amount: 5000 },
    ];

    function generateUniqueOrderNumber(userId) {
        const timestamp = Date.now();
        const orderNumber = `OTHUB-${userId}-${timestamp}`;
        return orderNumber;
    }

    const sendInvoiceToUser = async (ctx, label, amount) => {
        const userId = ctx.from.id;
        await bot.telegram.sendInvoice(ctx.from.id, {
            title: 'OTHub.io credits',
            description: `Unlock the power of Knowledge with OTHub.io! Create Knowledge Assets until your OTHub.io balance is depleted.`,
            payload: JSON.stringify({
                userId: userId,
                productId: 'othub-credits',
                currency: 'USD',
                orderNumber: generateUniqueOrderNumber(userId),
            }),
            provider_token: '284685063:TEST:NGE0OTBmMjEyZjM1',
            photo_url: 'https://runtime.othub.io/images?src=OTHub-Logo.png',
            photo_width: '180',
            photo_height: '180',
            currency: 'USD',
            prices: [
                { label: label, amount: amount },
            ],
        });
    };

    bot.command('invoice', async (ctx) => {
        command = 'invoice'
        // spamCheck = await queryTypes.spamCheck()
        // telegram_id = ctx.message.from.id

        // permission = await spamCheck
        //     .getData(command, telegram_id)
        //     .then(async ({ permission }) => {
        //     return permission
        //     })
        //     .catch(error => console.log(`Error : ${error}`))

        // if (permission != `allow`) {
        //     await ctx.deleteMessage()
        //     return
        // }

        const description = `
🌟 *Welcome to OTHub.io!* 🌟

You are about to create */Knowledge_Assets* to harness the power of connected and structured AI-ready data! 
        
🔍 *What You Get:*
- OTHub credits to create Knowledge Assets
- Exclusive features on @othubbot
- Unique tiers of OTHub Knowledge Badges
- Access to create and transfer API for App Developers
- Priority Support
- And Much More!

By continuing, you accept our /Terms.
        
💰 *Select the amount you want to purchase:*`;

        // Inline keyboard with payment options
        const keyboard = options.map((option, index) => ({
            text: option.label,
            callback_data: String(index),
        }));
        
        // Send the logo
        await ctx.replyWithPhoto('https://runtime.othub.io/images?src=OTHub-Logo.png', {
            width: 180,
            height: 180,
        });

        // Send the descriptive message with the inline keyboard
        await ctx.reply(description, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [keyboard],
            },
        });
    });

    bot.action(/.*/, async (ctx) => {
        const index = parseInt(ctx.match[0]);
        const selectedOption = options[index];

        await sendInvoiceToUser(ctx, selectedOption.label, selectedOption.amount);
        await ctx.answerCbQuery();
    });

    bot.on('pre_checkout_query', async (ctx) => {
        try {
            await ctx.answerPreCheckoutQuery(true);
        } catch (error) {
            console.error('PreCheckoutQuery failed', error);
            ctx.reply('We are sorry, but we were unable to process your payment. Please try again later.');
        }
    });
    
    bot.on('successful_payment', (ctx) => {
        const payload = JSON.parse(ctx.update.message.successful_payment.invoice_payload);
        const userId = payload.userId;
        const orderNumber = payload.orderNumber;
        const currency = payload.currency;
        const productId = payload.productId;
        const telegramPaymentChargeId = ctx.update.message.successful_payment.telegram_payment_charge_id;
        const providerPaymentChargeId = ctx.update.message.successful_payment.provider_payment_charge_id;    
        const amountPaid = ctx.update.message.successful_payment.total_amount / 100;
        const paymentStatus = 'Completed';

        addTransaction({
            orderNumber,
            userId,
            productId,
            amountPaid,
            currency,
            telegramPaymentChargeId,
            providerPaymentChargeId,
            paymentStatus,
        });
        
        // Check if the userId already has an associated evmAddress in the database
        const checkQuery = 'SELECT evmAddress FROM invoice_records WHERE userId = ? AND evmAddress IS NOT NULL LIMIT 1';
        connection.query(checkQuery, [userId], (error, results, fields) => {
        if (error) {
            console.error('Error checking EVM address:', error);
            return;
        }

        if (results.length > 0) {
            // An evmAddress is already associated with this userId
            const existingEvmAddress = results[0].evmAddress;

            // Update the new transaction record with the existing evmAddress
            const updateQuery = 'UPDATE invoice_records SET evmAddress = ? WHERE orderNumber = ?';
            connection.query(updateQuery, [existingEvmAddress, orderNumber], (updateError, updateResults, updateFields) => {
                if (updateError) {
                    console.error('Error updating EVM address:', updateError);
                    return;
                }
                ctx.reply('Thank you for your purchase! Your balance has been updated. Your existing EVM address has been successfully linked to this transaction!');
            });
        } else {

        ctx.reply('Thank you for your purchase! Your balance has been updated. Would you like to provide your EVM address to link your balance with your wallet on OTHub.io? If so, please reply with your EVM address. This step is required for App Developers to use OTHub API.');

            bot.on('message', async (messageCtx) => {
                // Check if the message is from the same user
                if (messageCtx.from.id === ctx.from.id) {
                    const evmAddress = messageCtx.message.text.trim();

                    // Validate the EVM address
                    if (ethers.utils.isAddress(evmAddress)) {
                        // Update the transaction record in the database with the provided EVM address
                        const updateQuery = 'UPDATE invoice_records SET evmAddress = ? WHERE orderNumber = ?';
                        connection.query(updateQuery, [evmAddress, orderNumber], (updateError, updateResults, updateFields) => {
                            if (updateError) {
                                console.error('Error updating EVM address:', updateError);
                                return;
                            }
                            messageCtx.reply('Your EVM address has been successfully linked!');
                        });
                    } else {
                        messageCtx.reply('Invalid EVM address. Please enter a valid EVM address.');
                    }
                }
            });
        }
    });
});
};