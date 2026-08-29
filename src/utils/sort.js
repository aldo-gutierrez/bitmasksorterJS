import {sortFloat64} from "./sorter-number.js";
import {sortObjectByFloat64Key} from "./sorter-object-number.js";
import {sortObjectByInt32Key} from "./sorter-object-int.js";
import {sortInt32} from "./sorter-int.js";
import {getSortOptions, handleNullsUndefinedAndNans, validateSortRange} from "./sorter-utils.js";

/**
 * Sorts an array based on the provided parameters.
 *
 *
 *
 * @param array
 * @param parameters
 */
export function sort(array, ...parameters) {
    if (array.length < 2) {
        return;
    }
    if (isTypedArray(array)) {
        if (array instanceof Float64Array || array instanceof Float32Array) {
            sortFloat64(array, parameters[0] ? parameters[0] : {});
        } else {
            sortInt32(array, parameters[0] ? parameters[0] : {});
        }
    } else {
        if (parameters.length === 0) {
            sortNativeArray("", array, {});
        } else if (parameters.length === 1) {
            let parameter0 = parameters[0];
            if (isPlainObject(parameter0)) {
                let type = parameter0.type ? parameter0.type.toLowerCase() : "";
                sortNativeArray(type, array, parameter0);
            } else if (isFunction(parameter0)) {
                sortObjectByField("", array, parameter0, {})
            } else if (isArray(parameter0)) {
                let sortByArray = parameter0;
                for (let i = sortByArray.length -1; i >= 0; i--) {
                    let options = sortByArray[i];
                    let type = options.type ? options.type : "";
                    type = type.toLowerCase();
                    let key = options.key;
                    sortObjectByField(type, array, key, options);
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
                type = type.toLowerCase();
                sortObjectByField(type, array, parameter0, parameter1);
            } else {
                let sortByArray = parameter0;
                for (let i = sortByArray.length -1; i >= 0; i--) {
                    let sortBy = sortByArray[i];
                    let type = sortBy.type ? sortBy.type : "";
                    type = type.toLowerCase();
                    let key = sortBy.key;
                    if (key === null || key === undefined) {
                        throw new Error("Invalid parameter type. Expected a function (x) ==> x.field");
                    }
                    let options =  mergeOptions(parameter1, sortBy)
                    sortObjectByField(type, array, key, options);
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

function sortNativeArray(type, array, options) {
    if (["int32", "uint32", "int16", "uint16", "int8", "uint8", "uint8clamped"].includes(type)) {
        sortInt32(array, options);
    } else {
        if (type.length === 0) {
            type = detectPrimitiveValueType(array);
        }
        if (type === "float64") {
            sortFloat64(array, options);
        } else if (type === "date") {
            sortObjectByFloat64Key(array, (x) => x.getTime(), options)
        } else if (type === "boolean") {
            sortObjectByInt32Key(array, (x) => x ? 1 : 0, options);
        } else if (type === "string") {
            sortStringArray(array, options);
        }
    }
}


function sortObjectByField(type, array, key, options) {
    if (["int32", "uint32", "int16", "uint16", "int8", "uint8", "uint8clamped"].includes(type)) {
        sortObjectByInt32Key(array, key, options);
    } else {
        if (type.length === 0) {
            type = detectObjectValueType(array, key);
        }
        if (type === "float64") {
            sortObjectByFloat64Key(array, key, options);
        } else if (type === "date") {
            sortObjectByFloat64Key(array, (x) => {
                const value = key(x);
                return value === null || value === undefined ? value : value.getTime();
            }, options);
        } else if (type === "boolean") {
            sortObjectByInt32Key(array, (x) => {
                const value = key(x);
                return value === null || value === undefined ? value : (value ? 1 : 0);
            }, options);
        } else if (type === "string") {
            //skip null objects and undefined objects in array
            let {start, endP1, asc, nulls} = getSortOptions(options);
            ({start, endP1} = validateSortRange(array, start, endP1));
            let arrayNative;
            try {
                ({
                    start, endP1, arrayNative
                } = handleNullsUndefinedAndNans(array, nulls, start, endP1, key, undefined));
            } catch (e) {
                throw new Error("Error in handleNullsUndefinedAndNans: " + e.message);
            }
            options.start = start;
            options.endP1 = endP1;
            //sort remaining objects, null keys will be handled by sortObjectArrayStringKey
            sortObjectArrayStringKey(array, key, options);
        }
    }
}

function detectPrimitiveValueType(list) {
    let hasString = false;
    let hasBoolean = false;
    let hasDate = false;
    let hasNumber = false;
    let hasOther = false;

    for (const value of list) {
        if (value === null || value === undefined) {
            continue;
        }
        if (typeof value === "string" || value instanceof String) {
            hasString = true;
            continue;
        }
        if (typeof value === "boolean" || value instanceof Boolean) {
            hasBoolean = true;
            continue;
        }
        if (value instanceof Date) {
            hasDate = true;
            continue;
        }
        if (typeof value === "number" || !Number.isNaN(Number(value))) {
            hasNumber = true;
            continue;
        }
        hasOther = true;
    }

    if (hasString && !(hasBoolean || hasDate || hasNumber || hasOther)) {
        return "string";
    }
    if (hasBoolean && !(hasString || hasDate || hasNumber || hasOther)) {
        return "boolean";
    }
    if (hasDate && !(hasString || hasBoolean || hasNumber || hasOther)) {
        return "date";
    }
    return "float64";
}
function detectObjectValueType(list, mapper) {
    let hasString = false;
    let hasBoolean = false;
    let hasDate = false;
    let hasNumber = false;
    let hasOther = false;

    for (const object of list) {
        let value = mapper(object);

        if (value === null || value === undefined) {
            continue;
        }
        if (typeof value === "string" || value instanceof String) {
            hasString = true;
            continue;
        }
        if (typeof value === "boolean" || value instanceof Boolean) {
            hasBoolean = true;
            continue;
        }
        if (value instanceof Date) {
            hasDate = true;
            continue;
        }
        if (typeof value === "number" || !Number.isNaN(Number(value))) {
            hasNumber = true;
            continue;
        }
        hasOther = true;
    }

    if (hasString && !(hasBoolean || hasDate || hasNumber || hasOther)) {
        return "string";
    }
    if (hasBoolean && !(hasString || hasDate || hasNumber || hasOther)) {
        return "boolean";
    }
    if (hasDate && !(hasString || hasBoolean || hasNumber || hasOther)) {
        return "date";
    }
    return "float64";
}

function sortStringArray(arr, options = {}) {
    const {
        start = 0,
        end = arr.length,
        nulls = 'ignore', // 'first' | 'last' | 'ignore'
        order = 'asc'    // 'asc' | 'desc'
    } = options;

    const subArray = arr.slice(start, end);

    subArray.sort((a, b) => {
        // undefined always o the end
        if (a === undefined && b === undefined) return 0;
        if (a === undefined) return 1;
        if (b === undefined) return -1;

        // null handling
        if (nulls !== 'ignore') {
            if (a === null && b === null) return 0;
            if (a === null) return nulls === 'first' ? -1 : 1;
            if (b === null) return nulls === 'first' ? 1 : -1;
        }

        // String compare
        const comparison = a.localeCompare(b);
        return order === 'desc' ? -comparison : comparison;
    });

    // 3. Replace ordered elements on the original array
    arr.splice(start, subArray.length, ...subArray);
    return arr;
}

function sortObjectArrayStringKey(arr, key, options = {}) {
    const {
        start = 0,
        end = arr.length,
        nulls = 'ignore', // 'first' | 'last' | 'ignore'
        order = 'asc'    // 'asc' | 'desc'
    } = options;

    const subArray = arr.slice(start, end);

    subArray.sort((itemA, itemB) => {
        //Extract values
        const a = key(itemA);
        const b = key(itemB);

        //Undefined always to the end
        if (a === undefined && b === undefined) return 0;
        if (a === undefined) return 1;
        if (b === undefined) return -1;

        //Null Handling
        if (nulls !== 'ignore') {
            if (a === null && b === null) return 0;
            if (a === null) return nulls === 'first' ? -1 : 1;
            if (b === null) return nulls === 'first' ? 1 : -1;
        }

        //String Compare
        const comparison = String(a).localeCompare(String(b));
        return order === 'desc' ? -comparison : comparison;
    });

    // Replace sublist into original array
    arr.splice(start, subArray.length, ...subArray);
    return arr;
}