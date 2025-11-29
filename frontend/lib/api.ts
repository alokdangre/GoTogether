import axios, { AxiosResponse } from 'axios';
import {
  User,
  Trip,
  TripWithDriver,
  TripDetail,
  TripCreate,
  TripSearch,
  TripSearchResponse,
  AuthToken,
  OTPRequest,
  OTPVerify,
  PaymentSplit,
  ApiError,
} from '@/types';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/auth/signin';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  sendOTP: async (data: OTPRequest): Promise<{ message: string; request_id: string }> => {
    const response = await api.post('/api/auth/otp', data);
    return response.data;
  },

  verifyOTP: async (data: OTPVerify): Promise<AuthToken> => {
    const response = await api.post('/api/auth/verify', data);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  signup: async (data: { email: string; password?: string; name: string; phone?: string }): Promise<AuthToken> => {
    const response = await api.post('/api/auth/signup', data);
    return response.data;
  },

  updateProfile: async (data: { phone?: string; name?: string; avatar_url?: string; whatsapp_number?: string }): Promise<User> => {
    const response = await api.put('/api/auth/me', data);
    return response.data;
  },
};

// Trips API
export const tripsApi = {
  create: async (data: TripCreate): Promise<TripWithDriver> => {
    const response = await api.post('/api/trips', data);
    return response.data;
  },

  search: async (params: TripSearch): Promise<TripSearchResponse> => {
    const response = await api.get('/api/trips/search', { params });
    return response.data;
  },

  getById: async (tripId: string): Promise<TripDetail> => {
    const response = await api.get(`/api/trips/${tripId}`);
    return response.data;
  },

  getUserTrips: async (params?: { status?: string; role?: string }): Promise<TripWithDriver[]> => {
    const response = await api.get('/api/trips', { params });
    return response.data;
  },

  update: async (tripId: string, data: Partial<TripCreate>): Promise<TripWithDriver> => {
    const response = await api.patch(`/api/trips/${tripId}`, data);
    return response.data;
  },

  join: async (tripId: string, data: { seats_requested: number; message?: string }) => {
    const response = await api.post(`/api/trips/${tripId}/join`, data);
    return response.data;
  },

  approveMember: async (tripId: string, memberId: string) => {
    const response = await api.post(`/api/trips/${tripId}/members/${memberId}/approve`);
    return response.data;
  },

  getDriverTrips: async (params?: { status?: string }): Promise<TripWithDriver[]> => {
    const response = await api.get('/api/trips/driver', { params });
    return response.data;
  },
};

// Chat API
export const chatApi = {
  getHistory: async (groupedRideId: string): Promise<any[]> => {
    const response = await api.get(`/api/chat/${groupedRideId}/history`);
    return response.data;
  },
};

// Drivers API
export const driversApi = {
  getProfile: async (): Promise<User> => {
    const response = await api.get('/api/drivers/me');
    return response.data;
  },
};

// Payment API
export const paymentApi = {
  createSplit: async (data: { trip_id: string; total_fare: number; currency?: string }): Promise<PaymentSplit> => {
    const response = await api.post('/api/payment/split', data);
    return response.data;
  },

  webhook: async (paymentId: string, data: any) => {
    const response = await api.post(`/api/payment/${paymentId}/webhook`, data);
    return response.data;
  },
};

// Ratings API
export const ratingsApi = {
  rateTrip: async (tripId: string, data: { ratings: Array<{ user_id: string; rating: number; comment?: string }> }) => {
    const response = await api.post(`/api/trips/${tripId}/rate`, data);
    return response.data;
  },
};

// Utility functions
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const isApiError = (error: any): error is ApiError => {
  return error?.response?.data?.error !== undefined;
};

export default api;
