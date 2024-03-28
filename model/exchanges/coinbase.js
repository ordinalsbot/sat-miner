const CoinbaseAPI = require('../../api/coinbase');
const NotificationService = require('../notifications/notificationService');

/**
 * Rotates funds from a Coinbase account
 */
class CoinbaseTumbler {
  /**
   * @param {CoinbaseAPI} coinbaseClient
   * @param {NotificationService} notificationService
   * @param {number} minWithdrawalAmount
   * @param {number} maxWithdrawalAmount
   * @param {string} withdrawWallet
   * @param {string} withdrawCurrency
   */
  constructor(
    coinbaseClient,
    notificationService,
    minWithdrawalAmount,
    maxWithdrawalAmount,
    withdrawWallet,
    withdrawCurrency,
  ) {
    this.coinbaseClient = coinbaseClient;
    this.notificationService = notificationService;
    this.minWithdrawalAmount = minWithdrawalAmount;
    this.maxWithdrawalAmount = maxWithdrawalAmount;
    this.withdrawWallet = withdrawWallet;
    this.withdrawCurrency = withdrawCurrency;
  }

  withdrawAvailableFunds = async () => {
    const balance = await this.coinbaseClient.getAccountBalance();

    const btcBalance = balance.data.balance.amount;
    if (btcBalance < this.minWithdrawalAmount) {
      console.log(`insufficient funds to withdraw, account balance ${btcBalance}`);
      return false;
    }

    let withdrawalAmount = Number(btcBalance).toFixed(8);;
    if (btcBalance > this.maxWithdrawalAmount) {
      withdrawalAmount = this.maxWithdrawalAmount;
    }
    // deduct some random fee
    withdrawalAmount -= 0.001;
    withdrawalAmount = Number(withdrawalAmount).toFixed(8);

    console.log(
      `withdrawing ${withdrawalAmount} ${this.withdrawCurrency} to wallet ${this.withdrawWallet}`,
    );

    const res = await this.coinbaseClient.withdrawFunds(
      `${withdrawalAmount}`,
      this.withdrawCurrency,
      this.withdrawWallet,
    );

    if (!res.data?.id) {
      this.notificationService.sendMessage('stopped: error calling coinbase api', 'verbose');
      console.error('error calling coinbase api', res);
      return false;
    }

    console.log('successful withdrawal from coinbase');
    this.notificationService.sendMessage(`successful withdrawal ${withdrawalAmount} ${this.withdrawCurrency} to wallet ${this.withdrawWallet}`, 'verbose');
    return true;
  };
}

module.exports = CoinbaseTumbler;
