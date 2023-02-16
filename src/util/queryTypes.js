const spamCheck = require('../queries/spamCheck')

const queryTypes = [
  {
    name: 'spamCheck',
    getData: () => spamCheck(command, telegram_id)
  }
]

module.exports = {
  spamCheck: function spamCheck () {
    return queryTypes[0]
  }
}
