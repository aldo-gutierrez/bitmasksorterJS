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
