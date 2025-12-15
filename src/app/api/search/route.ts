import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
        return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
    const clientSecret = process.env.NEXT_PUBLIC_NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return NextResponse.json({ error: 'Server configuration error: Missing API Keys' }, { status: 500 });
    }

    try {
        // Naver Local Search API URL
        const apiUrl = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=1&sort=random`;

        const response = await fetch(apiUrl, {
            headers: {
                'X-Naver-Client-Id': clientId,
                'X-Naver-Client-Secret': clientSecret,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json({ error: 'Naver API Error', details: errorData }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Search API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
