export type UserRole = 'rider' | 'driver';

export type CaptainVerificationStatus =
  | 'not_registered'
  | 'pending'
  | 'approved'
  | 'rejected';

export type RideStatus =
  | 'idle'
  | 'searching'
  | 'offers_received'
  | 'driver_assigned'
  | 'arriving'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type RideCategory = 'comfort' | 'saver' | 'shuttle' | 'women_only' | 'city_to_city';

export interface LocationPoint {
  id: string;
  name: string;
  nameEn: string;
  x: number;
  y: number;
  city: string;
  popular?: boolean;
}

export interface DriverOffer {
  id: string;
  driverId: string;
  driverName: string;
  avatar: string;
  rating: number;
  totalTrips: number;
  carModel: string;
  carColor: string;
  carPlate: string;
  offeredFareEgp: number;
  etaMinutes: number;
  distanceAwayKm: number;
  availableSeats?: number;
}

export interface Driver {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  totalTrips: number;
  carModel: string;
  carPlate: string;
  carColor: string;
  x: number;
  y: number;
  isAvailable: boolean;
  phone: string;
  verified: boolean;
  totalSeats?: number;
  availableSeats?: number;
}

export interface SeatPassenger {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  rating: number;
  pickup: LocationPoint;
  destination: LocationPoint;
  fareEgp: number;
  seatIndex: number; // 1, 2, 3
  status: 'waiting_pickup' | 'onboard' | 'dropped_off';
  boardedAt?: number;
  droppedOffAt?: number;
}

export interface EnRouteRequest {
  id: string;
  riderName: string;
  riderAvatar: string;
  riderPhone: string;
  riderRating: number;
  pickup: LocationPoint;
  destination: LocationPoint;
  fareEgp: number;
  distanceKm: number;
  detourExtraMinutes: number; // e.g. 1-2 mins detour on the way
  walkingMeters: number; // e.g. 150m walking to main road
}

export interface CaptainApplication {
  fullName: string;
  phone: string;
  email: string;
  avatarUrl: string;
  nationalIdUrl: string;
  driverLicenseUrl: string;
  carLicenseUrl: string;
  carMake: string;
  carModel: string;
  carColor: string;
  carYear: number;
  carPlate: string;
  submittedAt: number;
  reviewedAt?: number;
  status: CaptainVerificationStatus;
  rejectionReason?: string;
}

export interface CommunityReview {
  id: string;
  rideId: string;
  reviewerRole: 'rider' | 'driver';
  reviewerName: string;
  targetRole: 'rider' | 'driver';
  targetName: string;
  rating: number; // 1 to 5
  tags: string[];
  comment: string;
  timestamp: number;
  tripRoute: string;
}

export interface RideRequest {
  id: string;
  riderId: string;
  riderName: string;
  riderRating: number;
  riderPhone: string;
  pickup: LocationPoint;
  destination: LocationPoint;
  category: RideCategory;
  distanceKm: number;
  estimatedMinutes: number;
  baseRecommendedFareEgp: number;
  riderOfferedFareEgp: number;
  finalFareEgp: number;
  offers: DriverOffer[];
  status: RideStatus;
  createdAt: number;
  driver?: Driver;
  paymentMethod: 'cash' | 'wallet';
  isFirstRideFreeCommission: boolean;
  commissionEgp: number;
  isRushHour?: boolean;
  surgeMultiplier?: number;
  // Fixed Fare & Transparency Fields
  isFixedFare?: boolean;
  captainNetFareEgp?: number;
  trafficCongestionMultiplier?: number;
  trafficZoneName?: string;
  // Multi-Passenger Shuttle Fields
  isShuttleTrip?: boolean;
  totalSeats?: number;
  passengers?: SeatPassenger[];
  // Rider rating of captain
  captainRatingGivenByRider?: number;
  captainFeedbackByRider?: string;
  captainTagsByRider?: string[];
  // Captain rating of rider
  riderRatingGivenByCaptain?: number;
  riderFeedbackByCaptain?: string;
  riderTagsByCaptain?: string[];
}

export interface WalletTransaction {
  id: string;
  type: 'captain_recharge' | 'trip_commission' | 'welcome_bonus' | 'trip_payout';
  amountEgp: number;
  description: string;
  timestamp: number;
  referenceId?: string;
  paymentMethodName?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'rider' | 'driver';
  text: string;
  timestamp: number;
}

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
  duration?: number;
  timestamp: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface CaptainCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading?: number;
  speed?: number;
  lastUpdated: number;
  firestoreSyncStatus: 'synced' | 'syncing' | 'error' | 'idle';
  lastSyncedAt?: number;
}

