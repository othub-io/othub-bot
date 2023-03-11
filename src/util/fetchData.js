const axios = require('axios')

module.exports = fetchData = async apiOptions => {
  return await axios.get(apiOptions.path, apiOptions.config).catch(error => {
    console.log(`error querying ${apiOptions.path} : ${error}. Retrying...`)
  })
}
