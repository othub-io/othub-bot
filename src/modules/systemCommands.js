const { exec } = require('child_process');
const { spawn } = require('child_process');
const commands = require('./adminCommandList.js');

const admins = process.env.ADMIN_GROUP.split(',');

function isAdmin(ctx) {
  const userId = ctx.message.from.id.toString();
  return admins.includes(userId);
}

async function adminCommand(bot) {
  for (const [commandName, commandDetails] of Object.entries(commands)) {
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
            // If the command is othubbotrestart or othubbotstop and the exit code is null, ignore the error
            if ((commandName === 'othubbotrestart' || commandName === 'othubbotstop') && code === null) {
              return;
            }
            botmessage = await ctx.reply(`Command failed with exit code ${code}: ${stderr}`);
          } else {
            // Don't send success message for restart or stop commands as they might have killed the process already
            if (commandName !== 'othubbotrestart' && commandName !== 'othubbotstop') {
              botmessage = await ctx.reply(`Command execution successful\n${stdout}`);
            }
          }
          
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

module.exports = {
  adminCommand,
  isAdmin,
};
