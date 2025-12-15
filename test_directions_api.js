const fs = require('fs');

async function testDirections() {
    try {
        const envContent = fs.readFileSync('.env.local', 'utf8');
        const match = envContent.match(/GOOGLE_PLACES_API_KEY=(.*)/);
        const apiKey = match ? match[1].trim() : null;

        if (!apiKey) {
            console.error("API Key not found");
            return;
        }

        const origin = "37.4979,127.0276"; // Gangnam
        const destination = "37.4990,127.0290"; // Very close to Gangnam

        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=transit&region=kr&key=${apiKey}`;

        console.log(`Fetching ${url.replace(apiKey, "KEY")}...`);

        const response = await fetch(url);
        const data = await response.json();

        console.log("Status:", data.status);
        if (data.routes && data.routes.length > 0) {
            console.log("Found route!");
            console.log("Legs:", data.routes[0].legs.length);
            console.log("Distance:", data.routes[0].legs[0].distance.text);
        } else {
            console.log("No routes found.");
        }

    } catch (e) {
        console.error(e);
    }
}

testDirections();
