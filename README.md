# OTHub Bot

OTHub bot is a community managed multi purpose bot allowing social media platforms to interact directly with the DKG. 

### OTHub bot will be designed with a few functionalities in mind:
- Provide an interactive and simple way for Telegram and Discord users to query the DKG network statistics and to publish knowledge assets;
- Provide a simple way for Twitter users to query the DKG and to turn Tweets into knowledge assets, making them verifiable, immutable and traceable by simply tagging @othubbot with a command;
- Provide a network monitor for [OTHub](othub.io) Alliance node runners;
- Provide a tool that reports significant network activities such as new record daily publishing amount, new high stake node detected and publishes them on social media and chat platforms;
- Flexibility to adapt to any trending chat or social media platforms.

### Timeline
- Q3 2023 - Chat platform bot integration with basic network statistics
- Q4 2023 - Network monitor for [OTHub](othub.io) Alliance node runners
- Q1 2024 - Chat platform bot integration with full functionality (querying DKG, asset publishing)
- Q2 2024 - Significant network activities reporting
- Q3 2024 - Twitter integration with full functionality
- Q4 2024 - Further integration with other platforms


### Expected Impact
OTHub bot aims to fill the void between the retail user and the technical skills required to fully utilize the DKG infrastructure, fulfilling one of the core pillars of OriginTrail, usability. The lack of user-friendly frontend to publish knowledge assets to the DKG across social media or chat platforms is a potential obstacle to retail adoption and appreciation. The exposure to popular platforms such as Telegram, Discord and Twitter and allowing users to publish knowledge assets with just a few clicks should have a positive impact on the networking effects of the DKG. The primary goal of this project is to make viewing the DKG network and publishing assets extremely user-friendly. As a bot, the scalability, compatibility and reusability of the project is high, and the expected impact on network activity is very high as well. 

An early version of the OTHub bot has been released to the public on OriginTrail's Community channel on June 2023 and reception has been overwhelmingly positive. OTHub bot Telegram handle is [@othubbot](t.me/othubbot). Anyone can add @othubbot to their Telegram channel and use it right away (given admin rights with ability to delete messages).

### Instructions
> **Warning**
> 
> Please be aware that the instructions below are for users with a full sync of the OriginTrail Parachain blockchain by using otp-sync or any other indexing method which is required to run this bot. The code is open for reviewing and the bot is currently available on Telegram as [@othubbot](t.me/othubbot) and will be available on other platforms according to the timeline above. It is advised to use the bot instead of replicating and maintaining the OT parachain sync. 

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
| GROUP             | Telegram Chat ID                            |
| API_KEY           | OTHub API Key                               |
| ADMIN_GROUP       | Telegram ID of group admins                 |
| DBHOST            | Hostname of the database server             |
| USER              | Username for accessing the database         |
| PASSWORD          | Password for accessing the database         |
| OTHUB_DB          | Bot database name                           |
| SYNC_DB           | Sync database, refer to [otp-sync](https://github.com/othub-io/otp-sync) for details               |
| COOLDOWN          | Minimum cooldown for query spam check       |
| DELETE_TIMER      | Time before messages disappear              |

Set up your MySQL database
```
apt-get install mysql-server -y
node ~/othub-bot/create-db.js
```
Copy the service file and start the bot
```
cp ~/othub-bot/othub-bot.service /etc/systemd/system/
systemctl daemon-reload
systemctl start othub-bot
systemctl enable othub-bot
```
