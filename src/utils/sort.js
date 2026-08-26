import {sortFloat64} from "./sorter-number.js";
import {sortObjectByFloat64Key} from "./sorter-object-number.js";
import {sortObjectByInt32Key} from "./sorter-object-int.js";
import {sortInt32} from "./sorter-int.js";
/**
 * Sorts an array based on the provided parameters.
 *
 *
 *
 * @param array
 * @param parameters
 */
export function sort(array, ...parameters) {
    if (isTypedArray(array)) {
        if (array instanceof Float64Array || array instanceof Float32Array) {
            sortFloat64(array, parameters[0] ? parameters[0] : {});
        } else {
            sortInt32(array, parameters[0] ? parameters[0] : {});
        }
    } else {
        if (parameters.length === 0) {
            sortFloat64(array, {});
        } else if (parameters.length === 1) {
            let parameter0 = parameters[0];
            if (isPlainObject(parameter0)) {
                let type = parameter0.type ? parameter0.type : "";
                if (["int32", "uint32", "int16", "uint16", "int8", "uint8", "uint8clamped"].includes(type.toLowerCase())) {
                    sortInt32(array, parameter0);
                } else {
                    sortFloat64(array, parameter0);
                }
            } else if (isFunction(parameter0)) {
                sortObjectByFloat64Key(array, parameter0);
            } else if (isArray(parameter0)) {
                let sortByArray = parameter0;
                for (let i = sortByArray.length -1; i >= 0; i--) {
                    let option = sortByArray[i];
                    let type = option.type ? option.type : "";
                    let key = option.key;
                    if (["int32", "uint32", "int16", "uint16", "int8", "uint8", "uint8clamped"].includes(type.toLowerCase())) {
                        sortObjectByInt32Key(array, key, option);
                    } else {
                        sortObjectByFloat64Key(array, key, option);
                    }
                }
            } else {
                throw new Error("Invalid parameter type. Expected an object or a function.");
            }
        } else if (parameters.length === 2) {
            let parameter0 = parameters[0];
            let parameter1 = parameters[1];
            if (!isFunction(parameter0) && !isArray(parameter0)) {
                throw new Error("Invalid parameter type. Expected a function or an array as the second parameter.");
            }
            if (!isPlainObject(parameter1)) {
                throw new Error("Invalid parameter type. Expected an object as the third parameter.");
            }
            if (isFunction(parameter0)) {
                let type = parameter1.type ? parameter1.type : (parameter0.type ? parameter0.type : "");
                if (["int32", "uint32", "int16", "uint16", "int8", "uint8", "uint8clamped"].includes(type.toLowerCase())) {
                    sortObjectByInt32Key(array, parameter0, parameter1);
                } else {
                    sortObjectByFloat64Key(array, parameter0, parameter1);
                }
            } else {
                let sortByArray = parameter0;
                for (let i = sortByArray.length -1; i >= 0; i--) {
                    let sortBy = sortByArray[i];
                    let type = sortBy.type ? sortBy.type : "";
                    let key = sortBy.key;
                    if (["int32", "uint32", "int16", "uint16", "int8", "uint8", "uint8clamped"].includes(type.toLowerCase())) {
                        sortObjectByInt32Key(array, key, mergeOptions(parameter1, sortBy));
                    } else {
                        sortObjectByFloat64Key(array, key, mergeOptions(parameter1, sortBy));
                    }
                }
            }
        } else {
            throw new Error("Invalid number of parameters. Expected 1, 2, or 3 parameters.");
        }
    }
}

function isPlainObject(obj) {
    return Object.prototype.toString.call(obj) === "[object Object]" &&
        Object.getPrototypeOf(obj) === Object.prototype
}

function isFunction(obj) {
    return typeof obj === 'function';
}

function compareStringsCaseInsensitive(first, second) {
    return typeof first === "string" && typeof second === "string"
        ? first.toLowerCase() === second.toLowerCase()
        : false;
}

function isArray(value) {
    return Array.isArray(value);
}

function mergeOptions(globalOptions, userOptions) {
    return {
        ...globalOptions,
        ...Object.fromEntries(
            Object.entries(userOptions ?? {}).filter(
                ([, value]) => value !== undefined && value !== null
            )
        )
    };
}

function isTypedArray(value) {
    return ArrayBuffer.isView(value) && !(value instanceof DataView);
}