import {arrayCopy, rotateRight} from "./sorter-utils.js";

export function partitionStableInt(array, start, endP1, mask, aux, mapper) {
    let left = start;
    let right = 0;
    for (let i = start; i < endP1; i++) {
        let element = mapper(array[i]);
        if ((element & mask) === 0) {
            array[left] = array[i];
            left++;
        } else {
            aux[right] = array[i];
            right++;
        }
    }
    arrayCopy(aux, 0, array, left, right);
    return left;
}

export function partitionStableBInt(array, start, endP1, mask, aux, mapper) {
    let left = endP1 - 1;
    let right = aux.length - 1;
    for (let i = endP1 - 1; i >= start; i--) {
        let element = mapper(array[i]);
        if (!((element & mask) === 0)) {
            array[left] = array[i];
            left--;
        } else {
            aux[right] = array[i];
            right--;
        }
    }
    arrayCopy(aux, right + 1, array, start, aux.length - 1 - right);
    return left + 1;
}

export function partitionReverseStableInt(array, start, endP1, mask, aux, mapper) {
    let left = start;
    let right = 0;
    for (let i = start; i < endP1; i++) {
        let element = mapper(array[i]);
        if (!((element & mask) === 0)) {
            array[left] = array[i];
            left++;
        } else {
            aux[right] = array[i];
            right++;
        }
    }
    arrayCopy(aux, 0, array, left, right);
    return left;
}

export function partitionReverseStableBInt(array, start, endP1, mask, aux, mapper) {
    let left = endP1 - 1;
    let right = aux.length - 1;
    for (let i = endP1 - 1; i >= start; i--) {
        let element = mapper(array[i]);
        if ((element & mask) === 0) {
            array[left] = array[i];
            left--;
        } else {
            aux[right] = array[i];
            right--;
        }
    }
    arrayCopy(aux, right + 1, array, start, aux.length - 1 - right);
    return left + 1;
}


export function calculateMaskInt(array, start, endP1, mapper) {
    let mask = 0x00000000;
    let inv_mask = 0x00000000;
    for (let i = start; i < endP1; i++) {
        let ei = mapper(array[i]);
        mask = mask | ei;
        inv_mask = inv_mask | (~ei);
    }
    return mask & inv_mask;
}

const BUFFER_SIZE = 2;

export function partitionStableLowMemInt(array, start, endP1, mask, mapper) {
    ///Skip what is already sorted
    let i = start;
    while (i < endP1 && (mapper(array[i]) & mask) === 0) {
        i++;
    }
    start = i;
    i = endP1 - 1;
    while (i > start && !((mapper(array[i]) & mask) === 0)) {
        i--;
    }
    endP1 = i + 1;
    
    if (endP1 - start < 2) {
        return start;
    }

    ///Create Buffer >=1
    let aux = new Array(BUFFER_SIZE);

    ///Stable Partition with Buffer
    generateWhiteBlackBlocksAndMerge(array, start, endP1, mask, mapper, aux, true);

    ///Test first element
    i = start;
    if (!((mapper(array[i]) & mask) === 0)) {
        while (i < endP1 && !((mapper(array[i]) & mask) === 0)) {
            i++;
        }
        //rotate to get white first
        rotateRight(array, start, endP1, endP1 - i);
        return start + (endP1 - i);
    } else {
        while (i < endP1 && ((mapper(array[i]) & mask) === 0)) {
            i++;
        }
        return i;
    }
}

export function partitionReverseStableLowMemInt(array, start, endP1, mask, mapper) {
    ///Skip what is already sorted
    let i = start;
    while (i < endP1 && !((mapper(array[i]) & mask) === 0)) {
        i++;
    }
    start = i;
    i = endP1 - 1;
    while (i > start && ((mapper(array[i]) & mask) === 0)) {
        i--;
    }
    endP1 = i + 1;

    if (endP1 - start < 2) {
        return start;
    }
    
    ///Create Buffer >=1
    let aux = new Array(BUFFER_SIZE);

    ///Stable Partition with Buffer
    generateWhiteBlackBlocksAndMerge(array, start, endP1, mask, mapper, aux, true);

    ///Test first element
    i = start;
    if ((mapper(array[i]) & mask) === 0) {
        while (i < endP1 && ((mapper(array[i]) & mask) === 0)) {
            i++;
        }
        //rotate to get black first
        rotateRight(array, start, endP1, endP1 - i);
        return start + (endP1 - i);
    } else {
        while (i < endP1 && (!((mapper(array[i]) & mask) === 0))) {
            i++;
        }
        return i;
    }
}


function generateWhiteBlackBlocksAndMerge(array, start, endP1, mask, mapper, aux, whiteBefore) {
    //generate black/white or white/black blocks with aux buffer
    let bufferSize = aux.length;
    let i = start;
    for (; i < endP1;) {
        let white = 0;
        let black = 0;
        //maybe by 4 instead of by 2
        let j = i;
        for (; j < endP1; j++) {
            if ((mapper(array[j]) & mask) === 0) {
                white++;
            } else {
                black++;
            }
            if (Math.min(black, white) > bufferSize) {
                break;
            }
        }
        let maxjP1 = j;
        if (white > black) {
            if (whiteBefore) {
                //white - white - black -->
                partitionStableInt(array, i, maxjP1, mask, aux, mapper);
                whiteBefore = false;
            } else {
                //black  - black - white <--
                partitionReverseStableBInt(array, i, maxjP1, mask, aux, mapper);
                whiteBefore = true;
            }
        } else {
            if (!whiteBefore) {
                //black - black - white -->
                partitionReverseStableInt(array, i, maxjP1, mask, aux, mapper);
                whiteBefore = true;
            } else {
                //white - white - black <--
                partitionStableBInt(array, i, maxjP1, mask, aux, mapper);
                whiteBefore = false;
            }
        }
        i = maxjP1;
    }

    //merge blocks

    // repeat until there are 3 blocks (white, black, white) (black, white, black)

    // W W 

    //WBWBWBWBWBWBWBWB
    //W
    //WB
    //WBW
    //WBWB
    //WBWBW


    //WBWBW
    //WWBBW
    //WBW

    i = start;
    let nshifts = 0;
    while (i < endP1) {
        let white = (mapper(array[i]) & mask) === 0;
        if (white) {
            let white1Start = i;
            i = i + 1;
            while (i < endP1 && (mapper(array[i]) & mask) === 0) {
                i++;
            }
            let white1EndP1 = i;
            let blackStart = i;
            while (i < endP1 && (!((mapper(array[i]) & mask) === 0))) {
                i++;
            }
            let blackEnd = i;
            if (blackEnd - blackStart === 0) {
                if (nshifts <= 1) {
                    break;
                }
            }
            let white2Start = i;
            while (i < endP1 && (mapper(array[i]) & mask) === 0) {
                i++;
            }
            let white2End = i;
            if (white2End - white2Start === 0) {
                if (nshifts === 0) {
                    break;
                }
            }
            rotateRight(array, blackStart, white2End, white2End - white2Start);
            //swap black with white2; 
            nshifts++;
            if (white2End === endP1) {
                //start another round
                i = start;
                nshifts = 0;
            }
            // WWBBBWWW
            // WWWWWBBB
        } else {
            let black1Start = i;
            i = i + 1;
            while (i < endP1 && (mapper(array[i]) & mask) === 0) {
                i++;
            }
            let black1EndP1 = i;
            let whiteStart = i;
            while (i < endP1 && !((mapper(array[i]) & mask) === 0)) {
                i++;
            }
            let whiteEnd = i;
            if (whiteEnd - whiteStart === 0) {
                if (nshifts <= 1) {
                    break;
                }
            }
            let black2Start = i;
            while (i < endP1 && (mapper(array[i]) & mask) === 0) {
                i++;
            }
            let black2End = i;
            if (black2End - black2Start === 0) {
                if (nshifts === 0) {
                    break;
                }
            }
            rotateRight(array, whiteStart, black2End, black2End - black2Start);
            //swap black with white2;
            nshifts++;
            if (black2End === endP1) {
                //start another round
                i = start;
                nshifts = 0;
            }
            // WWBBBWWW
            // WWWWWBBB
        }
    }
    
}
