const { Satscanner, Satextractor } = require('ordinalsbot');
const Wallet = require('./wallet');
const NotificationService = require('./notifications/notificationService');

class Satminer {
  /**
   * @typedef {object} RareSatWallet
   * @property {string} address - the address of the wallet
   * @property {string} type - the type of the rare sat
   */

  /**
   * @param {Wallet} wallet - the bitcoin wallet
   * @param {Satscanner} satScannerClient - the sat scanner client
   * @param {Satextractor} satExtractorClient - the sat extractor client
   * @param {string} tumblerAddress - where we check if we have received rare sats
   * @param {string} addressSpecialSats - forward only the rare sats here, this is the default wallet
   * @param {string} addressCommonSats - the deposit address for the exchange account
   * @param {number} feePerByte - the transaction fee in sats for sending out rare sats
   * @param {number} sweepConfirmationTargetBlocks - confirmation target for sweeping the wallet back to the exchnage account
   * @param {number} minDepositAmount - minimum amount needed to send a deposit to exchange account
   * @param {NotificationService} notificationService - notification service for sending updates
   * @param {string[]} includeSatributes - array of satributes to include for extraction
   * @param {RareSatWallet[]} customRareSatsWallets - array of custom rare sats wallets ranked by priority
   */
  constructor(
    wallet,
    satScannerClient,
    satExtractorClient,
    tumblerAddress,
    addressSpecialSats,
    addressCommonSats,
    sweepConfirmationTargetBlocks = 1,
    minDepositAmount = 0.00015,
    notificationService = null,
    includeSatributes = null,
    customRareSatsWallets = [],
  ) {
    this.wallet = wallet;
    this.satScannerClient = satScannerClient;
    this.satExtractorClient = satExtractorClient;
    this.tumblerAddress = tumblerAddress;
    this.addressSpecialSats = addressSpecialSats;
    this.addressCommonSats = addressCommonSats;
    this.sweepConfirmationTargetBlocks = sweepConfirmationTargetBlocks;
    this.minDepositAmount = minDepositAmount;
    this.notificationService = notificationService;
    this.includeSatributes = includeSatributes;
    this.customRareSatsWallets = customRareSatsWallets;
    this.maxFeeAllowed = 1000;
    this.dustLimit = 546;

    if (!this.addressSpecialSats) {
      throw new Error('special sats wallet is required');
    }

    if (!this.addressCommonSats) {
      throw new Error('common sats address is required');
    }

    // array of user-controlled addresses for safety checks
    this.userControlledAddresses = [
      this.tumblerAddress,
      this.addressCommonSats,
      this.addressSpecialSats,
      ...this.customRareSatsWallets.map((wallet) => wallet.address),
    ];
  }

  /**
   * @typedef {object} Range
   * @property {string} output - the utxo
   * @property {number} start - the start of the range
   * @property {number} end - the end of the range
   * @property {number} size - the size of the range
   */

  /**
   * @typedef {object} SpecialRange
   * @property {string} output - the utxo
   * @property {number} start - the start of the range
   * @property {number} end - the end of the range
   * @property {number} size - the size of the range
   * @property {number} offset - the offset of the range
   * @property {string[]} satributes - the satributes of the range
   */

  /**
   * @typedef {object} Input
   * @property {string} hash - Transaction hash
   * @property {number} index - Transaction index
   * @typedef {object} Output
   * @property {string} address - Address
   * @property {number} value - Value in satoshis
   * /

  /**
   * Go trough the custom send addresses for the rare sats and find the right wallet.
   * The custom wallets are ranked by priority: the first one that matches the satribute is used.
   * If no custom wallet is found, the inventory wallet is used
   * @param {string[]} satributes - the array of satributes
   * @returns {string} - the address of the wallet
   */
  getSpecialSatSendAddress = (satributes) => {
    for (const wallet of this.customRareSatsWallets) {
      for (const satribute of satributes) {
        if (wallet.type === satribute) {
          return wallet.address;
        }
      }
    }

    return this.addressSpecialSats;
  };

  checkLocalBalance = async () => {
    const totalAmount = await this.wallet.getBalance('*', 1);
    if (totalAmount < this.minDepositAmount) {
      console.log('wallet balance too low');
      return false;
    }
  };

  specialRangesSummary = (specialRanges) => specialRanges.map((range) => `${range.size} x ${range.satributes.join(', ')}`).join('\n');

  extractSatsAndRotateFunds = async () => {
    console.log('scanning for rare sats...');
    this.notificationService.sendMessage(`starting a new cycle.`, 'verbose');

    const fees = await this.wallet.estimateFee();
    const { fastestFee } = fees;
    if (fastestFee > this.maxFeeAllowed) {
      this.notificationService.sendMessage(`stopped: fee higher than max allowed ${this.maxFeeAllowed}`, 'verbose');
      throw new Error(`fee higher than max allowed ${this.maxFeeAllowed}`);
    }

    const satextractorParams = {
      scanAddress: this.tumblerAddress,
      addressToSendSpecialSats: this.addressSpecialSats,
      addressToSendCommonSats: this.addressCommonSats,
      feePerByte: fastestFee,
    };

    if (this.includeSatributes) {
      satextractorParams.filterSatributes = this.includeSatributes;
    }

    console.log('satextractorParams', satextractorParams)
    const satextractorRes = await this.satExtractorClient.extract(satextractorParams);
    console.log('satextractorRes', satextractorRes);
    const { specialRanges, tx, message } = satextractorRes;

    if (message && message.includes('Address is empty')) {
      this.notificationService.sendMessage(`${this.tumblerAddress} is currently empty.`, 'verbose');
      console.log('tumbler wallet is empty');
      return false;
    } else if (specialRanges.length === 0) {
      this.notificationService.sendMessage('no special sats found, sending funds back to exchange', 'verbose');
      console.log('no special sats found, sending funds back to exchange');
      await this.checkLocalBalance();
    }

    // decode tx and check that all outputs are going to user-controlled addresses
    const decodedTransaction = await this.wallet.decodeRawTransaction(tx);
    console.log('decodedTransaction', JSON.stringify(decodedTransaction));
    const outputsNok = decodedTransaction.vout.find((output) => !this.userControlledAddresses.includes(output.scriptPubKey.address));
    console.log('outputsNok', outputsNok, this.userControlledAddresses);
    if (outputsNok) {
      this.notificationService.sendMessage('stopped: not all outputs are user-controlled', 'verbose');
      throw new Error('not all outputs are user-controlled');
    }

    // check that what we are depositing to exchange is more than minDepositAmount
    const exchangeOutput = decodedTransaction.vout.find((output) => output.scriptPubKey.address === this.addressCommonSats);
    if (exchangeOutput.scriptPubKey.value < this.minDepositAmount) {
      this.notificationService.sendMessage('stopped: deposit amount is less than minDepositAmount', 'verbose');
      throw new Error('deposit amount is less than minDepositAmount');
    }

    const signedTx = await this.wallet.signRawTransaction(tx);
    const txid = await this.wallet.sendRawTransaction(signedTx);
    console.log('sent txid', txid);
    this.notificationService.sendMessage(`end of cycle. sent txid: ${txid}`, 'verbose');

    if (specialRanges.length > 0) {
      const rangeSummary = this.specialRangesSummary(specialRanges);
      this.notificationService.sendMessage(`found and extracted special ranges in ${txid}\n${rangeSummary}`);
    }

    return txid;
  };
}

module.exports = Satminer;
