const { IncomingWebhook } = require('@slack/webhook');

class SlackNotifications {
    /**
     * @param {string} slackWebhookUrl - the slack webhook url
     */
    constructor(slackWebhookUrl) {
        if (!slackWebhookUrl) {
            throw new Error('slack webhook url is required');
        }
        this.slackWebHook = new IncomingWebhook(slackWebhookUrl);
    }
    
    /**
     * Send a slack notification
     * @param {string} message - the message to send
     */
    sendMessage = async (message) => {
        await this.slackWebHook.send({
            username: 'satminer',
            icon_emoji: ':robot_face:',
            text: message,
        });
        console.log('Slac message sent.');
        return true;
    };
}
    
module.exports = SlackNotifications;
