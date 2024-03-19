const axios = require('axios');

class MempoolApi {
  constructor(url = 'https://mempool.space/api/v1/') {
    this.url = url;
  }

  /**
   * @typedef {object} FeeEstimation
   * @property {number} fastestFee - Fastest fee in sat/vB
   * @property {number} halfHourFee - Half hour fee in sat/vB
   * @property {number} economyFee - Economy fee in sat/vB
   * @property {number} minimumFee - Minimum fee in sat/vB
   * @returns {Promise<FeeEstimation>}
   */
  getFeeEstimation = async () => {
    const response = await axios.get(`${this.url}fees/recommended`);
    return response.data;
  };
}

module.exports = MempoolApi;
