const axios = require("axios");

module.exports = queryAPI = async (queryOptions) => {
  return await axios
    .get(queryOptions.path, queryOptions.config)
    .catch((error) => {
      throw new Error(`error querying ${queryOptions.path} : ${error}.`);
    });
};
