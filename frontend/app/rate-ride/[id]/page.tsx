'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { StarIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

export default function RateRidePage() {
    const router = useRouter();
    const params = useParams();
    const rideId = params.id as string;

    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [testimonial, setTestimonial] = useState('');
    const [copied, setCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const submitRating = async () => {
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/my-rides/${rideId}/rate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    rating,
                    comment: comment || undefined
                })
            });

            if (!response.ok) {
                throw new Error('Failed to submit rating');
            }

            const data = await response.json();
            setTestimonial(data.testimonial);
            setIsSubmitted(true);
        } catch (error) {
            console.error('Error submitting rating:', error);
            alert('Failed to submit rating. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const copyTestimonial = () => {
        navigator.clipboard.writeText(testimonial);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-12">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                            <CheckIcon className="h-10 w-10 text-green-600" />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                            Thank You!
                        </h1>
                        <p className="text-gray-600">Your rating has been submitted</p>
                    </div>

                    {/* Testimonial */}
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Your Testimonial</h2>
                            <button
                                onClick={copyTestimonial}
                                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                            >
                                {copied ? (
                                    <>
                                        <CheckIcon className="h-4 w-4 mr-2 text-green-600" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>
                        <div className="bg-white rounded-xl p-4 whitespace-pre-wrap text-sm text-gray-700 border border-gray-200">
                            {testimonial}
                        </div>
                        <p className="text-xs text-gray-600 mt-3">
                            💡 Copy this and share it in your WhatsApp group to help others discover GoTogether!
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => router.push('/my-rides')}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold"
                        >
                            Back to My Rides
                        </button>
                        <button
                            onClick={() => router.push('/request-ride')}
                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                        >
                            Request Another Ride
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
                    <div className="flex items-center">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors mr-3"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Rate Your Ride</h1>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-2xl mx-auto px-3 sm:px-6 py-8 sm:py-12">
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8 lg:p-12">
                    {/* Rating Stars */}
                    <div className="text-center mb-8">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                            How was your ride?
                        </h2>
                        <div className="flex justify-center gap-2 sm:gap-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="transition-transform hover:scale-110 focus:outline-none"
                                >
                                    {star <= (hoverRating || rating) ? (
                                        <StarIcon className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-400" />
                                    ) : (
                                        <StarOutlineIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300" />
                                    )}
                                </button>
                            ))}
                        </div>
                        {rating > 0 && (
                            <p className="mt-3 text-sm text-gray-600">
                                {rating === 5 && '⭐ Excellent!'}
                                {rating === 4 && '😊 Great!'}
                                {rating === 3 && '👍 Good'}
                                {rating === 2 && '😐 Fair'}
                                {rating === 1 && '😞 Poor'}
                            </p>
                        )}
                    </div>

                    {/* Comment */}
                    <div className="mb-8">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Share your experience (optional)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-sm sm:text-base"
                            placeholder="Tell us about your ride experience..."
                        />
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                        <p className="text-sm text-blue-900">
                            <span className="font-semibold">💬 After submitting:</span> We'll generate a personalized testimonial that you can share in your WhatsApp group to help others discover GoTogether!
                        </p>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={submitRating}
                        disabled={isLoading || rating === 0}
                        className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {isLoading ? 'Submitting...' : 'Submit Rating'}
                    </button>
                </div>
            </div>
        </div>
    );
}
