const fs = require("fs");
const queryTypes = require("../util/queryTypes");
const queryOTHUB = queryTypes.queryOTHUB();
const db = require('better-sqlite3')(`${__dirname}/../../database/bot.db`,{ verbose: console.log });

module.exports = profile = async (type, ctx) => {
    user_info = await db.prepare('SELECT * FROM user_header WHERE chat_id =?').get(ctx.message.from.id);

    if(user_info){ //if profile exists
  		if(type == `profile`){
        node_ids = await db.prepare('SELECT node_id FROM node_header WHERE chat_id =? LIMIT 50').get(ctx.message.from.id);

        total_jobs = 0
        active_jobs = 0
        staked_tokens = 0
        locked_tokens = 0
        paidout_tokens = 0
        total_litigations = 0

        if(node_ids){
    		  for(var i = 0; i < (node_ids.length); i++) {
      			node_id = node_ids[i].node_id
      			ext = `nodes/DataHolder/${node_id}`
      			dh_info = await queryOTHUB
      			.getData(ext)
      			.then(async ({ result }) => {
      			  return result.data;
      			})
      			.catch((error) => console.log(`Error : ${error}`));

      			total_jobs = total_jobs + parseInt(dh_info.TotalWonOffers);
      			active_jobs = active_jobs + parseInt(dh_info.TotalActiveOffers);
      			staked_tokens = staked_tokens + parseInt(dh_info.StakeTokens);
      			locked_tokens =  locked_tokens + parseInt(dh_info.StakeReservedTokens);
      			paidout_tokens =  paidout_tokens + parseInt(dh_info.PaidTokens);
      			total_litigations = total_litigations + parseInt(dh_info.LitigationCount);
    		  }
        }

        return `
        @${ctx.message.from.username}
        *Tipping Address:* ${user_info.tip_address}
        *Node Count:* ${node_ids.length}
        *Total Jobs:* ${total_jobs}
        *Active Jobs:* ${active_jobs}
        *Staked Tokens:* ${staked_tokens}
        *Locked Tokens:* ${locked_tokens}
        *Paidout Tokens:* ${paidout_tokens}
        *Total Litigations:* ${total_litigations}
        `

  	  }

      if(type == `delete`){
    		if(ctx.message.chat.type == 'private'){
    		  await db.prepare('DELETE FROM user_header WHERE chat_id =?').run(ctx.message.from.id);

    		  await db.prepare('DELETE FROM node_header WHERE chat_id =?').run(ctx.message.from.id);

    		  return `@${ctx.message.from.username}, I have deleted your profile`
    		}
  	  }

      if(type == `nodeids`){
        if(ctx.message.chat.type != 'private'){
          return `@${ctx.message.from.username}, I can only show node ids in private`
        }

        node_ids = await db.prepare('SELECT node_id FROM node_header WHERE chat_id =?').get(ctx.message.from.id);

        if(node_ids == ''){
          return `@${ctx.message.from.username}, I dont have any nodes on record for you Please add some with addnodeid`
        }

        if(node_ids){
          node_list = ""
          for(var i = 0; i < (node_ids.length); i++) {
            var node_id = node_ids[i].node_id
            var node_list = node_list+node_ids[i].node_id+' '
            console.log(node_list)
          }
          return `
          @${ctx.message.from.username}, I have the following nodes on record for your profile
          ${node_list}
          `
        }
  	  }

      if(type == `add`){
        if(ctx.message.chat.type != 'private'){
          return `@${ctx.message.from.username}, I can only add node ids in private`
        }

        messy = ctx.message.text
        node_id = messy.replace('/addnodeid', '')
        node_id =  node_id.substring(1);

        if (node_id == ''){//no params rovided
          return `You need to specificy a node id`;
        }

        ext = `nodes/DataHolder/${node_id}`
        dh_info = await queryOTHUB
        .getData(ext)
        .then(async ({ result }) => {
          return result;
         })
         .catch((error) => console.log(`Error : ${error}`));

        if(dh_info.data == ''){
          return `@${ctx.message.from.username}, that is not a valid node id`
        }

        await db.prepare('INSERT INTO node_header VALUES (?,?)').run(ctx.message.from.id, node_id);

        node_id_list = await db.prepare('SELECT node_id FROM node_header WHERE chat_id =?').get(ctx.message.from.id);

        return `@${ctx.message.from.username}, I have added node ${node_id_list[0].node_id} to your profile You can run myprofile to get your stats`
  	  }

      if(type == `create`){
    		return `@${ctx.message.from.username}, You already have a profile`
  	  }

  	}else{//no profile data
      if(type == 'create'){
        if(ctx.message.chat.type != 'private'){
          return `@${ctx.message.from.username}, I only like to do profile creation stuff in private  DM me to create a profile and add node ids`
        }

        await db.prepare('INSERT INTO user_header VALUES (?,?,NULL,1)').run(ctx.message.from.id, ctx.message.from.username);

        user_info = await db.prepare('SELECT chat_id, user_name, tip_address FROM user_header WHERE chat_id =?').get(ctx.message.from.id);
        
        return `@${ctx.message.from.username},
        I have created a profile for ${user_info[0].user_name}  ${user_info[0].chat_id}
        Your tipping address is: ${user_info[0].tip_address}
        You can add nodes to your profile with /addnodeid`
      }

      return `@${ctx.message.from.username}, Please create a profile by DMing me /createprofile`
    }
};
