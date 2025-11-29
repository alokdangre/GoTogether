'use client';

import { useState, useEffect } from 'react';
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

interface DateTimePickerProps {
    value?: string;
    onChange: (value: string) => void;
    label: string;
    minDate?: Date;
    error?: string;
    required?: boolean;
}

export default function DateTimePicker({
    value,
    onChange,
    label,
    minDate = new Date(),
    error,
    required = false
}: DateTimePickerProps) {
    const [date, setDate] = useState('');
    const [hour, setHour] = useState('12');
    const [minute, setMinute] = useState('00');
    const [ampm, setAmpm] = useState<'AM' | 'PM'>('PM');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    useEffect(() => {
        if (value) {
            const dateObj = new Date(value);
            setDate(dateObj.toISOString().split('T')[0]);

            const hours24 = dateObj.getHours();
            const mins = dateObj.getMinutes();

            setAmpm(hours24 >= 12 ? 'PM' : 'AM');
            setHour(String(hours24 % 12 || 12).padStart(2, '0'));
            setMinute(String(mins).padStart(2, '0'));
        }
    }, [value]);

    const handleDateChange = (newDate: string) => {
        setDate(newDate);
        setShowDatePicker(false);
        updateDateTime(newDate, hour, minute, ampm);
    };

    const handleTimeChange = (newHour: string, newMinute: string, newAmpm: 'AM' | 'PM') => {
        setHour(newHour);
        setMinute(newMinute);
        setAmpm(newAmpm);
        if (date) {
            updateDateTime(date, newHour, newMinute, newAmpm);
        }
    };

    const updateDateTime = (d: string, h: string, m: string, ap: 'AM' | 'PM') => {
        let hours24 = parseInt(h);
        if (ap === 'PM' && hours24 !== 12) hours24 += 12;
        if (ap === 'AM' && hours24 === 12) hours24 = 0;

        const combined = `${d}T${String(hours24).padStart(2, '0')}:${m}`;
        onChange(combined);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'Select date';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = () => {
        if (!hour || !minute) return 'Select time';
        return `${hour}:${minute} ${ampm}`;
    };

    const getQuickDates = () => {
        const dates = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push({
                value: date.toISOString().split('T')[0],
                label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            });
        }
        return dates;
    };

    const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

    return (
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <div className="grid grid-cols-2 gap-3">
                {/* Date Picker */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => {
                            setShowDatePicker(!showDatePicker);
                            setShowTimePicker(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 border rounded-xl transition-all ${error ? 'border-red-300' : 'border-gray-200'
                            } ${date ? 'text-gray-900' : 'text-gray-400'} hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                        <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-5 w-5" />
                            <span className="text-sm">{formatDate(date)}</span>
                        </div>
                    </button>

                    {showDatePicker && (
                        <div className="absolute z-50 mt-2 w-full sm:w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-4">
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {getQuickDates().map((d) => (
                                    <button
                                        key={d.value}
                                        type="button"
                                        onClick={() => handleDateChange(d.value)}
                                        className={`w-full text-left px-4 py-3 rounded-lg transition-all ${date === d.value
                                                ? 'bg-blue-500 text-white'
                                                : 'hover:bg-gray-100 text-gray-900'
                                            }`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-200">
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    min={minDate.toISOString().split('T')[0]}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Time Picker */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => {
                            setShowTimePicker(!showTimePicker);
                            setShowDatePicker(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 border rounded-xl transition-all ${error ? 'border-red-300' : 'border-gray-200'
                            } ${hour && minute ? 'text-gray-900' : 'text-gray-400'} hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                        <div className="flex items-center space-x-2">
                            <ClockIcon className="h-5 w-5" />
                            <span className="text-sm">{formatTime()}</span>
                        </div>
                    </button>

                    {showTimePicker && (
                        <div className="absolute z-50 mt-2 right-0 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-6">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4 text-center">Select Time</h3>

                            {/* Clock Display */}
                            <div className="mb-6 text-center">
                                <div className="inline-flex items-center justify-center space-x-2 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-2xl px-6 py-4 text-3xl font-bold">
                                    <span>{hour}</span>
                                    <span className="animate-pulse">:</span>
                                    <span>{minute}</span>
                                    <span className="text-xl ml-2">{ampm}</span>
                                </div>
                            </div>

                            {/* Hour Selector */}
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-gray-600 mb-2">Hour</label>
                                <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-1">
                                    {hours.map((h) => (
                                        <button
                                            key={h}
                                            type="button"
                                            onClick={() => handleTimeChange(h, minute, ampm)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${hour === h
                                                    ? 'bg-blue-500 text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {h}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Minute Selector */}
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-gray-600 mb-2">Minute</label>
                                <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-1">
                                    {minutes.map((m) => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => handleTimeChange(hour, m, ampm)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${minute === m
                                                    ? 'bg-blue-500 text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* AM/PM Selector */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-2">Period</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleTimeChange(hour, minute, 'AM')}
                                        className={`py-3 rounded-lg font-semibold transition-all ${ampm === 'AM'
                                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        AM
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleTimeChange(hour, minute, 'PM')}
                                        className={`py-3 rounded-lg font-semibold transition-all ${ampm === 'PM'
                                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        PM
                                    </button>
                                </div>
                            </div>

                            {/* Done Button */}
                            <button
                                type="button"
                                onClick={() => setShowTimePicker(false)}
                                className="w-full mt-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
        </div>
    );
}
