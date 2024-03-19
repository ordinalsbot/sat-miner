const BitcoinClient = require('bitcoin-core');

/**
 * @description Load the bitcoin wallet if not loaded
 * @param {BitcoinClient} BitcoinClient
 * @param bitcoinClient
 * @param {string} walletName
 */
const loadBitcoinWallet = async (bitcoinClient, walletName) => {
  const wallets = await bitcoinClient.listWallets();
  if (!wallets.includes(walletName)) {
    await bitcoinClient.loadWallet(walletName);
  }
};

module.exports = {
  loadBitcoinWallet,
};
