const fs = require('fs');

try {
    const envPath = '.env.local';
    let content = '';
    if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf8');
    }

    // Check if key already exists
    if (!content.includes('TMAP_API_KEY')) {
        const newKey = '\nTMAP_API_KEY=ZQK0YFDEAi31iDJ7npsDC9Ux8IM2rDOKRk5vK8Wd\n';
        fs.appendFileSync(envPath, newKey);
        console.log("Added TMAP_API_KEY to .env.local");
    } else {
        console.log("TMAP_API_KEY already exists in .env.local");
    }
} catch (e) {
    console.error("Error updating .env.local:", e);
}
