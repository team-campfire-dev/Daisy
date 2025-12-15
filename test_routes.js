const fs = require('fs');

async function testRoute() {
    try {
        const envContent = fs.readFileSync('.env.local', 'utf8');
        const match = envContent.match(/GOOGLE_PLACES_API_KEY=(.*)/);
        const apiKey = match ? match[1].trim() : null;

        if (!apiKey) {
            console.error("API Key not found in .env.local");
            return;
        }

        const origin = { lat: 37.419734, lng: -122.0827784 }; // Google HQ
        const destination = { lat: 37.417670, lng: -122.079595 }; // Nearby

        const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
        const requestBody = {
            origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
            destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
            travelMode: 'WALK',
            computeAlternativeRoutes: false
        };

        console.log("Request Body:", JSON.stringify(requestBody, null, 2));

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': '*'
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`Error ${response.status}: ${text}`);
        } else {
            const data = await response.json();
            console.log("Success! Route found:", JSON.stringify(data, null, 2));
        }

    } catch (e) {
        console.error("Exception:", e);
    }
}

testRoute();
