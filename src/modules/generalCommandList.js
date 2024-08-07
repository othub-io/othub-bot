module.exports = {
  commands: {
    'othub': 'othubbot landing page',
    'wallet': 'Link your Telegram ID with your public wallet for funding',
    'balance': 'View your balance',
    'fund': 'Fund your wallet with test balance',
    'create': 'Create Knowledge Assets on the DKG',
    'pubsgraph': 'Show total network pubs over time',
    'networkgraph': 'TRAC spent on publishing, Assets published, Node payouts',
    'glossary': 'A list of terms and definitions to better understand the OriginTrail Ecosystem',
    'hourlypubs': 'Show network stats for the last hour',
    'dailypubs': 'Show network pubs for the last day',
    'weeklypubs': 'Show network pubs for the last week',
    'monthlypubs': 'Show network pubs for the last month',
    'totalpubs': 'Show total network pubs',
    'record': 'Show DKG record statistics',
    'networkstats': 'Show total network stats',
    'nodestats <tokenSymbol>': 'Show cumulative node stats for provided tokenSymbol',
    'nodestatslasthour <tokenSymbol>': 'Show node stats for provided tokenSymbol for the last hour',
    'nodestatslastday <tokenSymbol>': 'Show node stats for provided tokenSymbol for the last day',
    'nodestatslastweek <tokenSymbol>': 'Show node stats for provided tokenSymbol for the last week',
    'nodestatslastmonth <tokenSymbol>': 'Show node stats for provided tokenSymbol for the last month',
  },
  generateCommandList: function () {
    let message = 'Here are the general commands:\n\n';
    for (const [command, description] of Object.entries(this.commands)) {
      message += `/${command} - ${description}\n`;
    }
    return message;
  }
};
