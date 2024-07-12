require('dotenv').config();
const mysql = require('mysql');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { Readable } = require('stream');
const { getCoinPrice, getCoinCap, getCoinVolume } = require('./getCoinPrice.js');


const connection = mysql.createConnection({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    database: process.env.DKG_DB,
});

function query(sql, args) {
  return new Promise((resolve, reject) => {
    connection.query(sql, args, (error, rows) => {
      if (error) return reject(error);
      resolve(rows);
    });
  });
}

function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

function fetchDateTotalPubs() {
  return new Promise((resolve, reject) => {
    connection.query('select * from v_pubs_stats_daily where date != (select block_date from sync_otp_mainnet.v_sys_staging_date) order by date', (error, results) => {
      if (error) reject(error);
      resolve(results);
    });
  });
}

function fetchDateCumulativeTracSpent() {
  return new Promise((resolve, reject) => {
    connection.query('SELECT date, SUM(totalTracSpent) OVER (ORDER BY date ASC) AS cumulativeTotalTracSpent FROM v_pubs_stats_daily ORDER BY date ASC', (error, results) => {
      if (error) reject(error);
      resolve(results);
    });
  });
}

function fetchDateCumulativePubs() {
  return new Promise((resolve, reject) => {
    connection.query('SELECT date, SUM(totalPubs) OVER (ORDER BY date ASC) AS cumulativePubs FROM v_pubs_stats_daily ORDER BY date ASC', (error, results) => {
      if (error) reject(error);
      resolve(results);
    });
  });
}

function fetchDateCumulativePayouts() {
  return new Promise((resolve, reject) => {
    connection.query(`WITH RECURSIVE dates_cte AS (SELECT (SELECT MIN(block_date) FROM sync_otp_mainnet.staging_proof_submitted) AS date_val UNION ALL SELECT DATE_ADD(date_val, INTERVAL 1 DAY) FROM dates_cte WHERE date_val < (SELECT MAX(block_date) FROM sync_otp_mainnet.staging_proof_submitted)), dates_cte_2 AS (SELECT a.date_val FROM dates_cte AS a LEFT JOIN (SELECT DISTINCT block_date FROM sync_otp_mainnet.staging_proof_submitted) AS b ON a.date_val = b.block_date WHERE b.block_date IS NULL) SELECT a.date_val AS date, COALESCE(SUM(b.value) OVER (ORDER BY a.date_val ASC), 0) AS cumulativePayout FROM (SELECT block_date AS date, SUM(value) AS value FROM sync_otp_mainnet.staging_proof_submitted GROUP BY block_date UNION ALL SELECT date_val, 0 FROM dates_cte_2) AS b RIGHT JOIN dates_cte AS a ON a.date_val = b.date ORDER BY a.date_val ASC;`, (error, results) => {
      if (error) reject(error);
      resolve(results);
    });
  });
}

function getReadableTime(days) {
  let remainingDays = days;

  const years = Math.floor(remainingDays / 365);
  remainingDays -= years * 365;

  const months = Math.floor(remainingDays / 30);
  remainingDays -= months * 30;

  let result = '';

  if (years > 0) {
    result += `${years} year${years === 1 ? '' : 's'}, `;
  }
  if (months > 0) {
    result += `${months} month${months === 1 ? '' : 's'}, `;
  }
  if (remainingDays > 0) {
    result += `${remainingDays} day${remainingDays === 1 ? '' : 's'}`;
  }

  return result;
}

async function fetchNetworkStatistics(ctx) {
  const pubStats = await query('SELECT * FROM v_pubs_stats_total;');
  const nodeStats = await query('SELECT ROUND(AVG(nodeAsk), 3) AS avgNodeAsk, SUM(nodeStake) AS totalNodeStake, COUNT(*) AS totalNodes FROM v_nodes WHERE nodeStake >= 50000');

  const totalTracSpent = Number(pubStats[0].totalTracSpent).toLocaleString('en-US', {maximumFractionDigits: 0});
  const totalPubs = Number(pubStats[0].totalPubs).toLocaleString('en-US', {maximumFractionDigits: 0});
  const avgPubPrice = Number(pubStats[0].avgPubPrice).toFixed(2);
  const totalNodes = Number(nodeStats[0].totalNodes).toLocaleString('en-US', {maximumFractionDigits: 0});
  const totalNodeStake = Number(nodeStats[0].totalNodeStake).toLocaleString('en-US', {maximumFractionDigits: 0});
  const avgNodeAsk = Number(nodeStats[0].avgNodeAsk);

  const startDate = new Date("2022-12-14");
  const currentDate = new Date();
  const diffTime = Math.abs(currentDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const timeSinceStartDate = getReadableTime(diffDays);

  const message = `== Total Network 📊 ==
🗓Days: ${timeSinceStartDate}
🍺Total Pubs: ${totalPubs}
💻Total Nodes: ${totalNodes}
🥩Total Stake: ${totalNodeStake}
💰Total TRAC Spent: ${totalTracSpent}
⚖️Avg Pub Price: ${avgPubPrice}
🫴Avg Node Ask: ${avgNodeAsk}`;

  await ctx.reply(message);
}

async function postNetworkStatistics() {
  const pubStats = await query('SELECT * FROM v_pubs_stats_total;');
  const nodeStats = await query('SELECT ROUND(AVG(nodeAsk), 3) AS avgNodeAsk, SUM(nodeStake) AS totalNodeStake, COUNT(*) AS totalNodes FROM v_nodes WHERE nodeStake >= 50000');
  const dailyStats = await query('SELECT totalTracSpent FROM v_pubs_stats_last24h');

  const dailyTracSpent = Number(dailyStats[0].totalTracSpent);
  const totalTracSpent = Number(pubStats[0].totalTracSpent);
  const totalNodes = Number(nodeStats[0].totalNodes);
  const totalNodeStake = Number(nodeStats[0].totalNodeStake);

  const symbol = 'TRAC';
  const price = await getCoinPrice(symbol);
  const marketCap = await getCoinCap(symbol);
  const volume = await getCoinVolume(symbol);
  const totalNodeStakeUsd = (price * totalNodeStake).toFixed(2);
  const totalTracSpentUsd = (price * totalTracSpent).toFixed(2);
  const dailyTracSpentUsd = (price * dailyTracSpent).toFixed(2);

  const formatNumber = (number) => {
    if (number >= 1_000_000) {
      const value = number / 1_000_000;
      return value % 1 === 0 ? `${value}M` : `${value.toFixed(1)}M`;
    } else if (number >= 1_000) {
      const value = number / 1_000;
      return value % 1 === 0 ? `${value}K` : `${value.toFixed(1)}K`;
    } else {
      return number.toString();
    }
  };

  const formatCurrency = (number) => {
    if (number >= 1_000_000) {
      const value = number / 1_000_000;
      return value % 1 === 0 ? `${value}M` : `${value.toFixed(1)}M`;
    } else if (number >= 1_000) {
      const value = number / 1_000;
      return value % 1 === 0 ? `${value}K` : `${value.toFixed(1)}K`;
    } else {
      return number.toFixed(1);
    }
  };

  const totalNodesFormatted = formatNumber(totalNodes);
  const tvl = totalNodeStake + totalTracSpent;
  const tvlUsd = Number(totalNodeStakeUsd) + Number(totalTracSpentUsd);
  const dailyTracSpentFormatted = formatNumber(dailyTracSpent);
  const dailyTracSpentUsdFormatted = formatCurrency(Number(dailyTracSpentUsd));
  const totalTracSpentFormatted = formatNumber(totalTracSpent);
  const totalTracSpentUsdFormatted = formatCurrency(Number(totalTracSpentUsd));
  const tvlFormatted = formatNumber(tvl);
  const tvlUsdFormatted = formatCurrency(tvlUsd);
  const marketCapFormatted = formatCurrency(marketCap);
  const volumeFormatted = formatCurrency(volume);

  const message = `== Network Stats 📊 ==
💻Active nodes: ${totalNodesFormatted}
🥩TVL: ${tvlFormatted} ($${tvlUsdFormatted})
💵TRAC spent 24H: ${dailyTracSpentFormatted} ($${dailyTracSpentUsdFormatted})
💰TRAC Spent total: ${totalTracSpentFormatted} ($${totalTracSpentUsdFormatted})
⚖️Mcap: $${marketCapFormatted} | Volume: $${volumeFormatted}`;

  return message;
}

// postNetworkStatistics().then(message => {
//   console.log(message);
// });

async function KnowledgeAssetsOverTime(dates, totalPubsValues) {

  const width = 800;
  const height = 600;
  const backgroundColour = 'white';
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour});

  const xLabels = dates.map((dateObj, index, self) => {
    const dateStr = dateObj.toISOString().split('T')[0]; 
    const monthYear = dateStr.slice(0, 7);
    if (self.findIndex(d => d.toISOString().split('T')[0].slice(0, 7) === monthYear) === index) {
      const d = new Date(dateObj);
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      return label !== "Dec 2022" ? label : '';
    } else {
      return ''; 
    }
  });

  const configuration = {
    type: 'bar',
    data: {
      labels: xLabels,
      datasets: [{
        label: 'Knowledge Assets created per day',
        data: totalPubsValues,
        backgroundColor: '#6168ED',
        borderColor: '#6168ED',
        borderWidth: 0,
        barPercentage: 0.8
      }]
    },
    options: {
      plugins: {
        legend: {
          labels: {
            font:{
              size: 20
          }
        }
      }
    },
      devicePixelRatio: 2,
      layout: {
        padding: {
          right: 10
        }
      },
      scales: {
        x: {
          display: true,
          grid: {
            drawOnChartArea: false,
            drawBorder: false
          },
          ticks: {
            autoSkip: false,
            font: {
              size: 14
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            drawOnChartArea: true, 
            drawBorder: false
          },
          ticks: {
            font: {
              size: 14
            }
          }
        }
      }
    }
  };

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

async function cumulativeGraph(dates, cumulativeTotalTracSpentValues,cumulativePubsValues,cumulativePayoutsValues) {
  const width = 800;
  const height = 600;
  const backgroundColour = 'white';
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour});

  const xLabels = dates.map((dateObj, index, self) => {
    const dateStr = dateObj.toISOString().split('T')[0]; 
    const monthYear = dateStr.slice(0, 7);
    if (self.findIndex(d => d.toISOString().split('T')[0].slice(0, 7) === monthYear) === index) {
      const d = new Date(dateObj);
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      return label !== "Dec 2022" ? label : '';
    } else {
      return ''; 
    }
  });

  const configuration = {
    type: 'line',
    data: {
      labels: xLabels,
      datasets: [
      {
        label: 'TRAC Spent on Publishing',
        data: cumulativeTotalTracSpentValues,
        backgroundColor: process.env.COLOR_1,
        borderColor: process.env.COLOR_1,
        borderWidth: 3,
        fill: false, 
        pointRadius: 0,
        tension: 0.9,
        lineTension: 0.9
      },
      {
        label: 'Assets Published',
        data: cumulativePubsValues,
        backgroundColor: process.env.COLOR_2,
        borderColor: process.env.COLOR_2,
        borderWidth: 3,
        fill: false, 
        pointRadius: 0,
        tension: 0.9,
        lineTension: 0.9
      },
      {
        label: 'Node Payouts',
        data: cumulativePayoutsValues,
        backgroundColor: process.env.COLOR_3,
        borderColor: process.env.COLOR_3,
        borderWidth: 3,
        fill: false, 
        pointRadius: 0,
        tension: 0.9,
        lineTension: 0.9
      }
    ]
    },
    options: {
      plugins: {
        legend: {
          labels: {
            font: {
              size: 18
            }
          }
        }
      },
      devicePixelRatio: 2,
      layout: {
        padding: {
          right: 10
        }
      },
      scales: {
        x: {
          display: true,
          grid: {
            drawOnChartArea: false,
            drawBorder: false
          },
          ticks: {
            autoSkip: false,
            font: {
              size: 14
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            drawOnChartArea: true, 
            drawBorder: false
          },
          ticks: {
            font: {
              size: 14
            }
          }
        }
      }
    }
  };

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

module.exports = {
  postNetworkStatistics, fetchNetworkStatistics, fetchDateTotalPubs, fetchDateCumulativeTracSpent, fetchDateCumulativePubs, fetchDateCumulativePayouts, KnowledgeAssetsOverTime, bufferToStream, cumulativeGraph
};
