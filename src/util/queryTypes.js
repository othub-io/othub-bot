const spamCheck = require('../queries/spamCheck');

const queryTypes = [
  {
    name: 'spamCheck',
    getData: (command, telegram_id) => spamCheck.spamCheck(command, telegram_id),
  },
  {
    name: 'queryOTNodeAPI',
    getData: (ext) => queryOTNodeAPI(ext),
  },
];

module.exports = {
  spamCheck: function () {
    return queryTypes[0];
  },
  queryOTNodeAPI: function () {
    return queryTypes[1];
  },
};
