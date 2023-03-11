require('dotenv').config()

exports.getSubscan = (ext, contract_address, address, row, page) => ({
  path: `https://origintrail.api.subscan.io/api/scan/${ext}`,
  config: {
    headers: {
      'X-API-Key': process.env.SUBSCAN_API_KEY,
      'Content-Type': 'application/json'
    },
    data: {
      contract: contract_address,
      address: address,
      row: row,
      page: page
    }
  }
})
