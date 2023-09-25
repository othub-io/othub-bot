const queryTypes = require('../util/queryTypes');

module.exports = function sendInvoice(bot) {

    const options = [
        { label: '100 OTHub Credits - $10', amount: 1000, credits: 100 },
        { label: '600 OTHub Credits - $50', amount: 5000, credits: 600 },
    ];

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
        const keyboard = options.map((option, index) => ({
            text: option.label,
            callback_data: String(index),
        }));
                await ctx.reply('Select the amount of OTHub Credits you want to purchase:', {
            reply_markup: {
                inline_keyboard: [keyboard],
            },
        });
    });
    
    bot.action(/.*/, async (ctx) => {
        const index = parseInt(ctx.match[0]);
        const selectedOption = options[index];

        const chatId = ctx.chat.id;
        await bot.telegram.sendInvoice(chatId, {
            title: 'OTHub Credits',
            description: `Purchase ${selectedOption.credits} credits to create knowledge assets on OTHub.io!`,
            payload: 'othubio',
            provider_token: '284685063:TEST:NGE0OTBmMjEyZjM1',
            photo_url: 'https://runtime.othub.io/images?src=OTHub-Logo.png',
            photo_width: '200',
            photo_height: '200',
            currency: 'USD',
            prices: [
                { label: selectedOption.label, amount: selectedOption.amount },
            ],
        });
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
        // Update the user's balance in your database
        // ...
        
        ctx.reply(`Thank you for your purchase! Your balance has been updated. You now have X OTHub Credits.`);
    });
}
