import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, tripsApi, driversApi, handleApiError } from './api';
import {
  User,
  TripWithDriver,
  TripDetail,
  TripMatch,
  TripCreate,
  TripSearch,
  AuthState,
  TripState,
} from '@/types';

// Auth Store
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      sendOTP: async (phone: string): Promise<string> => {
        set({ isLoading: true });
        try {
          const response = await authApi.sendOTP({ phone });
          return response.request_id;
        } catch (error) {
          throw new Error(handleApiError(error));
        } finally {
          set({ isLoading: false });
        }
      },

      login: async (phone: string, otp: string, requestId: string, signupData?: { name: string; email?: string }): Promise<void> => {
        set({ isLoading: true });
        try {
          const response = await authApi.verifyOTP({
            phone,
            otp,
            request_id: requestId,
            ...(signupData && {
              name: signupData.name,
              email: signupData.email,
            }),
          });

          // Store token in localStorage
          localStorage.setItem('auth_token', response.access_token);

          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw new Error(handleApiError(error));
        }
      },

      loginWithPassword: async (email: string, password: string): Promise<void> => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ email, password });

          // Store token in localStorage
          localStorage.setItem('auth_token', response.access_token);

          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw new Error(handleApiError(error));
        }
      },

      signup: async (email: string, password: string, name: string, phone?: string): Promise<void> => {
        set({ isLoading: true });
        try {
          const response = await authApi.signup({
            email,
            password,
            name,
            phone
          });

          // Store token in localStorage
          localStorage.setItem('auth_token', response.access_token);

          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw new Error(handleApiError(error));
        }
      },

      loadUser: async (token: string): Promise<void> => {
        set({ isLoading: true });
        try {
          localStorage.setItem('auth_token', token);
          const user = await authApi.getMe();
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          // Only clear session if unauthorized (401)
          if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            set({
              token: null,
              user: null,
              isAuthenticated: false,
              isLoading: false
            });
          } else {
            set({ isLoading: false });
          }
          throw new Error(handleApiError(error));
        }
      },

      updateProfile: async (data: { phone?: string; name?: string }) => {
        set({ isLoading: true });
        try {
          const user = await authApi.updateProfile(data);
          set({
            user,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw new Error(handleApiError(error));
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Trip Store
export const useTripStore = create<TripState>((set, get) => ({
  trips: [],
  currentTrip: null,
  searchResults: [],
  isLoading: false,

  createTrip: async (tripData: TripCreate): Promise<TripWithDriver> => {
    set({ isLoading: true });
    try {
      const trip = await tripsApi.create(tripData);
      set((state) => ({
        trips: [trip, ...state.trips],
        isLoading: false,
      }));
      return trip;
    } catch (error) {
      set({ isLoading: false });
      throw new Error(handleApiError(error));
    }
  },

  searchTrips: async (searchData: TripSearch): Promise<TripMatch[]> => {
    set({ isLoading: true });
    try {
      const response = await tripsApi.search(searchData);
      set({
        searchResults: response.trips,
        isLoading: false,
      });
      return response.trips;
    } catch (error) {
      set({ isLoading: false });
      throw new Error(handleApiError(error));
    }
  },

  joinTrip: async (tripId: string, seats: number, message?: string): Promise<void> => {
    set({ isLoading: true });
    try {
      await tripsApi.join(tripId, {
        seats_requested: seats,
        message,
      });
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw new Error(handleApiError(error));
    }
  },

  fetchTrip: async (tripId: string): Promise<TripDetail> => {
    set({ isLoading: true });
    try {
      const trip = await tripsApi.getById(tripId);
      set({
        currentTrip: trip,
        isLoading: false,
      });
      return trip;
    } catch (error) {
      set({ isLoading: false });
      throw new Error(handleApiError(error));
    }
  },

  fetchUserTrips: async (): Promise<TripWithDriver[]> => {
    set({ isLoading: true });
    try {
      const trips = await tripsApi.getUserTrips();
      set({
        trips,
        isLoading: false,
      });
      return trips;
    } catch (error) {
      set({ isLoading: false });
      throw new Error(handleApiError(error));
    }
  },

  fetchDriverTrips: async (): Promise<TripWithDriver[]> => {
    set({ isLoading: true });
    try {
      const trips = await tripsApi.getDriverTrips();
      set({
        trips,
        isLoading: false,
      });
      return trips;
    } catch (error) {
      set({ isLoading: false });
      throw new Error(handleApiError(error));
    }
  },
}));

// Location Store for managing user's current location
interface LocationState {
  currentLocation: { lat: number; lng: number } | null;
  isLocationLoading: boolean;
  locationError: string | null;
  getCurrentLocation: () => Promise<{ lat: number; lng: number }>;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  currentLocation: null,
  isLocationLoading: false,
  locationError: null,

  getCurrentLocation: async (): Promise<{ lat: number; lng: number }> => {
    set({ isLocationLoading: true, locationError: null });

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = 'Geolocation is not supported by this browser';
        set({ isLocationLoading: false, locationError: error });
        reject(new Error(error));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          set({
            currentLocation: location,
            isLocationLoading: false,
            locationError: null,
          });
          resolve(location);
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          set({
            isLocationLoading: false,
            locationError: errorMessage,
          });
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  },
}));
