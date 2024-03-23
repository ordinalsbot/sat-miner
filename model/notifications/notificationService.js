class NotificationService {
    constructor(notificationLevel = 'info') {
        this.notifiers = [];
        this.notificationLevel = notificationLevel;
    }

    addNotifier(notifier) {
        this.notifiers.push(notifier);
    }

    sendMessage(message, severity = 'info') {
        if (this.notificationLevel === 'info' && severity === 'verbose') return;
        this.notifiers.forEach(notifier => {
            notifier.sendMessage(message);
        });
    }
}

module.exports = NotificationService;
