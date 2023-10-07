require('dotenv').config()
const DKG = require('dkg.js');

async function dkg(txn_data, epochs) {
    const dkgInstance = new DKG({
        endpoint: process.env.OT_NODE_HOSTNAME,
        port: process.env.OT_NODE_TESTNET_PORT,
        useSSL: true,
        maxNumberOfRetries: 100,
        blockchain: {
            name: 'otp::testnet',
            publicKey: process.env.PUBLIC_KEY,
            privateKey: process.env.PRIVATE_KEY,
        },
    });

    const nodeInfo = await dkgInstance.node.info(); 
    console.log(nodeInfo);

    const knowledgeAssetContent = txn_data
    console.log(`knowledgeAssetContent is: ${JSON.stringify(knowledgeAssetContent)}`)
    const assertionId = await dkgInstance.assertion.getPublicAssertionId(knowledgeAssetContent);
    console.log(`assertionId is: ${assertionId}`)
    const size = await dkgInstance.assertion.getSizeInBytes(knowledgeAssetContent);
    console.log(`size is: ${size}`)
    const bidSuggestion = await dkgInstance.network.getBidSuggestion(assertionId, size, { epochsNum: epochs });
    console.log(`bidSuggestion is: ${bidSuggestion}`)
    return { assertionId, size, bidSuggestion };
}

const txn_data = {
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
const dkgResult = dkg(txn_data, 5);
console.log(dkg(txn_data, 5));