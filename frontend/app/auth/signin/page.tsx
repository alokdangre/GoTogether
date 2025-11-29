'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { CarIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuthStore } from '@/lib/store';
import LoadingSpinner from '@/components/LoadingSpinner';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loadUser, loginWithPassword, isLoading } = useAuthStore();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  useEffect(() => {
    // Warm up backend on mount
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    fetch(`${apiUrl}/health`).catch(() => { });
  }, []);

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

  const handleGoogleLogin = async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    try {
      // Ping backend
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        await fetch(`${apiUrl}/health`, {
          method: 'GET',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (e) {
        console.log('Backend ping failed or timed out, proceeding anyway');
      }

      window.location.href = `${apiUrl}/api/auth/google/login`;
    } catch (error) {
      console.error('Google login error', error);
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      await loginWithPassword(data.email, data.password);
      toast.success('Successfully signed in!');
      router.push('/');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to sign in';

      // Check if error indicates user doesn't exist
      if (errorMessage.toLowerCase().includes('user not found') ||
        errorMessage.toLowerCase().includes('does not exist') ||
        errorMessage.toLowerCase().includes('invalid credentials') ||
        errorMessage.toLowerCase().includes('not found')) {
        toast.error('Account not found. Please sign up first!', { duration: 5000 });
        setTimeout(() => router.push('/auth/signup'), 2000);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h2>
              <p className="text-gray-600">Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  {...register('email', { required: 'Email is required' })}
                  type="email"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="you@example.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    {...register('password', { required: 'Password is required' })}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message as string}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-70 disabled:cursor-wait"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Sign In'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-200 rounded-xl shadow-sm bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-wait"
            >
              {isGoogleLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-3" />
                  Connecting...
                </>
              ) : (
                <>
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
                  Google
                </>
              )}
            </button>

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
