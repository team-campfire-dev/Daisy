const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
const clientSecret = process.env.NEXT_PUBLIC_NAVER_CLIENT_SECRET;

async function testSearch() {
    const query = "강남역 맛집";
    const apiUrl = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=5&sort=random`;

    console.log("Fetching:", apiUrl);

    try {
        const response = await fetch(apiUrl, {
            headers: {
                'X-Naver-Client-Id': clientId,
                'X-Naver-Client-Secret': clientSecret,
            },
        });

        if (!response.ok) {
            console.error("Error:", response.status, await response.text());
            return;
        }

        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

testSearch();
