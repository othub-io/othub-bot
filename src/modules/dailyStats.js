const fs = require("fs");
const queryTypes = require("../util/queryTypes");
const queryOTHUB = queryTypes.queryOTHUB();
const spamCheck = queryTypes.spamCheck();
const db = require('better-sqlite3')(`${__dirname}/../../database/bot.db`,{ verbose: console.log });

module.exports = dailyStats = async () => {
  console.log('Posting ODN stat updates');
  date = new Date().toISOString().slice(0, 10)

  //get trac usd
  ext = `home/HomeV3`
  trac_usd = await queryOTHUB
  .getData(ext)
  .then(async ({ result }) => {
    result = result.data.PriceUsd
    return result;
  })
    .catch((error) => console.log(`Error : ${error}`));

  //get historical stats
  historical_stats = await db.prepare('SELECT * FROM stats_history').get();

  ath = historical_stats.ath
  historical_eth_jobs = historical_stats.eth_jobs
  historical_gnosis_jobs = historical_stats.gnosis_jobs
  historical_poly_jobs = historical_stats.poly_jobs
  historical_eth_nodes = historical_stats.eth_nodes
  historical_gnosis_nodes = historical_stats.gnosis_nodes
  historical_poly_nodes = historical_stats.poly_nodes

  //query othub api to get payouts
  ext = `home/HomeV3`
  payouts = await queryOTHUB
  .getData(ext)
  .then(async ({ result }) => {
    return result.data.All.TokensPaidout24H;
   })
   .catch((error) => console.log(`Error : ${error}`));
  payouts = payouts.toFixed(2)

  //set ath to be inserted later
  if(payouts > ath){
    ath = payouts
  }

  ext = `jobs/jobcreatedcountinperiod?timePeriod=hours&time=24&blockchainID=1&onlyFinalizedJobs=true`
  eth_jobs = await queryOTHUB
  .getData(ext)
  .then(async ({ result }) => {
    return result.data
  })
  .catch((error) => console.log(`Error : ${error}`));
  ethjob_chng = eth_jobs - historical_eth_jobs

  if(eth_jobs < historical_eth_jobs){
    eth_sym = '' //negative
  }else{
    eth_sym = '+'
  }

  if(ethjob_chng == 0){
    ethjob_chng = '0.00'
  }else{
    ethjob_chng = ethjob_chng / eth_jobs
    ethjob_chng = ethjob_chng * 100
    ethjob_chng = ethjob_chng.toFixed(2);
  }

  ext = `jobs/jobcreatedcountinperiod?timePeriod=hours&time=24&blockchainID=2&onlyFinalizedJobs=true`
  gnosis_jobs = await queryOTHUB
  .getData(ext)
  .then(async ({ result }) => {
    return result.data
  })
  .catch((error) => console.log(`Error : ${error}`));
  gnojob_chng = gnosis_jobs - historical_gnosis_jobs

  if(gnosis_jobs < historical_gnosis_jobs){
    gno_sym = ''
  }else{
    gno_sym = '+'
  }

  if(gnojob_chng == 0){
    gnojob_chng = '0.00'
  }else{
    gnojob_chng = gnojob_chng / gnosis_jobs
    gnojob_chng = gnojob_chng * 100
    gnojob_chng = gnojob_chng.toFixed(2);
  }

  ext = `jobs/jobcreatedcountinperiod?timePeriod=hours&time=24&blockchainID=3&onlyFinalizedJobs=true`
  poly_jobs = await queryOTHUB
  .getData(ext)
  .then(async ({ result }) => {
    return result.data
  })
  .catch((error) => console.log(`Error : ${error}`));
  polyjob_chng = poly_jobs - historical_poly_jobs

  if(poly_jobs < historical_poly_jobs){
    poly_sym = ''
  }else{
    poly_sym = '+'
  }

  if(polyjob_chng == 0){
    polyjob_chng = '0.00'
  }else{
    polyjob_chng = polyjob_chng / poly_jobs
    polyjob_chng = polyjob_chng * 100
    polyjob_chng = polyjob_chng.toFixed(2);
  }

  //nodes
  ext = `home/HomeV3`
  eth_nodes = await queryOTHUB
  .getData(ext)
  .then(async ({ result }) => {
    return result.data.Blockchains[2].ActiveNodes
  })
  .catch((error) => console.log(`Error : ${error}`));
  ethnodes_chng = eth_nodes - historical_eth_nodes

  if(eth_nodes < historical_eth_nodes){
    ethn_sym = ''
  }else{
    ethn_sym = '+'
  }

  ethnodes_chng = ethnodes_chng / eth_nodes
  ethnodes_chng = ethnodes_chng * 100
  ethnodes_chng = ethnodes_chng.toFixed(2);

  ext = `home/HomeV3`
  gnosis_nodes = await queryOTHUB
  .getData(ext)
  .then(async ({ result }) => {
    return result.data.Blockchains[1].ActiveNodes
  })
  .catch((error) => console.log(`Error : ${error}`));
  gnonodes_chng = gnosis_nodes - historical_gnosis_nodes

  if(gnosis_nodes < historical_gnosis_nodes){
    gnon_sym = ''
  }else{
    gnon_sym = '+'
  }

  gnonodes_chng = gnonodes_chng / gnosis_nodes
  gnonodes_chng = gnonodes_chng * 100
  gnonodes_chng = gnonodes_chng.toFixed(2);

  ext = `home/HomeV3`
  poly_nodes = await queryOTHUB
  .getData(ext)
  .then(async ({ result }) => {
    return result.data.Blockchains[0].ActiveNodes
  })
  .catch((error) => console.log(`Error : ${error}`));
  polynodes_chng = poly_nodes - historical_poly_nodes

  if(poly_nodes < historical_poly_nodes){
    polyn_sym = ''
  }else{
    polyn_sym = '+'
  }

  polynodes_chng = polynodes_chng / poly_nodes
  polynodes_chng = polynodes_chng * 100
  polynodes_chng = polynodes_chng.toFixed(2);

  usdpayouts = payouts * trac_usd
  usdpayouts = Number(usdpayouts);
  usdpayouts = usdpayouts.toFixed(2);

  usdpayouts_ath = ath * trac_usd
  usdpayouts_ath = Number(usdpayouts_ath);
  usdpayouts_ath = usdpayouts_ath.toFixed(2);

  //insert new data stats history
  await db.prepare('REPLACE INTO stats_history VALUES (?,?,?,?,?,?,?)').run(ath, eth_jobs, gnosis_jobs, poly_jobs, eth_nodes, gnosis_nodes, poly_nodes);
  // command = ' '
  // query = `REPLACE INTO stats_history VALUES ("${ath}","${eth_jobs}","${gnosis_jobs}","${poly_jobs}","${eth_nodes}","${gnosis_nodes}","${poly_nodes}")`
  // await querySQL
  // .getData(query, command)
  // .then(async ({result}) => {
  //   return result;
  // })
  // .catch((error) => console.log(`Error : ${error}`));

  return `
  ${date} - Knowledge Graph Daily Stats:
 ATH: ${ath} TRAC ($${usdpayouts_ath} USD) paid out!
 Today: ${payouts} TRAC ($${usdpayouts} USD) paid out!

 Jobs by Network:
 Ethereum: ${eth_jobs} (${eth_sym}${ethjob_chng}%)
 Gnosis: ${gnosis_jobs} (${gno_sym}${gnojob_chng}%)
 Polygon: ${poly_jobs} (${poly_sym}${polyjob_chng}%)

 Active Nodes(IDs) by Network:
 Ethereum: ${eth_nodes} (${ethn_sym}${ethjob_chng}%)
 Gnosis: ${gnosis_nodes} (${gnon_sym}${gnojob_chng}%)
 Polygon: ${poly_nodes} (${polyn_sym}${polyjob_chng}%)
  `
  //bot testing
  // await bot.telegram.sendMessage('-543322141',
  //   date+' - Knowledge Graph Daily Stats:'+os.EOL+os.EOL+
  //   'ATH:   '+payout_ath+' TRAC ($'+usdpayouts_ath+' USD) paid out!'+os.EOL+
  //   'Today: '+payouts+' TRAC ($'+usdpayouts+' USD) paid out!'+os.EOL+os.EOL+
  //   'Jobs by Network:'+os.EOL+
  //   'Ethereum: '+ethjobs+' ('+eth_sym+ethjob_chng+'%)'+os.EOL+
  //   'xDai: '+xdaijobs+' ('+xdai_sym+xdaijob_chng+'%)'+os.EOL+
  //   'Polygon: '+polyjobs+' ('+poly_sym+polyjob_chng+'%)'+os.EOL+os.EOL+
  //   'Active Nodes(IDs) by Network:'+os.EOL+
  //   'Ethereum: '+ethnodes+' ('+ethn_sym+ethnodes_chng+'%)'+os.EOL+
  //   'xDai: '+xdainodes+' ('+xdain_sym+xdainodes_chng+'%)'+os.EOL+
  //   'Polygon: '+polynodes+' ('+polyn_sym+polynodes_chng+'%)'
  // )

  //main chat
  // await bot.telegram.sendMessage('-1001399729852',
  //   date+' - Knowledge Graph Daily Stats:'+os.EOL+os.EOL+
  //   'ATH:   '+payout_ath+' TRAC ($'+usdpayouts_ath+' USD) paid out!'+os.EOL+
  //   'Today: '+payouts+' TRAC ($'+usdpayouts+' USD) paid out!'+os.EOL+os.EOL+
  //   'Jobs by Network:'+os.EOL+
  //   'Ethereum: '+ethjobs+' ('+eth_sym+ethjob_chng+'%)'+os.EOL+
  //   'xDai: '+xdaijobs+' ('+xdai_sym+xdaijob_chng+'%)'+os.EOL+
  //   'Polygon: '+polyjobs+' ('+poly_sym+polyjob_chng+'%)'+os.EOL+os.EOL+
  //   'Active Nodes(IDs) by Network:'+os.EOL+
  //   'Ethereum: '+ethnodes+' ('+ethn_sym+ethnodes_chng+'%)'+os.EOL+
  //   'xDai: '+xdainodes+' ('+xdain_sym+xdainodes_chng+'%)'+os.EOL+
  //   'Polygon: '+polynodes+' ('+polyn_sym+polynodes_chng+'%)'
  // )
  //
  // //pink chat
  // await bot.telegram.sendMessage('-1001384216088',
  //   date+' - Knowledge Graph Daily Stats:'+os.EOL+os.EOL+
  //   'ATH:   '+payout_ath+' TRAC ($'+usdpayouts_ath+' USD) paid out!'+os.EOL+
  //   'Today: '+payouts+' TRAC ($'+usdpayouts+' USD) paid out!'+os.EOL+os.EOL+
  //   'Jobs by Network:'+os.EOL+
  //   'Ethereum: '+ethjobs+' ('+eth_sym+ethjob_chng+'%)'+os.EOL+
  //   'xDai: '+xdaijobs+' ('+xdai_sym+xdaijob_chng+'%)'+os.EOL+
  //   'Polygon: '+polyjobs+' ('+poly_sym+polyjob_chng+'%)'+os.EOL+os.EOL+
  //   'Active Nodes(IDs) by Network:'+os.EOL+
  //   'Ethereum: '+ethnodes+' ('+ethn_sym+ethnodes_chng+'%)'+os.EOL+
  //   'xDai: '+xdainodes+' ('+xdain_sym+xdainodes_chng+'%)'+os.EOL+
  //   'Polygon: '+polynodes+' ('+polyn_sym+polynodes_chng+'%)'
  // )
};
