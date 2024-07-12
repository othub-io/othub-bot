const axios = require('axios');
require('dotenv').config();
CMC_API_KEY='20e26f82-93b6-4289-9e1a-83a42319c701'
COIN_API_KEY='5EA0664E-6AEE-48B1-AF13-39018DCD984A'
ETHERSCAN_API_KEY='6AD4IUKRAIS1MKX83SREI1UJ2NGK3JVSEE'

async function getCoinPriceCoinAPI(cryptoSymbol) {
  const coinKey = COIN_API_KEY;
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
  const cmcKey = CMC_API_KEY;
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
    const price = await getCoinPriceCMC(cryptoSymbol);
    return price.toFixed(2);
  } catch (error) {
    try {
      const price = await getCoinPriceCoinAPI(cryptoSymbol);
      return price.toFixed(2);
    } catch (error) {
      throw error;
    }
  }
}
  
module.exports = { getCoinPrice };

// async function test() {
//   try {
//     const symbol = 'TRAC';
//     const price = await getCoinPrice(symbol);
//     console.log(`The price of ${symbol} is $${price}`);
//   } catch (error) {
//     console.error('Error:', error);
//   }
// }

// test();