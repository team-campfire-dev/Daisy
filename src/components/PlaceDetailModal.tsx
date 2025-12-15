'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { PlaceDetail, AccommodationDetail } from '@/services/gemini';

interface PlaceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    placeName: string;
    detail?: PlaceDetail | AccommodationDetail;
    isLoading?: boolean;
}

export default function PlaceDetailModal({ isOpen, onClose, placeName, detail, isLoading }: PlaceDetailModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
                >
                    {/* Header Image */}
                    <div className="h-48 bg-slate-800 relative group">
                        {detail?.imageUrl ? (
                            <img src={detail.imageUrl} alt={placeName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                                {isLoading ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-xs">데이터를 불러오는 중입니다...</span>
                                    </div>
                                ) : (
                                    <span className="text-4xl opacity-20">📸</span>
                                )}
                            </div>
                        )}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full text-white flex items-center justify-center transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 overflow-y-auto">
                        <h2 className="text-2xl font-bold text-white mb-2">{placeName}</h2>

                        {isLoading ? (
                            <div className="flex flex-col gap-4 py-8">
                                <div className="h-4 bg-slate-800 rounded w-3/4 animate-pulse" />
                                <div className="h-4 bg-slate-800 rounded w-1/2 animate-pulse" />
                                <div className="h-24 bg-slate-800 rounded w-full animate-pulse" />
                            </div>
                        ) : detail ? (
                            <div className="space-y-6">
                                {/* Stats */}
                                <div className="flex items-center gap-4 text-sm">
                                    {detail.rating && (
                                        <div className="flex items-center gap-1 text-yellow-400">
                                            <span className="text-lg">★</span>
                                            <span className="font-bold">{detail.rating}</span>
                                        </div>
                                    )}
                                    {detail.reviewCount && (
                                        <div className="text-slate-400">
                                            리뷰 <span className="text-slate-200">{detail.reviewCount}</span>
                                        </div>
                                    )}
                                    {detail.priceRange && (
                                        <div className="px-2 py-1 bg-slate-800 rounded text-slate-300 text-xs">
                                            {detail.priceRange}
                                        </div>
                                    )}
                                </div>

                                {/* Booking Button (If URL exists) */}
                                {detail.bookingUrl && (
                                    <a
                                        href={detail.bookingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full text-center bg-[#03C75A] hover:bg-[#02b351] text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-green-500/20"
                                    >
                                        N 네이버 예약 / 상세보기
                                    </a>
                                )}

                                {/* Accommodation Specifics */}
                                {'checkIn' in detail && (
                                    <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-xs text-slate-500 mb-1">체크인</div>
                                            <div className="text-sm text-white font-medium">{(detail as AccommodationDetail).checkIn || '-'}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 mb-1">체크아웃</div>
                                            <div className="text-sm text-white font-medium">{(detail as AccommodationDetail).checkOut || '-'}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Reviews */}
                                {detail.reviews && detail.reviews.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-400 mb-3">방문자 한줄평</h3>
                                        <div className="space-y-2">
                                            {detail.reviews.map((review, i) => (
                                                <div key={i} className="bg-slate-800 p-3 rounded-lg text-sm text-slate-300 border border-slate-700/50">
                                                    "{review}"
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            </div>
                        ) : (
                            <div className="py-8 text-center text-slate-500">
                                정보가 없습니다.
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
