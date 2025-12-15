
const fs = require('fs');

try {
    const raw = fs.readFileSync('output_plan.json', 'utf16le'); // PowerShell output is usually UTF-16LE
    const data = JSON.parse(raw.trim());

    if (data.plans && data.plans.length > 0) {
        const firstStep = data.plans[0].steps[0];
        console.log("First Step:", firstStep.placeName);
        console.log("PathToNext Type:", typeof firstStep.pathToNext);
        console.log("PathToNext Length:", firstStep.pathToNext ? firstStep.pathToNext.length : 'undefined');
        if (firstStep.pathToNext && firstStep.pathToNext.length > 0) {
            console.log("First Point:", JSON.stringify(firstStep.pathToNext[0]));
        }
    } else {
        console.log("No plans found.");
    }
} catch (e) {
    console.error("Error:", e.message);
}
