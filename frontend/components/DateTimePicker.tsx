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
    const [time, setTime] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    useEffect(() => {
        if (value) {
            const dateObj = new Date(value);
            setDate(dateObj.toISOString().split('T')[0]);
            setTime(dateObj.toTimeString().slice(0, 5));
        }
    }, [value]);

    const handleDateChange = (newDate: string) => {
        setDate(newDate);
        setShowDatePicker(false);
        if (time) {
            const combined = `${newDate}T${time}`;
            onChange(combined);
        }
    };

    const handleTimeChange = (newTime: string) => {
        setTime(newTime);
        setShowTimePicker(false);
        if (date) {
            const combined = `${date}T${newTime}`;
            onChange(combined);
        }
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

    const formatTime = (timeStr: string) => {
        if (!timeStr) return 'Select time';
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayHour = h % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const getQuickTimes = () => {
        const times = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const h = hour.toString().padStart(2, '0');
                const m = minute.toString().padStart(2, '0');
                times.push(`${h}:${m}`);
            }
        }
        return times;
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
                        onClick={() => setShowDatePicker(!showDatePicker)}
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
                        onClick={() => setShowTimePicker(!showTimePicker)}
                        className={`w-full flex items-center justify-between px-4 py-3 border rounded-xl transition-all ${error ? 'border-red-300' : 'border-gray-200'
                            } ${time ? 'text-gray-900' : 'text-gray-400'} hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                        <div className="flex items-center space-x-2">
                            <ClockIcon className="h-5 w-5" />
                            <span className="text-sm">{formatTime(time)}</span>
                        </div>
                    </button>

                    {showTimePicker && (
                        <div className="absolute z-50 mt-2 w-full sm:w-64 bg-white rounded-xl shadow-2xl border border-gray-200 p-4">
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {getQuickTimes().map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => handleTimeChange(t)}
                                        className={`w-full text-left px-4 py-2 rounded-lg transition-all ${time === t
                                                ? 'bg-blue-500 text-white'
                                                : 'hover:bg-gray-100 text-gray-900'
                                            }`}
                                    >
                                        {formatTime(t)}
                                    </button>
                                ))}
                            </div>
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
