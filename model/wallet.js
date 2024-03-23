const BitcoinClient = require('bitcoin-core');
const bitcoinjs = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');
const MempoolApi = require('../api/mempool');

/**
 * Wallet creates, signs and sends special bitcoin transactions.
 * Used for constructing txs for sat hunting.
 */
class Wallet {
  /**
   * @param {BitcoinClient} bitcoinClient - the bitcoin-core client
   * @param {MempoolApi} mempoolApi - the mempool api
   * @param network
   */
  constructor(
    bitcoinClient,
    mempoolApi,
    network = bitcoinjs.networks.bitcoin,
  ) {
    this.bitcoinClient = bitcoinClient;
    this.mempoolApi = mempoolApi;
    this.network = network;
  }

  getNewAddress = async () => this.bitcoinClient.getNewAddress();

  /**
   * @typedef {object} Unspent
   * @property {string} txid - Transaction id
   * @property {number} vout - Transaction index
   * @property {string} address - Address
   * @property {number} amount - Value in BTC
   * @property {boolean} spendable - Spendable
   * @property {boolean} safe - Safe
   */

  /**
   * Get the unspent outputs
   * @param {number} minConf - Minimum confirmations
   * @returns {Promise<Unspent[]>} - The unspent outputs
   */
  listUnspent = async (minConf = 1) => this.bitcoinClient.listUnspent(minConf);

  getRawTransaction = async (txid) => this.bitcoinClient.getRawTransaction(txid);

  estimateFee = async () => this.mempoolApi.getFeeEstimation();

  /**
   *
   * @param {string} dummy
   * @param {number} minConf
   */
  getBalance = async (dummy, minConf) => this.bitcoinClient.getBalance(dummy, minConf);

  /**
   * @param {string} address
   * @param {number} amount
   * @param {string} comment
   * @param {string} commentTo
   * @param {boolean} subtractFeeFromAmount
   * @param {boolean} replaceable
   * @param {number} confTarget
   */
  sendToAddress = async (
    address,
    amount,
    comment,
    commentTo,
    subtractFeeFromAmount,
    replaceable,
    confTarget,
  ) => this.bitcoinClient.sendToAddress(
    address,
    amount,
    comment,
    commentTo,
    subtractFeeFromAmount,
    replaceable,
    confTarget,
  );

  /**
   * @param {Input[]} inputs - the inputs
   * @param {Output[]} outputs - the outputs
   * @returns {Promise<string>} - the raw transaction hex
   */
  createUnsignedHexTransaction = async (inputs, outputs) => {
    const inputsAsRawTx = [];
    for (const input of inputs) {
      const rawTx = await this.getRawTransaction(input.hash);
      inputsAsRawTx.push(rawTx);
    }

    // Create raw transaction
    return this.createRawTransaction(inputs, outputs, inputsAsRawTx);
  };

  /**
   * Sign raw transaction hex using bitcoin core wallet
   * @param {string} rawTx - Raw transaction hex
   * @param {object[]} prevTxs - Previous transactions this transaction depends on but may not yet be in the block chain
   * @returns {Promise<string>} - Signed raw transaction
   */
  signRawTransaction = async (rawTx, prevTxs = null) => {
    const res = await this.bitcoinClient.signRawTransactionWithWallet(rawTx, prevTxs);
    if (!res.complete) {
      console.error('error signing transaction:', res.errors);
      throw new Error('error signing transaction');
    }

    return res.hex;
  };

  sendRawTransaction = async (signedTx) => this.bitcoinClient.sendRawTransaction(signedTx);

  decodeRawTransaction = async (rawTx) => this.bitcoinClient.decodeRawTransaction(rawTx);
}

module.exports = Wallet;
