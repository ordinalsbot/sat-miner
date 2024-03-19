const assert = require('assert');
const bitcoinjs = require('bitcoinjs-lib');
const BitcoinClient = require('bitcoin-core');
const sinon = require('sinon');
const Wallet = require('../model/wallet');

describe('Wallet', () => {
  describe('#createRawTransaction()', () => {
    it('should build a raw transaction', () => {
      const inputs = [
        {
          hash: 'b69a64b2e8feebae77e4a67b908392c7cfc5c648e55e1949d3187c1c1b5e95e7',
          index: 1,
        },
        {
          hash: 'c87146f7ffbd127c8daa7259f66f578a92eee5f4ed8afe690bb81e0c8de28092',
          index: 1,
        },
        {
          hash: '4d0fc9a7afbcd0ff2c5a2e3091114e2dbbe23e6e737729dee3c975aadbef2b91',
          index: 1,
        },
        {
          hash: '9217167d96de3cb45dc1b79f358901de3ad1778c7d6858cd03942fc59f92590c',
          index: 0,
        },
      ];
      const outputs = [
        {
          address: 'bc1qkz6m0ynel5y8ra9x8vqf04v75ayweavwm9l5k5',
          value: 40546,
        },
        {
          address: '3LA964JzvWFDH9kG9uTZBHA7CZgPUB6doi',
          value: 1007453,
        },
      ];
      const inputsRaw = [
        '0200000000010131ee2bd58aef2d83580c1d3ff198e9dadf38d5559c1c286e9776aad25826d6de0000000000ffffffff04415a041900000000160014e3a61181dd569c0250f828b393839d81517c78cd204e0000000000002251203cfada579a653ed7efbbd325eed4f54733a8630e5ffa6e1e5f0d28eb7cada0d2afab580400000000160014e3a61181dd569c0250f828b393839d81517c78cd6842000000000000225120cc8a60669be807a976f45c629b396cdfdaf2a6f970b65aba5d91f5a7f9592d3e0247304402202c63804b458f63827bb73d1f9e5eb74a20ca3c79f2bbf4907137a765a96547d302202d9f2fae0dceb1cf32411555a3bc8b6ee4299b8a5f17e75c169cfa2263d20aab01210311997bb26d1fbffd12db78378480e0e6d2141df34e255419cd12e147530407c300000000',
        '02000000000101a87b658b2f739a861e3cdc29224923e0240a2cd6fc7f830cc2c784d58b8b5e590300000000ffffffff042090f71000000000160014e3a61181dd569c0250f828b393839d81517c78cd204e0000000000002251203cfada579a653ed7efbbd325eed4f54733a8630e5ffa6e1e5f0d28eb7cada0d26326f50400000000160014e3a61181dd569c0250f828b393839d81517c78cd6842000000000000225120cc8a60669be807a976f45c629b396cdfdaf2a6f970b65aba5d91f5a7f9592d3e0247304402202199a46d54e7f4fc3bde2868cfe93cc4d91c43a077e5826b44573bc59ff23ebc02202c036c942c6b9ddfb88bb96f37b2c19176334b4b791239c1d75a4d644c82346501210311997bb26d1fbffd12db78378480e0e6d2141df34e255419cd12e147530407c300000000',
        '020000000001018dfd49e5ab4e6998290e9e0d93ef241fb0bede0402c4eaf174487726ea8ba0f10200000000ffffffff0428cec91100000000160014e3a61181dd569c0250f828b393839d81517c78cd22020000000000002251203cfada579a653ed7efbbd325eed4f54733a8630e5ffa6e1e5f0d28eb7cada0d239de3e0b00000000160014e3a61181dd569c0250f828b393839d81517c78cd8813000000000000225120cc8a60669be807a976f45c629b396cdfdaf2a6f970b65aba5d91f5a7f9592d3e02483045022100e71f82d377aced4b452686476b8d881f89046cb5086f01500dd0d54ff84b23fe022058f9d5297e2113aebeb2ebe63de6583d47ceb9fdc88bb983e7abc7acc575b9e201210311997bb26d1fbffd12db78378480e0e6d2141df34e255419cd12e147530407c300000000',
        '02000000000101b5edc0088d0ae5942cbc635afbc7601c5d178c0a6799fe8406a3dd53fe2e28be0000000000ffffffff04ee240000000000002251203cfada579a653ed7efbbd325eed4f54733a8630e5ffa6e1e5f0d28eb7cada0d222020000000000002251205b30284f60cd538523e7804650ba306950560fc228f85450c1e6e3d5c4c99701f2070000000000002251203cfada579a653ed7efbbd325eed4f54733a8630e5ffa6e1e5f0d28eb7cada0d28813000000000000225120cc8a60669be807a976f45c629b396cdfdaf2a6f970b65aba5d91f5a7f9592d3e014103a7847983ef557f78c664bf020f73ffacffb1cdb8ae5de6aab782501714df08d82fe05dc2e8bd0d6d3a35a02b764de58d5cdf117b441c677c53c541a2f167880100000000',
      ];
      const wallet = new Wallet();

      const res = wallet.createRawTransaction(inputs, outputs, inputsRaw);

      // decode the transaction and check the inputs and outputs
      const tx = bitcoinjs.Transaction.fromHex(res);
      assert.ok(tx.ins[0].sequence < bitcoinjs.Transaction.DEFAULT_SEQUENCE - 1, 'RBF is enabled');

      assert.equal(tx.ins.length, inputs.length);
      for (let i = 0; i < inputs.length; i++) {
        assert.equal(Buffer.from(tx.ins[i].hash).reverse().toString('hex'), inputs[i].hash);
        assert.equal(tx.ins[i].index, inputs[i].index);
      }

      assert.equal(tx.outs.length, outputs.length);
      for (let i = 0; i < outputs.length; i++) {
        const address = bitcoinjs.address.fromOutputScript(tx.outs[i].script);
        const { value } = tx.outs[i];
        assert.equal(address, outputs[i].address);
        assert.equal(value, outputs[i].value);
      }
    });

    it('should throw when output address is invalid', () => {
      const inputs = [
        {
          hash: 'b69a64b2e8feebae77e4a67b908392c7cfc5c648e55e1949d3187c1c1b5e95e7',
          index: 1,
        },
        {
          hash: 'c87146f7ffbd127c8daa7259f66f578a92eee5f4ed8afe690bb81e0c8de28092',
          index: 1,
        },
        {
          hash: '4d0fc9a7afbcd0ff2c5a2e3091114e2dbbe23e6e737729dee3c975aadbef2b91',
          index: 1,
        },
        {
          hash: '9217167d96de3cb45dc1b79f358901de3ad1778c7d6858cd03942fc59f92590c',
          index: 0,
        },
      ];
      const outputs = [
        {
          address: 'invalidAddr',
          value: 40546,
        },
        {
          address: '3LA964JzvWFDH9kG9uTZBHA7CZgPUB6doi',
          value: 1007453,
        },
      ];
      const inputsRaw = [
        '0200000000010131ee2bd58aef2d83580c1d3ff198e9dadf38d5559c1c286e9776aad25826d6de0000000000ffffffff04415a041900000000160014e3a61181dd569c0250f828b393839d81517c78cd204e0000000000002251203cfada579a653ed7efbbd325eed4f54733a8630e5ffa6e1e5f0d28eb7cada0d2afab580400000000160014e3a61181dd569c0250f828b393839d81517c78cd6842000000000000225120cc8a60669be807a976f45c629b396cdfdaf2a6f970b65aba5d91f5a7f9592d3e0247304402202c63804b458f63827bb73d1f9e5eb74a20ca3c79f2bbf4907137a765a96547d302202d9f2fae0dceb1cf32411555a3bc8b6ee4299b8a5f17e75c169cfa2263d20aab01210311997bb26d1fbffd12db78378480e0e6d2141df34e255419cd12e147530407c300000000',
        '02000000000101a87b658b2f739a861e3cdc29224923e0240a2cd6fc7f830cc2c784d58b8b5e590300000000ffffffff042090f71000000000160014e3a61181dd569c0250f828b393839d81517c78cd204e0000000000002251203cfada579a653ed7efbbd325eed4f54733a8630e5ffa6e1e5f0d28eb7cada0d26326f50400000000160014e3a61181dd569c0250f828b393839d81517c78cd6842000000000000225120cc8a60669be807a976f45c629b396cdfdaf2a6f970b65aba5d91f5a7f9592d3e0247304402202199a46d54e7f4fc3bde2868cfe93cc4d91c43a077e5826b44573bc59ff23ebc02202c036c942c6b9ddfb88bb96f37b2c19176334b4b791239c1d75a4d644c82346501210311997bb26d1fbffd12db78378480e0e6d2141df34e255419cd12e147530407c300000000',
        '020000000001018dfd49e5ab4e6998290e9e0d93ef241fb0bede0402c4eaf174487726ea8ba0f10200000000ffffffff0428cec91100000000160014e3a61181dd569c0250f828b393839d81517c78cd22020000000000002251203cfada579a653ed7efbbd325eed4f54733a8630e5ffa6e1e5f0d28eb7cada0d239de3e0b00000000160014e3a61181dd569c0250f828b393839d81517c78cd8813000000000000225120cc8a60669be807a976f45c629b396cdfdaf2a6f970b65aba5d91f5a7f9592d3e02483045022100e71f82d377aced4b452686476b8d881f89046cb5086f01500dd0d54ff84b23fe022058f9d5297e2113aebeb2ebe63de6583d47ceb9fdc88bb983e7abc7acc575b9e201210311997bb26d1fbffd12db78378480e0e6d2141df34e255419cd12e147530407c300000000',
        '02000000000101b5edc0088d0ae5942cbc635afbc7601c5d178c0a6799fe8406a3dd53fe2e28be0000000000ffffffff04ee240000000000002251203cfada579a653ed7efbbd325eed4f54733a8630e5ffa6e1e5f0d28eb7cada0d222020000000000002251205b30284f60cd538523e7804650ba306950560fc228f85450c1e6e3d5c4c99701f2070000000000002251203cfada579a653ed7efbbd325eed4f54733a8630e5ffa6e1e5f0d28eb7cada0d28813000000000000225120cc8a60669be807a976f45c629b396cdfdaf2a6f970b65aba5d91f5a7f9592d3e014103a7847983ef557f78c664bf020f73ffacffb1cdb8ae5de6aab782501714df08d82fe05dc2e8bd0d6d3a35a02b764de58d5cdf117b441c677c53c541a2f167880100000000',
      ];
      const wallet = new Wallet();

      assert.throws(() => wallet.createRawTransaction(inputs, outputs, inputsRaw));
    });

    it('should work with a taproot address', () => {
      const inputs = [
        {
          hash: 'b69a64b2e8feebae77e4a67b908392c7cfc5c648e55e1949d3187c1c1b5e95e7',
          index: 1,
        },
        {
          hash: 'c87146f7ffbd127c8daa7259f66f578a92eee5f4ed8afe690bb81e0c8de28092',
          index: 1,
        },
        {
          hash: '4d0fc9a7afbcd0ff2c5a2e3091114e2dbbe23e6e737729dee3c975aadbef2b91',
          index: 1,
        },
        {
          hash: '9217167d96de3cb45dc1b79f358901de3ad1778c7d6858cd03942fc59f92590c',
          index: 0,
        },
      ];
      const outputs = [
        {
          address: 'bc1pjltse6tx48xk6zyc7ss85ndk7uflc5twq2g0sc3wcv4asxx7vzlsgvlz7k',
          value: 40546,
        },
        {
          address: '3LA964JzvWFDH9kG9uTZBHA7CZgPUB6doi',
          value: 1007453,
        },
      ];
      const inputsRaw = [
        '0200000000010131ee2bd58aef2d83580c1d3ff198e9dadf38d5559c1c286e9776aad25826d6de0000000000ffffffff04415a041900000000160014e3a61181dd569c0250f828b393839d81517c78cd204e0000000000002251203cfada579a653ed7efbbd325eed4f54733a8630e5ffa6e1e5f0d28eb7cada0d2afab580400000000160014e3a61181dd569c0250f828b393839d81517c78cd6842000000000000225120cc8a60669be807a976f45c629b396cdfdaf2a6f970b65aba5d91f5a7f9592d3e0247304402202c63804b458f63827bb73d1f9e5eb74a20ca3c79f2bbf4907137a765a96547d302202d9f2fae0dceb1cf32411555a3bc8b6ee4299b8a5f17e75c169cfa2263d20aab01210311997bb26d1fbffd12db78378480e0e6d2141df34e255419cd12e147530407c300000000',
        '02000000000101a87b658b2f739a861e3cdc29224923e0240a2cd6fc7f830cc2c784d58b8b5e590300000000ffffffff042090f71000000000160014e3a61181dd569c0250f828b393839d81517c78cd204e0000000000002251203cfada579a653ed7efbbd325eed4f54733a8630e5ffa6e1e5f0d28eb7cada0d26326f50400000000160014e3a61181dd569c0250f828b393839d81517c78cd6842000000000000225120cc8a60669be807a976f45c629b396cdfdaf2a6f970b65aba5d91f5a7f9592d3e0247304402202199a46d54e7f4fc3bde2868cfe93cc4d91c43a077e5826b44573bc59ff23ebc02202c036c942c6b9ddfb88bb96f37b2c19176334b4b791239c1d75a4d644c82346501210311997bb26d1fbffd12db78378480e0e6d2141df34e255419cd12e147530407c300000000',
        '020000000001018dfd49e5ab4e6998290e9e0d93ef241fb0bede0402c4eaf174487726ea8ba0f10200000000ffffffff0428cec91100000000160014e3a61181dd569c0250f828b393839d81517c78cd22020000000000002251203cfada579a653ed7efbbd325eed4f54733a8630e5ffa6e1e5f0d28eb7cada0d239de3e0b00000000160014e3a61181dd569c0250f828b393839d81517c78cd8813000000000000225120cc8a60669be807a976f45c629b396cdfdaf2a6f970b65aba5d91f5a7f9592d3e02483045022100e71f82d377aced4b452686476b8d881f89046cb5086f01500dd0d54ff84b23fe022058f9d5297e2113aebeb2ebe63de6583d47ceb9fdc88bb983e7abc7acc575b9e201210311997bb26d1fbffd12db78378480e0e6d2141df34e255419cd12e147530407c300000000',
        '02000000000101b5edc0088d0ae5942cbc635afbc7601c5d178c0a6799fe8406a3dd53fe2e28be0000000000ffffffff04ee240000000000002251203cfada579a653ed7efbbd325eed4f54733a8630e5ffa6e1e5f0d28eb7cada0d222020000000000002251205b30284f60cd538523e7804650ba306950560fc228f85450c1e6e3d5c4c99701f2070000000000002251203cfada579a653ed7efbbd325eed4f54733a8630e5ffa6e1e5f0d28eb7cada0d28813000000000000225120cc8a60669be807a976f45c629b396cdfdaf2a6f970b65aba5d91f5a7f9592d3e014103a7847983ef557f78c664bf020f73ffacffb1cdb8ae5de6aab782501714df08d82fe05dc2e8bd0d6d3a35a02b764de58d5cdf117b441c677c53c541a2f167880100000000',
      ];
      const wallet = new Wallet();

      const res = wallet.createRawTransaction(inputs, outputs, inputsRaw);

      // decode the transaction and check the inputs and outputs
      const tx = bitcoinjs.Transaction.fromHex(res);
      assert.ok(tx.ins[0].sequence < bitcoinjs.Transaction.DEFAULT_SEQUENCE - 1, 'RBF is enabled');

      assert.equal(tx.ins.length, inputs.length);
      for (let i = 0; i < inputs.length; i++) {
        assert.equal(Buffer.from(tx.ins[i].hash).reverse().toString('hex'), inputs[i].hash);
        assert.equal(tx.ins[i].index, inputs[i].index);
      }

      assert.equal(tx.outs.length, outputs.length);
      for (let i = 0; i < outputs.length; i++) {
        const address = bitcoinjs.address.fromOutputScript(tx.outs[i].script);
        const { value } = tx.outs[i];
        assert.equal(address, outputs[i].address);
        assert.equal(value, outputs[i].value);
      }
    });
  });

  describe('#sendCustomTransaction()', () => {
    it('should send a custom transaction', async () => {
      const inputs = [
        {
          hash: 'b69a64b2e8feebae77e4a67b908392c7cfc5c648e55e1949d3187c1c1b5e95e7',
          index: 1,
        },
        {
          hash: 'c87146f7ffbd127c8daa7259f66f578a92eee5f4ed8afe690bb81e0c8de28092',
          index: 1,
        },
        {
          hash: '4d0fc9a7afbcd0ff2c5a2e3091114e2dbbe23e6e737729dee3c975aadbef2b91',
          index: 1,
        },
        {
          hash: '9217167d96de3cb45dc1b79f358901de3ad1778c7d6858cd03942fc59f92590c',
          index: 0,
        },
      ];
      const outputs = [
        {
          address: 'bc1qkz6m0ynel5y8ra9x8vqf04v75ayweavwm9l5k5',
          value: 40546,
        },
        {
          address: '3LA964JzvWFDH9kG9uTZBHA7CZgPUB6doi',
          value: 1007453,
        },
      ];
      const inputsRaw = [
        '0200000000010131ee2bd58aef2d83580c1d3ff198e9dadf38d5559c1c286e9776aad25826d6de0000000000ffffffff04415a041900000000160014e3a61181dd569c0250f828b393839d81517c78cd204e0000000000002251203cfada579a653ed7efbbd325eed4f54733a8630e5ffa6e1e5f0d28eb7cada0d2afab580400000000160014e3a61181dd569c0250f828b393839d81517c78cd6842000000000000225120cc8a60669be807a976f45c629b396cdfdaf2a6f970b65aba5d91f5a7f9592d3e0247304402202c63804b458f63827bb73d1f9e5eb74a20ca3c79f2bbf4907137a765a96547d302202d9f2fae0dceb1cf32411555a3bc8b6ee4299b8a5f17e75c169cfa2263d20aab01210311997bb26d1fbffd12db78378480e0e6d2141df34e255419cd12e147530407c300000000',
        '02000000000101a87b658b2f739a861e3cdc29224923e0240a2cd6fc7f830cc2c784d58b8b5e590300000000ffffffff042090f71000000000160014e3a61181dd569c0250f828b393839d81517c78cd204e0000000000002251203cfada579a653ed7efbbd325eed4f54733a8630e5ffa6e1e5f0d28eb7cada0d26326f50400000000160014e3a61181dd569c0250f828b393839d81517c78cd6842000000000000225120cc8a60669be807a976f45c629b396cdfdaf2a6f970b65aba5d91f5a7f9592d3e0247304402202199a46d54e7f4fc3bde2868cfe93cc4d91c43a077e5826b44573bc59ff23ebc02202c036c942c6b9ddfb88bb96f37b2c19176334b4b791239c1d75a4d644c82346501210311997bb26d1fbffd12db78378480e0e6d2141df34e255419cd12e147530407c300000000',
        '020000000001018dfd49e5ab4e6998290e9e0d93ef241fb0bede0402c4eaf174487726ea8ba0f10200000000ffffffff0428cec91100000000160014e3a61181dd569c0250f828b393839d81517c78cd22020000000000002251203cfada579a653ed7efbbd325eed4f54733a8630e5ffa6e1e5f0d28eb7cada0d239de3e0b00000000160014e3a61181dd569c0250f828b393839d81517c78cd8813000000000000225120cc8a60669be807a976f45c629b396cdfdaf2a6f970b65aba5d91f5a7f9592d3e02483045022100e71f82d377aced4b452686476b8d881f89046cb5086f01500dd0d54ff84b23fe022058f9d5297e2113aebeb2ebe63de6583d47ceb9fdc88bb983e7abc7acc575b9e201210311997bb26d1fbffd12db78378480e0e6d2141df34e255419cd12e147530407c300000000',
        '02000000000101b5edc0088d0ae5942cbc635afbc7601c5d178c0a6799fe8406a3dd53fe2e28be0000000000ffffffff04ee240000000000002251203cfada579a653ed7efbbd325eed4f54733a8630e5ffa6e1e5f0d28eb7cada0d222020000000000002251205b30284f60cd538523e7804650ba306950560fc228f85450c1e6e3d5c4c99701f2070000000000002251203cfada579a653ed7efbbd325eed4f54733a8630e5ffa6e1e5f0d28eb7cada0d28813000000000000225120cc8a60669be807a976f45c629b396cdfdaf2a6f970b65aba5d91f5a7f9592d3e014103a7847983ef557f78c664bf020f73ffacffb1cdb8ae5de6aab782501714df08d82fe05dc2e8bd0d6d3a35a02b764de58d5cdf117b441c677c53c541a2f167880100000000',
      ];

      const txUnsignedHex = '0200000004e7955e1b1c7c18d349195ee548c6c5cfc79283907ba6e477aeebfee8b2649ab60100000000fdffffff9280e28d0c1eb80b69fe8aedf4e5ee928a576ff65972aa8d7c12bdfff74671c80100000000fdffffff912befdbaa75c9e3de2977736e3ee2bb2d4e1191302e5a2cffd0bcafa7c90f4d0100000000fdffffff0c59929fc52f9403cd58687d8c77d13ade0189359fb7c15db43cde967d1617920000000000fdffffff02629e000000000000160014b0b5b79279fd0871f4a63b0097d59ea748ecf58e5d5f0f000000000017a914ca9379ae1eafa125156661d90741e6417195e3dd8700000000';
      const signRes = {
        hex: 'signed_tx_hex',
        complete: true,
      };
      const txid = 'txid';
      const mockBitcoinClient = new BitcoinClient();
      const stubRawTx = sinon.stub(mockBitcoinClient, 'getRawTransaction');
      for (let i = 0; i < inputs.length; i++) {
        stubRawTx.withArgs(inputs[i].hash).resolves(inputsRaw[i]);
      }

      const spySign = sinon.stub(mockBitcoinClient, 'signRawTransactionWithWallet').resolves(signRes);
      const spySend = sinon.stub(mockBitcoinClient, 'sendRawTransaction').resolves(txid);
      const wallet = new Wallet(mockBitcoinClient);
      const spyCreateRawTx = sinon.spy(wallet, 'createRawTransaction');

      const res = await wallet.sendCustomTransaction(inputs, outputs);
      assert(spyCreateRawTx.calledWith(inputs, outputs));
      assert(spySign.calledWith(txUnsignedHex));
      assert(spySend.calledWith(signRes.hex));
      assert.equal(res, txid);
    });
  });
});
