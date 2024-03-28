const axios = require('axios');
const crypto = require('crypto');

class CoinbaseAPI {
    constructor(apiKey, apiSecret) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.baseURL = 'https://api.coinbase.com';
        this.accountId = null;
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
            const headers = await this.signMessage('POST', endpoint, JSON.stringify(body));
            const response = await axios.post(`${this.baseURL}${endpoint}`, body, { headers });
            return response.data;
        } catch (error) {
            console.error('Error:', error.message);
            throw error;
        }
    }

    async signMessage(method, endpoint, body = '') {
        const timestamp = Math.floor(Date.now() / 1000); // Unix time in seconds
        const message = `${timestamp}${method}${endpoint}${body}`;
        const signature = crypto.createHmac('sha256', this.apiSecret).update(message).digest('hex');
        return {
            'CB-ACCESS-KEY': this.apiKey,
            'CB-ACCESS-SIGN': signature,
            'CB-ACCESS-TIMESTAMP': `${timestamp}`,
            'CB-VERSION': '2024-03-22',
            'Content-Type': 'application/json',
        };
    }

    async getSystemStatus() {
        throw new Error('Not implemented');
    }

    async getAccountId() {
        const accounts = await this.getAuthEndpoint('/v2/accounts/BTC');
        return accounts.data.id;
    }

    async getAccountBalance() {
        if (!this.accountId) {
            this.accountId = await this.getAccountId();
        }
        return this.getAuthEndpoint(`/v2/accounts/${this.accountId}`);
    }

    async withdrawFunds(amount, currency, address) {
        if (!this.accountId) {
            this.accountId = await this.getAccountId();
        }
        const body = {
            type: 'send',
            amount,
            currency,
            to: address,
            to_financial_institution: false,
        };
        return this.postAuthEndpoint(`/v2/accounts/${this.accountId}/transactions`, body);
    }

    async getServerTime() {
        return this.getPublicEndpoint('/v2/time');
    }
}

module.exports = CoinbaseAPI;
