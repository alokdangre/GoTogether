// User types
export interface User {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  avatar_url?: string;
  whatsapp_number?: string;
  is_active: boolean;
  is_verified: boolean;
  is_phone_verified: boolean;
  is_email_verified: boolean;
  total_rides: number;
  total_savings: number;
  rating: number;
  total_ratings: number;
  created_at: string;
  updated_at?: string;
  role?: 'rider' | 'driver' | 'both' | string;
}

export interface UserCreate {
  phone: string;
  name?: string;
  email?: string;
  whatsapp_number?: string;
}

export interface UserStats {
  total_rides: number;
  total_savings: number;
  average_rating: number;
}

// Driver types (admin-managed)
export interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  license_number?: string;
  license_document_url?: string;
  vehicle_type?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  vehicle_plate_number?: string;
  vehicle_document_url?: string;
  is_active: boolean;
  is_verified: boolean;
  availability_status: 'available' | 'busy' | 'offline';
  verified_at?: string;
  deactivated_at?: string;
  rating: number;
  total_rides: number;
  assigned_rides_count: number;
  total_ratings: number;
  created_at: string;
  updated_at?: string;
}

export interface DriverCreate {
  name: string;
  phone: string;
  email?: string;
  license_number?: string;
  vehicle_type?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  vehicle_plate_number?: string;
}

// Ride Request types
export type RideRequestStatus = 'pending' | 'grouped' | 'assigned' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

export interface RideRequest {
  id: string;
  user_id: string;
  source_lat: number;
  source_lng: number;
  source_address?: string;
  destination_lat: number;
  destination_lng: number;
  destination_address: string;
  is_railway_station: boolean;
  train_time?: string;
  requested_time: string;
  passenger_count: number;
  additional_info?: string;
  status: RideRequestStatus;
  grouped_ride_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface RideRequestWithUser extends RideRequest {
  user: User;
}

export interface RideRequestCreate {
  source_lat: number;
  source_lng: number;
  source_address?: string;
  destination_lat: number;
  destination_lng: number;
  destination_address: string;
  is_railway_station: boolean;
  train_time?: string | Date;
  requested_time: string | Date;
  passenger_count: number;
  additional_info?: string;
}

// Grouped Ride types
export type GroupedRideStatus = 'pending_acceptance' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface GroupedRide {
  id: string;
  admin_id: string;
  driver_id?: string;
  destination_address: string;
  pickup_time?: string;
  pickup_location?: string;
  actual_price?: number;
  charged_price?: number;
  status: GroupedRideStatus;
  created_at: string;
  updated_at?: string;
}

export interface GroupedRideDetail extends GroupedRide {
  ride_requests: RideRequest[];
  driver?: Driver;
}

export interface GroupedRideCreate {
  ride_request_ids: string[];
  destination_address: string;
}

// Notification types
export type NotificationType = 'ride_assignment' | 'ride_completed';
export type NotificationStatus = 'pending' | 'accepted' | 'rejected' | 'read';

export interface Notification {
  id: string;
  user_id: string;
  grouped_ride_id: string;
  notification_type: NotificationType;
  status: NotificationStatus;
  sent_at: string;
  responded_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface NotificationWithDetails extends Notification {
  grouped_ride: GroupedRideDetail;
}

// Rating types
export interface Rating {
  id: string;
  user_id: string;
  driver_id: string;
  grouped_ride_id: string;
  rating: number;
  comment?: string;
  testimonial_text?: string;
  created_at: string;
  updated_at?: string;
}

export interface RatingCreate {
  rating: number;
  comment?: string;
}

// Location types
export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export type LocationWithAddress = Location;

// Form types
export interface RideRequestFormData {
  source: Location;
  destination: Location;
  is_railway_station: boolean;
  train_time?: Date;
  requested_time: Date;
  passenger_count: number;
  additional_info?: string;
}

// Auth types
export interface LoginRequest {
  phone: string;
}

export interface OTPVerifyRequest {
  request_id: string;
  phone: string;
  otp: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Admin types
export interface Admin {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  is_super_admin: boolean;
  last_login?: string;
  created_at: string;
  updated_at?: string;
}

// API Response types
export interface ApiError {
  detail: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

// Legacy Trip types (restored for compatibility)
export type VehicleType = 'car' | 'auto' | 'bike';

export interface Trip {
  id: string;
  origin_lat: number;
  origin_lng: number;
  origin_address?: string;
  dest_lat: number;
  dest_lng: number;
  dest_address?: string;
  departure_time: string;
  status: string;
  fare_per_person: number;
  available_seats: number;
  total_seats: number;
  vehicle_type: VehicleType;
  description?: string;
  driver_id?: string;
  created_at: string;
}

export interface TripWithDriver extends Trip {
  driver: User | Driver;
}

export interface TripDetail extends TripWithDriver {
  members?: User[];
  stops?: Location[];
}

export interface TripMatch extends TripWithDriver {
  match_score: number;
  origin_distance: number;
  dest_distance: number;
  time_difference_minutes: number;
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
  date: string;
  seats: number;
}

export interface TripSearchResponse {
  trips: TripMatch[];
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  user: User;
}

export interface OTPRequest {
  phone: string;
}

export interface OTPVerify {
  phone: string;
  otp: string;
  request_id: string;
  name?: string;
  email?: string;
}

export interface PaymentSplit {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

// Store States
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sendOTP: (phone: string) => Promise<string>;
  login: (phone: string, otp: string, requestId: string, signupData?: { name: string; email?: string }) => Promise<void>;
  loadUser: (token: string) => Promise<void>;
  logout: () => void;
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
  fetchDriverTrips: () => Promise<TripWithDriver[]>;
}

export interface SearchFormData {
  origin: Location;
  destination: Location;
  departure_time: Date;
  max_origin_distance: number;
  max_dest_distance: number;
  time_window_minutes: number;
}
