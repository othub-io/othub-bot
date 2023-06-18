const { exec } = require('child_process');
const { spawn } = require('child_process');


const admins = process.env.ADMIN_GROUP.split(',');

function isAdmin(ctx) {
  const userId = ctx.message.from.id.toString();
  return admins.includes(userId);
}

const commands = {
  'otnoderestart': 'systemctl restart otnode.service',
  'otnodestop': 'systemctl stop otnode.service',
  'otnodestart': 'systemctl start otnode.service',
  'otnodelogs': 'journalctl -u otnode --output cat -n 100',
  'otnoderestart2': 'systemctl restart otnode2.service',
  'otnodestop2': 'systemctl stop otnode2.service',
  'otnodestart2': 'systemctl start otnode2.service',
  'otnodelogs2': 'journalctl -u otnode2 --output cat -n 100',
  'othubbotrestart': 'systemctl restart othub-bot',
  'othubbotstop': 'systemctl stop othub-bot',
  'othubbotstart': 'systemctl start othub-bot',
  'othubbotlogs': 'journalctl -u othub-bot --output cat -n 20',
  'otpsyncrestart': 'systemctl restart otp-sync',
  'otpsyncstop': 'systemctl stop otp-sync',
  'otpsyncstart': 'systemctl start otp-sync',
  'otpsynclogs': 'journalctl -u otp-sync --output cat -n 100',
  'otpsync2restart': 'systemctl restart otp-sync2',
  'otpsync2stop': 'systemctl stop otp-sync2',
  'otpsync2start': 'systemctl start otp-sync2',
  'otpsync2logs': 'journalctl -u otp-sync2 --output cat -n 100',
  'otnodeapirestart': 'systemctl restart otnode-api',
  'otnodeapistop': 'systemctl stop otnode-api',
  'otnodeapistart': 'systemctl start otnode-api',
  'otnodeapilogs': 'journalctl -u otnode-api --output cat -n 100',
  'otnodeapprestart': 'systemctl restart otnode-app',
  'otnodeappstop': 'systemctl stop otnode-app',
  'otnodeappstart': 'systemctl start otnode-app',
  'otnodeapplogs': 'journalctl -u otnode-app --output cat -n 100',
};

async function commandsHandler(bot) {
  for (const [commandName, systemCommand] of Object.entries(commands)) {
    bot.command(commandName, async (ctx) => {
      if (isAdmin(ctx)) {
        const parts = systemCommand.split(' ');
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

        childProcess.on('close', (code) => {
          if (code !== 0) {
            ctx.reply(`Command failed with exit code ${code}: ${stderr}`);
            return;
          }
          ctx.reply(`Command execution successful: ${stdout}`);
        });

        childProcess.on('error', (error) => {
          ctx.reply(`Command failed with error: ${error.message}`);
        });
      } else {
        await ctx.reply('You are not authorized to execute this command.');
      }
    });
  }
}

module.exports = {
  commandsHandler,
};
