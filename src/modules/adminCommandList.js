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
    action: 'journalctl -u otp-sync-rpc --output cat -n 100', 
    description: 'Show the last 100 entries of the otp-sync-rpc service logs'
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
    action: 'journalctl -u othub-api --output cat -n 100', 
    description: 'Show the last 100 entries of the othub-api service logs'
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
    action: 'journalctl -u othub-react --output cat -n 100', 
    description: 'Show the last 100 entries of the othub-react service logs'
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
    action: 'journalctl -u othub-runtime --output cat -n 100', 
    description: 'Show the last 100 entries of the othub-runtime service logs'
  },
};
