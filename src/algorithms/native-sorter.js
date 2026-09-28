export function sortSubList(array, start, end, comparator, isTyped) {
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

export function getStringComparator(order, nulls) {
    return (a, b) => {
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
}

export function get64BitComparatorNonNull(asc) {
    return asc
        ? (a, b) => (a > b ? 1 : a < b ? -1 : 0)
        : (a, b) => (a < b ? 1 : a > b ? -1 : 0);
}

export function getObjectStringKeyComparator(key, order, nulls) {
    return (itemA, itemB) => {
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
}

export function getObject64BitKeyComparatorNonNull(asc, key) {
    return asc
        ? (a, b) => {
            let ka = key(a);
            let kb = key(b);
            return ka > kb ? 1 : ka < kb ? -1 : 0
        }
        : (a, b) => {
            let ka = key(a);
            let kb = key(b);
            return ka < kb ? 1 : ka > kb ? -1 : 0
        };
}

/**
 * Comparator for sorting a list of objects by a property
 *   Supporting the list NOT having nulls, undefined, nans elements, all elements are valid objects
 *   Also supporting for valid objects supporting the property to have values of nulls, undefined and nans
 * @param asc true/false
 * @param nulls can have three values ignore, first, last
 * @param mapper
 * @returns {(function(*, *): (number|number))|*|(function(*, *): *)|(function(*, *): (number|*))}
 */
export function getComparatorObjectInt32(asc, nulls, mapper) {
    if (nulls === "ignore") {
        return asc
            ? (a, b) => {
                if (a === b) return 0;
                return mapper(a) - mapper(b);
            }
            : (a, b) => {
                if (a === b) return 0;
                return mapper(b) - mapper(a);
            };
    }

    if (nulls === "first") {
        // Root Target:   [ nulls, objects..., NaNs, undefineds ]
        // Mapped Target: [ nulls, numbers..., NaNs, undefineds ]
        return asc
            ? (a, b) => {
                if (a === b) return 0;

                // 2. MAPPED VALUE CHECKS
                const vA = mapper(a);
                const vB = mapper(b);
                if (vA === vB) return 0;

                if (vA === undefined) return 1;
                if (vB === undefined) return -1;
                if (vA !== vA) return 1;
                if (vB !== vB) return -1;
                if (vA === null) return (vB === null) ? 0 : -1;
                if (vB === null) return 1;

                return vA - vB;
            }
            : (a, b) => {
                if (a === b) return 0;

                // 2. MAPPED VALUE CHECKS
                const vA = mapper(a);
                const vB = mapper(b);
                if (vA === vB) return 0;

                if (vA === undefined) return 1;
                if (vB === undefined) return -1;
                if (vA !== vA) return 1;
                if (vB !== vB) return -1;
                if (vA === null) return (vB === null) ? 0 : -1;
                if (vB === null) return 1;

                return vB - vA;
            };
    }

    if (nulls === "last") {
        // Root Target:   [ objects..., NaNs, nulls, undefineds ]
        // Mapped Target: [ numbers..., NaNs, nulls, undefineds ]
        return asc
            ? (a, b) => {
                if (a === b) return 0;

                // 2. MAPPED VALUE CHECKS
                const vA = mapper(a);
                const vB = mapper(b);
                if (vA === vB) return 0;

                if (vA === undefined) return 1;
                if (vB === undefined) return -1;
                if (vA === null) return 1;
                if (vB === null) return -1;
                if (vA !== vA) return (vB !== vB) ? 0 : 1;
                if (vB !== vB) return -1;

                return vA - vB;
            }
            : (a, b) => {
                // 2. MAPPED VALUE CHECKS
                const vA = mapper(a);
                const vB = mapper(b);
                if (vA === vB) return 0;

                if (vA === undefined) return 1;
                if (vB === undefined) return -1;
                if (vA === null) return 1;
                if (vB === null) return -1;
                if (vA !== vA) return (vB !== vB) ? 0 : 1;
                if (vB !== vB) return -1;

                return vB - vA;
            };
    }
    console.error("[getComparatorObjectInt32] Invalid parameters returning default comparator")
    return (a, b) => mapper(a) - mapper(b);
}


/**
 * Comparator for sorting a list of objects by a property
 *   Supporting the list having nulls, undefined, nans
 *   Also supporting for valid objects supporting the property to have values of nulls, undefined and nans
 * @param asc true/false
 * @param nulls can have three values ignore, first, last
 * @param mapper
 * @returns {(function(*, *): (number|number))|*|(function(*, *): *)|(function(*, *): (number|*))}
 */
export function getComparatorObjectInt32Full(asc, nulls, mapper) {
    if (nulls === "ignore") {
        return asc
            ? (a, b) => {
                if (a === b) return 0;
                return mapper(a) - mapper(b);
            }
            : (a, b) => {
                if (a === b) return 0;
                return mapper(b) - mapper(a);
            };
    }

    if (nulls === "first") {
        // Root Target:   [ nulls, objects..., NaNs, undefineds ]
        // Mapped Target: [ nulls, numbers..., NaNs, undefineds ]
        return asc
            ? (a, b) => {
                if (a === b) return 0;

                // 1. ROOT LEVEL CHECKS
                if (a === undefined) return 1;
                if (b === undefined) return -1;
                if (a !== a) return 1;
                if (b !== b) return -1;
                if (a === null) return (b === null) ? 0 : -1;
                if (b === null) return 1;

                // 2. MAPPED VALUE CHECKS
                const vA = mapper(a);
                const vB = mapper(b);
                if (vA === vB) return 0;

                if (vA === undefined) return 1;
                if (vB === undefined) return -1;
                if (vA !== vA) return 1;
                if (vB !== vB) return -1;
                if (vA === null) return (vB === null) ? 0 : -1;
                if (vB === null) return 1;

                return vA - vB;
            }
            : (a, b) => {
                if (a === b) return 0;

                // 1. ROOT LEVEL CHECKS
                if (a === undefined) return 1;
                if (b === undefined) return -1;
                if (a !== a) return 1;
                if (b !== b) return -1;
                if (a === null) return (b === null) ? 0 : -1;
                if (b === null) return 1;

                // 2. MAPPED VALUE CHECKS
                const vA = mapper(a);
                const vB = mapper(b);
                if (vA === vB) return 0;

                if (vA === undefined) return 1;
                if (vB === undefined) return -1;
                if (vA !== vA) return 1;
                if (vB !== vB) return -1;
                if (vA === null) return (vB === null) ? 0 : -1;
                if (vB === null) return 1;

                return vB - vA;
            };
    }

    if (nulls === "last") {
        // Root Target:   [ objects..., NaNs, nulls, undefineds ]
        // Mapped Target: [ numbers..., NaNs, nulls, undefineds ]
        return asc
            ? (a, b) => {
                if (a === b) return 0;

                // 1. ROOT LEVEL CHECKS
                if (a === undefined) return 1;
                if (b === undefined) return -1;
                if (a === null) return 1;
                if (b === null) return -1;
                if (a !== a) return (b !== b) ? 0 : 1;
                if (b !== b) return -1;

                // 2. MAPPED VALUE CHECKS
                const vA = mapper(a);
                const vB = mapper(b);
                if (vA === vB) return 0;

                if (vA === undefined) return 1;
                if (vB === undefined) return -1;
                if (vA === null) return 1;
                if (vB === null) return -1;
                if (vA !== vA) return (vB !== vB) ? 0 : 1;
                if (vB !== vB) return -1;

                return vA - vB;
            }
            : (a, b) => {
                if (a === b) return 0;

                // 1. ROOT LEVEL CHECKS
                if (a === undefined) return 1;
                if (b === undefined) return -1;
                if (a === null) return 1;
                if (b === null) return -1;
                if (a !== a) return (b !== b) ? 0 : 1;
                if (b !== b) return -1;

                // 2. MAPPED VALUE CHECKS
                const vA = mapper(a);
                const vB = mapper(b);
                if (vA === vB) return 0;

                if (vA === undefined) return 1;
                if (vB === undefined) return -1;
                if (vA === null) return 1;
                if (vB === null) return -1;
                if (vA !== vA) return (vB !== vB) ? 0 : 1;
                if (vB !== vB) return -1;

                return vB - vA;
            };
    }
    console.error("[getComparatorObjectInt32Full] Invalid parameters returning default comparator")
    return (a, b) => mapper(a) - mapper(b);
}
