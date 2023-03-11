const fs = require('fs')
const queryAPI = require('../util/queryAPI')
const { getSubscan } = require('../util/queryOptions')

module.exports = querySubscan = async (
  ext,
  contract_address,
  address,
  row,
  page
) => {
  let queryOptions = getSubscan(ext, contract_address, address, row, page)
  result = await queryAPI(queryOptions)

  return {
    result: result
  }
}
