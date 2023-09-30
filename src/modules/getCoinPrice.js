const axios = require('axios');
require('dotenv').config();

async function getCoinPriceCoinAPI(cryptoSymbol) {
  const coinKey = process.env.COIN_API_KEY;
  const url = `https://rest.coinapi.io/v1/exchangerate/${cryptoSymbol}/USD`;

  try {
    const response = await axios.get(url, {
      headers: {
        "X-CoinAPI-Key": coinKey
      }
    });

    const data = response.data.rate;
    return data;
  } catch (error) {
    console.error('Error fetching coin price from CoinAPI:', error);
    throw error;
  }
}

async function getCoinPriceCMC(cryptoSymbol) {
  const cmcKey = process.env.CMC_API_KEY;
  const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${cryptoSymbol}`;

  try {
    const response = await axios.get(url, {
      headers: {
        "X-CMC_PRO_API_KEY": cmcKey
      }
    });

    const data = response.data.data[cryptoSymbol].quote.USD.price;
    return data;
  } catch (error) {
    console.error('Error fetching coin price from CoinMarketCap:', error);
    throw error;
  }
}

async function getCoinPrice(cryptoSymbol) {
    try {
      const price = await getCoinPriceCoinAPI(cryptoSymbol);
      return price;
    } catch (error) {
      try {
        const price = await getCoinPriceCMC(cryptoSymbol);
        return price;
      } catch (error) {
        throw error;
      }
    }
  }
  
module.exports = { getCoinPrice };