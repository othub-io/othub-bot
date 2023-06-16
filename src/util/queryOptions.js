require('dotenv').config()

exports.getOTNode = ext => ({
  path: `https://api.othub.io/${ext}`
})
