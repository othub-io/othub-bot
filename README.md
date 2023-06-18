# othub-bot

### OTHub bot is designed with a few functionalities in mind:
- Providing an interactive and simple way on Telegram and Discord (soon) to query the DKG network for statistics such as hourly and daily DKG activity overview;
- Providing a more personalized node network status monitor to [OTHub](othub.io) Alliance node runners which detects and notifies the member when their node is unreachable;
- Integration with [OTHub](othub.io) to monitor and propose service ask price based on voting and governance (soon);
- General monitoring of significant network activities such as new publisher wallet detected, new high stake node detected, high volume of publishes and so on (soon);
- General Management of a private OTHub Alliance channel.

## Instructions
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
| BOT_DB            | Bot database name                  |
| SYNC_DB           | Sync database, refer to [otp-sync](https://github.com/othub-io/otp-sync) for details               |
| MILLIMIN_COOLDOWN | Minimum cooldown for query spam check     |

Set up your MySQL database
```
apt-get install mysql-server -y
.~/othub-bot/othub-bot-create-db.sh
```
Copy the service file and start the bot
```
cp ~/othub-bot/othub-bot.service /etc/systemd/system/
systemctl daemon-reload
systemctl start othub-bot
systemctl enable othub-bot
```
