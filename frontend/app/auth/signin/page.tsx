'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { PhoneIcon } from '@heroicons/react/24/outline';
import { CarIcon } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuthStore } from '@/lib/store';
import LoadingSpinner from '@/components/LoadingSpinner';

interface SignInFormData {
  phone: string;
  otp: string;
}

export default function SignInPage() {
  const router = useRouter();
  const { sendOTP, login, isLoading } = useAuthStore();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [requestId, setRequestId] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    formState: { errors },
  } = useForm<SignInFormData>({
    shouldUnregister: false // Ensure values are kept when inputs are unmounted
  });

  const phoneValue = watch('phone');

  const handleSendOTP = async (data: { phone: string }) => {
    try {
      console.log('Sending OTP to:', data.phone);
      const id = await sendOTP(data.phone);
      console.log('OTP sent, Request ID:', id);
      setRequestId(id);
      setStep('otp');
      toast.success('OTP sent to your phone!');
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send OTP');
    }
  };

  const handleVerifyOTP = async (data: SignInFormData) => {
    try {
      const phone = data.phone || getValues('phone');
      console.log('Verifying OTP:', { phone, otp: data.otp, requestId });

      if (!phone) {
        throw new Error('Phone number is missing');
      }

      await login(phone, data.otp, requestId);
      toast.success('Welcome to GoTogether!');
      router.push('/');
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to verify OTP');
    }
  };

  const onSubmit = (data: SignInFormData) => {
    console.log('Form submitted:', data);
    if (step === 'phone') {
      handleSendOTP({ phone: data.phone });
    } else {
      handleVerifyOTP(data);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <CarIcon className="h-12 w-12 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-blue-100 text-sm">Share rides, split costs, travel smart</p>
            </div>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {step === 'phone' ? 'Sign In' : 'Verify OTP'}
              </h2>
              <p className="text-gray-600">
                {step === 'phone'
                  ? 'Enter your phone number to continue'
                  : `Enter the OTP sent to ${phoneValue}`
                }
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {step === 'phone' ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Phone Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      {...register('phone', {
                        required: 'Phone number is required',
                        pattern: {
                          value: /^\+[1-9]\d{1,14}$/,
                          message: 'Please enter a valid phone number with country code (e.g., +919876543210)',
                        },
                      })}
                      placeholder="+919876543210"
                      className="w-full px-4 py-4 pl-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 font-medium"
                    />
                    <PhoneIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                  {errors.phone && (
                    <p className="mt-2 text-sm text-red-600 font-medium">{errors.phone.message}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    Include country code (e.g., +91 for India)
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">OTP Code</label>
                  <input
                    type="text"
                    {...register('otp', {
                      required: 'OTP is required',
                      pattern: {
                        value: /^\d{4,6}$/,
                        message: 'Please enter a valid OTP',
                      },
                    })}
                    placeholder="123456"
                    className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest font-bold text-gray-900"
                    maxLength={6}
                  />
                  {errors.otp && (
                    <p className="mt-2 text-sm text-red-600 font-medium">{errors.otp.message}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    Didn't receive the code?{' '}
                    <button
                      type="button"
                      onClick={() => setStep('phone')}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Try again
                    </button>
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-3" />
                    {step === 'phone' ? 'Sending OTP...' : 'Verifying...'}
                  </>
                ) : (
                  step === 'phone' ? 'Send OTP' : 'Verify & Sign In'
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
            <div className="text-center text-sm text-gray-600">
              <p>
                By signing in, you agree to our{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Privacy Policy</a>
              </p>
            </div>
          </div>

          {/* Development Note */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mx-8 mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-sm text-yellow-800 text-center">
                <strong className="font-medium">Development Mode:</strong> Use OTP{' '}
                <code className="bg-yellow-100 px-2 py-1 rounded font-mono font-bold">123456</code>{' '}
                for testing
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
