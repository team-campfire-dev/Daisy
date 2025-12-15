'use client';

import KakaoMapComponent from '@/components/map/KakaoMapComponent';
import { CoursePlan } from '@/services/gemini';

const TEST_PLAN: CoursePlan = {
    id: 'TEST',
    title: 'Test Course: Seoul Tour',
    description: 'Testing Kakao Map rendering functionality',
    totalDuration: '1h',
    transportation: 'walk',
    steps: [
        {
            placeName: 'Gyeongbokgung Palace',
            category: 'Activity',
            description: 'Main royal palace',
            duration: '1h',
            location: { lat: 37.5796, lng: 126.9770 },
            detail: { rating: 4.8 }
        },
        {
            placeName: 'Bukchon Hanok Village',
            category: 'Activity',
            description: 'Traditional village',
            duration: '1h',
            location: { lat: 37.5826, lng: 126.9837 },
            detail: { rating: 4.6 }
        }
    ]
};

export default function MapTestPage() {
    return (
        <div className="w-full h-screen flex flex-col">
            <div className="p-4 bg-slate-900 text-white shrink-0">
                <h1 className="text-xl font-bold">Kakao Map Test Page</h1>
                <p className="text-sm text-gray-300">
                    If you see markers on the map below, the API Key and Script Loading are working correctly.
                </p>
                <div className="mt-2 text-xs bg-black/30 p-2 rounded">
                    Key used: {process.env.NEXT_PUBLIC_KAKAO_APP_KEY ? `${process.env.NEXT_PUBLIC_KAKAO_APP_KEY.slice(0, 5)}...` : 'Undefined'}
                </div>
            </div>
            <div className="flex-1 relative bg-gray-100">
                <KakaoMapComponent plan={TEST_PLAN} />
            </div>
        </div>
    );
}
