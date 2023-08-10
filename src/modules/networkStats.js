require('dotenv').config();
const mysql = require('mysql');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { Readable } = require('stream');

const connection = mysql.createConnection({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    database: process.env.SYNC_DB,
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
    connection.query('SELECT date, totalPubs FROM v_pubs_stats WHERE date < (SELECT MAX(date) FROM v_pubs_stats) order by date', (error, results) => {
      if (error) reject(error);
      resolve(results);
    });
  });
}

function fetchDateCumulativeTracSpent() {
  return new Promise((resolve, reject) => {
    connection.query('SELECT date, SUM(totalTracSpent) OVER (ORDER BY date ASC) AS cumulativeTotalTracSpent FROM v_pubs_stats ORDER BY date ASC', (error, results) => {
      if (error) reject(error);
      resolve(results);
    });
  });
}

function fetchDateCumulativePubs() {
  return new Promise((resolve, reject) => {
    connection.query('SELECT date, SUM(totalPubs) OVER (ORDER BY date ASC) AS cumulativePubs FROM v_pubs_stats ORDER BY date ASC', (error, results) => {
      if (error) reject(error);
      resolve(results);
    });
  });
}

function fetchDateCumulativePayouts() {
  return new Promise((resolve, reject) => {
    connection.query(`WITH RECURSIVE dates_cte AS (select (select cast(convert_tz(from_unixtime(timestamp),_utf8mb4'SYSTEM',_utf8mb4'UTC') as date) from block order by number asc limit 1) as date_val UNION ALL SELECT DATE_ADD(date_val, INTERVAL 1 DAY) FROM dates_cte WHERE date_val < (select block_date from v_sys_staging_date)), dates_cte_2 as (select a.date_val from dates_cte as a left join (select distinct block_date from staging_proof_submitted) as b on a.date_val=b.block_date where b.block_date is null) SELECT a.date ,SUM(value) OVER (ORDER BY date ASC) AS cumulativePayout FROM (select block_date as date, sum(value) as value from staging_proof_submitted group by block_date UNION ALL select date_val,0 from dates_cte_2) as a ORDER BY date ASC`, (error, results) => {
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
  const pubStats = await query('SELECT SUM(totalTracSpent) AS totalTracSpent, SUM(totalPubs) AS totalPubs, (SELECT AVG(avgPubPrice) FROM v_pubs_stats WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) AS avgPubPriceLast30Days FROM v_pubs_stats');
  const nodeStats = await query('SELECT ROUND(AVG(nodeAsk), 3) AS avgNodeAsk, SUM(nodeStake) AS totalNodeStake, COUNT(*) AS totalNodes FROM v_nodes WHERE nodeStake >= 50000');

  const totalTracSpent = Number(pubStats[0].totalTracSpent).toLocaleString('en-US', {maximumFractionDigits: 0});
  const totalPubs = Number(pubStats[0].totalPubs).toLocaleString('en-US', {maximumFractionDigits: 0});
  const avgPubPrice = Number(pubStats[0].avgPubPriceLast30Days).toFixed(2);
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

  const botmessage = await ctx.reply(message);

  if (botmessage) {
    setTimeout(async () => {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, botmessage.message_id)
      } catch (error) {
        console.error('Error deleting message:', error)
      }
    }, process.env.DELETE_TIMER)
  }
}

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
        label: 'Knowledge Assets published per day',
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
        backgroundColor: '#6344DF',
        borderColor: '#6344DF',
        borderWidth: 3,
        fill: false, 
        pointRadius: 0,
        tension: 0.9,
        lineTension: 0.9
      },
      {
        label: 'Assets Published',
        data: cumulativePubsValues,
        backgroundColor: '#3b419c',
        borderColor: '#3b419c',
        borderWidth: 3,
        fill: false, 
        pointRadius: 0,
        tension: 0.9,
        lineTension: 0.9
      },
      {
        label: 'Node Payouts',
        data: cumulativePayoutsValues,
        backgroundColor: '#8244df',
        borderColor: '#8244df',
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
  fetchNetworkStatistics, fetchDateTotalPubs, fetchDateCumulativeTracSpent, fetchDateCumulativePubs, fetchDateCumulativePayouts, KnowledgeAssetsOverTime, bufferToStream, cumulativeGraph
};
