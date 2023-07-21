require('dotenv').config()

const queryTypes = require('./src/util/queryTypes')
const networkOverview = require('./src/modules/networkOverview.js')
const uptimeMonitor = require('./src/modules/uptimeMonitor.js')
const teamMonitor = require('./src/modules/teamMonitor.js')
const askMonitor = require('./src/modules/askMonitor.js')
const myNodes = require('./src/modules/myNodes.js')
const newMember = require('./src/modules/newMember.js')
const closeProposals = require('./src/modules/closeProposals.js')
const networkPubs = require('./src/modules/networkPubs.js')
const { isAdmin , adminCommand } = require('./src/modules/systemCommands.js')
const adminCommandList = require('./src/modules/adminCommandList.js')
const generalCommandList = require('./src/modules/generalCommandList.js')
const networkStats = require('./src/modules/networkStats.js')
const nodeStats = require('./src/modules/nodeStats.js')
const { checkForNewPublishers } = require('./src/modules/eventMonitor.js')

const {
  Telegraf,
  session,
  Scenes,
  Markup,
  BaseScene,
  Stage
} = require('telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN)

const os = require('os')
const fs = require('fs')
const cron = require('node-cron')
const express = require('express')
const shell = require('shelljs')

bot.use(session({ ttl: 10 }))

setInterval(() => checkForNewPublishers(callback), 5 * 60 * 1000);

bot.on('new_chat_members', async ctx => {
  const specificChannelId = process.env.ALLIANCE_ID;
  if (ctx.chat && ctx.chat.id == specificChannelId) {
    await newMember(ctx);
  }
});


bot.command('mynodes', async ctx => {
  command = 'mynodes'
  spamCheck = await queryTypes.spamCheck()
  telegram_id = ctx.message.from.id

  permission = await spamCheck
    .getData(command, telegram_id)
    .then(async ({ permission }) => {
      return permission
    })
    .catch(error => console.log(`Error : ${error}`))

  if (permission != 'allow') {
    setTimeout(async () => {
      try {
        await ctx.deleteMessage();
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }, process.env.DELETE_TIMER);
    return;
  }

  const botmessage = await myNodes(ctx)

  if (botmessage) {
    setTimeout(async () => {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id)
      } catch (error) {
        console.error('Error deleting message:', error)
      }
    }, process.env.DELETE_TIMER)
  }
})

////////////////networkStats
bot.command('networkstats', async ctx => {
  command = 'networkstats'
  spamCheck = await queryTypes.spamCheck()
  telegram_id = ctx.message.from.id

  permission = await spamCheck
    .getData(command, telegram_id)
    .then(async ({ permission }) => {
      return permission
    })
    .catch(error => console.log(`Error : ${error}`))

  if (permission != 'allow') {
    setTimeout(async () => {
      try {
        await ctx.deleteMessage();
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }, process.env.DELETE_TIMER);
    return;
  }

  const botmessage = await networkStats.fetchNetworkStatistics(ctx)

  if (botmessage) {
    setTimeout(async () => {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id)
      } catch (error) {
        console.error('Error deleting message:', error)
      }
    }, process.env.DELETE_TIMER)
  }
})

////////////////networkPubs
bot.command('hourlypubs', async ctx => {
  command = 'hourlypubs'
  spamCheck = await queryTypes.spamCheck()
  telegram_id = ctx.message.from.id

  permission = await spamCheck
    .getData(command, telegram_id)
    .then(async ({ permission }) => {
      return permission
    })
    .catch(error => console.log(`Error : ${error}`))

  if (permission != 'allow') {
    setTimeout(async () => {
      try {
        await ctx.deleteMessage();
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }, process.env.DELETE_TIMER);
    return;
  }

  const botmessage = await networkPubs.fetchAndSendHourlyPubs(ctx)

  if (botmessage) {
    setTimeout(async () => {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id)
      } catch (error) {
        console.error('Error deleting message:', error)
      }
    }, process.env.DELETE_TIMER)
  }
})


bot.command('dailypubs', async ctx => {
  command = 'dailypubs'
  spamCheck = await queryTypes.spamCheck()
  telegram_id = ctx.message.from.id

  permission = await spamCheck
    .getData(command, telegram_id)
    .then(async ({ permission }) => {
      return permission
    })
    .catch(error => console.log(`Error : ${error}`))

  if (permission != 'allow') {
    setTimeout(async () => {
      try {
        await ctx.deleteMessage();
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }, process.env.DELETE_TIMER);
    return;
  }

  const botmessage = await networkPubs.fetchAndSendDailyPubs(ctx)

  if (botmessage) {
    setTimeout(async () => {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id)
      } catch (error) {
        console.error('Error deleting message:', error)
      }
    }, process.env.DELETE_TIMER)
  }
})

bot.command('weeklypubs', async ctx => {
  command = 'weeklypubs'
  spamCheck = await queryTypes.spamCheck()
  telegram_id = ctx.message.from.id

  permission = await spamCheck
    .getData(command, telegram_id)
    .then(async ({ permission }) => {
      return permission
    })
    .catch(error => console.log(`Error : ${error}`))

  if (permission != 'allow') {
    setTimeout(async () => {
      try {
        await ctx.deleteMessage();
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }, process.env.DELETE_TIMER);
    return;
  }

  const botmessage = await networkPubs.fetchAndSendWeeklyPubs(ctx)

  if (botmessage) {
    setTimeout(async () => {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id)
      } catch (error) {
        console.error('Error deleting message:', error)
      }
    }, process.env.DELETE_TIMER)
  }
})

bot.command('monthlypubs', async ctx => {
  command = 'monthlypubs'
  spamCheck = await queryTypes.spamCheck()
  telegram_id = ctx.message.from.id

  permission = await spamCheck
    .getData(command, telegram_id)
    .then(async ({ permission }) => {
      return permission
    })
    .catch(error => console.log(`Error : ${error}`))

  if (permission != 'allow') {
    setTimeout(async () => {
      try {
        await ctx.deleteMessage();
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }, process.env.DELETE_TIMER);
    return;
  }


  const botmessage = await networkPubs.fetchAndSendMonthlyPubs(ctx)

  if (botmessage) {
    setTimeout(async () => {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id)
      } catch (error) {
        console.error('Error deleting message:', error)
      }
    }, process.env.DELETE_TIMER)
  }
})

////////////////systemCommands
adminCommand(bot);

bot.command('commands', async (ctx) => {
  command = 'commands'
  spamCheck = await queryTypes.spamCheck()
  telegram_id = ctx.message.from.id

  permission = await spamCheck
    .getData(command, telegram_id)
    .then(async ({ permission }) => {
      return permission
    })
    .catch(error => console.log(`Error : ${error}`))

  if (permission != 'allow') {
    setTimeout(async () => {
      try {
        await ctx.deleteMessage();
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }, process.env.DELETE_TIMER);
    return;
  }

  setTimeout(async () => {
    try {
      await ctx.deleteMessage();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }, process.env.DELETE_TIMER);

  let message = 'Here are the general commands:\n\n';

  for (const [command, description] of Object.entries(generalCommandList)) {
    message += `/${command} - ${description}\n`;
  }

  const botmessage = await ctx.reply(message);

  if (botmessage) {
    setTimeout(async () => {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id)
      } catch (error) {
        console.error('Error deleting message:', error)
      }
    }, process.env.DELETE_TIMER)
  }
});


bot.command('admincommands', async (ctx) => {
  command = 'admincommands'
  spamCheck = await queryTypes.spamCheck()
  telegram_id = ctx.message.from.id

  permission = await spamCheck
    .getData(command, telegram_id)
    .then(async ({ permission }) => {
      return permission
    })
    .catch(error => console.log(`Error : ${error}`))

  if (permission != 'allow') {
    setTimeout(async () => {
      try {
        await ctx.deleteMessage();
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }, process.env.DELETE_TIMER);
    return;
  }

  setTimeout(async () => {
    try {
      await ctx.deleteMessage();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }, process.env.DELETE_TIMER);
  
  if (!isAdmin(ctx)) {
    const botmessage = await ctx.reply('You are not authorized to execute this command.');
    if (botmessage) {
      setTimeout(async () => {
        try {
          await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id)
        } catch (error) {
          console.error('Error deleting message:', error)
        }
      }, process.env.DELETE_TIMER)
    }    return;
  }

  let message = 'Here are the admin commands:\n\n';

  for (const [commandName, commandDetails] of Object.entries(adminCommandList)) {
    message += `/${commandName} - ${commandDetails.description}\n`;
  }

  const botmessage = await ctx.reply(message);

  if (botmessage) {
    setTimeout(async () => {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id)
      } catch (error) {
        console.error('Error deleting message:', error)
      }
    }, process.env.DELETE_TIMER)
  }
});

////////////////nodeStats
bot.command('nodestatslasthour', async ctx => {
  const tokenSymbol = ctx.message.text.split(' ')[1];
  command = 'nodestatslasthour' + '_' + tokenSymbol;
  
  spamCheck = await queryTypes.spamCheck();
  telegram_id = ctx.message.from.id;

  permission = await spamCheck
    .getData(command, telegram_id)
    .then(({ permission }) => {
      return permission;
    })
    .catch(error => console.log(`Error : ${error}`));

  if (permission != 'allow') {
    setTimeout(async () => {
      try {
        await ctx.deleteMessage();
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }, process.env.DELETE_TIMER);
    return;
  }

  setTimeout(async () => {
    try {
      await ctx.deleteMessage();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }, process.env.DELETE_TIMER);

  nodeStats.lastHourNodeStats(tokenSymbol, async (err, result) => {
    if (err) {
      console.error(err);
      return;
    }

    if (result) {
      const botmessage = await ctx.reply(result); 

      if (botmessage) {
        setTimeout(async () => {
          try {
            await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id);
          } catch (error) {
            console.error('Error deleting message:', error);
          }
        }, process.env.DELETE_TIMER);
      }
    } else {
      const noResultsMessage = await ctx.reply('No results found');
      setTimeout(async () => {
        try {
          await ctx.telegram.deleteMessage(ctx.chat.id, noResultsMessage.message_id);
        } catch (error) {
          console.error('Error deleting message:', error);
        }
      }, process.env.DELETE_TIMER);
    }
  });
});

bot.command('nodestatslastday', async ctx => {
  const tokenSymbol = ctx.message.text.split(' ')[1];
  command = 'nodestatslastday' + '_' + tokenSymbol;
  
  spamCheck = await queryTypes.spamCheck();
  telegram_id = ctx.message.from.id;
  
  permission = await spamCheck
    .getData(command, telegram_id)
    .then(({ permission }) => {
      return permission;
    })
    .catch(error => console.log(`Error : ${error}`));

  if (permission != 'allow') {
    setTimeout(async () => {
      try {
        await ctx.deleteMessage();
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }, process.env.DELETE_TIMER);
    return;
  }

  setTimeout(async () => {
    try {
      await ctx.deleteMessage();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }, process.env.DELETE_TIMER);

  nodeStats.lastDayNodeStats(tokenSymbol, async (err, result) => {
    if (err) {
      console.error(err);
      return;
    }

    if (result) {
      const botmessage = await ctx.reply(result); 

      if (botmessage) {
        setTimeout(async () => {
          try {
            await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id);
          } catch (error) {
            console.error('Error deleting message:', error);
          }
        }, process.env.DELETE_TIMER);
      }
    } else {
      const noResultsMessage = await ctx.reply('No results found');
      setTimeout(async () => {
        try {
          await ctx.telegram.deleteMessage(ctx.chat.id, noResultsMessage.message_id);
        } catch (error) {
          console.error('Error deleting message:', error);
        }
      }, process.env.DELETE_TIMER);
    }
  });
});

bot.command('nodestatslastweek', async ctx => {
  const tokenSymbol = ctx.message.text.split(' ')[1];
  command = 'nodestatslastweek' + '_' + tokenSymbol;
  
  spamCheck = await queryTypes.spamCheck();
  telegram_id = ctx.message.from.id;
  
  permission = await spamCheck
    .getData(command, telegram_id)
    .then(({ permission }) => {
      return permission;
    })
    .catch(error => console.log(`Error : ${error}`));

  if (permission != 'allow') {
    setTimeout(async () => {
      try {
        await ctx.deleteMessage();
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }, process.env.DELETE_TIMER);
    return;
  }

  setTimeout(async () => {
    try {
      await ctx.deleteMessage();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }, process.env.DELETE_TIMER);

  nodeStats.lastWeekNodeStats(tokenSymbol, async (err, result) => {
    if (err) {
      console.error(err);
      return;
    }

    if (result) {
      const botmessage = await ctx.reply(result); 

      if (botmessage) {
        setTimeout(async () => {
          try {
            await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id);
          } catch (error) {
            console.error('Error deleting message:', error);
          }
        }, process.env.DELETE_TIMER);
      }
    } else {
      const noResultsMessage = await ctx.reply('No results found');
      setTimeout(async () => {
        try {
          await ctx.telegram.deleteMessage(ctx.chat.id, noResultsMessage.message_id);
        } catch (error) {
          console.error('Error deleting message:', error);
        }
      }, process.env.DELETE_TIMER);
    }
  });
});

bot.command('nodestatslastmonth', async ctx => {
  const tokenSymbol = ctx.message.text.split(' ')[1];
  command = 'nodestatslastmonth' + '_' + tokenSymbol;
  
  spamCheck = await queryTypes.spamCheck();
  telegram_id = ctx.message.from.id;
  
  permission = await spamCheck
    .getData(command, telegram_id)
    .then(({ permission }) => {
      return permission;
    })
    .catch(error => console.log(`Error : ${error}`));

  if (permission != 'allow') {
    setTimeout(async () => {
      try {
        await ctx.deleteMessage();
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }, process.env.DELETE_TIMER);
    return;
  }

  setTimeout(async () => {
    try {
      await ctx.deleteMessage();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }, process.env.DELETE_TIMER);

  nodeStats.lastMonthNodeStats(tokenSymbol, async (err, result) => {
    if (err) {
      console.error(err);
      return;
    }

    if (result) {
      const botmessage = await ctx.reply(result); 

      if (botmessage) {
        setTimeout(async () => {
          try {
            await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id);
          } catch (error) {
            console.error('Error deleting message:', error);
          }
        }, process.env.DELETE_TIMER);
      }
    } else {
      const noResultsMessage = await ctx.reply('No results found');
      setTimeout(async () => {
        try {
          await ctx.telegram.deleteMessage(ctx.chat.id, noResultsMessage.message_id);
        } catch (error) {
          console.error('Error deleting message:', error);
        }
      }, process.env.DELETE_TIMER);
    }
  });
});


cron.schedule(process.env.ASK_MONITOR, async function () {
  await askMonitor()
})

cron.schedule(process.env.TEAM_MONITOR, async function () {
  await teamMonitor()
})

cron.schedule(process.env.UPTIME_MONITOR, async function () {
  await uptimeMonitor()
})

cron.schedule(process.env.HOURLY, async function () {
  await networkOverview(`hourly`)
})

cron.schedule(process.env.DAILY, async function () {
  await networkOverview(`daily`)
})

cron.schedule(process.env.WEEKLY, async function () {
  await networkOverview(`weekly`)
})

cron.schedule(process.env.MONTHLY, async function () {
  await networkOverview(`monthly`)
})

cron.schedule(process.env.YEARLY, async function () {
  await networkOverview(`yearly`)
})

// cron.schedule(process.env.ASK_PROPOSAL, async function () {
//   await closeProposals('ask')
// })

//-----------------------END---------------------------

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))