const TelegramBot = require('node-telegram-bot-api');

class TelegramNotifications {
    /**
     * @param {string} slackWebhookUrl - the slack webhook url
     */
    constructor(token, chatId) {
        if (!token) {
            throw new Error('Bot token is required');
        }
        this.bot = new TelegramBot(token, { polling: true });
        this.chatId = chatId;
    }
    
    /**
     * Send a slack notification
     * @param {string} message - the message to send
     */
    sendMessage = async (message) => {
      await this.bot.sendMessage(this.chatId, message);
      console.log('Telegram message sent.');
      return true;
    };
}
    
module.exports = TelegramNotifications;
