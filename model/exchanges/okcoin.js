const OkcoinAPI = require('../../api/okcoin');

/**
 * Rotates funds from a Okcoin account
 */
class OkcoinTumbler {
  /**
   * @param {OkcoinAPI} okcoinClient
   * @param {number} minWithdrawalAmount
   * @param {number} maxWithdrawalAmount
   * @param {string} withdrawWallet
   * @param {string} withdrawCurrency
   */
  constructor(
    okcoinClient,
    minWithdrawalAmount,
    maxWithdrawalAmount,
    withdrawWallet,
    withdrawCurrency,
  ) {
    this.okcoinClient = okcoinClient;
    this.minWithdrawalAmount = minWithdrawalAmount;
    this.maxWithdrawalAmount = maxWithdrawalAmount;
    this.withdrawWallet = withdrawWallet;
    this.withdrawCurrency = withdrawCurrency;
  }

  withdrawAvailableFunds = async () => {
    const balance = await this.okcoinClient.getAccountBalance();

    const btcBalance = balance.data.find((b) => b.ccy === 'BTC').availBal;
    if (btcBalance < this.minWithdrawalAmount) {
      console.log(`insufficient funds to withdraw, account balance ${btcBalance}`);
      return false;
    }

    let withdrawalAmount = Number(btcBalance).toFixed(8);;
    if (btcBalance > this.maxWithdrawalAmount) {
      withdrawalAmount = this.maxWithdrawalAmount;
    }

    const withdrawalFees = await this.okcoinClient.getWithdrawalFee(this.withdrawCurrency);
    let btcFee = withdrawalFees.data.find((f) => f.chain === 'BTC-Bitcoin').maxFee;
    btcFee = parseFloat(btcFee);
    withdrawalAmount -= btcFee;
    withdrawalAmount = Number(withdrawalAmount).toFixed(8);

    console.log(
      `withdrawing ${withdrawalAmount} ${this.withdrawCurrency} to wallet ${this.withdrawWallet}`,
    );

    const res = await this.okcoinClient.withdrawFunds(
      this.withdrawCurrency,
      this.withdrawWallet,
      withdrawalAmount,
      btcFee,
    );
    console.log('response from okcoin', res);

    if (res.msg) {
      console.error('error calling okcoin api', res.msg);
      return false;
    }

    console.log('succeful withdrawal from okcoin', res.result);
    return true;
  };
}

module.exports = OkcoinTumbler;
