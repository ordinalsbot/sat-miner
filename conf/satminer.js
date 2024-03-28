// Load environment variables from .env file
require('dotenv').config();

const { ORDINALSBOT_API_KEY } = process.env;
if (!ORDINALSBOT_API_KEY) {
  throw Error('Missing ORDINALSBOT_API_KEY environment variable');
}
console.log('ORDINALSBOT_API_KEY', ORDINALSBOT_API_KEY.slice(0, 4) + '...');

let { MAX_WITHDRAWAL_AMOUNT, MIN_WITHDRAWAL_AMOUNT, MIN_DEPOSIT_AMOUNT } = process.env;
if (!MAX_WITHDRAWAL_AMOUNT || !MIN_WITHDRAWAL_AMOUNT || !MIN_DEPOSIT_AMOUNT) {
  throw Error('Missing MAX_WITHDRAWAL_AMOUNT or MIN_WITHDRAWAL_AMOUNT, MIN_DEPOSIT_AMOUNT environment variable');
} else {
  MAX_WITHDRAWAL_AMOUNT = parseFloat(MAX_WITHDRAWAL_AMOUNT);
  MIN_WITHDRAWAL_AMOUNT = parseFloat(MIN_WITHDRAWAL_AMOUNT);
  MIN_DEPOSIT_AMOUNT = parseFloat(MIN_DEPOSIT_AMOUNT);

  if (isNaN(MAX_WITHDRAWAL_AMOUNT) || isNaN(MIN_WITHDRAWAL_AMOUNT)) {
    throw Error('MAX_WITHDRAWAL_AMOUNT or MIN_WITHDRAWAL_AMOUNT is not a number');
  } if (MIN_WITHDRAWAL_AMOUNT > MAX_WITHDRAWAL_AMOUNT) {
    throw Error('MIN_WITHDRAWAL_AMOUNT is greater than MAX_WITHDRAWAL_AMOUNT');
  }
}
console.log('MAX_WITHDRAWAL_AMOUNT', MAX_WITHDRAWAL_AMOUNT);
console.log('MIN_WITHDRAWAL_AMOUNT', MIN_WITHDRAWAL_AMOUNT);
console.log('MIN_DEPOSIT_AMOUNT', MIN_DEPOSIT_AMOUNT);

let EXCHANGE_DATA = {
  ACTIVE_EXCHANGE: process.env.ACTIVE_EXCHANGE,
};
let EXCHANGE_DEPOSIT_WALLET;
if (process.env.ACTIVE_EXCHANGE === 'kraken') {
  const { KRAKEN_API_KEY, KRAKEN_API_SECRET } = process.env;
  if (!KRAKEN_API_KEY || !KRAKEN_API_SECRET) {
    throw Error('Missing KRAKEN_API_KEY or KRAKEN_API_SECRET environment variable');
  }
  const { KRAKEN_WITHDRAWAL_WALLET } = process.env;
  if (!KRAKEN_WITHDRAWAL_WALLET) {
    throw Error('Missing KRAKEN_WITHDRAWAL_WALLET environment variable');
  }
  console.log('KRAKEN_WITHDRAWAL_WALLET', KRAKEN_WITHDRAWAL_WALLET);
  const KRAKEN_WITHDRAW_CURRENCY = 'XBT';
  const { KRAKEN_DEPOSIT_WALLET } = process.env;
  if (!KRAKEN_DEPOSIT_WALLET) {
    throw new Error('Missing KRAKEN_DEPOSIT_WALLET environment variable');
  }
  EXCHANGE_DATA = {
    ...EXCHANGE_DATA,
    KRAKEN_API_KEY,
    KRAKEN_API_SECRET,
    KRAKEN_WITHDRAWAL_WALLET,
    KRAKEN_WITHDRAW_CURRENCY,
    KRAKEN_DEPOSIT_WALLET,
  };
  EXCHANGE_DEPOSIT_WALLET = KRAKEN_DEPOSIT_WALLET;
} else if (process.env.ACTIVE_EXCHANGE === 'okcoin') {
  const { OKCOIN_API_KEY, OKCOIN_API_SECRET, OKCOIN_API_PASSPHRASE } = process.env;
  if (!OKCOIN_API_KEY || !OKCOIN_API_SECRET || !OKCOIN_API_PASSPHRASE) {
    throw Error('Missing OKCOIN_API_KEY, OKCOIN_API_SECRET or OKCOIN_API_PASSPHRASE environment variable');
  }
  const { OKCOIN_WITHDRAWAL_WALLET } = process.env;
  if (!OKCOIN_WITHDRAWAL_WALLET) {
    throw Error('Missing OKCOIN_WITHDRAWAL_WALLET environment variable');
  }
  console.log('OKCOIN_WITHDRAWAL_WALLET', OKCOIN_WITHDRAWAL_WALLET);
  const OKCOIN_WITHDRAW_CURRENCY = 'BTC';
  const { OKCOIN_DEPOSIT_WALLET } = process.env;
  if (!OKCOIN_DEPOSIT_WALLET) {
    throw new Error('Missing OKCOIN_DEPOSIT_WALLET environment variable');
  }
  EXCHANGE_DATA = {
    ...EXCHANGE_DATA,
    OKCOIN_API_KEY,
    OKCOIN_API_SECRET,
    OKCOIN_API_PASSPHRASE,
    OKCOIN_WITHDRAWAL_WALLET,
    OKCOIN_WITHDRAW_CURRENCY,
    OKCOIN_DEPOSIT_WALLET,
  };
  EXCHANGE_DEPOSIT_WALLET = OKCOIN_DEPOSIT_WALLET;
} else if (process.env.ACTIVE_EXCHANGE === 'coinbase') {
  const { COINBASE_API_KEY, COINBASE_API_SECRET } = process.env;
  if (!COINBASE_API_KEY || !COINBASE_API_SECRET) {
    throw Error('Missing COINBASE_API_KEY or COINBASE_API_SECRET environment variable');
  }
  const { COINBASE_WITHDRAWAL_WALLET } = process.env;
  if (!COINBASE_WITHDRAWAL_WALLET) {
    throw Error('Missing COINBASE_WITHDRAWAL_WALLET environment variable');
  }
  console.log('COINBASE_WITHDRAWAL_WALLET', COINBASE_WITHDRAWAL_WALLET);
  const COINBASE_WITHDRAW_CURRENCY = 'BTC';
  const { COINBASE_DEPOSIT_WALLET } = process.env;
  if (!COINBASE_DEPOSIT_WALLET) {
    throw new Error('Missing COINBASE_DEPOSIT_WALLET environment variable');
  }
  EXCHANGE_DATA = {
    ...EXCHANGE_DATA,
    COINBASE_API_KEY,
    COINBASE_API_SECRET,
    COINBASE_WITHDRAWAL_WALLET,
    COINBASE_WITHDRAW_CURRENCY,
    COINBASE_DEPOSIT_WALLET,
  };
  EXCHANGE_DEPOSIT_WALLET = COINBASE_DEPOSIT_WALLET;

} else {
  throw new Error('Unknown exchange');
}



const { TUMBLER_ADDRESS } = process.env;
if (!TUMBLER_ADDRESS) {
  throw Error('Missing TUMBLER_ADDRESS environment variable');
}
console.log('TUMBLER_ADDRESS', TUMBLER_ADDRESS);

const { INVENTORY_WALLET } = process.env;
if (!INVENTORY_WALLET) {
  throw new Error('Missing INVENTORY_WALLET environment variable');
}


const {
  BITCOIN_RPC_HOST,
  BITCOIN_RPC_PORT,
  BITCOIN_RPC_USERNAME,
  BITCOIN_RPC_PASSWORD,
  BITCOIN_RPC_WALLET,
} = process.env;
if (!BITCOIN_RPC_HOST || !BITCOIN_RPC_PORT || !BITCOIN_RPC_USERNAME || !BITCOIN_RPC_PASSWORD || !BITCOIN_RPC_WALLET) {
  throw new Error('Missing BITCOIN_RPC_HOST, BITCOIN_RPC_PORT, BITCOIN_RPC_USERNAME, BITCOIN_RPC_PASSWORD, BITCOIN_RPC_WALLET environment variable');
}

let { WITHDRAW_FUNDS_INTERVAL_MIN, EXTRACT_SATS_INTERVAL_MIN } = process.env;
if (!WITHDRAW_FUNDS_INTERVAL_MIN || !EXTRACT_SATS_INTERVAL_MIN) {
  throw new Error('Missing WITHDRAW_FUNDS_INTERVAL_MIN or EXTRACT_SATS_INTERVAL_MIN environment variable');
}

let { MIN_OUTPUT_SIZE } = process.env;
if (!MIN_OUTPUT_SIZE) {
  MIN_OUTPUT_SIZE = 5000;
  console.log('MIN_OUTPUT_SIZE not set, defaulting to', MIN_OUTPUT_SIZE);
}

MIN_OUTPUT_SIZE = Number(MIN_OUTPUT_SIZE);

if (MIN_OUTPUT_SIZE < 546) {
  throw new Error('MIN_OUTPUT_SIZE must be greater than 546');
}

WITHDRAW_FUNDS_INTERVAL_MIN = Number(WITHDRAW_FUNDS_INTERVAL_MIN);
EXTRACT_SATS_INTERVAL_MIN = Number(EXTRACT_SATS_INTERVAL_MIN);

const { SLACK_WEB_HOOK } = process.env;
if (SLACK_WEB_HOOK) {
  console.log('SLACK_WEB_HOOK', SLACK_WEB_HOOK.slice(0, 4) + '...');
}

const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;
if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
  console.log('TELEGRAM_BOT_TOKEN', TELEGRAM_BOT_TOKEN.slice(0, 4) + '...');
  console.log('TELEGRAM_CHAT_ID', TELEGRAM_CHAT_ID);
}

let { INCLUDE_SATRIBUTES } = process.env;
if (!INCLUDE_SATRIBUTES) {
  INCLUDE_SATRIBUTES = null;
} else {
  INCLUDE_SATRIBUTES = INCLUDE_SATRIBUTES.split(',').map((attribute) => attribute.trim());
  console.log(`including ${INCLUDE_SATRIBUTES.join(', ')} satributes`);
  console.log('only these satributes will be extracted!');
}

const { NOTIFICATION_LEVEL = 'info' } = process.env;

// The wallets will be loaded from ENV by priority from top to bottom
const RARE_SAT_KNOWN_TYPES = [
  'uncommon',
  'black',
  'block-9',
  'block-78',
  'nakamoto',
  'pizza',
  'vintage',
];

const getCustomDepositWallets = () => {
  const customDepositWallets = [];
  for (const type of RARE_SAT_KNOWN_TYPES) {
    const address = process.env[`CUSTOM_SPECIAL_SAT_WALLET_ADDR_${type.toUpperCase()}`];
    if (address) {
      customDepositWallets.push({
        address,
        type,
      });
    }
  }

  return customDepositWallets;
};

const CUSTOM_SPECIAL_SAT_WALLETS = getCustomDepositWallets();
console.log('CUSTOM_SPECIAL_SAT_WALLETS', CUSTOM_SPECIAL_SAT_WALLETS);

module.exports = {
  ORDINALSBOT_API_KEY,
  EXCHANGE_DATA,
  EXCHANGE_DEPOSIT_WALLET,
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
  INCLUDE_SATRIBUTES,
  MIN_OUTPUT_SIZE,
  CUSTOM_SPECIAL_SAT_WALLETS,
  NOTIFICATION_LEVEL,
};
