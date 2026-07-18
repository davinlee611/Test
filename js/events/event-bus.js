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

    listeners.get(eventName).push(callback);
}

/* ========================================
   UNSUBSCRIBE
======================================== */

export function off(eventName, callback) {
    if (!listeners.has(eventName)) {
        return;
    }

    const updated = listeners
        .get(eventName)
        .filter(function (listener) {
            return listener !== callback;
        });

    listeners.set(eventName, updated);
}

/* ========================================
   EMIT
======================================== */

export function emit(eventName, payload = {}) {
    if (!listeners.has(eventName)) {
        return;
    }

    listeners
        .get(eventName)
        .forEach(function (listener) {
            listener(payload);
        });
}