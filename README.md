# Caution
This is experimental software, doing experimental things with magic internet money. There can be bugs and your bitcoin can be lost.

# OrdinalsBot Sat Miner
Rare sat miner using OrdinalsBot API.

# What you need
1- OrdinalsBot API Key  
2- An account in a supported exchange/service so you can send sats back and forth.
3- A bitcoin-core wallet with a loaded wallet and some bitcoin.

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
* run the app
`npm run start`  

# Monitor
* you can bookmark your miner, exchange and rare sat collection address page on http://mempool.space and see funds move between them.

* receive slack webhooks (telegram/email coming soon...) for updates on activity of your funds.

# Contact
* Please open an issue if you run into any problems with this repository.
