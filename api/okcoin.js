const axios = require('axios');
const crypto = require('crypto');
const qs = require('qs');

class OkcoinAPI {
  constructor(APIKey, APISecret, APIPassPhrase, basePath = 'https://www.okcoin.com') {
    this.APIKey = APIKey;
    this.APISecret = APISecret;
    this.PassPhrase = APIPassPhrase;

    this.basePath = basePath;
  }

  getMessageSignature(timestamp, method, path, body = '') {
    const message = `${timestamp}${method}${path}${body}`;

    const hmac = crypto.createHmac('sha256', this.APISecret);
    hmac.update(timestamp + method + path + body);
    const signature = hmac.digest('base64');
    console.log(signature);
    return signature;
  }

  getHeaders(timestamp, method, path, body) {
    const signature = this.getMessageSignature(timestamp, method, path, JSON.stringify(body));
    const headers = {
      'OK-ACCESS-KEY': this.APIKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': this.PassPhrase,
    };
    return headers;
  }

  getPublicEndpoint = async (path) => {
    const rPath = `${this.basePath}${path}`;
    console.log('sending request', rPath);
    const response = await axios.get(rPath);
    return response.data;
  };

  getAuthEndpoint = async (path) => {
    const timestamp = new Date().toISOString();
    const headers = this.getHeaders(timestamp, 'GET', path);
    const rPath = `${this.basePath}${path}`;
    const response = await axios.get(rPath, { headers });

    return response.data;
  };

  postAuthEndpoint = async (path, data = {}) => {
    const timestamp = new Date().toISOString();
    const headers = this.getHeaders(timestamp, 'POST', path, data);
    const rPath = `${this.basePath}${path}`;
    const response = await axios.post(rPath, data, { headers });

    return response.data;
  };

  getSystemStatus = async () => this.getPublicEndpoint('/api/v5/system/status');

  getServerTime = async () => this.getPublicEndpoint('/api/v5/public/time');

  getAccountBalance = async () => this.getAuthEndpoint('/api/v5/asset/balances');

  getWithdrawalFee = async (asset) => this.getAuthEndpoint(`/api/v5/asset/currencies?ccy=${asset}`);

  getDepositMethods = async () => { throw new Error('Not implemented'); }

  getDepositAddresses = async (asset) => this.getAuthEndpoint('/api/v5/asset/deposit-address', {
    params: {
      'ccy': asset,
    },
  });

  withdrawFunds = async (asset, address, amount, fee) => this.postAuthEndpoint('/api/v5/asset/withdrawal', 
    {
      ccy: asset,
      amt: amount,
      dest: '4',
      toAddr: address,
      fee,
      chain: 'BTC-Bitcoin',
    }
  );
}

module.exports = OkcoinAPI;
