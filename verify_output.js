const fs = require('fs');

try {
    // Check Plan Output
    const planRaw = fs.readFileSync('debug_plan.json', 'utf16le');
    const planJson = JSON.parse(planRaw.trim());

    if (planJson.plans && planJson.plans.length > 0) {
        planJson.plans[0].steps.forEach((step, i) => {
            console.log(`Step ${i} debug_poly_len: ${step.debug_poly_len}`);
            console.log(`Step ${i} debug_error: ${step.debug_error}`);
            console.log(`Step ${i} debug_origin: ${step.debug_origin}`);
            console.log(`Step ${i} debug_dest: ${step.debug_dest}`);
            console.log(`Step ${i} pathToNext type: ${typeof step.pathToNext}`);
            if (step.pathToNext) console.log(`Step ${i} pathToNext len: ${step.pathToNext.length}`);
        });
    }

    // Check Adaptive Output
    const adaptiveRaw = fs.readFileSync('output_adaptive.json', 'utf16le');
    const adaptiveJson = JSON.parse(adaptiveRaw.trim());

    const adaptivePlans = adaptiveJson.plans && adaptiveJson.plans.length > 0;
    // Check for "Peaches" or "피치스" in any step name
    const hasPeaches = adaptivePlans && adaptiveJson.plans.some(p =>
        p.steps.some(s => s.placeName.includes('Peaches') || s.placeName.includes('피치스') || s.placeName.includes('도원'))
    );

    console.log(`Adaptive Plan Generated: ${adaptivePlans}`);
    console.log(`Specific Place (Peaches) Found: ${hasPeaches}`);

} catch (e) {
    console.error("Verification Script Error:", e);
}
