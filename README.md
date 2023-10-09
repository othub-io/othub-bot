# OTHub Bot

OTHub bot is a multi purpose mini app allowing Telegram users to view the Decentralized Knowledge Graph's advanced network statistics and seamlessly create Knowledge Assets. 

### OTHub bot will be designed with a few functionalities in mind:
- Provide an interactive and simple way for Telegram users to query the DKG network statistics;
- Provide an easy command to create knowledge assets and to refill account balances;
- Provide a simple way to learn about the DKG ecosystem;
- Provide a tool that reports significant network activities such as new record daily publishing amount, new high stake node detected;

OTHub bot aims to fill the void between the retail user and the technical skills required to fully utilize the DKG infrastructure, fulfilling one of the core pillars of OriginTrail - usability. The lack of user-friendly front end to publish knowledge assets to the DKG across social media or chat platforms is a potential hindrance to retail adoption. The exposure to popular platforms such as Telegram and allowing users to publish knowledge assets with just a few clicks should have a positive impact on the networking effects of the DKG. The primary goal of this project is to make viewing the DKG network and publishing assets extremely user-friendly and accessible. 

An early version of the OTHub bot has been released to the public on OriginTrail's Community channel on June 2023 and reception has been overwhelmingly positive. The OTHub bot Telegram handle is [@othubbot](t.me/othubbot) and is available for everyone.

### Instructions
> **Warning**
> 
> Please note that @othubbot network statistics should not be considered financial advice. The bot is still in beta and some features are still in testing. The bot relies on OTHub.io's API, which is currently free and accessible to any App Developers on the DKG. The bot also relies on OTHub's OriginTrail Parachain Sync, which requires maintaining a full blockchain sync to get the latest network statistics. This project is unique to OriginTrail but you are free to use our code and ideas for your project. See more details here: https://github.com/othub-io. 

Set up your working environment
```
git clone https://github.com/othub-io/othub-bot
cd othub-bot
cp .example-env .env
npm install
```
Below is the list of essential parameters:

| Params            | Description                                |
|-------------------|-------------------------------------------|
| BOT_TOKEN         | Telegram BOT token obtained through [@BotFather](https://t.me/BotFather) |
| OTHUB_ID          | Telegram Chat ID                            |
| ORIGINTRAIL_ID    | Official OriginTrail Telegram Chat ID       |
| API_KEY           | OTHub API Key                               |
| OTHUB_WALLET      | OTHub's wallet address                      |
| ADMIN_GROUP       | Telegram ID of group admins                 |
| DBHOST            | Hostname of the database server             |
| DBUSER            | Username for accessing the database         |
| DBPASSWORD        | Password for accessing the database         |
| OTHUB_DB          | Main database                               |
| SYNC_DB           | Sync database, refer to [otp-sync](https://github.com/othub-io/otp-sync) for details               |
| PAYMENT_DB        | Payment database                            |
| COOLDOWN          | Minimum cooldown for query spam check       |
| DELETE_TIMER      | Time before messages disappear              |

Set up your MySQL database
```
apt-get install mysql-server -y
```
Restore the schema.sql to your server
```
mysql -u <username> -p < schema.sql
```
Copy the service file and start the bot
```
cp ~/othub-bot/othub-bot.service /etc/systemd/system/
systemctl daemon-reload
systemctl start othub-bot
systemctl enable othub-bot
```
> **Note**
> 
> @othubbot is designed to be the bridge between the non coding general Telegram community and the power of the Decentralized Knowledge Graph.
> By allowing every day users to publish Knowledge Assets, members of society will be able to participate in this shift from Web2 to Web3, owning their physical and digital assets. 
> More info about the DKG can be found on https://origintrail.io/ and a full length DKG Conference 2023 explains the power of the DKG: https://www.youtube.com/watch?v=ekG1Bl-tCjc.

### Commands
Here is a list of functional commands:
##### **Knowledge Asset Creation**
/othub - @othubbot landing page
/knowledge - Start of the Journey
/start - Link Telegram ID with Funding Public Address
/balance - Check current balance
/fund - Fund user's wallet with test balance
/create - Create Knowledge Assets on the DKG

##### **Advanced Network Statistics**
/pubsgraph - Show total network pubs over time
/networkgraph - TRAC spent on publishing, Assets published, Node payouts
/hourlypubs - Show network stats for the last hour
/dailypubs - Show network pubs for the last day
/weeklypubs - Show network pubs for the last week
/monthlypubs - Show network pubs for the last month
/totalpubs - Show total network pubs
/networkstats - Show total network stats
/nodestats <tokenSymbol> - Show cumulative node stats for provided tokenSymbol
/nodestatslasthour <tokenSymbol> - Show node stats for provided tokenSymbol for the last hour
/nodestatslastday <tokenSymbol> - Show node stats for provided tokenSymbol for the last day
/nodestatslastweek <tokenSymbol> - Show node stats for provided tokenSymbol for the last week
/nodestatslastmonth <tokenSymbol> - Show node stats for provided tokenSymbol for the last month

##### **Definitions**
/commands - shows all available commands to all users
/admincommands - shows admin commands
/glossary - A list of terms and definitions to better understand the OriginTrail Ecosystem

*@othubbot is a work in progress. Feel free to provide us some feedback!*
