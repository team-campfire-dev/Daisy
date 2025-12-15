'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
// import { Input } from '@/components/ui/input'; // Removed unused import to fix linter error
import { Search, MapPin, Star, Filter, ExternalLink } from 'lucide-react';
import { getPlaces } from '@/app/actions/getPlaces';
import { Place } from '@prisma/client';
import { motion, AnimatePresence } from 'framer-motion';

// Simple Debounce Hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function PlacesPage() {
    const [places, setPlaces] = useState<Place[]>([]);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('All');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);

    const debouncedQuery = useDebounce(query, 500);
    const { ref, inView } = useInView();

    const loadPlaces = useCallback(async (reset = false) => {
        if (loading) return;
        setLoading(true);

        const currentPage = reset ? 1 : page;
        const res = await getPlaces({
            query: debouncedQuery,
            category,
            page: currentPage,
            limit: 20
        });

        if (reset) {
            setPlaces(res.places);
        } else {
            setPlaces(prev => [...prev, ...res.places]);
        }

        setHasMore(res.hasMore);
        setTotal(res.total);
        setPage(currentPage + 1);
        setLoading(false);
    }, [debouncedQuery, category, page, loading]);

    // Initial load & Filter change
    useEffect(() => {
        setPage(1); // Reset page state first
        // We need to call a separate init function or handle the state update carefully
        // to avoid stale state. simple approach:
        const init = async () => {
            setLoading(true);
            const res = await getPlaces({ query: debouncedQuery, category, page: 1, limit: 20 });
            setPlaces(res.places);
            setHasMore(res.hasMore);
            setTotal(res.total);
            setPage(2);
            setLoading(false);
        };
        init();
    }, [debouncedQuery, category]);

    // Infinite Scroll
    useEffect(() => {
        if (inView && hasMore && !loading) {
            loadPlaces();
        }
    }, [inView, hasMore, loading, loadPlaces]);

    const categories = ["All", "restaurant", "cafe", "park", "tourist_attraction", "bar"];
    const categoryLabels: { [key: string]: string } = {
        "All": "전체",
        "restaurant": "식당",
        "cafe": "카페",
        "park": "공원",
        "tourist_attraction": "관광지",
        "bar": "술집"
    };

    return (
        <div className="min-h-screen bg-black text-white p-4 pb-20 md:p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8 sticky top-0 z-10 bg-black/80 backdrop-blur-md py-4 border-b border-white/10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                            장소 DB임 ㅎ
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            {total}개의 장소 저장됨
                        </p>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="검색..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-all text-white"
                            />
                        </div>

                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="pl-10 pr-8 py-2 bg-white/5 border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm appearance-none cursor-pointer text-white"
                            >
                                {categories.map(c => (
                                    <option key={c} value={c} className="bg-gray-900 text-white">
                                        {categoryLabels[c] || c}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                    {places.map((place, index) => (
                        <motion.div
                            key={place.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 flex flex-col h-[320px]"
                        >
                            {/* Image Area */}
                            <div className="h-40 bg-gray-800 relative overflow-hidden">
                                {place.photoUrl ? (
                                    <img
                                        src={place.photoUrl}
                                        alt={place.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                                        <MapPin className="w-8 h-8 text-gray-600" />
                                    </div>
                                )}

                                {/* Rating Badge */}
                                {place.rating && (
                                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 border border-white/10">
                                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                        <span className="text-xs font-medium">{place.rating}</span>
                                        <span className="text-[10px] text-gray-400">({place.userRatingCount})</span>
                                    </div>
                                )}
                            </div>

                            {/* Content Area */}
                            <div className="p-4 flex flex-col flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors line-clamp-1">
                                        {place.title}
                                    </h3>
                                </div>

                                <p className="text-xs text-purple-300 mb-3 px-2 py-1 bg-purple-500/10 rounded-md w-fit">
                                    {(place.category && categoryLabels[place.category]) || place.category || '알 수 없음'}
                                </p>

                                <div className="flex items-start gap-2 mt-auto">
                                    <MapPin className="w-3 h-3 text-gray-500 mt-0.5" />
                                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                                        {place.address}
                                    </p>
                                </div>
                            </div>

                            {/* Hover Overlay Actions */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.title + ' ' + place.address)}&query_place_id=${place.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform"
                                    title="구글 지도에서 보기"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                </a>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Loading State */}
            <div ref={ref} className="flex justify-center mt-12 mb-20">
                {loading && (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs text-gray-500">장소를 불러오는 중...</p>
                    </div>
                )}
                {!hasMore && places.length > 0 && (
                    <p className="text-gray-600 text-sm">DB는 여기가 끝.</p>
                )}
                {!loading && places.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-gray-500">검색 결과가 없다 ㅋ</p>
                    </div>
                )}
            </div>
        </div>
    );
}
