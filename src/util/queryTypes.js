const spamCheck = require('../queries/spamCheck')

const queryTypes = [
  {
    name: 'spamCheck',
    getData: () => spamCheck(command)
  }
]

module.exports = {
  spamCheck: function spamCheck () {
    return queryTypes[0]
  }
}
