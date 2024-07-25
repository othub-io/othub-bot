const { spawn } = require('child_process');

const admins = process.env.ADMIN_GROUP.split(',');

const adminCommands = {
  'otnoderestart': { 
    action: 'systemctl restart otnode.service', 
    description: 'Restart the otnode service'
  },
  'otnodestop': { 
    action: 'systemctl stop otnode.service', 
    description: 'Stop the otnode service'
  },
  'otnodestart': { 
    action: 'systemctl start otnode.service', 
    description: 'Start the otnode service'
  },
  'otnodelogs': { 
    action: 'journalctl -u otnode --output cat -n 25', 
    description: 'Show the last 25 entries of the otnode service logs'
  },
  'otnode2restart': { 
    action: 'systemctl restart otnode2.service', 
    description: 'Restart the otnode2 service'
  },
  'otnode2stop': { 
    action: 'systemctl stop otnode2.service', 
    description: 'Stop the otnode2 service'
  },
  'otnode2start': { 
    action: 'systemctl start otnode2.service', 
    description: 'Start the otnode2 service'
  },
  'otnode2logs': { 
    action: 'journalctl -u otnode2 --output cat -n 25', 
    description: 'Show the last 25 entries of the otnode2 service logs'
  },
  'othubbotrestart': { 
    action: 'systemctl restart othub-bot', 
    description: 'Restart the othub-bot service'
  },
  'othubbotstop': { 
    action: 'systemctl stop othub-bot', 
    description: 'Stop the othub-bot service'
  },
  'othubbotstart': { 
    action: 'systemctl start othub-bot', 
    description: 'Start the othub-bot service'
  },
  'othubbotlogs': { 
    action: 'journalctl -u othub-bot --output cat -n 25', 
    description: 'Show the last 25 entries of the othub-bot service logs'
  },
  'otpsyncrpcrestart': { 
    action: 'systemctl restart otp-sync-rpc', 
    description: 'Restart the otp-sync-rpc service'
  },
  'otpsyncrpcstop': { 
    action: 'systemctl stop otp-sync-rpc', 
    description: 'Stop the otp-sync-rpc service'
  },
  'otpsyncrpcstart': { 
    action: 'systemctl start otp-sync-rpc', 
    description: 'Start the otp-sync-rpc service'
  },
  'otpsyncrpclogs': { 
    action: 'journalctl -u otp-sync-rpc --output cat -n 25', 
    description: 'Show the last 25 entries of the otp-sync-rpc service logs'
  },
  'othubapirestart': { 
    action: 'systemctl restart othub-api', 
    description: 'Restart the othub-api service'
  },
  'othubapistop': { 
    action: 'systemctl stop othub-api', 
    description: 'Stop the othub-api service'
  },
  'othubapistart': { 
    action: 'systemctl start othub-api', 
    description: 'Start the othub-api service'
  },
  'othubapilogs': { 
    action: 'journalctl -u othub-api --output cat -n 25', 
    description: 'Show the last 25 entries of the othub-api service logs'
  },
  'othubreactrestart': { 
    action: 'systemctl restart othub-react', 
    description: 'Restart the othub-react service'
  },
  'othubreactstop': { 
    action: 'systemctl stop othub-react', 
    description: 'Stop the othub-react service'
  },
  'othubreactstart': { 
    action: 'systemctl start othub-react', 
    description: 'Start the othub-react service'
  },
  'othubreactlogs': { 
    action: 'journalctl -u othub-react --output cat -n 25', 
    description: 'Show the last 25 entries of the othub-react service logs'
  },
  'othubruntimerestart': { 
    action: 'systemctl restart othub-runtime', 
    description: 'Restart the othub-runtime service'
  },
  'othubruntimestop': { 
    action: 'systemctl stop othub-runtime', 
    description: 'Stop the othub-runtime service'
  },
  'othubruntimestart': { 
    action: 'systemctl start othub-runtime', 
    description: 'Start the othub-runtime service'
  },
  'othubruntimelogs': { 
    action: 'journalctl -u othub-runtime --output cat -n 25', 
    description: 'Show the last 25 entries of the othub-runtime service logs'
  },
  'othubprocessorrestart': { 
    action: 'systemctl restart othub-processor', 
    description: 'Restart the othub-processor service'
  },
  'othubprocessorstop': { 
    action: 'systemctl stop othub-processor', 
    description: 'Stop the othub-processor service'
  },
  'othubprocessorstart': { 
    action: 'systemctl start othub-processor', 
    description: 'Start the othub-processor service'
  },
  'othubprocessorlogs': { 
    action: 'journalctl -u othub-processor --output cat -n 25', 
    description: 'Show the last 25 entries of the othub-processor service logs'
  }
};

function adminCommandList() {
  let message = 'Here are the admin commands:\n\n';
  for (const [command, details] of Object.entries(adminCommands)) {
    message += `/${command} - ${details.description}\n`;
  }
  return message;
}

function isAdmin(ctx) {
  const userId = ctx.message.from.id.toString();
  return admins.includes(userId);
}

async function adminCommand(bot) {
  for (const [commandName, commandDetails] of Object.entries(adminCommands)) {
    bot.command(commandName, async (ctx) => {
      if (isAdmin(ctx)) {
        if (commandName === 'othubbotrestart' || commandName === 'othubbotstop') {
          const botmessage = await ctx.reply(`Command ${commandName} is being executed.`);
          if (botmessage) {
            setTimeout(async () => {
              try {
                await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id)
              } catch (error) {
                console.error('Error deleting message:', error)
              }
            }, process.env.DELETE_TIMER)
          }
        }
        
        const parts = commandDetails.action.split(' ');
        const cmd = parts[0];
        const args = parts.slice(1);
        const childProcess = spawn(cmd, args);

        let stdout = '';
        let stderr = '';

        childProcess.stdout.on('data', (data) => {
          stdout += data;
        });

        childProcess.stderr.on('data', (data) => {
          stderr += data;
        });

        childProcess.on('close', async (code) => {
          let botmessage;
          if (code !== 0) {
            if ((commandName === 'othubbotrestart' || commandName === 'othubbotstop') && code === null) {
              return;
            }
            botmessage = await ctx.reply(`Command failed with exit code ${code}: ${stderr}`);
          } else {
            if (commandName !== 'othubbotrestart' && commandName !== 'othubbotstop') {
              // Split long messages
              const chunks = splitMessage(`Command execution successful\n${stdout}`);
              for (const chunk of chunks) {
                botmessage = await ctx.reply(chunk);
                if (botmessage) {
                  setTimeout(async () => {
                    try {
                      await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id)
                    } catch (error) {
                      console.error('Error deleting message:', error)
                    }
                  }, process.env.DELETE_TIMER);
                }
              }
            }
          }
        });

        childProcess.on('error', async (error) => {
          const botmessage = await ctx.reply(`Command failed with error\n${error.message}`);
          
          if (botmessage) {
            setTimeout(async () => {
              try {
                await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id)
              } catch (error) {
                console.error('Error deleting message:', error)
              }
            }, process.env.DELETE_TIMER);
          }
        });

        await ctx.deleteMessage()
        
      } else {
        const botmessage = await ctx.reply('You are not authorized to execute this command.');
        if (botmessage) {
          setTimeout(async () => {
            try {
              await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id)
            } catch (error) {
              console.error('Error deleting message:', error)
            }
          }, process.env.DELETE_TIMER)
        }
      }
    });
  }
}

function splitMessage(message, maxLength = 4000) {
  const chunks = [];
  while (message.length > 0) {
    if (message.length <= maxLength) {
      chunks.push(message);
      break;
    }
    
    let chunk = message.substr(0, maxLength);
    let lastNewline = chunk.lastIndexOf('\n');
    
    if (lastNewline > 0) {
      chunk = message.substr(0, lastNewline);
      message = message.substr(lastNewline + 1);
    } else {
      message = message.substr(maxLength);
    }
    
    chunks.push(chunk);
  }
  return chunks;
}

module.exports = {
  adminCommand,
  isAdmin,
  adminCommandList,
  adminCommands
};