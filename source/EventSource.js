function EventSource() {
    var eventHandlers = {};
    this.addEventListener = function (type, handler) {
        if (!eventHandlers[type]) {
            eventHandlers[type] = [];
        }
        eventHandlers[type].push(handler);
    };
    this.removeEventListener = function (type, handler) {
        if (!eventHandlers[type]) {
            return;
        }
        eventHandlers[type] = eventHandlers[type].filter(function (f) {
            return f != handler;
        })
    };
    this.dispatchEvent = function (e) {
        if (eventHandlers.hasOwnProperty(e.type)) {
            eventHandlers[e.type].forEach(function (f) {
                f.call(this, e);
            })
        }
        if (this["on" + e.type]) {
            this["on" + e.type](e);
        }
    }
}
