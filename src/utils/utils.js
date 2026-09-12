const bigInt64ArraySupported = typeof BigInt64Array === 'function';

export function isBigInt64Array(array) {
    return bigInt64ArraySupported && array instanceof BigInt64Array;
}

export function isBigUint64Array(array) {
    return bigInt64ArraySupported && array instanceof BigUint64Array;
}

export function isTypedArray(value) {
    return ArrayBuffer.isView(value) && !(value instanceof DataView);
}

export function isFunction(obj) {
    return typeof obj === 'function';
}

export function isArray(value) {
    return Array.isArray(value);
}

export function isPlainObject(obj) {
    return Object.prototype.toString.call(obj) === "[object Object]" &&
        Object.getPrototypeOf(obj) === Object.prototype
}

