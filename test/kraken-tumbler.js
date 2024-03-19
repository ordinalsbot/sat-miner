const sinon = require('sinon');
const assert = require('assert');
const KrakenAPI = require('../api/kraken');
const KrakenTumbler = require('../model/exchanges/kraken');

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
  describe('#withdrawAvailableFunds()', () => {
    it('should not withdraw funds if balance is too low', async () => {
      const { api } = getMockKrakenAPI(0.001);
      const krakenTumbler = new KrakenTumbler(api, 0.01, 1, 'test', 'XBT');

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

      const krakenTumbler = new KrakenTumbler(api, minWithdrawalAmount, maxWithdrawalAmount, withdrawWalllet, withdrawCurrency);

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

      const krakenTumbler = new KrakenTumbler(api, minWithdrawalAmount, maxWithdrawalAmount, withdrawWalllet, withdrawCurrency);
      const res = await krakenTumbler.withdrawAvailableFunds();

      assert.ok(res);
      assert(stubWithdrawFunds.calledWith(withdrawCurrency, withdrawWalllet, maxWithdrawalAmount));
    });
  });
});
