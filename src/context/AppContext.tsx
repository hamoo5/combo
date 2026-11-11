import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  CaptainVerificationStatus,
  CaptainApplication,
  RideRequest,
  DriverOffer,
  Driver,
  WalletTransaction,
  LocationPoint,
  RideCategory,
  ChatMessage,
  CommunityReview,
  SeatPassenger,
  EnRouteRequest,
  ToastMessage,
  ToastType,
} from '../types';
import {
  INITIAL_DRIVERS,
  INITIAL_CAPTAIN_TRANSACTIONS,
  INITIAL_PAST_RIDES,
  POPULAR_LOCATIONS,
} from '../data/mockData';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from '../lib/firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';

const INITIAL_REVIEWS: CommunityReview[] = [
  {
    id: 'rev_1',
    rideId: 'ride_mock_1',
    reviewerRole: 'rider',
    reviewerName: 'مريم عادل',
    targetRole: 'driver',
    targetName: 'كابتن أحمد سامي',
    rating: 5,
    tags: ['قيادة آمنة', 'سيارة نظيفة ومكيفة', 'احترام الموعد'],
    comment: 'كابتن محترم جداً، وصل في أقل من 3 دقائق، والسيارة نظيفة جداً والتكييف شغال.',
    timestamp: Date.now() - 86400000 * 2,
    tripRoute: 'الكوربة، مصر الجديدة &larr; التجمع الخامس',
  },
  {
    id: 'rev_2',
    rideId: 'ride_mock_2',
    reviewerRole: 'driver',
    reviewerName: 'كابتن سارة محمود',
    targetRole: 'rider',
    targetName: 'يوسف عبد الرحمن',
    rating: 5,
    tags: ['التزام بالموعد', 'دفع الأجرة كاش فوراً', 'تعامل راقٍ'],
    comment: 'راكب ممتاز وخلوق، كان متواجد في نقطة الركوب ودفع الأجرة بدون أي تأخير.',
    timestamp: Date.now() - 86400000 * 3,
    tripRoute: 'ميدان التحرير &larr; دجلة، المعادي',
  },
  {
    id: 'rev_3',
    rideId: 'ride_mock_3',
    reviewerRole: 'rider',
    reviewerName: 'عمر طارق',
    targetRole: 'driver',
    targetName: 'كابتن مصطفى عبد العزيز',
    rating: 5,
    tags: ['طريق سلس', 'سائق محترف', 'عدم التدخين'],
    comment: 'المشوار كان ممتاز والطريق سالك، تعامل راقٍ جداً.',
    timestamp: Date.now() - 86400000 * 4,
    tripRoute: 'أركان بلازا، الشيخ زايد &larr; الزمالك',
  },
];

const INITIAL_SHUTTLE_PASSENGERS: SeatPassenger[] = [
  {
    id: 'pass_1',
    name: 'أحمد كمال (مهندس)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
    phone: '01019283746',
    rating: 4.95,
    pickup: POPULAR_LOCATIONS[0], // Tahrir
    destination: POPULAR_LOCATIONS[1], // Korba
    fareEgp: 45,
    seatIndex: 1, // Front passenger seat
    status: 'onboard',
  },
  {
    id: 'pass_2',
    name: 'نورهان عبد الله',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80',
    phone: '01128374650',
    rating: 4.98,
    pickup: POPULAR_LOCATIONS[0], // Tahrir
    destination: POPULAR_LOCATIONS[2], // Citystars
    fareEgp: 55,
    seatIndex: 2, // Rear Right
    status: 'onboard',
  },
  {
    id: 'pass_3',
    name: 'كريم ممدوح (طالب)',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80',
    phone: '01239847561',
    rating: 4.88,
    pickup: POPULAR_LOCATIONS[1], // Korba
    destination: POPULAR_LOCATIONS[3], // 90th St
    fareEgp: 60,
    seatIndex: 3, // Rear Left
    status: 'waiting_pickup',
  },
];

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  captainStatus: CaptainVerificationStatus;
  captainApplication: CaptainApplication | null;
  submitCaptainApplication: (app: Omit<CaptainApplication, 'submittedAt' | 'status'>) => void;
  approveCaptainApplication: () => void;
  isFirstRideFreeUsed: boolean;
  captainBalanceEgp: number;
  captainTransactions: WalletTransaction[];
  rechargeCaptainWallet: (amountEgp: number, methodName: string) => void;
  activeRide: RideRequest | null;
  pastRides: RideRequest[];
  drivers: Driver[];
  isDriverOnline: boolean;
  incomingDriverRides: RideRequest[];
  chatMessages: ChatMessage[];
  communityReviews: CommunityReview[];
  riderScore: number;
  captainScore: number;
  pendingCaptainReviewRide: RideRequest | null;
  submitRiderRatingOfCaptain: (
    rideId: string,
    rating: number,
    tags: string[],
    comment: string
  ) => void;
  submitCaptainRatingOfRider: (
    rideId: string,
    rating: number,
    tags: string[],
    comment: string
  ) => void;
  dismissPendingCaptainReview: () => void;
  // Multi-Passenger Shuttle & En-Route Features
  shuttlePassengers: SeatPassenger[];
  enRouteRequest: EnRouteRequest | null;
  boardShuttlePassenger: (passengerId: string) => void;
  dropOffShuttlePassenger: (passengerId: string) => void;
  acceptEnRouteRequest: () => void;
  declineEnRouteRequest: () => void;
  triggerDemoEnRouteRequest: () => void;
  requestRide: (
    pickup: LocationPoint,
    destination: LocationPoint,
    category: RideCategory,
    offeredFareEgp: number,
    options?: {
      isFixedFare?: boolean;
      trafficCongestionMultiplier?: number;
      trafficZoneName?: string;
      captainNetFareEgp?: number;
    }
  ) => void;
  acceptDriverOffer: (offer: DriverOffer) => void;
  cancelRide: () => void;
  advanceActiveRide: () => void;
  completeActiveRide: () => void;
  toggleDriverOnline: () => void;
  acceptRideAsDriver: (rideId: string) => void;
  counterOfferAsDriver: (rideId: string, counterFare: number) => void;
  declineRideAsDriver: (rideId: string) => void;
  sendChatMessage: (text: string) => void;
  isRideModalMinimized: boolean;
  setIsRideModalMinimized: (minimized: boolean) => void;
  isSosModalOpen: boolean;
  sosInitiatorRole: 'rider' | 'driver' | null;
  openSosModal: (initiator?: 'rider' | 'driver') => void;
  closeSosModal: () => void;
  safetyAlertSent: boolean;
  sendSafetyAlert: () => void;
  acceptanceNotification: string | null;
  dismissAcceptanceNotification: () => void;
  driverEarningsTodayEgp: number;
  completedRidesCountToday: number;
  resetSimulation: () => void;
  // Firebase Auth
  authUser: FirebaseUser | null;
  isAuthLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  // Theme state
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  // Toast notifications
  toasts: ToastMessage[];
  addToast: (
    message: string,
    type?: ToastType,
    options?: {
      title?: string;
      duration?: number;
      action?: { label: string; onClick: () => void };
    }
  ) => string;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'wasla_indrive_v4';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [role, setRole] = useState<UserRole>('rider');
  const [captainStatus, setCaptainStatus] = useState<CaptainVerificationStatus>('not_registered');
  const [captainApplication, setCaptainApplication] = useState<CaptainApplication | null>(null);
  const [isFirstRideFreeUsed, setIsFirstRideFreeUsed] = useState<boolean>(false);
  const [captainBalanceEgp, setCaptainBalanceEgp] = useState<number>(0);
  const [captainTransactions, setCaptainTransactions] = useState<WalletTransaction[]>(INITIAL_CAPTAIN_TRANSACTIONS);
  const [activeRide, setActiveRide] = useState<RideRequest | null>(null);
  const [pastRides, setPastRides] = useState<RideRequest[]>(INITIAL_PAST_RIDES);
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [isDriverOnline, setIsDriverOnline] = useState<boolean>(true);
  const [incomingDriverRides, setIncomingDriverRides] = useState<RideRequest[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [communityReviews, setCommunityReviews] = useState<CommunityReview[]>(INITIAL_REVIEWS);
  const [riderScore, setRiderScore] = useState<number>(4.94);
  const [captainScore, setCaptainScore] = useState<number>(4.98);
  const [pendingCaptainReviewRide, setPendingCaptainReviewRide] = useState<RideRequest | null>(null);
  const [acceptanceNotification, setAcceptanceNotification] = useState<string | null>(null);
  const [driverEarningsTodayEgp, setDriverEarningsTodayEgp] = useState<number>(100);
  const [completedRidesCountToday, setCompletedRidesCountToday] = useState<number>(1);
  const [isRideModalMinimized, setIsRideModalMinimized] = useState<boolean>(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState<boolean>(false);
  const [sosInitiatorRole, setSosInitiatorRole] = useState<'rider' | 'driver' | null>(null);
  const [safetyAlertSent, setSafetyAlertSent] = useState<boolean>(false);

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addToast = (
    message: string,
    type: ToastType = 'info',
    options?: {
      title?: string;
      duration?: number;
      action?: { label: string; onClick: () => void };
    }
  ): string => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newToast: ToastMessage = {
      id,
      message,
      type,
      title: options?.title,
      duration: options?.duration ?? 4500,
      timestamp: Date.now(),
      action: options?.action,
    };
    setToasts((prev) => [newToast, ...prev].slice(0, 5));
    return id;
  };

  // Shuttle & En-Route state
  const [shuttlePassengers, setShuttlePassengers] = useState<SeatPassenger[]>(INITIAL_SHUTTLE_PASSENGERS);
  const [enRouteRequest, setEnRouteRequest] = useState<EnRouteRequest | null>(null);

  // Global theme: 'dark' (default) or 'light' (High Contrast Light for daytime/outdoor conditions)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('wasla_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return 'dark';
  });

  useEffect(() => {
    try {
      localStorage.setItem('wasla_theme', theme);
      if (theme === 'light') {
        document.documentElement.classList.add('light', 'theme-high-contrast-light');
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.classList.remove('light', 'theme-high-contrast-light');
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } catch (e) {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.captainStatus) setCaptainStatus(parsed.captainStatus);
        if (parsed.captainApplication) setCaptainApplication(parsed.captainApplication);
        if (parsed.isFirstRideFreeUsed !== undefined) setIsFirstRideFreeUsed(parsed.isFirstRideFreeUsed);
        if (parsed.captainBalanceEgp !== undefined) setCaptainBalanceEgp(parsed.captainBalanceEgp);
        if (parsed.captainTransactions) setCaptainTransactions(parsed.captainTransactions);
        if (parsed.pastRides) setPastRides(parsed.pastRides);
        if (parsed.communityReviews) setCommunityReviews(parsed.communityReviews);
        if (parsed.riderScore) setRiderScore(parsed.riderScore);
        if (parsed.captainScore) setCaptainScore(parsed.captainScore);
        if (parsed.driverEarningsTodayEgp !== undefined) setDriverEarningsTodayEgp(parsed.driverEarningsTodayEgp);
        if (parsed.completedRidesCountToday !== undefined) setCompletedRidesCountToday(parsed.completedRidesCountToday);
        if (parsed.shuttlePassengers) setShuttlePassengers(parsed.shuttlePassengers);
      }
    } catch (e) {
      console.error('Failed to parse saved state:', e);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          captainStatus,
          captainApplication,
          isFirstRideFreeUsed,
          captainBalanceEgp,
          captainTransactions,
          pastRides,
          communityReviews,
          riderScore,
          captainScore,
          driverEarningsTodayEgp,
          completedRidesCountToday,
          shuttlePassengers,
        })
      );
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }, [
    captainStatus,
    captainApplication,
    isFirstRideFreeUsed,
    captainBalanceEgp,
    captainTransactions,
    pastRides,
    communityReviews,
    riderScore,
    captainScore,
    driverEarningsTodayEgp,
    completedRidesCountToday,
    shuttlePassengers,
  ]);

  // Firebase Auth and Firestore User synchronization
  useEffect(() => {
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      setIsAuthLoading(false);

      if (user) {
        const userRef = doc(db, 'users', user.uid);
        try {
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.role) setRole(data.role as UserRole);
            if (data.captainStatus) setCaptainStatus(data.captainStatus as CaptainVerificationStatus);
            if (data.walletBalanceEgp !== undefined) setCaptainBalanceEgp(data.walletBalanceEgp);
          } else {
            await setDoc(userRef, {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'مستخدم وصلة',
              photoURL: user.photoURL || '',
              role: 'rider',
              captainStatus: 'not_registered',
              walletBalanceEgp: 100,
              totalTripsCount: 0,
              rating: 4.95,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.warn('Firestore initial user sync note:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setIsAuthLoading(true);
      const res = await signInWithPopup(auth, googleProvider);
      addToast(
        `مرحباً بك، ${res.user.displayName || 'يا صديقي'}! تم تسجيل الدخول بنجاح عبر Google 👋`,
        'success',
        { title: 'تسجيل الدخول' }
      );
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      addToast('تعذر تسجيل الدخول عبر Google. يرجى المحاولة مرة أخرى.', 'error', {
        title: 'خطأ تسجيل الدخول',
      });
      throw error;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      addToast('تم تسجيل الخروج من الحساب بنجاح.', 'info', { title: 'تسجيل الخروج' });
    } catch (error) {
      console.error('Sign Out failed:', error);
    }
  };

  // Gentle driver vehicle movement simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setDrivers((prev) =>
        prev.map((drv) => {
          const dx = (Math.random() - 0.5) * 0.4;
          const dy = (Math.random() - 0.5) * 0.4;
          return {
            ...drv,
            x: Math.max(10, Math.min(90, drv.x + dx)),
            y: Math.max(15, Math.min(85, drv.y + dy)),
          };
        })
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Direct Captain Matching (Fixed Upfront Pricing - No Price Negotiation)
  useEffect(() => {
    if (!activeRide || activeRide.status !== 'searching') return;

    const timer = setTimeout(() => {
      const fixedFare = activeRide.finalFareEgp;
      const matchedDriver = drivers[0];
      const startX = activeRide.pickup.x - 11;
      const startY = activeRide.pickup.y + 7;

      const chosenDriver: Driver = {
        ...matchedDriver,
        x: startX,
        y: startY,
        isAvailable: false,
        totalSeats: 4,
        availableSeats: 2,
      };

      setActiveRide((prev) =>
        prev && prev.status === 'searching'
          ? {
              ...prev,
              status: 'driver_assigned',
              finalFareEgp: fixedFare,
              driver: chosenDriver,
            }
          : prev
      );

      // Automatically minimize modal so the rider immediately watches the live map progress!
      setIsRideModalMinimized(true);

      setChatMessages([
        {
          id: 'msg_welcome',
          sender: 'driver',
          text: `السلام عليكم! أنا الكابتن ${matchedDriver.name}، تم تأكيد وقبول المشوار بالسعر الثابت ${fixedFare} ج.م نقداً (ممنوع الفصال). أنا في طريقي إليك بالسيارة ${matchedDriver.carModel} (${matchedDriver.carPlate}).`,
          timestamp: Date.now(),
        },
      ]);
    }, 2500);

    return () => clearTimeout(timer);
  }, [activeRide?.status, drivers]);

  // Incoming requests for online approved captain
  useEffect(() => {
    if (captainStatus !== 'approved' || !isDriverOnline) {
      setIncomingDriverRides([]);
      return;
    }

    const timer = setTimeout(() => {
      if (incomingDriverRides.length === 0) {
        const p1 = POPULAR_LOCATIONS[0];
        const p2 = POPULAR_LOCATIONS[3];
        const dist = 14.2;
        const suggestedFare = 115;
        const sampleRequest: RideRequest = {
          id: 'req_indrive_' + Math.floor(Math.random() * 1000),
          riderId: 'rider_youssef',
          riderName: 'يوسف عبد الرحمن',
          riderRating: 4.92,
          riderPhone: '01023456789',
          pickup: p1,
          destination: p2,
          category: 'comfort',
          distanceKm: dist,
          estimatedMinutes: 26,
          baseRecommendedFareEgp: suggestedFare,
          riderOfferedFareEgp: suggestedFare - 5,
          finalFareEgp: suggestedFare - 5,
          offers: [],
          status: 'searching',
          createdAt: Date.now(),
          paymentMethod: 'cash',
          isFirstRideFreeCommission: !isFirstRideFreeUsed,
          commissionEgp: !isFirstRideFreeUsed ? 0 : Math.round((suggestedFare - 5) * 0.15),
          isFixedFare: true,
          captainNetFareEgp: (suggestedFare - 5) - (!isFirstRideFreeUsed ? 0 : Math.round((suggestedFare - 5) * 0.15)),
          trafficCongestionMultiplier: 1.25,
          trafficZoneName: 'وسط البلد والتحرير (زحام معتدل)',
        };
        setIncomingDriverRides([sampleRequest]);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [captainStatus, isDriverOnline, isFirstRideFreeUsed]);

  // Multi-Passenger Shuttle: Board a passenger
  const boardShuttlePassenger = (passengerId: string) => {
    setShuttlePassengers((prev) =>
      prev.map((p) =>
        p.id === passengerId
          ? { ...p, status: 'onboard', boardedAt: Date.now() }
          : p
      )
    );
  };

  // Multi-Passenger Shuttle: Drop off a passenger, receive cash, and trigger en-route hop-on!
  const dropOffShuttlePassenger = (passengerId: string) => {
    const pass = shuttlePassengers.find((p) => p.id === passengerId);
    if (!pass) return;

    setShuttlePassengers((prev) =>
      prev.map((p) =>
        p.id === passengerId
          ? { ...p, status: 'dropped_off', droppedOffAt: Date.now() }
          : p
      )
    );

    // Add cash fare to earnings
    setDriverEarningsTodayEgp((prev) => prev + pass.fareEgp);
    setCompletedRidesCountToday((prev) => prev + 1);

    // Open prompt for rating this passenger
    setPendingCaptainReviewRide({
      id: 'ride_drop_' + Date.now(),
      riderId: pass.id,
      riderName: pass.name,
      riderRating: pass.rating,
      riderPhone: pass.phone,
      pickup: pass.pickup,
      destination: pass.destination,
      category: 'shuttle',
      distanceKm: 8.5,
      estimatedMinutes: 18,
      baseRecommendedFareEgp: pass.fareEgp,
      riderOfferedFareEgp: pass.fareEgp,
      finalFareEgp: pass.fareEgp,
      offers: [],
      status: 'completed',
      createdAt: Date.now(),
      paymentMethod: 'cash',
      isFirstRideFreeCommission: true,
      commissionEgp: 0,
    });

    // After dropping off a passenger, seat is now vacant! Simulate a passenger on the remaining path
    setTimeout(() => {
      triggerDemoEnRouteRequest();
    }, 2500);
  };

  // Trigger simulated en-route request on the captain's path
  const triggerDemoEnRouteRequest = () => {
    const candidates = [
      {
        name: 'د. طارق الحسين',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
        phone: '01099283741',
        pickup: POPULAR_LOCATIONS[2], // Citystars
        destination: POPULAR_LOCATIONS[3], // 90th St
        fare: 40,
        dist: 7.2,
      },
      {
        name: 'هبة الشناوي',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
        phone: '01123498765',
        pickup: POPULAR_LOCATIONS[1], // Korba
        destination: POPULAR_LOCATIONS[3], // 90th St
        fare: 45,
        dist: 9.1,
      },
    ];

    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    const req: EnRouteRequest = {
      id: 'enroute_' + Date.now(),
      riderName: pick.name,
      riderAvatar: pick.avatar,
      riderPhone: pick.phone,
      riderRating: 4.96,
      pickup: pick.pickup,
      destination: pick.destination,
      fareEgp: pick.fare,
      distanceKm: pick.dist,
      detourExtraMinutes: 1, // only 1 minute on the way!
      walkingMeters: 120,
    };
    setEnRouteRequest(req);
  };

  // Captain accepts en-route hop-on rider
  const acceptEnRouteRequest = () => {
    if (!enRouteRequest) return;

    // Find the first dropped_off or vacant seat
    const vacantIndex = shuttlePassengers.findIndex((p) => p.status === 'dropped_off');
    const targetIndex = vacantIndex !== -1 ? vacantIndex : shuttlePassengers.length;

    const newPassenger: SeatPassenger = {
      id: 'pass_enroute_' + Date.now(),
      name: enRouteRequest.riderName,
      avatar: enRouteRequest.riderAvatar,
      phone: enRouteRequest.riderPhone,
      rating: enRouteRequest.riderRating,
      pickup: enRouteRequest.pickup,
      destination: enRouteRequest.destination,
      fareEgp: enRouteRequest.fareEgp,
      seatIndex: (targetIndex % 3) + 1,
      status: 'waiting_pickup',
    };

    if (vacantIndex !== -1) {
      setShuttlePassengers((prev) => {
        const copy = [...prev];
        copy[vacantIndex] = newPassenger;
        return copy;
      });
    } else {
      setShuttlePassengers((prev) => [...prev, newPassenger]);
    }

    setEnRouteRequest(null);
  };

  const declineEnRouteRequest = () => {
    setEnRouteRequest(null);
  };

  // Captain Application
  const submitCaptainApplication = (
    data: Omit<CaptainApplication, 'submittedAt' | 'status'>
  ) => {
    const newApp: CaptainApplication = {
      ...data,
      submittedAt: Date.now(),
      status: 'pending',
    };
    setCaptainApplication(newApp);
    setCaptainStatus('pending');
    addToast(
      'تم إرسال مستندات الكابتن بنجاح! جاري مراجعة بطاقة الرقم القومي ورخص القيادة والسيارة 📄',
      'info',
      { title: 'توثيق الكابتن' }
    );
  };

  const approveCaptainApplication = () => {
    if (!captainApplication) return;
    const updated: CaptainApplication = {
      ...captainApplication,
      reviewedAt: Date.now(),
      status: 'approved',
    };
    setCaptainApplication(updated);
    setCaptainStatus('approved');
    const msg =
      '🎉 تهانينا! تمت مراجعة بياناتك وقبولك ككابتن معتمد. أول رحلة لك مجاناً 100% بدون أي عمولة!';
    setAcceptanceNotification(msg);
    addToast(msg, 'success', { title: 'اعتماد الكابتن المعتمد' });
  };

  const dismissAcceptanceNotification = () => {
    setAcceptanceNotification(null);
  };

  const rechargeCaptainWallet = (amountEgp: number, methodName: string) => {
    setCaptainBalanceEgp((prev) => prev + amountEgp);
    const tx: WalletTransaction = {
      id: 'tx_rech_' + Date.now(),
      type: 'captain_recharge',
      amountEgp,
      description: `شحن رصيد المحفظة عبر ${methodName} لدفع عمولات المشاوير`,
      timestamp: Date.now(),
      paymentMethodName: methodName,
    };
    setCaptainTransactions((prev) => [tx, ...prev]);
    addToast(
      `تم شحن المحفظة بنجاح بمبلغ ${amountEgp} ج.م عبر ${methodName} 💳`,
      'success',
      { title: 'شحن المحفظة' }
    );
  };

  // Request ride
  const requestRide = (
    pickup: LocationPoint,
    destination: LocationPoint,
    category: RideCategory,
    offeredFareEgp: number,
    options?: {
      isFixedFare?: boolean;
      trafficCongestionMultiplier?: number;
      trafficZoneName?: string;
      captainNetFareEgp?: number;
    }
  ) => {
    const dx = destination.x - pickup.x;
    const dy = destination.y - pickup.y;
    const rawDist = Math.sqrt(dx * dx + dy * dy) * 0.45;
    const distanceKm = Math.max(2.5, Math.round(rawDist * 10) / 10);
    const estimatedMinutes = Math.round(distanceKm * 2.2 + 4);

    const isFixed = options?.isFixedFare ?? true;
    const commissionEgp = Math.round(offeredFareEgp * 0.15);
    const captainNetFareEgp = options?.captainNetFareEgp ?? Math.max(0, offeredFareEgp - commissionEgp);

    // Shuttle discount is 50%
    const baseFare =
      category === 'shuttle'
        ? Math.max(20, Math.round((15 + distanceKm * 7) * 0.55))
        : Math.max(25, Math.round(15 + distanceKm * 7));

    const newRide: RideRequest = {
      id: 'ride_' + Date.now(),
      riderId: 'current_user',
      riderName: 'أنا (الراكب)',
      riderRating: riderScore,
      riderPhone: '01011122334',
      pickup,
      destination,
      category,
      distanceKm,
      estimatedMinutes,
      baseRecommendedFareEgp: baseFare,
      riderOfferedFareEgp: offeredFareEgp,
      finalFareEgp: offeredFareEgp,
      offers: [],
      status: 'searching',
      createdAt: Date.now(),
      paymentMethod: 'cash',
      isFirstRideFreeCommission: false,
      commissionEgp,
      isFixedFare: isFixed,
      captainNetFareEgp,
      trafficCongestionMultiplier: options?.trafficCongestionMultiplier || 1.0,
      trafficZoneName: options?.trafficZoneName,
      isRushHour: (options?.trafficCongestionMultiplier || 1.0) > 1.2,
      surgeMultiplier: options?.trafficCongestionMultiplier,
      isShuttleTrip: category === 'shuttle',
      totalSeats: 4,
    };

    setActiveRide(newRide);
    setChatMessages([]);
    addToast(
      `تم إرسال طلب المشوار بالسعر الثابت (${offeredFareEgp} ج.م كاش)! جاري البحث وتوجيه أقرب كابتن 🚖`,
      'info',
      { title: 'طلب مشوار جديد' }
    );
  };

  const acceptDriverOffer = (offer: DriverOffer) => {
    if (!activeRide) return;

    const existingDriver = drivers.find((d) => d.id === offer.driverId);
    let startX = existingDriver ? existingDriver.x : activeRide.pickup.x - 12;
    let startY = existingDriver ? existingDriver.y : activeRide.pickup.y + 8;
    if (Math.abs(startX - activeRide.pickup.x) < 5 && Math.abs(startY - activeRide.pickup.y) < 5) {
      startX = activeRide.pickup.x - 11;
      startY = activeRide.pickup.y + 7;
    }

    const chosenDriver: Driver = {
      id: offer.driverId,
      name: offer.driverName,
      avatar: offer.avatar,
      rating: offer.rating,
      totalTrips: offer.totalTrips,
      carModel: offer.carModel,
      carPlate: offer.carPlate,
      carColor: offer.carColor,
      x: startX,
      y: startY,
      isAvailable: false,
      phone: '01098234512',
      verified: true,
      totalSeats: 4,
      availableSeats: offer.availableSeats || 2,
    };

    setActiveRide({
      ...activeRide,
      status: 'driver_assigned',
      finalFareEgp: offer.offeredFareEgp,
      driver: chosenDriver,
    });

    // Automatically minimize modal so the rider immediately watches the live map progress!
    setIsRideModalMinimized(true);

    addToast(
      `تم تعيين الكابتن ${offer.driverName} وهو في طريقه إليك بالسيارة ${offer.carModel} (${offer.carPlate}) 🚗`,
      'success',
      { title: 'كابتن في الطريق' }
    );

    setChatMessages([
      {
        id: 'msg_welcome',
        sender: 'driver',
        text: `السلام عليكم! أنا ${offer.driverName}، قبلت المشوار بـ ${offer.offeredFareEgp} ج.م نقدي. أنا في طريقي إليك الآن بالسيارة ${offer.carModel} (${offer.carPlate}).`,
        timestamp: Date.now(),
      },
    ]);
  };

  const cancelRide = () => {
    setActiveRide(null);
    setIsRideModalMinimized(false);
    setChatMessages([]);
    addToast('تم إلغاء الرحلة بنجاح.', 'warning', { title: 'إلغاء المشوار' });
  };

  const advanceActiveRide = () => {
    if (!activeRide) return;
    if (activeRide.status === 'driver_assigned') {
      setActiveRide({ ...activeRide, status: 'arriving' });
    } else if (activeRide.status === 'arriving') {
      setActiveRide({ ...activeRide, status: 'in_progress' });
    } else if (activeRide.status === 'in_progress') {
      setActiveRide({ ...activeRide, status: 'completed' });
    }
  };

  // Complete Active Ride
  const completeActiveRide = () => {
    if (!activeRide) return;

    const fare = activeRide.finalFareEgp;
    const isFreeFirstRide = !isFirstRideFreeUsed;
    const commission = isFreeFirstRide ? 0 : Math.round(fare * 0.1);

    if (!isFreeFirstRide && commission > 0) {
      setCaptainBalanceEgp((prev) => Math.max(-50, prev - commission));
      const tx: WalletTransaction = {
        id: 'tx_comm_' + Date.now(),
        type: 'trip_commission',
        amountEgp: -commission,
        description: `خصم عمولة رحلة (10% من ${fare} ج.م كاش استلمها الكابتن)`,
        timestamp: Date.now(),
        referenceId: activeRide.id,
      };
      setCaptainTransactions((prev) => [tx, ...prev]);
    } else {
      setIsFirstRideFreeUsed(true);
    }

    setDriverEarningsTodayEgp((prev) => prev + fare);
    setCompletedRidesCountToday((prev) => prev + 1);

    setPendingCaptainReviewRide(activeRide);
    setActiveRide(null);
    setChatMessages([]);

    addToast(
      `تم إنهاء المشوار بنجاح واستلام ${fare} ج.م نقداً! شكراً لاختيارك وصلة ✨`,
      'success',
      { title: 'إتمام المشوار' }
    );
  };

  const submitRiderRatingOfCaptain = (
    rideId: string,
    rating: number,
    tags: string[],
    comment: string
  ) => {
    if (!activeRide) return;

    const newReview: CommunityReview = {
      id: 'rev_' + Date.now(),
      rideId,
      reviewerRole: 'rider',
      reviewerName: 'الراكب (أنت)',
      targetRole: 'driver',
      targetName: activeRide.driver?.name || 'الكابتن',
      rating,
      tags,
      comment: comment || 'رحلة مريحة وسائق محترم.',
      timestamp: Date.now(),
      tripRoute: `${activeRide.pickup.name.split('،')[0]} &larr; ${activeRide.destination.name.split('،')[0]}`,
    };

    setCommunityReviews((prev) => [newReview, ...prev]);

    const updatedRide: RideRequest = {
      ...activeRide,
      status: 'completed',
      captainRatingGivenByRider: rating,
      captainFeedbackByRider: comment,
      captainTagsByRider: tags,
    };
    setPastRides((prev) => [updatedRide, ...prev]);

    setActiveRide(null);
    setChatMessages([]);

    addToast('تم إرسال تقييمك للكابتن بنجاح! شكراً لدعمك الأمان والثقة في مجتمع وصلة ⭐', 'success', {
      title: 'تقييم الراكب للكابتن',
    });
  };

  const submitCaptainRatingOfRider = (
    rideId: string,
    rating: number,
    tags: string[],
    comment: string
  ) => {
    if (!pendingCaptainReviewRide) return;

    const newReview: CommunityReview = {
      id: 'rev_' + Date.now(),
      rideId,
      reviewerRole: 'driver',
      reviewerName: captainApplication?.fullName || 'الكابتن (أنت)',
      targetRole: 'rider',
      targetName: pendingCaptainReviewRide.riderName,
      rating,
      tags,
      comment: comment || 'راكب محترم وخلوق، كان متواجداً في الموعد ودفع الأجرة كاش.',
      timestamp: Date.now(),
      tripRoute: `${pendingCaptainReviewRide.pickup.name.split('،')[0]} &larr; ${pendingCaptainReviewRide.destination.name.split('،')[0]}`,
    };

    setCommunityReviews((prev) => [newReview, ...prev]);

    const newScore = Math.round(((riderScore * 10 + rating) / 11) * 100) / 100;
    setRiderScore(Math.min(5, newScore));

    const updatedRide: RideRequest = {
      ...pendingCaptainReviewRide,
      status: 'completed',
      riderRatingGivenByCaptain: rating,
      riderFeedbackByCaptain: comment,
      riderTagsByCaptain: tags,
    };
    setPastRides((prev) => [updatedRide, ...prev]);

    setPendingCaptainReviewRide(null);

    addToast('تم إرسال تقييمك للراكب بنجاح! شكراً لتعزيزك الثقة في مجتمع وصلة ⭐', 'success', {
      title: 'تقييم الكابتن للراكب',
    });
  };

  const dismissPendingCaptainReview = () => {
    if (pendingCaptainReviewRide) {
      setPastRides((prev) => [
        { ...pendingCaptainReviewRide, status: 'completed' },
        ...prev,
      ]);
      setPendingCaptainReviewRide(null);
    }
  };

  const toggleDriverOnline = () => {
    setIsDriverOnline((prev) => {
      const next = !prev;
      addToast(
        next
          ? 'أنت متصل الآن وجاهز لتلقي طلبات المشاوير الحية 🟢'
          : 'أنت في وضع الاستراحة الآن (غير متاح لتلقي الطلبات) ⏸️',
        next ? 'success' : 'info',
        { title: 'حالة الكابتن' }
      );
      return next;
    });
  };

  const acceptRideAsDriver = (rideId: string) => {
    const req = incomingDriverRides.find((r) => r.id === rideId);
    if (!req) return;

    setIncomingDriverRides((prev) => prev.filter((r) => r.id !== rideId));

    const isFree = !isFirstRideFreeUsed;
    const commission = isFree ? 0 : Math.round(req.finalFareEgp * 0.1);

    setActiveRide({
      ...req,
      status: 'in_progress',
      isFirstRideFreeCommission: isFree,
      commissionEgp: commission,
      driver: {
        id: 'current_user_driver',
        name: captainApplication?.fullName || 'الكابتن (أنت)',
        avatar:
          captainApplication?.avatarUrl ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=140&h=140&q=80',
        rating: 4.98,
        totalTrips: 1,
        carModel: `${captainApplication?.carMake || 'تويوتا'} ${captainApplication?.carModel || 'كورولا'}`,
        carPlate: captainApplication?.carPlate || 'س ر و 1928',
        carColor: captainApplication?.carColor || 'أبيض',
        x: req.pickup.x,
        y: req.pickup.y,
        isAvailable: false,
        phone: captainApplication?.phone || '01012345678',
        verified: true,
      },
    });

    addToast(
      `تم قبول المشوار بنجاح بالسعر الثابت ${req.finalFareEgp} ج.م (صافيك ${req.captainNetFareEgp || (req.finalFareEgp - commission)} ج.م كاش)! توجه لنقطة الركوب 🚖`,
      'success',
      { title: 'قبول المشوار' }
    );

    setChatMessages([
      {
        id: 'msg_drv_init',
        sender: 'rider',
        text: 'أهلاً يا كابتن، أنا في انتظارك عند نقطة الركوب.',
        timestamp: Date.now(),
      },
    ]);
  };

  const counterOfferAsDriver = (rideId: string, counterFare: number) => {
    setIncomingDriverRides((prev) =>
      prev.map((r) => (r.id === rideId ? { ...r, finalFareEgp: counterFare } : r))
    );
  };

  const declineRideAsDriver = (rideId: string) => {
    setIncomingDriverRides((prev) => prev.filter((r) => r.id !== rideId));
  };

  const sendChatMessage = (text: string) => {
    if (!text.trim()) return;
    const msg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: role === 'rider' ? 'rider' : 'driver',
      text: text.trim(),
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, msg]);

    if (role === 'rider') {
      setTimeout(() => {
        const replies = [
          'تمام يا فندم، دقيقة واحدة وهكون أمامك بالضبط.',
          'أنا وصلت وشغلت إشارات الانتظار أمام البوابة.',
          'تمام، متقلقش هكون عندك في الموعد.',
        ];
        const reply = replies[Math.floor(Math.random() * replies.length)];
        setChatMessages((prev) => [
          ...prev,
          {
            id: 'msg_rep_' + Date.now(),
            sender: 'driver',
            text: reply,
            timestamp: Date.now(),
          },
        ]);
      }, 1500);
    }
  };

  const openSosModal = (initiator?: 'rider' | 'driver') => {
    setSosInitiatorRole(initiator || role);
    setIsSosModalOpen(true);
  };

  const closeSosModal = () => {
    setIsSosModalOpen(false);
    setSafetyAlertSent(false);
  };

  const sendSafetyAlert = () => {
    setSafetyAlertSent(true);
    addToast(
      'تم إرسال بلاغ الطوارئ SOS ومشاركة موقعك اللحظي مع شرطة النجدة وجهات الاتصال! 🚨',
      'error',
      { title: 'طوارئ واستغاثة SOS' }
    );
  };

  const resetSimulation = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCaptainStatus('not_registered');
    setCaptainApplication(null);
    setIsFirstRideFreeUsed(false);
    setCaptainBalanceEgp(0);
    setCaptainTransactions(INITIAL_CAPTAIN_TRANSACTIONS);
    setActiveRide(null);
    setPastRides([]);
    setIncomingDriverRides([]);
    setChatMessages([]);
    setCommunityReviews(INITIAL_REVIEWS);
    setRiderScore(4.94);
    setCaptainScore(4.98);
    setPendingCaptainReviewRide(null);
    setAcceptanceNotification(null);
    setDriverEarningsTodayEgp(0);
    setCompletedRidesCountToday(0);
    setShuttlePassengers(INITIAL_SHUTTLE_PASSENGERS);
    setEnRouteRequest(null);
    setIsSosModalOpen(false);
    setSafetyAlertSent(false);
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        captainStatus,
        captainApplication,
        submitCaptainApplication,
        approveCaptainApplication,
        isFirstRideFreeUsed,
        captainBalanceEgp,
        captainTransactions,
        rechargeCaptainWallet,
        activeRide,
        pastRides,
        drivers,
        isDriverOnline,
        incomingDriverRides,
        chatMessages,
        communityReviews,
        riderScore,
        captainScore,
        pendingCaptainReviewRide,
        submitRiderRatingOfCaptain,
        submitCaptainRatingOfRider,
        dismissPendingCaptainReview,
        shuttlePassengers,
        enRouteRequest,
        boardShuttlePassenger,
        dropOffShuttlePassenger,
        acceptEnRouteRequest,
        declineEnRouteRequest,
        triggerDemoEnRouteRequest,
        requestRide,
        acceptDriverOffer,
        cancelRide,
        advanceActiveRide,
        completeActiveRide,
        toggleDriverOnline,
        acceptRideAsDriver,
        counterOfferAsDriver,
        declineRideAsDriver,
        sendChatMessage,
        isRideModalMinimized,
        setIsRideModalMinimized,
        isSosModalOpen,
        sosInitiatorRole,
        openSosModal,
        closeSosModal,
        safetyAlertSent,
        sendSafetyAlert,
        acceptanceNotification,
        dismissAcceptanceNotification,
        driverEarningsTodayEgp,
        completedRidesCountToday,
        resetSimulation,
        authUser,
        isAuthLoading,
        signInWithGoogle,
        signOutUser,
        theme,
        toggleTheme,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
