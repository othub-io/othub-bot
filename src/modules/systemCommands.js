const exec = require('child_process').exec;

const commands = {
  'otnode-restart': 'systemctl restart otnode.service',
  'otnode-stop': 'systemctl stop otnode.service',
  'otnode-start': 'systemctl start otnode.service',
  'otnode-logs': 'journalctl -u otnode --output cat -n 100',
  'otnode-restart2': 'systemctl restart otnode2.service',
  'otnode-stop2': 'systemctl stop otnode2.service',
  'otnode-start2': 'systemctl start otnode2.service',
  'otnode-logs2': 'journalctl -u otnode2 --output cat -n 100',
  'othubbotrestart': 'systemctl restart othub-bot',
  'othubbotstop': 'systemctl stop othub-bot',
  'othubbotstart': 'systemctl start othub-bot',
  'othubbotlogs': 'journalctl -u othub-bot --output cat -n 100',
  'otp-sync-restart': 'systemctl restart otp-sync',
  'otp-sync-stop': 'systemctl stop otp-sync',
  'otp-sync-start': 'systemctl start otp-sync',
  'otp-sync-logs': 'journalctl -u otp-sync --output cat -n 100',
  'otp-sync2-restart': 'systemctl restart otp-sync2',
  'otp-sync2-stop': 'systemctl stop otp-sync2',
  'otp-sync2-start': 'systemctl start otp-sync2',
  'otp-sync2-logs': 'journalctl -u otp-sync2 --output cat -n 100',
  'otnode-api-restart': 'systemctl restart otnode-api',
  'otnode-api-stop': 'systemctl stop otnode-api',
  'otnode-api-start': 'systemctl start otnode-api',
  'otnode-api-logs': 'journalctl -u otnode-api --output cat -n 100',
  'otnode-app-restart': 'systemctl restart otnode-app',
  'otnode-app-stop': 'systemctl stop otnode-app',
  'otnode-app-start': 'systemctl start otnode-app',
  'otnode-app-logs': 'journalctl -u otnode-app --output cat -n 100',
};

const handleCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.warn(error);
        reject(error);
      }
      resolve(stdout? stdout : stderr);
    });
  });
};

async function isAdmin(ctx) {
  const admins = process.env.ADMIN_GROUP.split(',');
  const userId = ctx.message.from.id.toString();
  return admins.includes(userId);
}

module.exports = {
  commands,
  handleCommand,
  isAdmin
};
