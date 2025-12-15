const fs = require('fs');

async function testKakao() {
    try {
        const envContent = fs.readFileSync('.env.local', 'utf8');
        const match = envContent.match(/KAKAO_REST_API_KEY=(.*)/);
        const apiKey = match ? match[1].trim() : null;

        if (!apiKey) {
            console.error("No Kakao Key");
            return;
        }

        const origin = "127.0276,37.4979"; // Gangnam
        const destination = "127.0591,37.5116"; // COEX

        // Try to force walking if possible (undocumented/guess)
        const url = `https://apis-navi.kakaomobility.com/v1/directions?origin=${origin}&destination=${destination}&priority=RECOMMEND&car_type=1&vehicle_type=WALK`;

        console.log("Fetching Kakao...");
        const response = await fetch(url, {
            headers: {
                'Authorization': `KakaoAK ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error(response.status, await response.text());
        } else {
            const data = await response.json();
            console.log("Success! Routes:", data.routes ? data.routes.length : 0);
            if (data.routes && data.routes.length > 0) {
                console.log("Distance:", data.routes[0].summary.distance);
            }
        }
    } catch (e) {
        console.error(e);
    }
}

testKakao();
