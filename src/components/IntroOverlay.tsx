'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Combobox from './ui/Combobox';

export interface UserContext {
    date: string;
    time: string;
    partner: string;
    transport: "car" | "public" | "walk";
}

interface IntroOverlayProps {
    onComplete: (context: UserContext) => void;
    initialContext?: UserContext;
    editMode?: boolean; // If true, skip intro and show form directly
}

// --- Custom Components ---

// 1. Calendar Component (Fixed 6-row Layout)
const Calendar = ({ value, onChange }: { value: string, onChange: (date: string) => void }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

    // Navigation
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const prevMonth = () => {
        const newDate = new Date(year, month - 1, 1);
        // Allow going back ONLY if it's not before the current real month
        if (newDate.getFullYear() > today.getFullYear() ||
            (newDate.getFullYear() === today.getFullYear() && newDate.getMonth() >= today.getMonth())) {
            setCurrentDate(newDate);
        }
    };

    // Grid Generation (Always 42 cells: 6 rows x 7 cols)
    const firstDayOfMonth = new Date(year, month, 1);
    const startingDayIndex = firstDayOfMonth.getDay(); // 0(Sun) - 6(Sat)

    // We need to find the start date of the grid (often in previous month)
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startingDayIndex);

    const calendarCells = [];
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        calendarCells.push(date);
    }

    const handleDateClick = (date: Date) => {
        // Format YYYY-MM-DD (local time)
        const offsetDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        onChange(offsetDate.toISOString().split('T')[0]);
    };

    return (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10 h-[340px] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 shrink-0">
                <button onClick={prevMonth} className="p-1 hover:bg-white/10 rounded-full text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent"
                    disabled={currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()}>
                    <ChevronLeft size={20} />
                </button>
                <span className="font-bold text-white text-lg">{year}년 {monthNames[month]}</span>
                <button onClick={nextMonth} className="p-1 hover:bg-white/10 rounded-full text-slate-300">
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 mb-2 text-center text-xs text-slate-400 font-medium shrink-0">
                <span className="text-red-400">일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span className="text-blue-400">토</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 content-start">
                {calendarCells.map((date, i) => {
                    const isCurrentMonth = date.getMonth() === month;
                    const isPast = date < today;

                    // Format comparison
                    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    const isSelected = value === dateStr;

                    // Today check
                    const isToday = date.getDate() === new Date().getDate() &&
                        date.getMonth() === new Date().getMonth() &&
                        date.getFullYear() === new Date().getFullYear();

                    return (
                        <button
                            key={i}
                            disabled={isPast || !isCurrentMonth}
                            onClick={() => handleDateClick(date)}
                            className={`
                                w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm transition-all relative
                                ${!isCurrentMonth ? 'text-slate-700 font-thin' :
                                    isPast ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:bg-white/10'}
                                ${isSelected ? '!bg-violet-600 !text-white font-bold shadow-md scale-105 z-10' : ''}
                                ${isToday && !isSelected && isCurrentMonth ? 'border border-violet-500/50 text-violet-300' : ''}
                            `}
                        >
                            {date.getDate()}
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

// 2. Stylish Digital Clock Time Picker
const TimePicker = ({ value, onChange }: { value: string, onChange: (time: string) => void }) => {
    // value format: "오전 06:30"
    const [meridiem, setMeridiem] = useState("오후");
    const [hour, setHour] = useState("06");
    const [minute, setMinute] = useState("30");

    // Selection Mode: 'hour' or 'minute'
    const [mode, setMode] = useState<'hour' | 'minute'>('hour');

    useEffect(() => {
        onChange(`${meridiem} ${hour}:${minute}`);
    }, [meridiem, hour, minute]);

    const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

    return (
        <div className="bg-slate-800/50 rounded-xl p-5 border border-white/10 h-[340px] flex flex-col justify-between">
            {/* 1. Digital Clock Display */}
            <div className="flex items-center justify-between bg-slate-900/50 rounded-2xl p-3 border border-white/5 mb-2 shrink-0">
                {/* AM/PM Toggle */}
                <div className="flex flex-col gap-1">
                    {["오전", "오후"].map((m) => (
                        <button
                            key={m}
                            onClick={() => setMeridiem(m)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${meridiem === m
                                ? 'bg-violet-600 text-white'
                                : 'text-slate-500 hover:bg-white/5'
                                }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>

                {/* Time Display */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setMode('hour')}
                        className={`text-4xl font-bold tracking-tight transition-colors ${mode === 'hour' ? 'text-white' : 'text-slate-600 hover:text-slate-400'
                            }`}
                    >
                        {hour}
                    </button>
                    <span className="text-4xl font-bold text-slate-700 pb-2">:</span>
                    <button
                        onClick={() => setMode('minute')}
                        className={`text-4xl font-bold tracking-tight transition-colors ${mode === 'minute' ? 'text-white' : 'text-slate-600 hover:text-slate-400'
                            }`}
                    >
                        {minute}
                    </button>
                </div>
            </div>

            {/* 2. Selection Grid */}
            <div className="flex-1 min-h-0 flex flex-col">
                <div className="text-xs text-slate-400 font-bold mb-2 text-center uppercase tracking-wider shrink-0">
                    {mode === 'hour' ? 'Hour' : 'Minute'}
                </div>

                <div className="grid grid-cols-3 gap-2 flex-1">
                    {(mode === 'hour' ? hours : minutes).map((item) => {
                        const isSelected = mode === 'hour' ? hour === item : minute === item;
                        return (
                            <button
                                key={item}
                                onClick={() => {
                                    if (mode === 'hour') {
                                        setHour(item);
                                        setMode('minute'); // Auto-advance
                                    } else {
                                        setMinute(item);
                                    }
                                }}
                                className={`
                                    rounded-xl text-lg font-medium transition-all flex items-center justify-center
                                    ${isSelected
                                        ? 'bg-violet-600 text-white shadow-lg scale-105'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}
                                `}
                            >
                                {item}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}


export default function IntroOverlay({ onComplete, initialContext, editMode = false }: IntroOverlayProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [step, setStep] = useState(editMode ? 1 : 0); // Skip intro if edit mode
    const [context, setContext] = useState<UserContext>(initialContext || {
        date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`, // YYYY-MM-DD (Local)
        time: '오후 06:30',
        partner: 'Lover',
        transport: 'car'
    });

    const handleStart = () => {
        setIsVisible(false);
        onComplete(context);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl">
            <AnimatePresence mode="wait">
                {step === 0 ? (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.5, type: "spring" }}
                        className="text-center space-y-8 max-w-lg w-full p-8"
                    >
                        <div className="relative inline-block">
                            <h1 className="text-7xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent tracking-tighter">
                                Daisy
                            </h1>
                            <span className="absolute -top-2 -right-8 text-4xl animate-bounce">🌼</span>
                        </div>

                        <p className="text-slate-300 text-xl font-light leading-relaxed">
                            <span className="font-bold text-white">완벽한 데이트</span>를 위한<br />
                            당신만의 AI 플래너
                        </p>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setStep(1)}
                            className="px-12 py-4 bg-white text-slate-900 rounded-full font-bold text-lg shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(255,255,255,0.5)] transition-all"
                        >
                            코스 짜러 가기
                        </motion.button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900/90 border border-white/10 p-10 rounded-2xl w-full max-w-xl shadow-2xl relative overflow-hidden"
                    >
                        {/* Background Decoration - Removed for performance/cleanliness */}

                        <h2 className="text-3xl font-bold text-white mb-8 text-center">
                            {editMode ? '설정 변경' : '몇 가지 질문이 있어요!'}
                        </h2>

                        <div className="relative z-10 text-left">
                            {/* Row 1: Date & Time */}
                            <div className="grid grid-cols-2 gap-8 mb-10">
                                <div className="space-y-3">
                                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider ml-1">Date</label>
                                    <Calendar
                                        value={context.date}
                                        onChange={(val) => setContext({ ...context, date: val })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider ml-1">Time</label>
                                    <TimePicker
                                        value={context.time}
                                        onChange={(val) => setContext({ ...context, time: val })}
                                    />
                                </div>
                            </div>


                            {/* WHO */}
                            <div className="space-y-3 mb-5">
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider ml-1">Partner</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { id: 'Lover', label: '💘 연인' },
                                        { id: 'Friend', label: '😎 친구' },
                                        { id: 'Family', label: '👨‍👩‍👧 가족' },
                                        { id: 'Blind Date', label: '☕ 소개팅' }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setContext({ ...context, partner: opt.id })}
                                            className={`
                                                py-3 rounded-xl text-xs font-semibold transition-all border
                                                ${context.partner === opt.id
                                                    ? 'bg-violet-600 border-violet-500 text-white shadow-lg'
                                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'}
                                            `}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* TRANSPORT */}
                            <div className="space-y-3">
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider ml-1">Transport</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'car', label: '🚗 자차' },
                                        { id: 'public', label: '🚌 대중교통' },
                                        { id: 'walk', label: '🚶 도보' }
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setContext({ ...context, transport: opt.id as any })}
                                            className={`
                                                py-3 rounded-xl text-sm font-semibold transition-all border
                                                ${context.transport === opt.id
                                                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 border-transparent text-white shadow-lg'
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
                            className="w-full mt-8 bg-white text-slate-900 font-bold py-4 rounded-xl hover:bg-slate-200 transition-transform active:scale-95 shadow-xl"
                        >
                            {editMode ? '설정 저장 ✓' : '데이지와 코스 짜기 ✨'}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
