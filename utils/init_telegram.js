const TelegramBot = require('node-telegram-bot-api');

// Token obtained from BotFather when you create a new bot
const token = 'YOUR_TELEGRAM_BOT_TOKEN_HERE';

// Create a bot instance
const bot = new TelegramBot(token, { polling: true });

// Event listener for when the bot receives a message
bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    // Log the chat ID to the console
    console.log('Your chat ID:', chatId);

    // Send a confirmation message to the user
    bot.sendMessage(chatId, 'Your chat ID has been logged. Add this info with your bot token to the .env file.');

    // Stop the bot polling
    bot.stopPolling();
});

// Log any errors
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

// Start polling for messages
console.log('Bot started. Please send a message to get your chat ID.');
