
const https = require('https');
const fs = require('fs');
const path = require('path');

// Manually load .env.local
try {
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.log("No .env.local found");
}

const CLIENT_ID = process.env.NAVER_SEARCH_CLIENT_ID;
const CLIENT_SECRET = process.env.NAVER_SEARCH_CLIENT_SECRET;

console.log("ID:", CLIENT_ID);
console.log("Secret:", CLIENT_SECRET ? "******" : "Missing");

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
        console.log("BODY:", data);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
