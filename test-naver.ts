
import { searchNaverPlaces } from './src/lib/naver';

async function test() {
    console.log("Testing Naver Search...");
    const results = await searchNaverPlaces("강남역 맛집", 5);
    console.log("Results for '강남역 맛집':", results.length);
    if (results.length > 0) {
        console.log("First result:", results[0]);
    } else {
        console.log("No results. Envs check:");
        console.log("ID:", process.env.NEXT_PUBLIC_NAVER_CLIENT_ID ? "Set" : "Missing");
        console.log("Secret:", process.env.NEXT_PUBLIC_NAVER_CLIENT_SECRET ? "Set" : "Missing"); // CAREFUL searching env
    }
}

test();
