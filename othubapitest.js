const { default: axios } = require('axios');

require('dotenv').config()

const txndata = {
    public: {
        '@context': ['https://schema.org'],
        '@id': 'uuid:1',
        company: 'OT',
        user: {
            '@id': 'uuid:user:1',
        },
        city: {
            '@id': 'uuid:belgrade',
        },
    },
};

let URL = 'https://api.othub.io/dkg/getBidSuggestion';

let postData = {
    network: 'otp::testnet',
    asset: txndata
};


let config = {
    headers: {
        'x-api-key': process.env.API_KEY
    },
    timeout: 0
};

axios.post(URL, postData, config)
    .then(response => {
        console.log(response.data);
    })
    .catch(error => {
        console.error(error.message);
    });
