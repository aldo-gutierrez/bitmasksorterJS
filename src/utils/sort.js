import {sortFloat64} from "./sorter-number.js";
import {sortObjectByFloat64Key} from "./sorter-object-number.js";
import {sortObjectByInt32Key} from "./sorter-object-int.js";
import {sortInt32} from "./sorter-int.js";
import {getSortOptions, handleNullsUndefinedAndNans, validateSortRange} from "./sorter-utils.js";
import {isArray, isBigInt64Array, isBigUint64Array, isFunction, isPlainObject, isTypedArray} from "./utils.js";

/**
 * Sorts an array based on the provided parameters.
 *
 * @param array
 * @param parameters
 * the first parameter must be always the array to sort
 * the second parameter can be
 *    an object with options to sort the array
 *    or a function to map the objects in the array to a value to sort by
 *    or an array of objects with options to sort the array by multiple keys
 *    or an array of functions to map the objects in the array to values to sort by
 * the third parameter is always an object with options to sort the array
 *
 */
export function sort(array, ...parameters) {
    if (array.length < 2) {
        return;
    }
    let parameter2 = parameters[0];
    let parameter3 = parameters[1];
    if (isTypedArray(array)) {
        if (!isPlainObject(parameter2)) {
            parameter2  = {}
        }
        parameter2.type = parameter2.type?.toLowerCase() || "";
        if (array instanceof Float64Array || array instanceof Float32Array ||  array instanceof Uint32Array) {
            sortFloat64(array, parameter2);
        } else {
            let isBigInt64 = isBigInt64Array(array);
            let isBigUint64 = isBigUint64Array(array);
            if (isBigInt64 || isBigUint64) {
                let options = parameter2;
                parameter2.type = isBigInt64 ? "int64" : "uint64";
                sortElementArray(options.type, array, options);
            } else {
                sortInt32(array, parameter2);
            }
        }
    } else {
        if (parameters.length === 0) {
            sortElementArray("", array, {});
        } else if (parameters.length === 1) {
            if (isPlainObject(parameter2)) {
                let type = parameter2.type ? parameter2.type.toLowerCase() : "";
                sortElementArray(type, array, parameter2);
            } else if (isFunction(parameter2)) {
                sortObjectArrayByKey("", array, parameter2, {})
            } else if (isArray(parameter2)) {
                let sortByArray = parameter2;
                for (let i = sortByArray.length -1; i >= 0; i--) {
                    let options = sortByArray[i];
                    let type = options.type ? options.type : "";
                    type = type.toLowerCase();
                    let key = options.key;
                    sortObjectArrayByKey(type, array, key, options);
                }
            } else {
                throw new Error("Invalid parameter type. Expected an object or a function.");
            }
        } else if (parameters.length === 2) {
            if (!isFunction(parameter2) && !isArray(parameter2)) {
                throw new Error("Invalid parameter type. Expected a function or an array as the second parameter.");
            }
            if (!isPlainObject(parameter3)) {
                throw new Error("Invalid parameter type. Expected an object as the third parameter.");
            }
            if (isFunction(parameter2)) {
                let type = parameter3.type ? parameter3.type : (parameter2.type ? parameter2.type : "");
                type = type.toLowerCase();
                sortObjectArrayByKey(type, array, parameter2, parameter3);
            } else {
                let sortByArray = parameter2;
                for (let i = sortByArray.length -1; i >= 0; i--) {
                    let sortBy = sortByArray[i];
                    let type = sortBy.type ? sortBy.type : "";
                    type = type.toLowerCase();
                    let key = sortBy.key;
                    if (key === null || key === undefined) {
                        throw new Error("Invalid parameter type. Expected a function (x) ==> x.field");
                    }
                    let options =  mergeOptions(parameter3, sortBy)
                    sortObjectArrayByKey(type, array, key, options);
                }
            }
        } else {
            throw new Error("Invalid number of parameters. Expected 1, 2, or 3 parameters.");
        }
    }
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

function sortSubList(array, start, end, comparator, isTyped) {
    if (end - start >= 2) {
        if (isTyped) {
            array.subarray(start, end).sort(comparator);
        } else {
            const subArray = array.slice(start, end);
            subArray.sort(comparator);
            array.splice(start, subArray.length, ...subArray);
        }
    }
}

function sortBigIntArray(array, options) {
    sortObjectByFloat64Key(array, (x) => {
        return x === null || x === undefined ? x : Number(x);
    }, options);
    let isTyped = isTypedArray(array);

    //fix 2^53-1 limit for int64 and uint64, but this is the best we can do in JS
    let asc = options.order !== 'desc';
    let comparator = (a, b) => {
        if (a < b) {
            return asc ? -1 : 1;
        }
        if (a > b) {
            return asc ? 1 : -1;
        }
        return 0;
    };
    let previousNumber = null;
    let previousIndex = null;
    for (let i = 0; i < array.length; i++) {
        let element = array[i];
        if (element === null || element === undefined) {
            continue;
        }
        let number = Number(element);
        if (number !== previousNumber) {
            sortSubList(array, previousIndex, i, comparator, isTyped);
            previousNumber = number;
            previousIndex = i;
        }
    }
    // Fix: sort any remaining duplicates at the end
    if (typeof previousIndex === 'number') {
        sortSubList(array, previousIndex, array.length, comparator, isTyped);
    }
}

function sortObjectByBigIntKey(array, key, options) {
    sortObjectByFloat64Key(array, (x) => {
        const value = key(x);
        return value === null || value === undefined ? value : Number(value);
    }, options);

    //fix 2^53-1 limit for int64 and uint64, but this is the best we can do in JS
    let isTyped = false;
    let asc = options.order !== 'desc';
    let comparator = (a, b) => {
        let ka = key(a);
        let kb = key(b);
        if (ka < kb) {
            return asc ? -1 : 1;
        }
        if (ka > kb) {
            return asc ? 1 : -1;
        }
        return 0;
    };
    let previousNumber = null;
    let previousIndex = null;
    for (let i = 0; i < array.length; i++) {
        let element = array[i];
        if (element === null || element === undefined) {
            continue;
        }
        let value = key(element);
        let number = Number(value);
        if (number !== previousNumber) {
            sortSubList(array, previousIndex, i, comparator, false);
            previousNumber = number;
            previousIndex = i;
        }
    }
    // Fix: sort any remaining duplicates at the end
    if (typeof previousIndex === 'number') {
        sortSubList(array, previousIndex, array.length, comparator, false);
    }
}


function sortElementArray(type, array, options) {
    if (["int32", "uint32", "int16", "uint16", "int8", "uint8", "uint8clamped"].includes(type)) {
        sortInt32(array, options);
    } else {
        if (type.length === 0) {
            type = detectPrimitiveValueType(array);
        }
        if (type === "float64" || type === "number") {
            sortFloat64(array, options);
        } else if (type === "date") {
            sortObjectByFloat64Key(array, (x) => x.getTime(), options)
        } else if (type === "boolean") {
            sortObjectByInt32Key(array, (x) => x ? 1 : 0, options);
        } else if (type === "string") {
            sortStringArray(array, options);
        } else if (type === "int64" || type === "uint64" || type === "bigint") {
            sortBigIntArray(array, options);
        }
    }
}


function sortObjectArrayByKey(type, array, key, options) {
    if (["int32", "int16", "uint16", "int8", "uint8", "uint8clamped"].includes(type)) {
        sortObjectByInt32Key(array, key, options);
    } else {
        if (type.length === 0) {
            type = detectObjectValueType(array, key);
        }
        if (type === "float64" || type === "uint32") {
            sortObjectByFloat64Key(array, key, options);
        } else if (type === "int64" || type === "uint64" || type === "bigint") {
            sortObjectByBigIntKey(array, key, options);
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
    for (const value of list) {
        if (value === null || value === undefined) {
            continue;
        }
        if (typeof value === "string" || value instanceof String) {
            return "string";
        }
        if (typeof value === "boolean" || value instanceof Boolean) {
            return "boolean";
        }
        if (typeof value === "number" || Number.isNaN(Number(value))) {
            return "float64";
        }
        if (typeof value === "bigint") {
            return "bigint";
        }
        if (value instanceof Date) {
            return "date"
        }
    }
    return "string";
}

function detectObjectValueType(list, mapper) {
    for (const object of list) {
        let value = mapper(object);

        if (value === null || value === undefined) {
            continue;
        }
        if (typeof value === "string" || value instanceof String) {
            return "string"
        }
        if (typeof value === "boolean" || value instanceof Boolean) {
            return "boolean";
        }
        if (value instanceof Date) {
            return "date";
        }
        if (typeof value === "number" || Number.isNaN(Number(value))) {
            return  "float64";
        }
        if (typeof value === "bigint" || Number.isNaN(Number(value))) {
            return  "bigint";
        }
    }
    return "string";
}

function sortStringArray(arr, options = {}) {
    const {
        start = 0,
        end = arr.length,
        nulls = 'ignore', // 'first' | 'last' | 'ignore'
        order = 'asc'    // 'asc' | 'desc'
    } = options;

    let stringComparator = (a, b) => {
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
    };

    sortSubList(arr, start,end, stringComparator, false);
    return arr;
}

function sortObjectArrayStringKey(arr, key, options = {}) {
    const {
        start = 0,
        end = arr.length,
        nulls = 'ignore', // 'first' | 'last' | 'ignore'
        order = 'asc'    // 'asc' | 'desc'
    } = options;

    let stringComparator = (itemA, itemB) => {
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
    };

    sortSubList(arr, start,end, stringComparator, false);
    return arr;
}