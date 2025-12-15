
const https = require('https');

const CLIENT_ID = "LS5Eb5iVAUNWgZfuk3if";
const CLIENT_SECRET = "gWnOD0TcLF";

console.log("Testing with Hardcoded Keys...");
console.log("ID:", CLIENT_ID);

const query = encodeURIComponent("강남역 맛집");
const url = `https://openapi.naver.com/v1/search/local.json?query=${query}&display=5&sort=random`;

const options = {
    headers: {
        'X-Naver-Client-Id': CLIENT_ID,
        'X-Naver-Client-Secret': CLIENT_SECRET
    }
};

const req = https.request(url, options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log("BODY_PREVIEW:", data.substring(0, 200));
        try {
            const json = JSON.parse(data);
            console.log("ITEMS FOUND:", json.items ? json.items.length : 0);
        } catch (e) {
            console.log("Invalid JSON");
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
