const fs = require("fs");
require('dotenv').config()
const alliance_db = require('better-sqlite3')(process.env.ALLIANCE_DB)
const queryTypes = require("../util/queryTypes");
const bot_db = require('better-sqlite3')(`${__dirname}/database/bot.db`, {
  verbose: console.log
})

const {
  Telegraf,
  session,
  Scenes,
  Markup,
  BaseScene,
  Stage
} = require('telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN)

const mysql = require('mysql')
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'admin',
  database: 'operationaldb2'
})

const DKGClient = require('dkg.js')
const OT_NODE_HOSTNAME = process.env.OT_NODE_HOSTNAME
const OT_NODE_PORT = process.env.OT_NODE_PORT
const node_options = {
  endpoint: OT_NODE_HOSTNAME,
  port: OT_NODE_PORT,
  useSSL: true,
  maxNumberOfRetries: 100
}
const dkg = new DKGClient(node_options)

module.exports = closeProposals = async (type) => {
    proposals = await alliance_db
          .prepare(`SELECT * FROM proposal_header WHERE active = ? AND proposal_type = ?`)
          .all(0,type)

    for (i = 0; i < proposals.length; ++i) {
        if(type == 'ask'){
            winning_proposal = ""
            winning_votes = 0
            proposal = proposals[i]

            ballots = await alliance_db
                .prepare(`SELECT vote_ual FROM vote_header WHERE = ?`)
                .all(proposal.proposal_ual)

        yes_vote = 0
        no_vote = 0

        if(ballots){
            vote_uals = []
            for (x = 0; x < ballots.length; ++x) {
                vote_uals.push(ballots.vote_ual)
            }
        }

        if(vote_uals){
            for (a = 0; a < vote_uals.length; ++a) {
                ual = vote_uals[a]

                dkg_get_result = await dkg.asset
                    .get(ual, {
                        validate: true,
                        state: 'LATEST_FINALIZED',
                        contentType: 'all',
                        maxNumberOfRetries: 30,
                        blockchain: {
                        name: 'otp::testnet',
                        publicKey: process.env.PUBLIC_KEY,
                        privateKey: process.env.PRIVATE_KEY
                        }
                    })
                    .then(result => {
                        //console.log(JSON.stringify(result))
                        return result
                    })
                    .catch(error => {
                        console.log(error)
                    })

                    vote_asset = [];

                    console.log(`ASSERTIONS: ${dkg_get_result.public.assertion.length}`);

                    for (i = 0; i < dkg_get_result.public.assertion.length; ++i) {
                        current_assertion = dkg_get_result.public.assertion[i];
                        if (current_assertion["@type"]) {
                            console.log(`CURRENT ASSERTION: ${current_assertion["@type"][0]}`);
        
                            if (current_assertion["@type"][0] == "http://schema.org/VoteAction") {
                                console.log(current_assertion);
                                asset.push(current_assertion["@id"]);
                            }
                        }
                    }
        
                    console.log(`Vote Assertion Index: ${asset}`);
        
                    voteList = [];
                    for (x = 0; x < dkg_get_result.public.assertion.length; ++x) {
                        current_assertion = dkg_get_result.public.assertion[x];
        
                        if (asset.includes(current_assertion["@id"], 0)) {
                            voter = current_assertion["http://schema.org/voter"][0]["@value"];
                            proposal = current_assertion["http://schema.org/proposal"][0]["@value"];
                            url = current_assertion["http://schema.org/url"][0]["@value"];
        
                            for (i = 0; i < current_assertion["http://schema.org/votes"].length;++i) {
                                vote = current_assertion["http://schema.org/votes"][i]["@id"];
                                voteList.push(vote);
                            }
                        }
                    }
        
                    console.log(`Vote result Index: ${voteList}`);
        
                    for (x = 0; x < dkg_get_result.public.assertion.length; ++x) {
                        current_assertion = dkg_get_result.public.assertion[x];
        
                        if (voteList.includes(current_assertion["@id"], 0)) {
                            yes_votes = Number(current_assertion["http://schema.org/yes"][0]["@value"])
                            no_votes = Number(current_assertion["http://schema.org/no"][0]["@value"])
                        }
                    }       
            }
        }

        nodes = await alliance_db
          .prepare('SELECT * FROM member_nodes WHERE verified = ? AND tg_id = ?')
          .all(1, telegram_id)
    
        //node_count = Number(nodes.length)
        
        total_stake = 0
        for (i = 0; i < nodes.length; ++i) {
          node = nodes[i]
          total_stake = total_stake + Number(node.stake)
        }

        total_votes = yes_votes + note_votes

        //result = 0 //failed
        //1 = active
        if((yes_votes / total_votes) > 0.75 && yes_votes > winning_votes && (total_votes / total_stake) > 0.75){
            //result = 2 //passed

            await alliance_db
                    .prepare(
                        `UPDATE proposal_header SET active = ? WHERE proposal_ual = ? COLLATE NOCASE`
                    )
                    .run(0,winning_proposal)

            winning_proposal = proposal.proposal_ual
            winning_votes = yes_votes

            await alliance_db
                    .prepare(
                        `UPDATE proposal_header SET active = ? WHERE proposal_ual = ? COLLATE NOCASE`
                    )
                    .run(2,winning_proposal)
        }

        console.log(`VOTE RESULT: ${result}`)
        }

        //new type--------------------------------------------------

    }

    //update Alliance Ask Asset
    if(winning_proposal != ""){
        dkg_get_result = await dkg.asset
                    .get(winning_proposal, {
                        validate: true,
                        state: 'LATEST_FINALIZED',
                        contentType: 'all',
                        maxNumberOfRetries: 30,
                        blockchain: {
                        name: 'otp::testnet',
                        publicKey: process.env.PUBLIC_KEY,
                        privateKey: process.env.PRIVATE_KEY
                        }
                    })
                    .then(result => {
                        //console.log(JSON.stringify(result))
                        return result
                    })
                    .catch(error => {
                        console.log(error)
                    })

                    proposal_asset = [];

                    console.log(`ASSERTIONS: ${dkg_get_result.public.assertion.length}`);

                    for (i = 0; i < dkg_get_result.public.assertion.length; ++i) {
                        current_assertion = dkg_get_result.public.assertion[i];
                        if (current_assertion["@type"]) {
                            console.log(`CURRENT ASSERTION: ${current_assertion["@type"][0]}`);
        
                            if (current_assertion["@type"][0] == "http://schema.org/Proposal") {
                                console.log(current_assertion);
                                proposal_asset.push(current_assertion["@id"]);
                            }
                        }
                    }
        
                    console.log(`Vote Assertion Index: ${proposal_asset}`);
        
                    voteList = [];
                    for (x = 0; x < dkg_get_result.public.assertion.length; ++x) {
                        current_assertion = dkg_get_result.public.assertion[x];
        
                        if (proposal_asset.includes(current_assertion["@id"], 0)) {
                            ask = current_assertion["http://schema.org/proposedAsk"][0]["@value"];
                        }
                    }

                    updateAskAssertion ={
                        "@context": "https://schema.org",
                        "@type": "Offer",
                        "name": `OTNode Alliance Perpetual Ask Asset`,
                        "description": `The OTNode PAA that signals the alliances asking price.`,
                        "proposedTo": "OTNode Alliance",
                        "url": "https://www.girraph.com/alliance/dao",
                        "subjectOf": "OTNode Alliance DAO",
                        "ask": ask
                      }

                      updateOptions= {
                            epochsNum: 1,
                            maxNumberOfRetries: 30,
                            frequency: 1,
                            keywords: keywords,
                            blockchain : {
                                name: 'otp::testnet',
                            },
                            contentType: 'all'
                        }

                    askAssetResult = await DkgClient.asset.update(process.env.ASK_ASSET_UAL,{
                        public: updateAskAssertion,
                      },updateOptions)
                          .then(result => {
                              //console.log(result)
                              return result;
                          })
                          .catch(error => {
                            console.log(error)
                          });

                    console.log(`Ask Asset ${askAssetResult.UAL} has been updated to ${ask}.`)
                          
    }
};
