export function testArraysEquals(expected, current, f) {
    let firstError = null;
    let equal = expected.length === current.length && current.every(function (value, index) {
        if (value === expected[index]) {
            return true;
        } else {
            if (!firstError) {
                firstError = {"index": index, "expected": expected[index], "current": current[index]};
            }
            return false;
        }
    })
    if (!equal) {
        if (f) {
            f(firstError);
        }
    }
    return equal;
}
