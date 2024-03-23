const KrakenAPI = require('../../api/kraken');

/**
 * Rotates funds from a Kraken account
 */
class KrakenTumbler {
  /**
   * @param {KrakenAPI} krakenClient
   * @param {number} minWithdrawalAmount
   * @param {number} maxWithdrawalAmount
   * @param {string} withdrawWallet
   * @param {string} withdrawCurrency
   */
  constructor(
    krakenClient,
    minWithdrawalAmount,
    maxWithdrawalAmount,
    withdrawWallet,
    withdrawCurrency,
  ) {
    this.krakenClient = krakenClient;
    this.minWithdrawalAmount = minWithdrawalAmount;
    this.maxWithdrawalAmount = maxWithdrawalAmount;
    this.withdrawWallet = withdrawWallet;
    this.withdrawCurrency = withdrawCurrency;
  }

  withdrawAvailableFunds = async () => {
    const balance = await this.krakenClient.getAccountBalance();

    const btcBalance = balance.result.XXBT;
    if (btcBalance < this.minWithdrawalAmount) {
      console.log(`insufficient funds to withdraw, account balance ${btcBalance}`);
      return false;
    }

    let withdrawalAmount = btcBalance;
    if (btcBalance > this.maxWithdrawalAmount) {
      withdrawalAmount = this.maxWithdrawalAmount;
    }

    console.log(
      `withdrawing ${withdrawalAmount} ${this.withdrawCurrency} from wallet ${this.withdrawWallet}`,
    );

    const res = await this.krakenClient.withdrawFunds(
      this.withdrawCurrency,
      this.withdrawWallet,
      withdrawalAmount,
    );
    if (res.error.length > 0) {
      this.notificationService.sendMessage('stopped: error calling kraken api', 'verbose');
      console.error('error calling kraken api', res.error);
      return false;
    }

    this.notificationService.sendMessage(`successful withdrawal ${withdrawalAmount} ${this.withdrawCurrency} to wallet ${this.withdrawWallet}`, 'verbose');
    console.log('succeful withdrawal from kraken', res.result);

    return true;
  };
}

module.exports = KrakenTumbler;
