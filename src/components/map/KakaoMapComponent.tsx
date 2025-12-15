'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { Map, MapMarker, Polyline, CustomOverlayMap } from 'react-kakao-maps-sdk';
import { CoursePlan, CourseStep } from '@/services/gemini';

interface KakaoMapComponentProps {
    plan: CoursePlan | null;
    onMarkerClick?: (step: CourseStep) => void;
}

export default function KakaoMapComponent({ plan, onMarkerClick }: KakaoMapComponentProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);
    const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: 37.5665, lng: 126.9780 });
    const [level, setLevel] = useState<number>(7);
    const [map, setMap] = useState<kakao.maps.Map | null>(null);

    const KAKAO_SDK_URL = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_APP_KEY}&libraries=services,clusterer&autoload=false`;

    useEffect(() => {
        if (!isLoaded || !map || !plan || !plan.steps || plan.steps.length === 0) return;

        // Ensure Kakao SDK is loaded
        if (!window.kakao || !window.kakao.maps) return;

        const bounds = new kakao.maps.LatLngBounds();
        let hasValidPoint = false;

        plan.steps.forEach(step => {
            if (step.location && step.location.lat) {
                bounds.extend(new kakao.maps.LatLng(step.location.lat, step.location.lng));
                hasValidPoint = true;
            }
        });
        if (hasValidPoint && !bounds.isEmpty()) {
            map.setBounds(bounds, 100); // 100px padding
        }
    }, [isLoaded, map, plan]);

    return (
        <>
            <Script
                src={KAKAO_SDK_URL}
                strategy="afterInteractive"
                onReady={() => {
                    console.log("KaKao SDK Script: onReady triggered");
                    if (window.kakao && window.kakao.maps) {
                        window.kakao.maps.load(() => {
                            console.log("Kakao Map: Initialized via window.kakao.maps.load");
                            setIsLoaded(true);
                        });
                    } else {
                        console.error("Kakao Map: Script loaded but window.kakao is undefined");
                        // Sometimes it takes a moment, fallback retry
                        setTimeout(() => {
                            if (window.kakao && window.kakao.maps) {
                                window.kakao.maps.load(() => setIsLoaded(true));
                            } else {
                                setMapError("SDK Loaded but Object Missing (Auth Failure?)");
                            }
                        }, 500);
                    }
                }}
                onError={(e) => {
                    console.error("Kakao Map Script Load Error:", e);
                    setMapError("Script Failed to Load (Network/Blocker)");
                }}
            />

            {mapError ? (
                <div className="w-full h-full flex items-center justify-center text-red-500 flex-col gap-2 p-4 text-center">
                    <p className="font-bold">지도 로드 실패</p>
                    <p className="text-sm bg-red-100 p-2 rounded text-red-700">{mapError}</p>
                    <p className="text-xs text-slate-500">
                        1. 키가 'JavaScript Key'가 맞는지 확인 (REST Key 아님)<br />
                        2. 도메인(localhost:3000) 등록 확인<br />
                        3. 광고 차단 프로그램 확인
                    </p>
                </div>
            ) : !isLoaded ? (
                <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400 text-sm flex-col gap-2">
                    <p>지도를 불러오는 중...</p>
                    <p className="text-xs text-gray-300">잠시만 기다려주세요</p>
                </div>
            ) : (
                <Map
                    id="map"
                    center={center}
                    level={level}
                    style={{ width: "100%", height: "100%" }}
                    onCreate={setMap}
                >
                    {plan?.steps.map((step, index) => (
                        <div key={`step-group-${index}`}>
                            {step.location && step.location.lat ? (
                                <CustomOverlayMap
                                    key={`marker-${index}`}
                                    position={{ lat: step.location.lat, lng: step.location.lng }}
                                    yAnchor={1}
                                    zIndex={1}
                                >
                                    <div
                                        onClick={() => onMarkerClick && onMarkerClick(step)}
                                        className="relative cursor-pointer group"
                                    >
                                        {/* Pin Shape */}
                                        <div className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white transform transition-transform group-hover:scale-110 group-hover:bg-violet-500">
                                            <span className="text-white font-bold text-lg">{index + 1}</span>
                                        </div>
                                        {/* Triangle Arrow below */}
                                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-violet-600 absolute -bottom-1.5 left-1/2 transform -translate-x-1/2"></div>

                                        {/* Label (Optional: Show name on hover) */}
                                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                            {step.placeName}
                                        </div>
                                    </div>
                                </CustomOverlayMap>
                            ) : null}

                            {/* Polyline to Next Step */}
                            {step.pathToNext && step.pathToNext.length > 0 && (
                                <Polyline
                                    path={step.pathToNext}
                                    strokeWeight={5}
                                    strokeColor={"#7C3AED"} // Violet-600
                                    strokeOpacity={0.8}
                                    strokeStyle={"solid"}
                                />
                            )}
                        </div>
                    ))}
                </Map>
            )}
        </>
    );
}
