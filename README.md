# OTHub Bot

### OTHub bot will be designed with a few functionalities in mind:
- Provide an interactive and simple way on Telegram and Discord to query the DKG network and to publish knowledge assets;
- Provide a simple way for Twitter users to query the DKG and to turn Tweets into knowledge assets, making them verifiable, immutable and traceable by simply tagging @othubbot with a command;
- Provide a network monitor to [OTHub](othub.io) Alliance node runners which detects and notifies the user when their node is unreachable;
- Provide general monitoring of significant network activities such as new publisher wallet detected, new high stake node detected, high volume of publishes and so on.

### Timeline
- Q3 2023 - Network monitor for DKG V6 node runners and general monitoring of significant network activities
- Q4 2023 - Chat platform bot integration with basic network statistics
- Q1 2024 - Chat platform bot integration with full functionality (querying DKG, asset publishing)
- Q2 2024 - Twitter integration with full functionality
- Q3 2024 - Further integration with other platforms 


### Expected Impact
This project aims to contribute to one of the core pillars of OriginTrail, usability. The lack of user-friendly frontend to publish knowledge assets to the DKG across social media or chat platforms is hurting adoption. The exposure to popular platforms such as Telegram, Discord and Twitter and allowing users to publish knowledge assets with just a few clicks will have a positive impact on the networking effects of the DKG. The primary goal of this project is to make publishing assets extremely user-friendly for all users. As a bot, the scalability, compatibility and reusability of the project is high, and the expected impact on network activity is very high as well. Cross integrations with chatDKG, OTHub and DKG explorer to query published assets through OTHub Bot is very possible. 

### Instructions
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
| API_KEY           | OTHub API Key               |
| DBHOST            | Hostname of the database server             |
| USER              | Username for accessing the database         |
| PASSWORD          | Password for accessing the database         |
| OTHUB_DB            | Bot database name                  |
| SYNC_DB           | Sync database, refer to [otp-sync](https://github.com/othub-io/otp-sync) for details               |
| MILLIMIN_COOLDOWN | Minimum cooldown for query spam check     |

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
