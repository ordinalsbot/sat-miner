const BitcoinClient = require('bitcoin-core');
const { IncomingWebhook } = require('@slack/webhook');
const { Satscanner, Satextractor, Mempool } = require('ordinalsbot');
const Satminer = require('./model/satminer');
const KrakenAPI = require('./api/kraken');
const OkcoinAPI = require('./api/okcoin');
const MempoolApi = require('./api/mempool');
const KrakenTumbler = require('./model/exchanges/kraken');
const OkcoinTumbler = require('./model/exchanges/okcoin');
const Wallet = require('./model/wallet');
const { loadBitcoinWallet } = require('./utils/funcs');
const {
  EXCHANGE_DATA,
  MAX_WITHDRAWAL_AMOUNT,
  MIN_WITHDRAWAL_AMOUNT,
  MIN_DEPOSIT_AMOUNT,
  TUMBLER_ADDRESS,
  INVENTORY_WALLET,
  BITCOIN_RPC_HOST,
  BITCOIN_RPC_PORT,
  BITCOIN_RPC_USERNAME,
  BITCOIN_RPC_PASSWORD,
  BITCOIN_RPC_WALLET,
  WITHDRAW_FUNDS_INTERVAL_MIN,
  EXTRACT_SATS_INTERVAL_MIN,
  SLACK_WEB_HOOK,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  CUSTOM_SPECIAL_SAT_WALLETS,
  ORDINALSBOT_API_KEY,
  INCLUDE_SATRIBUTES,
  NOTIFICATION_LEVEL,
} = require('./conf/satminer');
const NotificationService = require('./model/notifications/notificationService');
const SlackNotifications = require('./model/notifications/slack');
const TelegramNotifications = require('./model/notifications/telegram');

const bitcoinClient = new BitcoinClient({
  host: BITCOIN_RPC_HOST,
  port: BITCOIN_RPC_PORT,
  wallet: BITCOIN_RPC_WALLET,
  username: BITCOIN_RPC_USERNAME,
  password: BITCOIN_RPC_PASSWORD,
});

const mempoolApi = new MempoolApi();

const wallet = new Wallet(bitcoinClient, mempoolApi);

const satscanner = new Satscanner(ORDINALSBOT_API_KEY, "live");
const satextractor = new Satextractor(ORDINALSBOT_API_KEY, "live");
const mempool = new Mempool(ORDINALSBOT_API_KEY, "live");

// initialize notifications
let notifications = new NotificationService(NOTIFICATION_LEVEL);
if (SLACK_WEB_HOOK) {
  console.log('enabling slack webhook notifications');
  const slackWebHook = new SlackNotifications(SLACK_WEB_HOOK);
  notifications.addNotifier(slackWebHook);
}
if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
  console.log('enabling telegram notifications');
  const telegramNotifier = new TelegramNotifications(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);
  notifications.addNotifier(telegramNotifier);
}

const {
  ACTIVE_EXCHANGE,
  KRAKEN_API_KEY,
  KRAKEN_API_SECRET,
  KRAKEN_WITHDRAWAL_WALLET,
  KRAKEN_WITHDRAW_CURRENCY,
  KRAKEN_DEPOSIT_WALLET,
  OKCOIN_API_KEY,
  OKCOIN_API_SECRET,
  OKCOIN_API_PASSPHRASE,
  OKCOIN_WITHDRAWAL_WALLET,
  OKCOIN_WITHDRAW_CURRENCY,
  OKCOIN_DEPOSIT_WALLET,
} = EXCHANGE_DATA;

const sweepConfirmationTargetBlocks = 1;
const satminer = new Satminer(
  wallet,
  satscanner,
  satextractor,
  TUMBLER_ADDRESS,
  INVENTORY_WALLET,
  ACTIVE_EXCHANGE === 'kraken' ? KRAKEN_DEPOSIT_WALLET : OKCOIN_DEPOSIT_WALLET,
  sweepConfirmationTargetBlocks,
  MIN_DEPOSIT_AMOUNT,
  notifications,
  INCLUDE_SATRIBUTES,
  CUSTOM_SPECIAL_SAT_WALLETS,
);

let exchangeTumbler = null;
switch (ACTIVE_EXCHANGE) {
    case 'kraken':
        const krakenAPI = new KrakenAPI(KRAKEN_API_KEY, KRAKEN_API_SECRET);
        exchangeTumbler = new KrakenTumbler(
            krakenAPI,
            notifications,
            MIN_WITHDRAWAL_AMOUNT,
            MAX_WITHDRAWAL_AMOUNT,
            KRAKEN_WITHDRAWAL_WALLET,
            KRAKEN_WITHDRAW_CURRENCY,
        );
        break;
    case 'okcoin':
        const okcoinAPI = new OkcoinAPI(OKCOIN_API_KEY, OKCOIN_API_SECRET, OKCOIN_API_PASSPHRASE);
        exchangeTumbler = new OkcoinTumbler(
            okcoinAPI,
            notifications,
            MIN_WITHDRAWAL_AMOUNT,
            MAX_WITHDRAWAL_AMOUNT,
            OKCOIN_WITHDRAWAL_WALLET,
            OKCOIN_WITHDRAW_CURRENCY,
        );
        break;
    default:
        throw new Error(`Unknown exchange ${ACTIVE_EXCHANGE}`);
}
if (!exchangeTumbler) {
  throw new Error('No exchange tumbler set');
}

// Call the two main jobs at startup
const initWalletAndServices = async () => {
  await loadBitcoinWallet(bitcoinClient, BITCOIN_RPC_WALLET);
  // Only call the withdraw available funds on startup if there are
  // no incoming withdrawals or very small amounts in the wallet.
  // This prevents us from cycling too much funds at once.
  const newWithdrawThreshold = MIN_WITHDRAWAL_AMOUNT / 2;
  const unconfirmedBalance = await bitcoinClient.getUnconfirmedBalance();
  const balance = await bitcoinClient.getBalance('*', 0);
  const totalBalance = balance + unconfirmedBalance;
  if (totalBalance < newWithdrawThreshold) {
    console.log(`${totalBalance} BTC in wallet, initiating a withdrawal on startup`);
    exchangeTumbler.withdrawAvailableFunds();
  } else {
    console.log(`${totalBalance} BTC in wallet, skipping withdrawal on startup`);
  }

  satminer.extractSatsAndRotateFunds();

  console.log('starting jobs');

  // Set the jobs to run at intervals
  const withdrawInterval = WITHDRAW_FUNDS_INTERVAL_MIN * 60 * 1000;
  setInterval(exchangeTumbler.withdrawAvailableFunds, withdrawInterval);

  const extractSatsInterval = EXTRACT_SATS_INTERVAL_MIN * 60 * 1000;
  setInterval(satminer.extractSatsAndRotateFunds, extractSatsInterval);
};

initWalletAndServices();
