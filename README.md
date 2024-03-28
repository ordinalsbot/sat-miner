## Caution
This is experimental software, doing experimental things with magic internet money. There can be bugs and your bitcoin can be lost.

# OrdinalsBot Sat Miner
Rare sat miner using OrdinalsBot API.

# What you need
1- OrdinalsBot API Key  
2- An account in a supported [exchange](https://github.com/ordinalsbot/sat-miner/tree/main/model/exchanges) so you can send sats back and forth.  
3- A bitcoin-core instance with a loaded wallet and some bitcoin.

# Install
* Clone and install this repository
```
git clone https://github.com/ordinalsbot/sat-miner
cd sat-miner
npm i
```
* Rename `.env.sample` to `.env`  
* Update the file with your exchange account and bitcoin-core wallet information

# Use
* make sure `bitcoind` is running and reachable via RPC.  
* run the app  
`npm run start`  

# Monitor
* receive slack webhooks or telegram chat messages (email coming soon...) for updates on activity of your funds.

## Setup Telegram
1- Visit BotFather on telegram, create a new bot and get bot token.  
2- Add this TELEGRAM_BOT_TOKEN to `utils/init_telegram.js` script and run it.  
`node utils/init_telegram.js`  
3- copy the logged TELEGRAM_CHAT_ID and add both of these secrets to your `.env` file.

## Setup Slack
1- Visit your Slack App Directory, search and install `Incoming WebHooks` app to a channel.  
2- Copy your Slack Webhook URL and add it to your `.env` file. 

# Contact
* Please open an issue if you run into any problems with this repository.
