'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CoursePlan, CourseStep } from '@/services/gemini';

interface CourseSidebarProps {
    plans: CoursePlan[];
    selectedPlanId: string | null;
    onSelectPlan: (planId: string) => void;
    onStepClick: (step: CourseStep) => void;
    className?: string;
}

const categoryMap: { [key: string]: string } = {
    restaurant: '식당',
    korean_restaurant: '한식',
    japanese_restaurant: '일식',
    chinese_restaurant: '중식',
    asian_restaurant: '아시안',
    western_restaurant: '양식',
    italian_restaurant: '이탈리안',
    french_restaurant: '프렌치',
    cafe: '카페',
    coffee_shop: '카페',
    bar: '술집',
    pub: '펍',
    club: '클럽',
    park: '공원',
    gym: '헬스장',
    spa: '스파',
    movie_theater: '영화관',
    museum: '박물관',
    art_gallery: '미술관',
    shopping_mall: '쇼핑몰',
    clothing_store: '옷가게',
    department_store: '백화점',
    tourist_attraction: '관광지',
    amusement_park: '놀이공원',
    aquarium: '아쿠아리움',
    zoo: '동물원',
    library: '도서관',
    book_store: '서점',
    bakery: '베이커리',
    meal_takeaway: '포장',
    meal_delivery: '배달',
    convenience_store: '편의점',
    supermarket: '마트'
};


export default function CourseSidebar({ plans, selectedPlanId, onSelectPlan, onStepClick, className = '' }: CourseSidebarProps) {
    const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0] || null;

    return (
        <div className={`
            glass-panel w-full h-full flex flex-col pointer-events-auto
            ${className}
        `}>
            {/* Header */}
            <div className="p-6 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
                        <span className="text-xl">📅</span>
                    </div>
                    <div>
                        <h2 className="font-bold text-white text-lg">데이트 코스</h2>
                        <p className="text-xs text-violet-200">
                            AI 맞춤형 추천 플랜
                        </p>
                    </div>
                </div>

                {/* Plan Tabs */}
                {plans.length > 0 && (
                    <div className="flex bg-black/20 p-1 rounded-lg mb-4">
                        {plans.map(plan => (
                            <button
                                key={plan.id}
                                onClick={() => onSelectPlan(plan.id)}
                                className={`
                                    flex-1 py-1.5 text-xs font-bold rounded-md transition-all
                                    ${selectedPlanId === plan.id
                                        ? 'bg-violet-600 text-white shadow-md'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'}
                                `}
                            >
                                Plan {plan.id}
                            </button>
                        ))}
                    </div>
                )}

                {selectedPlan && (
                    <div className="mb-2">
                        <h3 className="text-white font-bold text-md">{selectedPlan.title}</h3>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{selectedPlan.description}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-violet-300">
                            <span>⏱️ {selectedPlan.totalDuration}</span>
                            <span>•</span>
                            <span>{selectedPlan.transportation === 'car' ? '🚗 자차' : selectedPlan.transportation === 'public' ? '🚌 대중교통' : '🚶 도보'}</span>
                            {selectedPlan.totalDistance && <span>• {selectedPlan.totalDistance}</span>}
                        </div>
                    </div>
                )}

                {selectedPlan?.parkingInfo && (
                    <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10 text-xs text-gray-300">
                        <span className="font-bold text-violet-300">🅿️ 주차 팁:</span> {selectedPlan.parkingInfo}
                    </div>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                <AnimatePresence mode='wait'>
                    {!selectedPlan || !selectedPlan.steps || selectedPlan.steps.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="h-full flex flex-col items-center justify-center text-center text-white/40 space-y-2"
                        >
                            <span className="text-4xl">✨</span>
                            <p className="text-sm">채팅으로 데이트 코스를 요청해보세요!</p>
                        </motion.div>
                    ) : (
                        <div key={selectedPlan.id}>
                            {selectedPlan.steps.map((step, index) => (
                                <div key={`step-${index}`}>
                                    {/* Travel Info (Between Steps) */}
                                    {index > 0 && (step.distanceFromPrev || step.timeFromPrev) && (
                                        <div className="flex flex-col items-center py-2 relative">
                                            <div className="h-full w-0.5 bg-white/10 absolute top-0 bottom-0 z-0"></div>
                                            <div className="z-10 bg-slate-900/80 px-3 py-1 rounded-full border border-white/10 text-[10px] text-gray-400 flex gap-2 backdrop-blur-sm">
                                                {step.distanceFromPrev && <span>📏 {step.distanceFromPrev}</span>}
                                                {step.timeFromPrev && <span>⏱️ {step.timeFromPrev}</span>}
                                            </div>
                                        </div>
                                    )}

                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => onStepClick(step)}
                                        className="
                                        cursor-pointer rounded-xl border border-white/5 bg-white/5 overflow-hidden
                                        hover:border-violet-500/30 transition-all duration-200 group relative
                                    "
                                    >
                                        {/* Image Logic */}
                                        <div className="h-32 w-full bg-gray-800 relative">
                                            {step.detail?.imageUrl ? (
                                                <img
                                                    src={step.detail.imageUrl}
                                                    alt={step.placeName}
                                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-600 bg-black/40">
                                                    <span>No Image</span>
                                                </div>
                                            )}
                                            <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold shadow-md">
                                                {index + 1}
                                            </div>
                                            {step.detail?.rating && (
                                                <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/60 text-white text-xs font-bold flex items-center gap-1 backdrop-blur-sm">
                                                    ⭐ {step.detail.rating} <span className="text-[10px] opacity-70">({step.detail.reviewCount})</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-bold text-white group-hover:text-violet-300 transition-colors">
                                                    {step.placeName}
                                                </h3>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300 shrink-0">
                                                    {categoryMap[step.category?.toLowerCase()] || step.category?.replace(/_/g, ' ') || '기타'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                                                {step.description}
                                            </p>
                                            <div className="flex items-center justify-between text-[10px] text-gray-400">
                                                <span>⌚ {step.duration}</span>
                                                {step.detail?.priceRange && <span>💰 {step.detail.priceRange}</span>}
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
