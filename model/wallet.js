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
   * create a raw bitcoin transaction manually,
   * instead of using bitcoind createrawtransaction.
   * This is needed because bitcoind does not support
   * having duplicate output addresses.
   * @param {Input[]} inputs - Array of inputs
   * @param {Output[]} outputs - Input object
   * @param {string[]} inputsRawTx - Array of raw transactions
   * @returns {string} Raw transaction hex
   *
   * // Inputs and outputs arrays
   *  const inputs = [
   *    { hash: 'transactionId1', index: 0 },
   *    { hash: 'transactionId2', index: 1 }
   *  ];
   *  const outputs = [
   *    { address: address1, value: amount1 },
   *    { address: address2, value: amount2 }
   *  ];
   */
  createRawTransaction = (inputs, outputs, inputsRawTx = null) => {
    // Without this sending to taproot addresses is failing
    bitcoinjs.initEccLib(ecc);

    const { network } = this;
    const txb = new bitcoinjs.Psbt({ network });

    inputs.forEach((input, i) => {
      const x = {
        ...input,
        sequence: bitcoinjs.Transaction.DEFAULT_SEQUENCE - 2, // Enable RBF
      };

      // Add the raw transaction if it exists
      if (inputsRawTx) {
        x.nonWitnessUtxo = Buffer.from(inputsRawTx[i], 'hex');
      }

      txb.addInput(x);
    });
    outputs.forEach((output) => txb.addOutput({ ...output }));

    // Build the transaction
    const tx = txb.data.globalMap.unsignedTx.toBuffer().toString('hex');
    return tx;
  };

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

  /**
   *
   * @typedef {object} Input
   * @property {string} hash - Transaction hash
   * @property {number} index - Transaction index
   * @typedef {object} Output
   * @property {string} address - Address
   * @property {number} value - Value in satoshis
   * @param {Input[]} inputs - Array of inputs
   * @param {Output[]} outputs - Input object
   * @returns {Promise<string>} txId - Transaction id
   */
  sendCustomTransaction = async (inputs, outputs) => {
    // Create raw transaction
    const rawTx = await this.createUnsignedHexTransaction(inputs, outputs);

    // Sign raw transaction
    const signedTx = await this.signRawTransaction(rawTx);

    // Send raw transaction
    const txId = await this.sendRawTransaction(signedTx);

    return txId;
  };

  decodeRawTransaction = async (rawTx) => this.bitcoinClient.decodeRawTransaction(rawTx);
}

module.exports = Wallet;
