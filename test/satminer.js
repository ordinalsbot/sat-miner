const sinon = require('sinon');
const assert = require('assert');
const Satminer = require('../model/satminer');
const { Satscanner, Satextractor } = require('ordinalsbot');
const Wallet = require('../model/wallet');
const MempoolApi = require('../api/mempool');
const NotificationService = require('../model/notifications/notificationService');

describe('Satminer', () => {
  const addressReceiveRareSats = 'receive_rare_sats';
  const addressReceiveCommonSats = 'receive_common_sats';
  const tumblerAddress = 'tumbleraddr';
  let satscanner = new Satscanner();
  let satextractor = new Satextractor();
  let mempoolApi = new MempoolApi();
  let wallet = new Wallet();
  let notifications = new NotificationService();
  let satminer = new Satminer(wallet, satscanner, satextractor, tumblerAddress, addressReceiveRareSats, addressReceiveCommonSats, null, null, notifications);

  beforeEach(() => {
    mempoolApi = new MempoolApi();
    wallet = new Wallet(mempoolApi);
    satscanner = new Satscanner();
    satextractor = new Satextractor();
    notifications = new NotificationService();
    satminer = new Satminer(wallet, satscanner, satextractor, tumblerAddress, addressReceiveRareSats, addressReceiveCommonSats, null, null, notifications);
  });

  describe('#extractSatsAndRotateFunds()', () => {
    it('should send rare sats to inventory wallet', async () => {
      const mockSatExtractorApiResponse = {
        "specialRanges": [
            {
                start: 280810779975733,
                output: "826fe75c2e9d567baa6bee11160ae265b3007814ecca79299c5bd8338298b5d5:0",
                size: 1,
                offset: 0,
                satributes: [
                    "pizza"
                ]
            }
        ],
        tx: "0200000001d5b5988233d85b9c2979caec147800b365e20a1611ee6baa7b569d2e5ce76f820000000000fdffffff02220200000000000022512044ddb479c1fe1e5c6ca9c2d1b477fcf7eb024e57f5aee10f2507f0c450c47da85c1100000000000016001402b3df8c029274deabfac0ace62f9fddae7dbfca00000000"
      };
      const fastestFee = 20;
      const mockFeeEst = {
        fastestFee,
        halfHourFee: 20,
        hourFee: 15,
        economyFee: 10,
        minimumFee: 8,
      };
      const stubExtract = sinon.stub(satextractor, 'extract').resolves(mockSatExtractorApiResponse);

      const txid = 'sometxid';
      sinon.stub(wallet, 'estimateFee').resolves(mockFeeEst);
      const sendTxSpy = sinon.stub(wallet, 'sendRawTransaction').resolves(txid);
      const decodeRawTxSpy = sinon.stub(wallet, 'decodeRawTransaction').resolves({ vout: [{ scriptPubKey: { address: addressReceiveCommonSats } }, { scriptPubKey: { address: addressReceiveRareSats } }] });
      const signRawTxSpy = sinon.stub(wallet, 'signRawTransaction').resolves('signedtx');
      const notificationSpy = sinon.stub(notifications, 'sendMessage').resolves(true);

      const res = await satminer.extractSatsAndRotateFunds();

      assert.strictEqual(res, txid);
      assert(stubExtract.calledOnce);
      assert(stubExtract.calledWith({
        scanAddress: tumblerAddress,
        addressToSendSpecialSats: addressReceiveRareSats,
        addressToSendCommonSats: addressReceiveCommonSats,
        feePerByte: mockFeeEst.fastestFee,
      }));
      assert(decodeRawTxSpy.calledOnce);
      assert(decodeRawTxSpy.calledWith(mockSatExtractorApiResponse.tx));
      assert(signRawTxSpy.calledOnce);
      assert(signRawTxSpy.calledWith(mockSatExtractorApiResponse.tx));
      assert(sendTxSpy.calledOnce);
      assert(sendTxSpy.calledWith('signedtx'));
      assert(notificationSpy.calledWith('found and extracted special ranges in sometxid\n1 x pizza'));
    });

    it('should filter out pizza ranges', async () => {
      const mockSatExtractorApiResponse = {
        "specialRanges": [
        ],
        tx: "0200000001d5b5988233d85b9c2979caec147800b365e20a1611ee6baa7b569d2e5ce76f820000000000fdffffff011f1700000000000016001402b3df8c029274deabfac0ace62f9fddae7dbfca00000000"
      };
      const fastestFee = 20;
      const mockFeeEst = {
        fastestFee,
        halfHourFee: 20,
        hourFee: 15,
        economyFee: 10,
        minimumFee: 8,
      };

      const txid = 'sometxid';
      sinon.stub(wallet, 'estimateFee').resolves(mockFeeEst);
      const stubExtract = sinon.stub(satextractor, 'extract').resolves(mockSatExtractorApiResponse);
      const sendTxSpy = sinon.stub(wallet, 'sendRawTransaction').resolves(txid);
      const decodeRawTxSpy = sinon.stub(wallet, 'decodeRawTransaction').resolves({ vout: [{ scriptPubKey: { address: addressReceiveCommonSats, value: 0.1 } }] });
      const signRawTxSpy = sinon.stub(wallet, 'signRawTransaction').resolves('signedtx');
      const notificationSpy = sinon.stub(notifications, 'sendMessage').resolves(true);

      const walletBalance = 1;
      const confirmationTargetBlocks = 2;
      sinon.stub(wallet, 'getBalance').resolves(walletBalance);
      
      satminer = new Satminer(
        wallet,
        satscanner,
        satextractor,
        tumblerAddress,
        addressReceiveRareSats,
        addressReceiveCommonSats,
        confirmationTargetBlocks,
        null,
        notifications,
        ['uncommon'],
      );
      const res = await satminer.extractSatsAndRotateFunds();

      assert.strictEqual(res, txid);
      assert(stubExtract.calledOnce);
      assert(stubExtract.calledWith({
        scanAddress: tumblerAddress,
        addressToSendSpecialSats: addressReceiveRareSats,
        addressToSendCommonSats: addressReceiveCommonSats,
        feePerByte: mockFeeEst.fastestFee,
        filterSatributes: ['uncommon'],
      }));
      assert(decodeRawTxSpy.calledOnce);
      assert(decodeRawTxSpy.calledWith(mockSatExtractorApiResponse.tx));
      assert(signRawTxSpy.calledOnce);
      assert(signRawTxSpy.calledWith(mockSatExtractorApiResponse.tx));
      assert(sendTxSpy.calledOnce);
      assert(sendTxSpy.calledWith('signedtx'));
      assert(notificationSpy.calledTwice);
    });

    it('should send common sats to exchange wallet', async () => {
      const scanner = new Satscanner();
      const mockSatExtractorApiResponse = {
        "specialRanges": [
        ],
        tx: "0200000001d5b5988233d85b9c2979caec147800b365e20a1611ee6baa7b569d2e5ce76f820000000000fdffffff011f1700000000000016001402b3df8c029274deabfac0ace62f9fddae7dbfca00000000"
      };
      const fastestFee = 20;
      const mockFeeEst = {
        fastestFee,
        halfHourFee: 20,
        hourFee: 15,
        economyFee: 10,
        minimumFee: 8,
      };

      const mockMempoolApi = new MempoolApi();
      sinon.stub(mockMempoolApi, 'getFeeEstimation').resolves(mockFeeEst);

      const minDepositAmount = 0.005;
      const txid = 'sometxid';
      const inventoryWallet = 'inventorywalletaddr';
      const krakenDepoAddr = 'krakendepoaddr';
      const walletBalance = 1;
      const confirmationTargetBlocks = 2;
      const mockWallet = new Wallet(null, mockMempoolApi);
      sinon.stub(mockWallet, 'getBalance').resolves(walletBalance);
      const stubExtract = sinon.stub(satextractor, 'extract').resolves(mockSatExtractorApiResponse);
      const sendTxSpy = sinon.stub(mockWallet, 'sendRawTransaction').resolves(txid);
      const decodeRawTxSpy = sinon.stub(mockWallet, 'decodeRawTransaction').resolves({ vout: [{ scriptPubKey: { address: krakenDepoAddr, value: 0.1 } }] });
      const signRawTxSpy = sinon.stub(mockWallet, 'signRawTransaction').resolves('signedtx');
      const notificationSpy = sinon.stub(notifications, 'sendMessage').resolves(true);

      satminer = new Satminer(
        mockWallet,
        scanner,
        satextractor,
        tumblerAddress,
        inventoryWallet,
        krakenDepoAddr,
        confirmationTargetBlocks,
        minDepositAmount,
        notifications,
      );

      const res = await satminer.extractSatsAndRotateFunds();
      assert.strictEqual(res, txid);
      assert(stubExtract.calledOnce);
      assert(stubExtract.calledWith({
        scanAddress: tumblerAddress,
        addressToSendSpecialSats: inventoryWallet,
        addressToSendCommonSats: krakenDepoAddr,
        feePerByte: mockFeeEst.fastestFee,
      }));
      assert(decodeRawTxSpy.calledOnce);
      assert(decodeRawTxSpy.calledWith(mockSatExtractorApiResponse.tx));
      assert(signRawTxSpy.calledOnce);
      assert(signRawTxSpy.calledWith(mockSatExtractorApiResponse.tx));
      assert(sendTxSpy.calledOnce);
      assert(sendTxSpy.calledWith('signedtx'));
      assert(notificationSpy.calledTwice);
    });

    it('should throw if common sats sent to exchange wallet if below min deposit amount', async () => {
      const scanner = new Satscanner();
      const mockSatExtractorApiResponse = {
        "specialRanges": [
        ],
        tx: "0200000001d5b5988233d85b9c2979caec147800b365e20a1611ee6baa7b569d2e5ce76f820000000000fdffffff011f1700000000000016001402b3df8c029274deabfac0ace62f9fddae7dbfca00000000"
      };
      const fastestFee = 20;
      const mockFeeEst = {
        fastestFee,
        halfHourFee: 20,
        hourFee: 15,
        economyFee: 10,
        minimumFee: 8,
      };

      const mockMempoolApi = new MempoolApi();
      sinon.stub(mockMempoolApi, 'getFeeEstimation').resolves(mockFeeEst);

      const minDepositAmount = 0.005;
      const txid = 'sometxid';
      const inventoryWallet = 'inventorywalletaddr';
      const krakenDepoAddr = 'krakendepoaddr';
      const walletBalance = 1;
      const confirmationTargetBlocks = 2;
      const mockWallet = new Wallet(null, mockMempoolApi);
      sinon.stub(mockWallet, 'getBalance').resolves(walletBalance);
      const stubExtract = sinon.stub(satextractor, 'extract').resolves(mockSatExtractorApiResponse);
      const sendTxSpy = sinon.stub(mockWallet, 'sendRawTransaction').resolves(txid);
      const decodeRawTxSpy = sinon.stub(mockWallet, 'decodeRawTransaction').resolves({ vout: [{ scriptPubKey: { address: krakenDepoAddr, value: 0.004 } }] });
      const signRawTxSpy = sinon.stub(mockWallet, 'signRawTransaction').resolves('signedtx');
      const notificationSpy = sinon.stub(notifications, 'sendMessage').resolves(true);

      satminer = new Satminer(
        mockWallet,
        scanner,
        satextractor,
        tumblerAddress,
        inventoryWallet,
        krakenDepoAddr,
        confirmationTargetBlocks,
        minDepositAmount,
        notifications,
      );

      await assert.rejects(async () => satminer.extractSatsAndRotateFunds(), { message: 'deposit amount is less than minDepositAmount' });

      assert(stubExtract.calledOnce);
      assert(stubExtract.calledWith({
        scanAddress: tumblerAddress,
        addressToSendSpecialSats: inventoryWallet,
        addressToSendCommonSats: krakenDepoAddr,
        feePerByte: mockFeeEst.fastestFee,
      }));
      assert(decodeRawTxSpy.calledOnce);
      assert(decodeRawTxSpy.calledWith(mockSatExtractorApiResponse.tx));
      assert(signRawTxSpy.notCalled);
      assert(signRawTxSpy.notCalled);
      assert(sendTxSpy.notCalled);
      assert(sendTxSpy.notCalled);
      assert(notificationSpy.calledTwice);
    });

    it('should throw if any funds go to non-user controlled addresses', async () => {
      const scanner = new Satscanner();
      const mockSatExtractorApiResponse = {
        "specialRanges": [
        ],
        tx: "0200000001d5b5988233d85b9c2979caec147800b365e20a1611ee6baa7b569d2e5ce76f820000000000fdffffff011f1700000000000016001402b3df8c029274deabfac0ace62f9fddae7dbfca00000000"
      };
      const fastestFee = 20;
      const mockFeeEst = {
        fastestFee,
        halfHourFee: 20,
        hourFee: 15,
        economyFee: 10,
        minimumFee: 8,
      };

      const mockMempoolApi = new MempoolApi();
      sinon.stub(mockMempoolApi, 'getFeeEstimation').resolves(mockFeeEst);

      const minDepositAmount = 0.005;
      const txid = 'sometxid';
      const inventoryWallet = 'inventorywalletaddr';
      const krakenDepoAddr = 'krakendepoaddr';
      const randomAddress = 'some_random_address';
      const walletBalance = 1;
      const confirmationTargetBlocks = 2;
      const mockWallet = new Wallet(null, mockMempoolApi);
      sinon.stub(mockWallet, 'getBalance').resolves(walletBalance);
      const stubExtract = sinon.stub(satextractor, 'extract').resolves(mockSatExtractorApiResponse);
      const sendTxSpy = sinon.stub(mockWallet, 'sendRawTransaction').resolves(txid);
      const decodeRawTxSpy = sinon.stub(mockWallet, 'decodeRawTransaction').resolves({ vout: [{ scriptPubKey: { address: randomAddress, value: 0.01 }}, { scriptPubKey: { address: krakenDepoAddr, value: 0.02 }} ] });
      const signRawTxSpy = sinon.stub(mockWallet, 'signRawTransaction').resolves('signedtx');
      const notificationSpy = sinon.stub(notifications, 'sendMessage').resolves(true);

      satminer = new Satminer(
        mockWallet,
        scanner,
        satextractor,
        tumblerAddress,
        inventoryWallet,
        krakenDepoAddr,
        confirmationTargetBlocks,
        minDepositAmount,
        notifications,
      );

      await assert.rejects(async () => satminer.extractSatsAndRotateFunds(), { message: 'not all outputs are user-controlled' });

      assert(stubExtract.calledOnce);
      assert(stubExtract.calledWith({
        scanAddress: tumblerAddress,
        addressToSendSpecialSats: inventoryWallet,
        addressToSendCommonSats: krakenDepoAddr,
        feePerByte: mockFeeEst.fastestFee,
      }));
      assert(decodeRawTxSpy.calledOnce);
      assert(decodeRawTxSpy.calledWith(mockSatExtractorApiResponse.tx));
      assert(signRawTxSpy.notCalled);
      assert(signRawTxSpy.notCalled);
      assert(sendTxSpy.notCalled);
      assert(sendTxSpy.notCalled);
      assert(notificationSpy.calledTwice);
    });

    it('should finish quietly when address is empty', async () => {
      const mockSatExtractorApiResponse = { 
        specialRanges: [], 
        tx: null, 
        message: 'Address is empty' ,
      };
      const fastestFee = 99;
      const mockFeeEst = {
        fastestFee,
        halfHourFee: 20,
        hourFee: 15,
        economyFee: 10,
        minimumFee: 8,
      };

      sinon.stub(wallet, 'estimateFee').resolves(mockFeeEst);
      const stubExtract = sinon.stub(satextractor, 'extract').resolves(mockSatExtractorApiResponse);
      const sendTxSpy = sinon.stub(wallet, 'sendRawTransaction').resolves('txid');
      const decodeRawTxSpy = sinon.stub(wallet, 'decodeRawTransaction').resolves({ vout: [{ scriptPubKey: { address: tumblerAddress } }] });
      const signRawTxSpy = sinon.stub(wallet, 'signRawTransaction').resolves('signedtx');

      const spySlack = sinon.spy(notifications, 'sendMessage');

      const res = await satminer.extractSatsAndRotateFunds();

      assert(stubExtract.calledOnce);
      assert(spySlack.notCalled);
      assert(decodeRawTxSpy.notCalled);
      assert(signRawTxSpy.notCalled);
      assert(sendTxSpy.notCalled);
      assert(!res);
    });

    it('should throw mempool fee is exceptionally high', async () => {
      const mockSatExtractorApiResponse = {
        "specialRanges": [
        ],
        tx: "0200000001d5b5988233d85b9c2979caec147800b365e20a1611ee6baa7b569d2e5ce76f820000000000fdffffff011f1700000000000016001402b3df8c029274deabfac0ace62f9fddae7dbfca00000000"
      };
      const fastestFee = 1500;
      const mockFeeEst = {
        fastestFee,
        halfHourFee: 20,
        hourFee: 15,
        economyFee: 10,
        minimumFee: 8,
      };

      const mockMempoolApi = new MempoolApi();
      sinon.stub(mockMempoolApi, 'getFeeEstimation').resolves(mockFeeEst);
      const notificationSpy = sinon.stub(notifications, 'sendMessage').resolves(true);

      const scanner = new Satscanner();

      const minDepositAmount = 0.005;
      const tumblerAddress = 'tumbleraddr';
      const inventoryWallet = 'inventorywalletaddr';
      const krakenDepoAddr = 'krakendepoaddr';
      const mockWallet = new Wallet(null, mockMempoolApi);
      const satminer = new Satminer(
        mockWallet, 
        scanner, 
        satextractor, 
        tumblerAddress, 
        inventoryWallet, 
        krakenDepoAddr, 
        null, 
        minDepositAmount,
        notifications,
      );

      await assert.rejects(async () => satminer.extractSatsAndRotateFunds(), { message: 'fee higher than max allowed 1000' });
      assert(notificationSpy.calledOnce);
    });
  });

  describe('#sendFundsBackToExchnage()', () => {
    const confTarget = 1;
    const minDepositAmount = 0.00015;

    beforeEach(() => {
      satminer = new Satminer(
        wallet,
        null,
        null,
        null,
        addressReceiveRareSats,
        addressReceiveCommonSats,
        0,
        confTarget,
        minDepositAmount,
      );
    });

    it('should not send funds if wallet balance is too low', async () => {
      const walletBalance = 0.00001;
      sinon.stub(wallet, 'getBalance').resolves(walletBalance);
      const res = await satminer.checkLocalBalance();
      assert(!res);
    });
  });

  describe('#specialRangesSummary()', () => {
    it('should extract special sats summary', () => {
      const specialRanges = [
        {
          output: 'b69a64b2e8feebae77e4a67b908392c7cfc5c648e55e1949d3187c1c1b5e95e7:1',
          start: 1096735000000000,
          size: 20000,
          satributes: [
            'uncommon',
          ],
        },
        {
          output: 'c87146f7ffbd127c8daa7259f66f578a92eee5f4ed8afe690bb81e0c8de28092:1',
          start: 1681220000000000,
          size: 200000,
          satributes: [
            'uncommon',
          ],
        },
        {
          output: '4d0fc9a7afbcd0ff2c5a2e3091114e2dbbe23e6e737729dee3c975aadbef2b91:1',
          start: 2451780871542,
          size: 546,
          satributes: [
            'vintage',
            'number-palindrome',
          ],
        },
      ];

      const summary = satminer.specialRangesSummary(specialRanges);

      assert.equal(summary, '20000 x uncommon\n200000 x uncommon\n546 x vintage, number-palindrome');
    });
  });

  describe('#getSpecialSatSendAddress()', () => {
    beforeEach(() => {
      const customRareSatWallets = [
        {
          address: 'addr_uncommon',
          type: 'uncommon',
        },
        {
          address: 'addr_block9',
          type: 'block-9',
        },
        {
          address: 'addr_vintage',
          type: 'vintage',
        },
        {
          address: 'addr_pizza',
          type: 'pizza',
        },
      ];
      satminer = new Satminer(wallet, satscanner, satextractor, tumblerAddress, addressReceiveCommonSats, addressReceiveCommonSats, null, null, null, null, customRareSatWallets);
    });
    it('should get the address correctly', () => {
      const tt = [
        [['pizza'], 'addr_pizza'],
        [['uncommon'], 'addr_uncommon'],
        [['pizza', 'uncommon'], 'addr_uncommon'],
        [['uncommon', 'pizza'], 'addr_uncommon'],
        [['vintage', 'block-9'], 'addr_block9'],
        [['vintage'], 'addr_vintage'],
      ];

      tt.forEach(([sattributes, expectedAddress]) => {
        const address = satminer.getSpecialSatSendAddress(sattributes);
        assert.equal(address, expectedAddress);
      });
    });
  });
});
