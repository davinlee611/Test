"use strict";

/* ========================================
   EVENT BUS
======================================== */

const listeners = new Map();


/* ========================================
   SUBSCRIBE
======================================== */

export function on(eventName, callback) {
    if (!listeners.has(eventName)) {
        listeners.set(eventName, []);
    }

    listeners
        .get(eventName)
        .push(callback);

    return function unsubscribe() {
        off(eventName, callback);
    };
}


/* ========================================
   UNSUBSCRIBE
======================================== */

export function off(eventName, callback) {
    if (!listeners.has(eventName)) {
        return;
    }

    const updatedListeners =
        listeners
            .get(eventName)
            .filter(function (listener) {
                return listener !== callback;
            });

    if (updatedListeners.length === 0) {
        listeners.delete(eventName);
        return;
    }

    listeners.set(
        eventName,
        updatedListeners,
    );
}


/* ========================================
   EMIT
======================================== */

export function emit(
    eventName,
    payload = {},
) {
    if (!listeners.has(eventName)) {
        return;
    }

    listeners
        .get(eventName)
        .forEach(function (listener) {
            listener(payload);
        });
}