
const fs = require('fs');

try {
    console.log("Reading debug_plan.json...");
    const buffer = fs.readFileSync('debug_plan.json');

    // Try UTF-8
    const str8 = buffer.toString('utf8');
    if (str8.includes('debug_poly_len')) {
        console.log("Match in UTF-8:");
        const idx = str8.indexOf('debug_poly_len');
        console.log(str8.substring(idx, idx + 60));
    } else {
        console.log("No match in UTF-8");
    }

    // Try UTF-16LE
    const str16 = buffer.toString('utf16le');
    if (str16.includes('debug_poly_len')) {
        console.log("Match in UTF-16LE:");
        const idx = str16.indexOf('debug_poly_len');
        console.log(str16.substring(idx, idx + 60));
    } else {
        console.log("No match in UTF-16LE");
    }

    // Also check for debug_error
    if (str8.includes('debug_error') || str16.includes('debug_error')) {
        console.log("Found debug_error present!");
        const idx = str8.indexOf('debug_error');
        if (idx !== -1) console.log(str8.substring(idx, idx + 200));
        const idx16 = str16.indexOf('debug_error');
        if (idx16 !== -1) console.log(str16.substring(idx16, idx16 + 200));

        const destIdx = str8.indexOf('debug_dest');
        if (destIdx !== -1) console.log("Dest:", str8.substring(destIdx, destIdx + 100));
    }

} catch (e) {
    console.error("Script Error:", e);
}
