const queryTypes = require('../util/queryTypes');

module.exports = function sendInvoice(bot) {
bot.command('invoice', async (ctx) => {
    command = 'invoice'
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

    const chatId = ctx.chat.id;
    await bot.telegram.sendInvoice(chatId, {
        title: 'OTHub Credits',
        description: 'Purchase credits to create knowledge assets on OTHub.io!',
        payload: 'othubio',
        provider_token: '284685063:TEST:NGE0OTBmMjEyZjM1',
        photo_url: '',
        currency: 'USD',
        prices: [
          { label: 'OTHub Credit', amount: 1000 }, // amount is in the smallest currency unit (e.g., cents for USD)
        ],
      });
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