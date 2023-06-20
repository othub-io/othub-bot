module.exports = {
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
    action: 'journalctl -u otnode --output cat -n 100', 
    description: 'Show the last 100 entries of the otnode service logs'
  },
  'otnoderestart2': { 
    action: 'systemctl restart otnode2.service', 
    description: 'Restart the otnode2 service'
  },
  'otnodestop2': { 
    action: 'systemctl stop otnode2.service', 
    description: 'Stop the otnode2 service'
  },
  'otnodestart2': { 
    action: 'systemctl start otnode2.service', 
    description: 'Start the otnode2 service'
  },
  'otnodelogs2': { 
    action: 'journalctl -u otnode2 --output cat -n 100', 
    description: 'Show the last 100 entries of the otnode2 service logs'
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
    action: 'journalctl -u othub-bot --output cat -n 20', 
    description: 'Show the last 20 entries of the othub-bot service logs'
  },
  'otpsyncrestart': { 
    action: 'systemctl restart otp-sync', 
    description: 'Restart the otp-sync service'
  },
  'otpsyncstop': { 
    action: 'systemctl stop otp-sync', 
    description: 'Stop the otp-sync service'
  },
  'otpsyncstart': { 
    action: 'systemctl start otp-sync', 
    description: 'Start the otp-sync service'
  },
  'otpsynclogs': { 
    action: 'journalctl -u otp-sync --output cat -n 100', 
    description: 'Show the last 100 entries of the otp-sync service logs'
  },
  'otpsync2restart': { 
    action: 'systemctl restart otp-sync2', 
    description: 'Restart the otp-sync2 service'
  },
  'otpsync2stop': { 
    action: 'systemctl stop otp-sync2', 
    description: 'Stop the otp-sync2 service'
  },
  'otpsync2start': { 
    action: 'systemctl start otp-sync2', 
    description: 'Start the otp-sync2 service'
  },
  'otpsync2logs': { 
    action: 'journalctl -u otp-sync2 --output cat -n 100', 
    description: 'Show the last 100 entries of the otp-sync2 service logs'
  },
  'otnodeapirestart': { 
    action: 'systemctl restart otnode-api', 
    description: 'Restart the otnode-api service'
  },
  'otnodeapistop': { 
    action: 'systemctl stop otnode-api', 
    description: 'Stop the otnode-api service'
  },
  'otnodeapistart': { 
    action: 'systemctl start otnode-api', 
    description: 'Start the otnode-api service'
  },
  'otnodeapilogs': { 
    action: 'journalctl -u otnode-api --output cat -n 100', 
    description: 'Show the last 100 entries of the otnode-api service logs'
  },
  'otnodeapprestart': { 
    action: 'systemctl restart otnode-app', 
    description: 'Restart the otnode-app service'
  },
  'otnodeappstop': { 
    action: 'systemctl stop otnode-app', 
    description: 'Stop the otnode-app service'
  },
  'otnodeappstart': { 
    action: 'systemctl start otnode-app', 
    description: 'Start the otnode-app service'
  },
  'otnodeapplogs': { 
    action: 'journalctl -u otnode-app --output cat -n 100', 
    description: 'Show the last 100 entries of the otnode-app service logs'
  },
};
