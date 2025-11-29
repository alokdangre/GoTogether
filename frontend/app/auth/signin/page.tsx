'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { sendOTP, login, loadUser, isLoading } = useAuthStore();
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

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      loadUser(token)
        .then(() => {
          toast.success('Successfully signed in with Google!');
          router.push('/');
        })
        .catch((error) => {
          console.error('Google login error:', error);
          toast.error('Failed to sign in with Google');
        });
    }
  }, [searchParams, loadUser, router]);

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/google/login`;
  };

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
    // Prepend +91 to the phone number
    const formattedPhone = `+91${data.phone}`;
    const formattedData = { ...data, phone: formattedPhone };

    console.log('Form submitted:', formattedData);
    if (step === 'phone') {
      handleSendOTP({ phone: formattedPhone });
    } else {
      handleVerifyOTP(formattedData);
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
                  : `Enter the OTP sent to +91 ${phoneValue}`
                }
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {step === 'phone' ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Phone Number</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center pointer-events-none">
                      <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-500 font-medium border-r border-gray-300 pr-2 mr-2">+91</span>
                    </div>
                    <input
                      type="tel"
                      {...register('phone', {
                        required: 'Phone number is required',
                        pattern: {
                          value: /^[6-9]\d{9}$/,
                          message: 'Please enter a valid 10-digit Indian phone number',
                        },
                      })}
                      placeholder="9876543210"
                      className="w-full px-4 py-4 pl-28 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 font-medium"
                      maxLength={10}
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-2 text-sm text-red-600 font-medium">{errors.phone.message}</p>
                  )}
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

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="mt-6 w-full inline-flex items-center justify-center px-6 py-4 border border-gray-200 rounded-xl shadow-sm bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </button>
            </div>
            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => router.push('/auth/signup')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign up here
                </button>
              </p>
            </div>
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
    </div >
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SignInContent />
    </Suspense>
  );
}
