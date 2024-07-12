const axios = require('axios');
require('dotenv').config();

// Function to get the coin price from CoinMarketCap
async function getCoinPriceCMC(cryptoSymbol) {
  const cmcKey = process.env.CMC_API_KEY;
  const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${cryptoSymbol}`;

  try {
    const response = await axios.get(url, {
      headers: {
        "X-CMC_PRO_API_KEY": cmcKey
      }
    });

    const data = response.data.data[cryptoSymbol].quote.USD;
    return data.price.toFixed(2);
  } catch (error) {
    console.error('Error fetching coin price from CoinMarketCap:', error);
    throw error;
  }
}

// Function to get the coin market cap from CoinMarketCap
async function getCoinCapCMC(cryptoSymbol) {
  const cmcKey = process.env.CMC_API_KEY;
  const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${cryptoSymbol}`;

  try {
    const response = await axios.get(url, {
      headers: {
        "X-CMC_PRO_API_KEY": cmcKey
      }
    });

    const data = response.data.data[cryptoSymbol].quote.USD;
    return data.market_cap.toFixed(2);
  } catch (error) {
    console.error('Error fetching coin market cap from CoinMarketCap:', error);
    throw error;
  }
}

// Function to get the coin volume from CoinMarketCap
async function getCoinVolumeCMC(cryptoSymbol) {
  const cmcKey = process.env.CMC_API_KEY; // Make sure you have this in your .env file
  const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${cryptoSymbol}`;

  try {
    const response = await axios.get(url, {
      headers: {
        "X-CMC_PRO_API_KEY": cmcKey
      }
    });

    const data = response.data.data[cryptoSymbol].quote.USD;
    return data.volume_24h.toFixed(2);
  } catch (error) {
    console.error('Error fetching coin volume from CoinMarketCap:', error);
    throw error;
  }
}

// Function to get the coin price from CoinAPI
async function getCoinPriceCoinAPI(cryptoSymbol) {
  const coinKey = process.env.COIN_API_KEY; // Make sure you have this in your .env file
  const url = `https://rest.coinapi.io/v1/exchangerate/${cryptoSymbol}/USD`;

  try {
    const response = await axios.get(url, {
      headers: {
        "X-CoinAPI-Key": coinKey
      }
    });

    const data = response.data.rate;
    return data.toFixed(2);
  } catch (error) {
    console.error('Error fetching coin price from CoinAPI:', error);
    throw error;
  }
}

// Aggregated function to get the coin price with fallback
async function getCoinPrice(cryptoSymbol) {
  try {
    const price = await getCoinPriceCMC(cryptoSymbol);
    return price;
  } catch (error) {
    try {
      const price = await getCoinPriceCoinAPI(cryptoSymbol);
      return price;
    } catch (error) {
      throw error;
    }
  }
}

// Aggregated function to get the coin market cap with fallback (using only CMC here)
async function getCoinCap(cryptoSymbol) {
  try {
    const cap = await getCoinCapCMC(cryptoSymbol);
    return cap;
  } catch (error) {
    throw error;
  }
}

// Aggregated function to get the coin volume with fallback (using only CMC here)
async function getCoinVolume(cryptoSymbol) {
  try {
    const volume = await getCoinVolumeCMC(cryptoSymbol);
    return volume;
  } catch (error) {
    throw error;
  }
}

module.exports = { getCoinPrice, getCoinCap, getCoinVolume };

// async function test() {
//   try {
//     const symbol = 'TRAC';
//     const price = await getCoinPrice(symbol);
//     const cap = await getCoinCap(symbol);
//     const volume = await getCoinVolume(symbol);
//     console.log(`The price of ${symbol} is $${price}, market cap is $${cap}, and 24h volume is $${volume}`);
//   } catch (error) {
//     console.error('Error:', error);
//   }
// }

// test();
