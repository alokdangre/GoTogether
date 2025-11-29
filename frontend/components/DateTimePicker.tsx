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
    const [selectingHour, setSelectingHour] = useState(true); // true = selecting hour, false = selecting minute

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

    // Handle clock click for hour/minute selection
    const handleClockClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const x = e.clientX - rect.left - centerX;
        const y = e.clientY - rect.top - centerY;

        let angle = Math.atan2(y, x) * (180 / Math.PI);
        angle = (angle + 90 + 360) % 360;

        if (selectingHour) {
            const hourValue = Math.round(angle / 30) % 12;
            const selectedHour = hourValue === 0 ? 12 : hourValue;
            handleTimeChange(String(selectedHour).padStart(2, '0'), minute, ampm);
            setSelectingHour(false); // Switch to minute selection
        } else {
            const minuteValue = Math.round(angle / 6) % 60;
            handleTimeChange(hour, String(minuteValue).padStart(2, '0'), ampm);
        }
    };

    // Calculate hand positions
    const getHourAngle = () => {
        const h = parseInt(hour);
        const m = parseInt(minute);
        return ((h % 12) * 30 + m * 0.5) - 90;
    };

    const getMinuteAngle = () => {
        const m = parseInt(minute);
        return (m * 6) - 90;
    };

    // Handle manual input
    const handleManualHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 2) val = val.slice(0, 2);
        let num = parseInt(val);
        if (num > 12) num = 12;
        if (num < 1 && val.length === 2) num = 1;
        const formatted = val === '' ? '' : String(num).padStart(2, '0');
        handleTimeChange(formatted || '12', minute, ampm);
    };

    const handleManualMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 2) val = val.slice(0, 2);
        let num = parseInt(val);
        if (num > 59) num = 59;
        const formatted = val === '' ? '' : String(num).padStart(2, '0');
        handleTimeChange(hour, formatted || '00', ampm);
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
                            setSelectingHour(true); // Reset to hour selection
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
                        <div className="absolute z-50 mt-2 right-0 w-[360px] bg-white rounded-xl shadow-2xl border border-gray-200 p-6">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4 text-center">
                                {selectingHour ? 'Select Hour' : 'Select Minute'}
                            </h3>

                            {/* Analog Clock */}
                            <div className="mb-6 flex justify-center">
                                <div
                                    className="relative w-48 h-48 rounded-full border-4 border-gray-300 bg-gradient-to-br from-blue-50 to-purple-50 cursor-pointer"
                                    onClick={handleClockClick}
                                >
                                    {/* Clock numbers */}
                                    {selectingHour ? (
                                        <>
                                            {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num, idx) => {
                                                const angle = (idx * 30 - 90) * (Math.PI / 180);
                                                const x = 50 + 38 * Math.cos(angle);
                                                const y = 50 + 38 * Math.sin(angle);
                                                return (
                                                    <div
                                                        key={num}
                                                        className={`absolute text-sm font-semibold ${parseInt(hour) === num ? 'text-blue-600' : 'text-gray-700'
                                                            }`}
                                                        style={{
                                                            left: `${x}%`,
                                                            top: `${y}%`,
                                                            transform: 'translate(-50%, -50%)'
                                                        }}
                                                    >
                                                        {num}
                                                    </div>
                                                );
                                            })}
                                        </>
                                    ) : (
                                        <>
                                            {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((num, idx) => {
                                                const angle = (idx * 30 - 90) * (Math.PI / 180);
                                                const x = 50 + 38 * Math.cos(angle);
                                                const y = 50 + 38 * Math.sin(angle);
                                                return (
                                                    <div
                                                        key={num}
                                                        className={`absolute text-xs font-semibold ${parseInt(minute) === num ? 'text-blue-600' : 'text-gray-600'
                                                            }`}
                                                        style={{
                                                            left: `${x}%`,
                                                            top: `${y}%`,
                                                            transform: 'translate(-50%, -50%)'
                                                        }}
                                                    >
                                                        {num.toString().padStart(2, '0')}
                                                    </div>
                                                );
                                            })}
                                        </>
                                    )}

                                    {/* Center dot */}
                                    <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-gray-800 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-10" />

                                    {/* Hour hand */}
                                    <div
                                        className="absolute top-1/2 left-1/2 origin-left bg-blue-600 rounded-full transition-transform duration-300"
                                        style={{
                                            width: '35%',
                                            height: '4px',
                                            transform: `rotate(${getHourAngle()}deg) translateY(-50%)`,
                                            transformOrigin: 'left center'
                                        }}
                                    />

                                    {/* Minute hand */}
                                    <div
                                        className="absolute top-1/2 left-1/2 origin-left bg-red-500 rounded-full transition-transform duration-300"
                                        style={{
                                            width: '42%',
                                            height: '3px',
                                            transform: `rotate(${getMinuteAngle()}deg) translateY(-50%)`,
                                            transformOrigin: 'left center'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Manual Input */}
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-gray-600 mb-2">Manual Entry</label>
                                <div className="flex items-center justify-center gap-2">
                                    {/* Hour Input */}
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={hour}
                                        onChange={handleManualHourChange}
                                        onFocus={() => setSelectingHour(true)}
                                        placeholder="12"
                                        maxLength={2}
                                        className="w-14 text-center px-2 py-2 text-lg font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                    />
                                    <span className="text-2xl font-bold text-gray-400">:</span>
                                    {/* Minute Input */}
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={minute}
                                        onChange={handleManualMinuteChange}
                                        onFocus={() => setSelectingHour(false)}
                                        placeholder="00"
                                        maxLength={2}
                                        className="w-14 text-center px-2 py-2 text-lg font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                    />
                                    {/* AM/PM */}
                                    <select
                                        value={ampm}
                                        onChange={(e) => handleTimeChange(hour, minute, e.target.value as 'AM' | 'PM')}
                                        className="px-3 py-2 text-lg font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none cursor-pointer"
                                    >
                                        <option value="AM">AM</option>
                                        <option value="PM">PM</option>
                                    </select>
                                </div>
                            </div>

                            {/* Toggle Button */}
                            <button
                                type="button"
                                onClick={() => setSelectingHour(!selectingHour)}
                                className="w-full mb-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                            >
                                Switch to {selectingHour ? 'Minute' : 'Hour'} Selection
                            </button>

                            {/* Done Button */}
                            <button
                                type="button"
                                onClick={() => setShowTimePicker(false)}
                                className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-colors"
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
