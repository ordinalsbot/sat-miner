const axios = require('axios');
const crypto = require('crypto');
const qs = require('qs');

class KrakenAPI {
  constructor(APIKey, APISecret, basePath = 'https://api.kraken.com') {
    this.APIKey = APIKey;
    this.APISecret = APISecret;

    this.basePath = basePath;
  }

  getMessageSignature(path, request, nonce) {
    const message = JSON.stringify(request);
    const secret_buffer = new Buffer.from(this.APISecret, 'base64');
    const hash = new crypto.createHash('sha256');
    const hmac = new crypto.createHmac('sha512', secret_buffer);
    const hash_digest = hash.update(nonce + message).digest('binary');
    const hmac_digest = hmac.update(path + hash_digest, 'binary').digest('base64');

    return hmac_digest;
  }

  getPublicEndpoint = async (path) => {
    const rPath = `${this.basePath}${path}`;
    console.log('sending request', rPath);
    const response = await axios.get(rPath);
    return response.data;
  };

  postAuthEndpoint = async (path, data = {}) => {
    const nonce = Date.now().toString();
    data.nonce = nonce;

    const signature = this.getMessageSignature(path, data, nonce);
    const headers = {
      'API-Key': this.APIKey,
      'API-Sign': signature,
    };

    const rPath = `${this.basePath}${path}`;
    const response = await axios.post(rPath, data, { headers });

    return response.data;
  };

  getSystemStatus = async () => this.getPublicEndpoint('/0/public/SystemStatus');

  getServerTime = async () => this.getPublicEndpoint('/0/public/Time');

  getAccountBalance = async () => this.postAuthEndpoint('/0/private/Balance');

  getDepositMethods = async (asset) => this.postAuthEndpoint('/0/private/DepositMethods', { asset });

  getDepositAddresses = async (asset, method, newAddress = false, amount = null) => this.postAuthEndpoint('/0/private/DepositAddresses', {
    asset, method, new: newAddress, amount,
  });

  withdrawFunds = async (asset, key, amount) => this.postAuthEndpoint('/0/private/Withdraw', { asset, key, amount });
}

module.exports = KrakenAPI;
