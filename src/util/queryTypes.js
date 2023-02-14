const getOTHUB = require("../queries/queryOTHUB");
const spamCheck = require("../queries/spamCheck");

const queryTypes = [
  {
    name: "spamCheck",
    getData: () => spamCheck(command)
  },
  {
    name: "othub",
    getData: () => getOTHUB(ext)
  }
];

module.exports = {
  spamCheck: function spamCheck() {
    return queryTypes[0];
  },
  queryOTHUB: function queryOTHUB() {
    return queryTypes[1];
  }
};
