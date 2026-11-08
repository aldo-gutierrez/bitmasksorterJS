import {sortFloat64} from "./sorter-number.js";
import {sortObjectByFloat64Key} from "./sorter-object-number.js";
import {sortObjectByInt32Key} from "./sorter-object-int.js";
import {sortInt32} from "./sorter-int.js";
import {getSortOptions, handleNullsUndefinedAndNans, validateSortRange} from "./sorter-utils.js";
import {isArray, isBigInt64Array, isBigUint64Array, isFunction, isPlainObject, isTypedArray} from "./utils.js";
import {
    get64BitComparatorNonNull,
    getObject64BitKeyComparatorNonNull,
    getObjectStringKeyComparator,
    getStringComparator,
    sortSubList
} from "../algorithms/native-sorter.js";

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
    const parameter3 = parameters[1];
    if (isTypedArray(array)) {
        if (!isPlainObject(parameter2)) {
            parameter2  = {}
        }
        parameter2.type = normalizeType(parameter2.type);
        if (array instanceof Float64Array || array instanceof Float32Array ||  array instanceof Uint32Array) {
            sortFloat64(array, parameter2);
        } else {
            const isBigInt64 = isBigInt64Array(array);
            const isBigUint64 = isBigUint64Array(array);
            if (isBigInt64 || isBigUint64) {
                parameter2.type = isBigInt64 ? "int64" : "uint64";
                sortFloat64(array, parameter2);
            } else {
                sortInt32(array, parameter2);
            }
        }
    } else {
        if (parameters.length === 0) {
            sortElementArray("", array, {});
        } else if (parameters.length === 1) {
            if (isPlainObject(parameter2)) {
                parameter2.type = normalizeType(parameter2.type);
                sortElementArray(parameter2.type, array, parameter2);
            } else if (isFunction(parameter2)) {
                sortObjectArrayByKey("", array, parameter2, {})
            } else if (isArray(parameter2)) {
                const sortByArray = parameter2;
                for (let i = sortByArray.length -1; i >= 0; i--) {
                    const sortBy = sortByArray[i];
                    let options;
                    if (isPlainObject(sortBy)) {
                        options = sortBy;
                        options.type = normalizeType(options.type);
                    } else if (isFunction(sortBy)) {
                        options = {};
                        options.key = sortBy;
                        options.type = "";
                    } else {
                        throw new Error("Invalid parameter type. Expected an object array or a function array.");
                    }
                    sortObjectArrayByKey(options.type, array, options.key, options);
                }
            } else {
                throw new Error("Invalid parameter type. Expected an object a function or an array of objects or functions.");
            }
        } else if (parameters.length === 2) {
            if (!isFunction(parameter2) && !isArray(parameter2)) {
                throw new Error("Invalid parameter type. Expected a function or an array as the second parameter.");
            }
            if (!isPlainObject(parameter3)) {
                throw new Error("Invalid parameter type. Expected an object as the third parameter.");
            }
            if (isFunction(parameter2)) {
                parameter3.type = normalizeType(parameter3.type);
                sortObjectArrayByKey(parameter3.type, array, parameter2, parameter3);
            } else {
                const sortByArray = parameter2;
                let start = parameter3.start ?? undefined;
                let end = parameter3.end ?? undefined;
                for (let i = sortByArray.length -1; i >= 0; i--) {
                    const sortBy = sortByArray[i];
                    let key;
                    let options;
                    let type;
                    if (isPlainObject(sortBy)) {
                        key = sortBy.key;
                        if (key === null || key === undefined) {
                            throw new Error("Invalid parameter type. Expected a function (x) ==> x.field");
                        }
                        type = normalizeType(sortBy.type);
                        if (start === undefined || end === undefined) {
                            start = sortBy.start ?? undefined;
                            end = sortBy.end ?? undefined;
                        }
                        options =  mergeOptions(parameter3, sortBy)
                    } else if (isFunction(sortBy)) {
                        type ="";
                        key = sortBy;
                        options = parameter3;
                    } else {
                        throw new Error("Invalid parameter type. Expected an object array or a function array.");
                    }
                    sortObjectArrayByKey(type, array, key, options);
                }

            }
        } else {
            throw new Error("Invalid number of parameters. Expected 1, 2, or 3 parameters.");
        }
    }
}

function normalizeType(type) {
    type = type?.toLowerCase() || "";
    if (type === "int") return "int32";
    if (type === "number") return "float64";
    return type;
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

function sortBigIntArray(array, options) {
    let {start, endP1, asc} = getSortOptions(options);
    ({start, endP1} = validateSortRange(array, start, endP1));
    const isTyped = isTypedArray(array);
    if (isTyped) {
        sortObjectByFloat64Key(array, (x) => Number(x), options);
    } else {
        ({start, endP1} = handleNullsUndefinedAndNans(array, options.nulls, start, endP1, (x) => Number(x)));
        options.start = start;
        options.end = endP1;
        options.nulls = "ignore";
        sortObjectByFloat64Key(array, (x) => Number(x), options);
    }
    correctBigIntCollisions(array, start, endP1, (value) => value, get64BitComparatorNonNull(asc), isTyped);
}

function sortObjectByBigIntKey(array, key, options) {
    let {start, endP1, asc} = getSortOptions(options);
    ({start, endP1} = validateSortRange(array, start, endP1));
    const mapper = (x) => {
        const v = key(x)
        if (v === null || v === undefined) {
            return v;
        }
        return Number(v);
    };
    ({start, endP1} = handleNullsUndefinedAndNans(array, options.nulls, start, endP1, mapper));
    options.start = start;
    options.end = endP1;
    options.nulls = "ignore";
    sortObjectByFloat64Key(array, (x) => Number(key(x)), options);

    correctBigIntCollisions(array, start, endP1, key, getObject64BitKeyComparatorNonNull(asc, key), false);
}

function correctBigIntCollisions(array, start, endP1, key, comparator, isTyped) {
    // Distinct BigInts can convert to the same floating-point number.
    let previousNumber = null;
    let previousIndex = start;
    const sortGroup = (end) => {
        if (end - previousIndex < 2) return;
        if (isTyped) {
            array.subarray(previousIndex, end).sort(comparator);
        } else {
            const group = array.slice(previousIndex, end).sort(comparator);
            for (let i = 0; i < group.length; i++) {
                array[previousIndex + i] = group[i];
            }
        }
    };
    for (let i = start; i < endP1; i++) {
        const element = array[i];
        const bigInt = key(element);
        const number = Number(bigInt);
        if (number !== previousNumber) {
            sortGroup(i);
            previousNumber = number;
            previousIndex = i;
        }
    }
    sortGroup(endP1);
}


function sortElementArray(type, array, options) {
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
            let {start, endP1, nulls} = getSortOptions(options);
            ({start, endP1} = validateSortRange(array, start, endP1));
            try {
                ({
                    start, endP1
                } = handleNullsUndefinedAndNans(array, nulls, start, endP1, key, undefined));
            } catch (e) {
                throw new Error("Error in handleNullsUndefinedAndNans: " + e.message);
            }
            options.start = start;
            options.end = endP1;
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
        if (typeof value === "number") {
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
        const value = mapper(object);

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
        if (typeof value === "number") {
            return  "float64";
        }
        if (typeof value === "bigint") {
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
    const stringComparator = getStringComparator(order, nulls);
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
    const stringComparator = getObjectStringKeyComparator(key, order, nulls);
    sortSubList(arr, start,end, stringComparator, false);
    return arr;
}