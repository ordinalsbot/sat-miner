const CoinbaseAPI = require('../../api/coinbase');

/**
 * Rotates funds from a Coinbase account
 */
class CoinbaseTumbler {
  /**
   * @param {CoinbaseAPI} coinbaseClient
   * @param {number} minWithdrawalAmount
   * @param {number} maxWithdrawalAmount
   * @param {string} withdrawWallet
   * @param {string} withdrawCurrency
   */
  constructor(
    coinbaseClient,
    minWithdrawalAmount,
    maxWithdrawalAmount,
    withdrawWallet,
    withdrawCurrency,
  ) {
    this.coinbaseClient = coinbaseClient;
    this.minWithdrawalAmount = minWithdrawalAmount;
    this.maxWithdrawalAmount = maxWithdrawalAmount;
    this.withdrawWallet = withdrawWallet;
    this.withdrawCurrency = withdrawCurrency;
  }

  withdrawAvailableFunds = async () => {
    const btcBalance = balance.data.find((b) => b.ccy === 'BTC').availBal;
    if (btcBalance < this.minWithdrawalAmount) {
      console.log(`insufficient funds to withdraw, account balance ${btcBalance}`);
      return false;
    }

    let withdrawalAmount = Number(btcBalance).toFixed(8);;
    if (btcBalance > this.maxWithdrawalAmount) {
      withdrawalAmount = this.maxWithdrawalAmount;
    }

    const withdrawalFees = await this.coinbaseClient.getWithdrawalFee(this.withdrawCurrency);
    let btcFee = withdrawalFees.data.find((f) => f.chain === 'BTC-Bitcoin').maxFee;
    btcFee = parseFloat(btcFee);
    withdrawalAmount -= btcFee;
    withdrawalAmount = Number(withdrawalAmount).toFixed(8);

    console.log(
      `withdrawing ${withdrawalAmount} ${this.withdrawCurrency} to wallet ${this.withdrawWallet}`,
    );

    const res = await this.coinbaseClient.withdrawFunds(
      this.withdrawCurrency,
      this.withdrawWallet,
      withdrawalAmount,
      btcFee,
    );
    console.log('response from coinbase', res);

    if (res.msg) {
      console.error('error calling coinbase api', res.msg);
      return false;
    }

    console.log('successful withdrawal from coinbase');
    return true;
  };
}

module.exports = CoinbaseTumbler;
