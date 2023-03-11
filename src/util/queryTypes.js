const spamCheck = require('../queries/spamCheck')
const getSubscan = require('../queries/querySubscan')

const queryTypes = [
  {
    name: 'spamCheck',
    getData: () => spamCheck(command, telegram_id)
  },
  {
    name: 'querySubscan',
    getData: () => getSubscan(ext, contract_address, address, row, page)
  }
]

module.exports = {
  spamCheck: function spamCheck () {
    return queryTypes[0]
  },
  querySubscan: function querySubscan () {
    return queryTypes[1]
  }
}
