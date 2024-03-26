const sinon = require('sinon');
const assert = require('assert');
const KrakenAPI = require('../api/kraken');
const KrakenTumbler = require('../model/exchanges/kraken');
const NotificationService = require('../model/notifications/notificationService');

const getMockKrakenAPI = (accountBalance) => {
  const api = new KrakenAPI('', '');
  sinon.stub(api, 'getAccountBalance').resolves({
    result: {
      XXBT: accountBalance,
    },
  });
  const stubWithdrawFunds = sinon.stub(api, 'withdrawFunds').resolves({
    error: [],
    result: {
      refid: 'AGBSO6T-UFMTTQ-I7KGS6',
    },
  });

  return {
    api,
    stubWithdrawFunds,
  };
};

describe('KrakenTumbler', () => {
  let api = new KrakenAPI('', '');
  let notificationService = new NotificationService();
  let krakenTumbler = new KrakenTumbler(api, notificationService, 0.01, 1, 'test', 'XBT');

  beforeEach(() => {
    api = new KrakenAPI('', '');
    notificationService = new NotificationService();
    krakenTumbler = new KrakenTumbler(api, notificationService, 0.01, 1, 'test', 'XBT');
  });

  describe('#withdrawAvailableFunds()', () => {
    it('should not withdraw funds if balance is too low', async () => {
      const { api } = getMockKrakenAPI(0.001);
      krakenTumbler = new KrakenTumbler(api, notificationService, 0.01, 1, 'test', 'XBT');

      const res = await krakenTumbler.withdrawAvailableFunds();

      assert.ok(!res);
    });

    it('should withdraw all account funds', async () => {
      const withdrawCurrency = 'XBT';
      const withdrawWalllet = 'test';
      const accountBalance = 0.5;
      const minWithdrawalAmount = 0.01;
      const maxWithdrawalAmount = 1;
      const { api, stubWithdrawFunds } = getMockKrakenAPI(accountBalance);

      krakenTumbler = new KrakenTumbler(api, notificationService, minWithdrawalAmount, maxWithdrawalAmount, withdrawWalllet, withdrawCurrency);

      const res = await krakenTumbler.withdrawAvailableFunds();

      assert.ok(res);
      assert(stubWithdrawFunds.calledWith(withdrawCurrency, withdrawWalllet, accountBalance));
    });

    it('should not withdraw more than the maximum amount', async () => {
      const withdrawCurrency = 'XBT';
      const withdrawWalllet = 'test';
      const accountBalance = 10;
      const minWithdrawalAmount = 0.01;
      const maxWithdrawalAmount = 1;
      const { api, stubWithdrawFunds } = getMockKrakenAPI(accountBalance);

      krakenTumbler = new KrakenTumbler(api, notificationService, minWithdrawalAmount, maxWithdrawalAmount, withdrawWalllet, withdrawCurrency);
      const res = await krakenTumbler.withdrawAvailableFunds();

      assert.ok(res);
      assert(stubWithdrawFunds.calledWith(withdrawCurrency, withdrawWalllet, maxWithdrawalAmount));
    });
  });
});
