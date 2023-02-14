const fs = require("fs");
const queryTypes = require("../util/queryTypes");
const queryOTHUB = queryTypes.queryOTHUB();

module.exports = profit = async (ctx) => {
  date = new Date().toISOString().slice(0, 10)

  messy = ctx.message.text
  messy = messy.replace('/profit', '')

  if (messy == ''){
    custom = 'no'
    staked_trac = 3500
    vps_cost_usd = 10
  }else{
    custom = 'yes'
    messy = messy.trim();

    staked_trac = messy.substr(0,messy.indexOf(' '));
    if(isNaN(staked_trac) == true || staked_trac <= 3000 || staked_trac > 100000){
      return 'Please provide only staked amount and vps cost in that order separated by a space. Staked trac must be between 3000 and 100000.'
    }

    vps_cost_usd = messy.substr(messy.indexOf(' ')+1);
    if(isNaN(vps_cost_usd) == true || vps_cost_usd > 100000){
      return 'Please provide only staked amount and vps cost in that order separated by a space. Staked trac must be between 3000 and 100000.'
    }
  }

  ext = `jobs/jobcreatedcountinperiod?timePeriod=hours&time=24&onlyFinalizedJobs=true`
  jobs24h = await queryOTHUB
  .getData(ext)
  .then(async ({ result }) => {
    return result.data;
  })
  .catch((error) => console.log(`Error : ${error}`));

  jobs24h = jobs24h * 3

  ext = `home/HomeV3`
  nodes = await queryOTHUB
  .getData(ext)
  .then(async ({ result }) => {
    return result.data.All.ActiveNodes
  })
  .catch((error) => console.log(`Error : ${error}`));

  jobs_per_node = jobs24h / nodes

  ext = `home/HomeV3`
  avg_reward = await queryOTHUB
  .getData(ext)
  .then(async ({ result }) => {
    result = result.data.All.JobsReward24H
    return result.toFixed(2);
  })
  .catch((error) => console.log(`Error : ${error}`));

  ext = `home/HomeV3`
  trac_usd = await queryOTHUB
  .getData(ext)
  .then(async ({ result }) => {
    result = result.data.PriceUsd
    return result;
  })
  .catch((error) => console.log(`Error : ${error}`));

  avg_monthly_reward = jobs_per_node * 30 * avg_reward
  avg_usd_reward =  avg_monthly_reward * trac_usd
  usd_after_vps = avg_usd_reward - vps_cost_usd

  usd_staked = staked_trac * trac_usd
  apy = usd_after_vps * 12 / usd_staked
  apy = apy.toFixed(3);
  apy = apy * 100

  if(apy < 0){
    return `You would currently get more TRAC for your money by market buying instead of running a node based on last weeks jobs.`
  }else{
    return `You would currently get more TRAC for your money by running a node instead of market buying based on last weeks jobs.`
  }
  // if(custom == 'no'){
  //   await ctx.reply("The current profitability of staking on the ODN is "+apy+"% APY assuming you are staking 3500 trac and are paying $10/month for your vps. This number can be inaccurate based on job holding time and how many jobs there have been in the past week.");
  // }else{
  //   await ctx.reply("The current profitability of staking on the ODN is "+apy+"% APY assuming you are staking "+staked_trac+" trac and are paying $"+vps_cost_usd+"/month for your vps. This number can be inaccurate based on job holding time and how many jobs there have been in the past week.");
  // }

};
