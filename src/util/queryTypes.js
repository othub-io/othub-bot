const spamCheck = require('../queries/spamCheck')
const queryOTNodeAPI = require('../queries/queryOTNodeAPI')

const queryTypes = [
  {
    name: 'spamCheck',
    getData: () => spamCheck(command, telegram_id)
  },
  {
    name: 'queryOTNodeAPI',
    getData: () => getOTNode(ext)
  }
]

module.exports = {
  spamCheck: function spamCheck () {
    return queryTypes[0]
  },
  queryOTNodeAPI: function queryOTNodeAPI () {
    return queryTypes[1]
  }
}
