require('dotenv').config();
const fs = require("fs");
const queryTypes = require("../util/queryTypes");
const queryOTHUB = queryTypes.queryOTHUB();
// const rpc_endpoint = process.env.TIPPING_ENDPOINT
// const Tx = require('ethereumjs-tx').Transaction;
// const Common = require('ethereumjs-common').default;
// const Web3 = require('web3');
// const web3 =  new Web3(Web3.givenProvider || new Web3.providers.HttpProvider(rpc_endpoint));
// const contract_addr = process.env.TIPPING_CONTRACT_ADDR
// const common = new Common.forCustomChain('mainnet',{name: 'polygon-mainnet',chainId: 137, networkId: 137 }, 'petersburg');
// const minABI = require("../abi/abi");

module.exports = tip = async (ctx) => {
  console.log(ctx);
  spam_result = await db.prepare('SELECT last_tip_date FROM user_header WHERE chat_id =?').get(ctx.message.from.id);
  expireDate = new Date(spam_result.last_tip_date);
  currentDate = new Date();

  timeDif = Math.abs(currentDate - expireDate);
  expireDate = Math.abs(expireDate);
  //cooldown = 3*60*1000
  cooldown = 1

  if(timeDif > cooldown){
    permission = `allow`
    //insert a new time stamp
    time_stamp = new Date();
    time_stamp = Math.abs(time_stamp);
    insert_timestamp = `UPDATE user_header SET last_tip_date = ${time_stamp}`
    await queryDB(insert_timestamp);

  }else{
    permission = `block`
    remaining = cooldown - timeDif
    console.log(`Command: tips was blocked. Time remaining: ${remaining} milliseconds.`)
  }

  if(permission == `block`){
    return ``;
  }

  messy = ctx.message.text
  messy = messy.replace('/tip', '')

  if (messy == ''){//no params rovided
    return `@${ctx.message.from.username}, you must provide a tip amount (1 trac max) and a recipient`;
  }

  custom = 'yes'
  messy = messy.trim();

  amount = messy.substr(0,messy.indexOf(' '));
  console.log(`AMOUNT: ${amount}`)

  if(amount > 1){
    return `@${ctx.message.from.username}, you must provide a valid number less than or equal 1`;
  }

  reciever_name = messy.substr(messy.indexOf(' ')+2);
  reciever_name = reciever_name.trim();
  console.log(`RECEIVER NAME: ${reciever_name}`)

  if(reciever_name == ''){
    return `@${ctx.message.from.username}, you must provide a recipient`;
  }
  ///start here
  reciever_address = await db.prepare('SELECT tip_address FROM user_header WHERE user_name =?').get(reciever_name);

  if(reciever_address == ''){
    return `@${ctx.message.from.username}, the recipient does not have a registered tip address`;
  }

  //DO METAMASK STUFF

  }
};
