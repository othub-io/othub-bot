const fs = require('fs')
const queryAPI = require('../util/queryAPI')
const { queryOTNodeAPI } = require('../util/queryOptions')

module.exports = queryOTNode = async ext => {
  let queryOptions = queryOTNodeAPI(ext)
  result = await queryAPI(queryOptions)

  return {
    result: result
  }
}
