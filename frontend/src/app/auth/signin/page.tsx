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
    formState: { errors },
  } = useForm<SignInFormData>();

  const phoneValue = watch('phone');

  const handleSendOTP = async (data: { phone: string }) => {
    try {
      const id = await sendOTP(data.phone);
      setRequestId(id);
      setStep('otp');
      toast.success('OTP sent to your phone!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send OTP');
    }
  };

  const handleVerifyOTP = async (data: SignInFormData) => {
    try {
      await login(data.phone, data.otp, requestId);
      toast.success('Welcome to GoTogether!');
      router.push('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to verify OTP');
    }
  };

  const onSubmit = (data: SignInFormData) => {
    if (step === 'phone') {
      handleSendOTP({ phone: data.phone });
    } else {
      handleVerifyOTP(data);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <CarIcon className="h-12 w-12 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GoTogether</h1>
          <p className="text-gray-600">Share rides, split costs, travel smart</p>
        </div>

        {/* Sign In Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {step === 'phone' ? 'Sign In' : 'Verify OTP'}
            </h2>
            <p className="text-gray-600">
              {step === 'phone' 
                ? 'Enter your phone number to get started'
                : `Enter the OTP sent to ${phoneValue}`
              }
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {step === 'phone' ? (
              <div>
                <label className="form-label">Phone Number</label>
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
                    className="form-input pl-10"
                  />
                  <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Include country code (e.g., +91 for India)
                </p>
              </div>
            ) : (
              <div>
                <label className="form-label">OTP Code</label>
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
                  className="form-input text-center text-2xl tracking-widest"
                  maxLength={6}
                />
                {errors.otp && (
                  <p className="mt-1 text-sm text-red-600">{errors.otp.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Didn't receive the code? 
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="ml-1 text-primary-600 hover:text-primary-700"
                  >
                    Try again
                  </button>
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {step === 'phone' ? 'Sending OTP...' : 'Verifying...'}
                </>
              ) : (
                step === 'phone' ? 'Send OTP' : 'Verify & Sign In'
              )}
            </button>
          </form>

          {/* Development Note */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Development Mode:</strong> Use OTP <code className="bg-yellow-100 px-1 rounded">123456</code> for testing
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>
            By signing in, you agree to our{' '}
            <a href="#" className="text-primary-600 hover:text-primary-700">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-primary-600 hover:text-primary-700">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
