'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Option {
    value: string;
    label: string;
}

interface ComboboxProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
}

export default function Combobox({ options, value, onChange, placeholder, label }: ComboboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Initial value label
    useEffect(() => {
        const selected = options.find(o => o.value === value);
        if (selected) setQuery(selected.label);
    }, [value, options]);

    // If query matches the selected value exactly, show all (assume selection mode).
    // If user types something new, filter it.
    const selectedLabel = options.find(o => o.value === value)?.label || '';

    // Show all if:
    // 1. Query is empty
    // 2. Query matches the currently selected label (meaning user just opened it)
    const filteredOptions = (query === '' || query === selectedLabel)
        ? options
        : options.filter((option) =>
            option.label.toLowerCase().includes(query.toLowerCase())
        );

    return (
        <div className="relative w-full" ref={containerRef}>
            {label && <label className="text-sm text-slate-300 font-semibold ml-1 block mb-2">{label}</label>}
            <div className="relative">
                <input
                    type="text"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-4 pr-10 py-3 text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none placeholder-slate-400 font-medium"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                    ▼
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                    >
                        {filteredOptions.length === 0 ? (
                            <div className="p-3 text-slate-400 text-sm text-center">No options found</div>
                        ) : (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-700 text-slate-200 text-sm border-b border-slate-700 last:border-0 transition-colors font-medium"
                                    onClick={() => {
                                        onChange(option.value);
                                        setQuery(option.label);
                                        setIsOpen(false);
                                    }}
                                >
                                    {option.label}
                                </button>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
