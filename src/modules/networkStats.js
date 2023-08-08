require('dotenv').config();
const mysql = require('mysql');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

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

function fetchDateTotalPubs() {
  return new Promise((resolve, reject) => {
    connection.query('SELECT date, totalPubs FROM v_pubs_stats WHERE date < (SELECT MAX(date) FROM v_pubs_stats)', (error, results) => {
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
  try {
    setTimeout(async () => {
      try {
        await ctx.deleteMessage();
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }, process.env.DELETE_TIMER);

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

  } catch (error) {
    console.error('An error occurred:', error);
    await ctx.reply('An error occurred while retrieving network statistics.');
  }
}

async function generateGraph(dates, totalPubsValues) {

  const width = 400; //px
  const height = 400; //px
  const backgroundColour = 'white';
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour});

  // Create an array for the X-axis labels
  const xLabels = dates.map((dateObj, index, self) => {
    const dateStr = dateObj.toISOString().split('T')[0];  // Convert Date object to "YYYY-MM-DD"
    const monthYear = dateStr.slice(0, 7);  // Extract "YYYY-MM" from the date
    if (self.findIndex(d => d.toISOString().split('T')[0].slice(0, 7) === monthYear) === index) {
      const d = new Date(dateObj);
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      return label !== "Dec 2022" ? label : '';  // Exclude "Dec 2022"
    } else {
      return '';  // Empty string for other dates
    }
  });

  const configuration = {
    type: 'bar',
    data: {
      labels: xLabels,
      datasets: [{
        label: 'Daily Pubs',
        data: totalPubsValues,
        backgroundColor: 'blue',
        borderColor: 'blue',
        borderWidth: 1
      }]
    },
    options: {
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
              size: 10
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            drawOnChartArea: true, 
            drawBorder: false
          }
        }
      }
    }
  };

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}



module.exports = {
  fetchNetworkStatistics, fetchDateTotalPubs, generateGraph
};
