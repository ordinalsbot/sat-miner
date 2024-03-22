const axios = require('axios');
const crypto = require('crypto');

class CoinbaseAPI {
    constructor(apiKey, apiSecret, apiPassphrase) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.apiPassphrase = apiPassphrase;
        this.baseURL = 'https://api.coinbase.com';
    }

    async getPublicEndpoint(endpoint) {
        try {
            const response = await axios.get(`${this.baseURL}${endpoint}`);
            return response.data;
        } catch (error) {
            console.error('Error:', error.message);
            throw error;
        }
    }

    async getAuthEndpoint(endpoint, body) {
        try {
            const headers = await this.signMessage('GET', endpoint, body);
            const response = await axios.get(`${this.baseURL}${endpoint}`, { headers });
            return response.data;
        } catch (error) {
            console.error('Error:', error.message);
            throw error;
        }
    }

    async postAuthEndpoint(endpoint, body) {
        try {
            const headers = await this.signMessage('POST', endpoint, body);
            const response = await axios.post(`${this.baseURL}${endpoint}`, body, { headers });
            return response.data;
        } catch (error) {
            console.error('Error:', error.message);
            throw error;
        }
    }

    async signMessage(method, endpoint, body) {
        const cb_access_timestamp = Date.now() / 1000; // in ms

        // create the prehash string by concatenating required parts
        const message = `${cb_access_timestamp}${method}${endpoint}${JSON.stringify(body)}`;

        // decode the base64 secret
        const key = Buffer.from(this.apiSecret, 'base64');

        // create a sha256 hmac with the secret
        const hmac = crypto.createHmac('sha256', key);

        // sign the required message with the hmac and base64 encode the result
        const cb_access_sign = hmac.update(message).digest('base64');

        return {
            'CB-ACCESS-KEY': this.apiKey,
            'CB-ACCESS-SIGN': cb_access_sign,
            'CB-ACCESS-TIMESTAMP': cb_access_timestamp,
            'CB-ACCESS-PASSPHRASE': this.apiPassphrase,
            'Content-Type': 'application/json',
        };
    }

    async getSystemStatus() {
        return this.getPublicEndpoint('/system/status');
    }

    async getAccountBalance() {
        return this.getAuthEndpoint('/accounts');
    }

    async withdrawFunds(amount, currency, address) {
        const body = {
            amount,
            currency,
            crypto_address: address,
        };
        return this.postAuthEndpoint('/withdrawals/crypto', body);
    }

    async getServerTime() {
        return this.getPublicEndpoint('/time');
    }
}

module.exports = CoinbaseAPI;
