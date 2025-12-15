const fs = require('fs');

async function testTMap() {
    try {
        const envContent = fs.readFileSync('.env.local', 'utf8');
        const match = envContent.match(/TMAP_API_KEY=(.*)/);
        const apiKey = match ? match[1].trim() : null;

        if (!apiKey) {
            console.error("No TMap Key");
            return;
        }

        const origin = { lat: 37.4979, lng: 127.0276 }; // Gangnam
        const destination = { lat: 37.5116, lng: 127.0591 }; // COEX

        const url = 'https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json';

        console.log(`[TMap] Routing...`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'appKey': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                startX: origin.lng,
                startY: origin.lat,
                endX: destination.lng,
                endY: destination.lat,
                reqCoordType: "WGS84GEO",
                resCoordType: "WGS84GEO",
                startName: "Origin",
                endName: "Destination"
            })
        });

        if (!response.ok) {
            console.error(`Error ${response.status}: ${await response.text()}`);
            return;
        }

        const data = await response.json();
        console.log("Success!");
        console.log("Features:", data.features.length);
        console.log("Total Distance:", data.features[0].properties.totalDistance);
        console.log("Total Time:", data.features[0].properties.totalTime);

    } catch (e) {
        console.error(e);
    }
}

testTMap();
