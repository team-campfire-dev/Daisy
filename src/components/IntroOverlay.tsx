'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Combobox from './ui/Combobox';

export interface UserContext {
    date: string;
    time: string;
    partner: string;
    transport: "car" | "public" | "walk";
}

interface IntroOverlayProps {
    onComplete: (context: UserContext) => void;
}

export default function IntroOverlay({ onComplete }: IntroOverlayProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [step, setStep] = useState(0); // 0: Intro, 1: Form
    const [context, setContext] = useState<UserContext>({
        date: 'Today',
        time: 'Evening',
        partner: 'Lover',
        transport: 'car'
    });

    const handleStart = () => {
        setIsVisible(false);
        onComplete(context);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-md">
            <AnimatePresence mode="wait">
                {step === 0 ? (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="text-center space-y-8 max-w-lg w-full p-8"
                    >
                        <h1 className="text-6xl font-bold text-white tracking-tight">
                            Daisy 🌼
                        </h1>
                        <p className="text-slate-300 text-xl font-medium leading-relaxed">
                            나만의 데이트 코스 AI,<br />
                            데이지와 함께 시작해보세요
                        </p>
                        <button
                            onClick={() => setStep(1)}
                            className="px-10 py-4 bg-violet-600 hover:bg-violet-500 rounded-xl text-white font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-violet-900/50"
                        >
                            시작하기
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl"
                    >
                        <h2 className="text-2xl font-bold text-white mb-8 text-center">기본 정보 설정</h2>

                        <div className="space-y-6">
                            {/* WHEN */}
                            <Combobox
                                label="언제 만나시나요?"
                                value={context.date}
                                onChange={(val) => setContext({ ...context, date: val })}
                                options={[
                                    { value: 'Today', label: '오늘' },
                                    { value: 'Tomorrow', label: '내일' },
                                    { value: 'Weekend', label: '이번 주말' },
                                    { value: 'Next Week', label: '다음 주' }
                                ]}
                            />

                            {/* TIME */}
                            <Combobox
                                label="시간대"
                                value={context.time}
                                onChange={(val) => setContext({ ...context, time: val })}
                                options={[
                                    { value: 'Lunch', label: '점심' },
                                    { value: 'Afternoon', label: '오후 ' },
                                    { value: 'Dinner', label: '저녁' },
                                    { value: 'All Day', label: '하루 종일' }
                                ]}
                            />

                            {/* WHO */}
                            <Combobox
                                label="누구와 함께하나요?"
                                value={context.partner}
                                onChange={(val) => setContext({ ...context, partner: val })}
                                options={[
                                    { value: 'Lover', label: '연인' },
                                    { value: 'Friend', label: '친구' },
                                    { value: 'Family', label: '가족' },
                                    { value: 'Blind Date', label: '소개팅' }
                                ]}
                            />

                            {/* TRANSPORT */}
                            <div className="space-y-2">
                                <label className="text-sm text-slate-300 font-semibold ml-1">이동 수단</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'car', label: '🚗 자차' },
                                        { id: 'public', label: '🚌 대중교통' },
                                        { id: 'walk', label: '🚶 도보' }
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setContext({ ...context, transport: opt.id as any })}
                                            className={`
                                                py-3 rounded-lg text-sm font-medium transition-all border
                                                ${context.transport === opt.id
                                                    ? 'bg-violet-600 border-violet-500 text-white shadow-md'
                                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'}
                                            `}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleStart}
                            className="w-full mt-10 bg-white text-slate-900 font-bold py-4 rounded-xl hover:bg-slate-200 transition-colors shadow-lg"
                        >
                            데이지와 대화 시작하기
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
