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

        console.log(`Testing Key: ${apiKey.substring(0, 5)}...`);

        // Test 1: POI Search (Simplest GET)
        console.log("\n--- Test 1: POI Search (GET) ---");
        try {
            const poiUrl = `https://apis.openapi.sk.com/tmap/pois?version=1&searchKeyword=Seoul&appKey=${apiKey}`;
            const res = await fetch(poiUrl);
            const text = await res.text();
            if (res.ok) {
                console.log("POI Test SUCCESS!");
            } else {
                console.log(`POI Test FAILED: ${res.status}`);
                console.log(text.substring(0, 200));
            }
        } catch (e) {
            console.log("POI Test Exception:", e.message);
        }

        // Test 2: Pedestrian Route (POST) - Header Method
        console.log("\n--- Test 2: Pedestrian Route (POST - Header) ---");
        try {
            const url = 'https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json';
            const origin = { lat: 37.4979, lng: 127.0276 };
            const destination = { lat: 37.5116, lng: 127.0591 };

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
            const text = await response.text();
            if (response.ok) {
                console.log("Pedestrian Test SUCCESS!");
            } else {
                console.log(`Pedestrian Test FAILED: ${response.status}`);
                console.log(text);
            }
        } catch (e) {
            console.log("Pedestrian Test Exception:", e.message);
        }

    } catch (e) {
        console.error(e);
    }
}

testTMap();
