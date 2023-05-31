require('dotenv').config()

exports.getOTNode = ext => ({
  path: `https://api.otnode.com/${ext}`
})
