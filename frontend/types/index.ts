// User types
export interface User {
  id: string;
  phone: string;
  name?: string;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  rating: number;
  total_trips: number;
  total_ratings: number;
  created_at: string;
}

export interface UserCreate {
  phone: string;
  name?: string;
  avatar_url?: string;
}

// Trip types
export type VehicleType = 'car' | 'auto' | 'bike';
export type TripStatus = 'active' | 'full' | 'completed' | 'cancelled';
export type MemberStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface Trip {
  id: string;
  driver_id: string;
  origin_lat: number;
  origin_lng: number;
  origin_address?: string;
  dest_lat: number;
  dest_lng: number;
  dest_address?: string;
  departure_time: string;
  total_seats: number;
  available_seats: number;
  fare_per_person: number;
  vehicle_type: VehicleType;
  description?: string;
  status: TripStatus;
  origin_geohash: string;
  dest_geohash: string;
  created_at: string;
  updated_at?: string;
}

export interface TripWithDriver extends Trip {
  driver: User;
}

export interface TripMember {
  id: string;
  trip_id: string;
  user_id: string;
  user: User;
  seats_requested: number;
  status: MemberStatus;
  message?: string;
  joined_at: string;
  updated_at?: string;
}

export interface TripDetail extends TripWithDriver {
  members: TripMember[];
}

export interface TripCreate {
  origin_lat: number;
  origin_lng: number;
  origin_address?: string;
  dest_lat: number;
  dest_lng: number;
  dest_address?: string;
  departure_time: string;
  total_seats: number;
  fare_per_person: number;
  vehicle_type: VehicleType;
  description?: string;
}

export interface TripSearch {
  origin_lat: number;
  origin_lng: number;
  dest_lat: number;
  dest_lng: number;
  departure_time: string;
  max_origin_distance?: number;
  max_dest_distance?: number;
  time_window_minutes?: number;
}

export interface TripMatch extends TripWithDriver {
  origin_distance: number;
  dest_distance: number;
  time_difference_minutes: number;
  match_score: number;
}

export interface TripSearchResponse {
  trips: TripMatch[];
  total: number;
}

// Location types
export interface Location {
  lat: number;
  lng: number;
}

export interface LocationWithAddress extends Location {
  address?: string;
}

// Auth types
export interface OTPRequest {
  phone: string;
}

export interface OTPVerify {
  phone: string;
  otp: string;
  request_id: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  user: User;
}

// Payment types
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type PaymentGateway = 'razorpay' | 'stripe';
export type SplitStatus = 'pending' | 'paid' | 'failed';

export interface Payment {
  id: string;
  trip_id: string;
  total_fare: number;
  currency: string;
  status: PaymentStatus;
  gateway: PaymentGateway;
  gateway_payment_id?: string;
  gateway_order_id?: string;
  created_at: string;
}

export interface PaymentSplitItem {
  user_id: string;
  user: User;
  amount: number;
  status: SplitStatus;
}

export interface PaymentSplit {
  payment: Payment;
  splits: PaymentSplitItem[];
  checkout_url?: string;
}

// Chat types
export interface ChatMessage {
  id: string;
  trip_id: string;
  user_id: string;
  user_name: string;
  content: string;
  message_type: 'text' | 'location' | 'system';
  timestamp: string;
}

export interface WebSocketMessage {
  type: 'message' | 'location_update' | 'member_joined' | 'trip_update';
  [key: string]: any;
}

// Rating types
export interface RatingItem {
  user_id: string;
  rating: number;
  comment?: string;
}

export interface RatingCreate {
  ratings: RatingItem[];
}

export interface Rating {
  id: string;
  trip_id: string;
  rater_id: string;
  rated_user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  rater: User;
  rated_user: User;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  details?: any;
}

export interface ApiError {
  error: string;
  message: string;
  details?: any;
}

// Form types
export interface TripFormData {
  origin: LocationWithAddress;
  destination: LocationWithAddress;
  departure_time: Date;
  total_seats: number;
  fare_per_person: number;
  vehicle_type: VehicleType;
  description?: string;
}

export interface SearchFormData {
  origin: LocationWithAddress;
  destination: LocationWithAddress;
  departure_time: Date;
  max_origin_distance: number;
  max_dest_distance: number;
  time_window_minutes: number;
}

// Store types (for Zustand)
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, otp: string, requestId: string) => Promise<void>;
  logout: () => void;
  sendOTP: (phone: string) => Promise<string>;
}

export interface TripState {
  trips: TripWithDriver[];
  currentTrip: TripDetail | null;
  searchResults: TripMatch[];
  isLoading: boolean;
  createTrip: (tripData: TripCreate) => Promise<TripWithDriver>;
  searchTrips: (searchData: TripSearch) => Promise<TripMatch[]>;
  joinTrip: (tripId: string, seats: number, message?: string) => Promise<void>;
  fetchTrip: (tripId: string) => Promise<TripDetail>;
  fetchUserTrips: () => Promise<TripWithDriver[]>;
}
