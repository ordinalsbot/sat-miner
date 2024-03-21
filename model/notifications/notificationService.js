class NotificationService {
    constructor() {
        this.notifiers = [];
    }

    addNotifier(notifier) {
        this.notifiers.push(notifier);
    }

    sendMessage(message) {
        this.notifiers.forEach(notifier => {
            notifier.sendMessage(message);
        });
    }
}

module.exports = NotificationService;
