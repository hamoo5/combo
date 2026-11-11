/**
 * MasarX (مسار إكس) - Complete Core Logic & Routing Engine
 * Architecture: Vanilla JavaScript + Leaflet.js + OSRM + Supabase Realtime
 * Model: 0% Commission on Rides + Fixed Captain Subscription + Smart Grace Mode
 */

// ==============================================================================
// 1. STATE & GLOBAL CONFIGURATION
// ==============================================================================
const STATE = {
  currentRole: 'rider', // 'rider' | 'captain' | 'admin'
  theme: 'dark', // 'dark' | 'light'
  soundEnabled: true,
  adminUnlocked: false,
  
  // Geolocation defaults (Cairo Downtown Center, auto-overridden by user GPS)
  userCoords: { lat: 30.0444, lng: 31.2357 }, // Downtown Tahrir Square, Cairo
  destinationCoords: { lat: 30.1219, lng: 31.4056 }, // Cairo International Airport
  
  // Active Ride State
  activeRide: null,
  activeCategory: 'economy', // 'economy' | 'comfort' | 'family'
  isFavoriteOnly: false,
  routeData: {
    distanceKm: 16.4,
    durationMins: 22,
    polylinePoints: []
  },
  
  // Fast Search (Photon API) & Map Pin Picker State
  searchTarget: 'pickup', // 'pickup' | 'dropoff'
  searchDebounceTimer: null,
  pinPickerTarget: 'pickup',
  tempPinCoords: null,
  reverseGeoTimer: null,
  
  // Captain Screen Dual-Route Preview (Pre-Acceptance)
  captainCoords: { lat: 30.0520, lng: 31.2280 }, // Captain current location (1.4 km from Downtown)
  captainToRiderPolyline: null,
  riderToDestPolyline: null,
  captainPreviewMarkers: [],
  captainPreviewData: {
    arrivalDistanceKm: 1.5,
    arrivalDurationMins: 4,
    tripDistanceKm: 16.4,
    tripDurationMins: 22,
    legAPoints: [],
    legBPoints: []
  },
  
  // Live Street Polyline Vehicle Tracking
  trackedCarMarker: null,
  liveTrackingInterval: null,
  trackingLeg: 'idle', // 'to_pickup' | 'to_dropoff' | 'idle'
  trackingStepIndex: 0,
  
  // Pricing configuration (EGP Egyptian Pounds)
  pricing: {
    baseFare: 15.00,
    perKmRate: 4.50,
    perMinuteRate: 0.85,
    minimumFare: 25.00,
    currency: 'ج.م',
    categories: {
      economy: { multiplier: 1.0, title: 'اقتصادي', icon: '🚗' },
      comfort: { multiplier: 1.4, title: 'مريح', icon: '🚘' },
      family: { multiplier: 1.8, title: 'عائلي', icon: '🚐' }
    }
  },

  // Captain Profile & Smart Grace Mode State (Egyptian Fleet)
  captainProfile: {
    id: 'cpt-101',
    name: 'كابتن محمود حسن',
    phone: '+201012345678',
    rating: 4.96,
    totalTrips: 582,
    carModel: 'نيسان صني 2024',
    carColor: 'فضي ميتاليك',
    plate: 'ق هـ ر | 5821',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    isOnline: true,
    todayEarnings: 485.00,
    // Subscription & 6-Hour Smart Grace Mode
    subscriptionStatus: 'active', // 'active' | 'grace_mode' | 'expired'
    subscriptionExpiresAt: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
    graceModeHours: 6,
    graceExpiresAt: new Date(Date.now() + (18 + 6) * 3600 * 1000).toISOString()
  },

  // Simulated & Live Radar Captains Fleet in Cairo
  radarCaptains: [
    { id: 'cpt-1', name: 'محمود حسن', car: 'نيسان صني 2024', plate: 'ق هـ ر 5821', lat: 30.0480, lng: 31.2390, heading: 45, category: 'economy', rating: 4.96 },
    { id: 'cpt-2', name: 'أحمد سامي', car: 'تويوتا كورولا 2023', plate: 'س ي د 4192', lat: 30.0590, lng: 31.2210, heading: 120, category: 'comfort', rating: 4.98 },
    { id: 'cpt-3', name: 'إبراهيم فؤاد', car: 'كيا سيراتو 2023', plate: 'ط ن ط 7731', lat: 30.0560, lng: 31.3340, heading: 260, category: 'economy', rating: 4.92 },
    { id: 'cpt-4', name: 'عمر خطاب', car: 'هيونداي إلنترا 2024', plate: 'م ص ر 9924', lat: 30.0900, lng: 31.3280, heading: 310, category: 'comfort', rating: 4.97 },
    { id: 'cpt-5', name: 'حسام مصطفى', car: 'شيفروليه أوبترا 2023', plate: 'ع ط ف 3288', lat: 30.0250, lng: 31.4150, heading: 85, category: 'family', rating: 4.95 }
  ],

  // Favorite Captains saved by rider
  favoriteCaptains: JSON.parse(localStorage.getItem('masarx_favorites') || '[]'),

  // Supabase Config
  supabaseConfig: {
    url: localStorage.getItem('masarx_sb_url') || '',
    key: localStorage.getItem('masarx_sb_key') || ''
  },
  supabaseClient: null
};

// Map & Layer references
let mapInstance = null;
let tileLayer = null;
let userMarker = null;
let destMarker = null;
let captainMarkers = [];
let routePolyline = null;
let radarInterval = null;
let graceTimerInterval = null;
let heatmapLayer = null;
let heatmapFluctuationInterval = null;
let heatmapData = [];

// ==============================================
// 2. AUDIO SYNTHESIS ENGINE (ZERO EXTERNAL ASSET FAILURE)
// ==============================================
const AudioEngine = {
  ctx: null,
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  },
  playBeep(freq = 600, type = 'sine', duration = 0.15) {
    if (!STATE.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  },
  playSuccess() {
    this.playBeep(523.25, 'triangle', 0.1);
    setTimeout(() => this.playBeep(659.25, 'triangle', 0.15), 100);
    setTimeout(() => this.playBeep(783.99, 'triangle', 0.25), 200);
  },
  playIncomingRide() {
    this.playBeep(880, 'sine', 0.2);
    setTimeout(() => this.playBeep(1174, 'sine', 0.3), 150);
  },
  playSiren() {
    if (!STATE.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1400, this.ctx.currentTime + 0.3);
      osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.6);
    } catch (e) {}
  }
};

// ==============================================
// 3. AUTOMATIC TIME-BASED DAY/NIGHT THEME
// ==============================================
function initAutoTheme() {
  const currentHour = new Date().getHours();
  // Daylight is considered 06:00 to 18:00
  const isDaytime = currentHour >= 6 && currentHour < 18;
  const savedTheme = localStorage.getItem('masarx_theme');
  
  if (savedTheme) {
    STATE.theme = savedTheme;
  } else {
    STATE.theme = isDaytime ? 'light' : 'dark';
  }
  applyTheme();
}

function applyTheme() {
  const html = document.documentElement;
  const themeIcon = document.getElementById('themeIcon');
  if (STATE.theme === 'dark') {
    html.classList.add('dark');
    html.classList.remove('light');
    if (themeIcon) themeIcon.textContent = '🌙';
  } else {
    html.classList.remove('dark');
    html.classList.add('light');
    if (themeIcon) themeIcon.textContent = '☀️';
  }

  // Update map tiles to match theme
  updateMapTiles();
}

function toggleThemeManual() {
  STATE.theme = STATE.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('masarx_theme', STATE.theme);
  applyTheme();
  showToast(`تم التبديل إلى الوضع ${STATE.theme === 'dark' ? 'الليلي 🌙' : 'النهاري ☀️'}`);
}

// ==============================================
// 4. MAP INITIALIZATION & TILES (LEAFLET + OSRM)
// ==============================================
function initMap() {
  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  // Initialize Leaflet Map
  mapInstance = L.map('map', {
    zoomControl: false,
    attributionControl: false
  }).setView([STATE.userCoords.lat, STATE.userCoords.lng], 14);

  // Add clean attribution
  L.control.attribution({ position: 'bottomright' }).addTo(mapInstance);

  // Add Tile Layer
  updateMapTiles();

  // Create Rider User Marker (Glowing Beacon)
  const userIcon = L.divIcon({
    className: 'custom-user-icon',
    html: `
      <div class="relative w-7 h-7 flex items-center justify-center">
        <span class="absolute inset-0 rounded-full bg-emeraldAccent-400 opacity-60 radar-beacon"></span>
        <div class="w-4 h-4 rounded-full bg-emeraldAccent-500 border-2 border-white shadow-glow-emerald"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });

  userMarker = L.marker([STATE.userCoords.lat, STATE.userCoords.lng], {
    icon: userIcon,
    title: 'موقعك الحالي'
  }).addTo(mapInstance);

  // Create Destination Marker
  const destIcon = L.divIcon({
    className: 'custom-dest-icon',
    html: `
      <div class="relative w-8 h-8 flex items-center justify-center">
        <div class="w-6 h-6 rounded-full bg-goldAccent-500 border-2 border-white shadow-glow-gold flex items-center justify-center text-indigoTheme-950 font-bold text-[10px]">
          📍
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 28]
  });

  destMarker = L.marker([STATE.destinationCoords.lat, STATE.destinationCoords.lng], {
    icon: destIcon,
    title: 'الوجهة'
  }).addTo(mapInstance);

  // Handle map click to pick destination
  mapInstance.on('click', (e) => {
    if (STATE.pickingFromMap) {
      setDestination(e.latlng.lat, e.latlng.lng, `موقع محدد على الخريطة (${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)})`);
      STATE.pickingFromMap = false;
      const pickBtn = document.getElementById('pickMapBtn');
      if (pickBtn) pickBtn.textContent = 'حدد بالخريطة';
      showToast('تم تحديد الوجهة بنجاح 📍');
    }
  });

  // Start Live Captain Radar
  initCaptainRadar();

  // Initialize Live Demand Heatmap Layer (Leaflet.heat)
  initHeatmapLayer();

  // Calculate Initial Upfront Route via OSRM
  calculateRouteOSRM();

  // Try fetching actual GPS
  locateUserGPS();
}

function updateMapTiles() {
  if (!mapInstance) return;
  if (tileLayer) mapInstance.removeLayer(tileLayer);

  // Standard OpenStreetMap - 100% Free, NO API keys, NO watermarks, reliable worldwide!
  tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(mapInstance);
}

// ==============================================
// 4.1 REAL DEVICE GPS & REVERSE GEOCODING ENGINE
// ==============================================
function showLocationPermissionBlockedModal(msg) {
  const modal = document.getElementById('gpsBlockedModal');
  const msgEl = document.getElementById('gpsBlockedMessage');
  if (msgEl && msg) msgEl.textContent = msg;
  if (modal) modal.classList.remove('hidden');
}

function closeGpsBlockedModal() {
  const modal = document.getElementById('gpsBlockedModal');
  if (modal) modal.classList.add('hidden');
}

function updateStickyConfirmVisibility() {
  const container = document.getElementById('stickyConfirmContainer');
  if (!container) return;

  const isRiderRole = STATE.currentRole === 'rider';
  const hasNoActiveRide = !STATE.activeRide;
  const isBookingExpanded = !document.getElementById('riderBookingState')?.classList.contains('hidden');
  const isNotCollapsed = !isSheetCollapsed;
  const centerPin = document.getElementById('centerPinContainer');
  const isNotPickingPin = !centerPin || centerPin.classList.contains('hidden');

  if (isRiderRole && hasNoActiveRide && isBookingExpanded && isNotCollapsed && isNotPickingPin) {
    container.classList.remove('hidden');
    container.style.display = 'block';
  } else {
    container.classList.add('hidden');
    container.style.display = 'none';
  }
}

async function fetchRealUserGPS(isManualClick = false) {
  if (!('geolocation' in navigator)) {
    if (isManualClick) {
      showToast('المتصفح لا يدعم خاصية تحديد الموقع (Geolocation)');
    }
    return;
  }

  if (isManualClick) {
    showToast('جاري الاتصال بـ GPS الهاتف بأعلى دقة 🛰️...');
  }

  const options = {
    enableHighAccuracy: true,
    timeout: 12000,
    maximumAge: 0
  };

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const userLat = pos.coords.latitude;
      const userLng = pos.coords.longitude;
      const accuracy = Math.round(pos.coords.accuracy || 10);

      STATE.userCoords = { lat: userLat, lng: userLng };
      STATE.hasRealGPS = true;

      // Update pickup marker on map
      if (userMarker) {
        userMarker.setLatLng([userLat, userLng]);
      } else if (mapInstance) {
        const userIcon = L.divIcon({
          className: 'custom-user-icon',
          html: `
            <div class="relative w-7 h-7 flex items-center justify-center">
              <span class="absolute inset-0 rounded-full bg-emeraldAccent-400 opacity-60 radar-beacon"></span>
              <div class="w-4 h-4 rounded-full bg-emeraldAccent-500 border-2 border-white shadow-glow-emerald"></div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        userMarker = L.marker([userLat, userLng], { icon: userIcon }).addTo(mapInstance);
      }

      // Smoothly pan & zoom map to actual phone coordinates
      if (mapInstance) {
        mapInstance.flyTo([userLat, userLng], 16, { duration: 1.2 });
      }

      // Fetch actual street name via OpenStreetMap Nominatim reverse geocoding
      let resolvedStreet = `موقعي الحالي (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`;
      try {
        const revUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}&addressdetails=1&accept-language=ar`;
        const res = await fetch(revUrl, {
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            const road = addr.road || addr.pedestrian || addr.street || addr.residential || addr.neighbourhood || '';
            const district = addr.suburb || addr.city_district || addr.quarter || addr.town || addr.city || '';
            const city = addr.city || addr.town || addr.state || '';
            const parts = [road, district, city].filter(Boolean);
            if (parts.length > 0) {
              resolvedStreet = parts.join('، ');
            } else if (data.display_name) {
              resolvedStreet = data.display_name.split(',').slice(0, 3).join('، ');
            }
          }
        }
      } catch (err) {
        try {
          const photonRev = `https://photon.komoot.io/reverse?lat=${userLat}&lon=${userLng}&lang=ar`;
          const resP = await fetch(photonRev);
          if (resP.ok) {
            const dataP = await resP.json();
            if (dataP.features && dataP.features.length > 0) {
              const p = dataP.features[0].properties;
              const name = p.name || p.street || p.district || p.city;
              if (name) resolvedStreet = name;
            }
          }
        } catch (e) {}
      }

      const pInput = document.getElementById('pickupInput');
      if (pInput) pInput.value = resolvedStreet;

      // Adjust destination to be in the same city if previously too far away
      const distToDest = getDistanceFromLatLonInKm(userLat, userLng, STATE.destinationCoords.lat, STATE.destinationCoords.lng);
      if (distToDest > 35) {
        STATE.destinationCoords = {
          lat: userLat + 0.05,
          lng: userLng + 0.04
        };
        const dInput = document.getElementById('dropoffInput');
        if (dInput) dInput.value = 'الوجهة المحددة (داخل نطاق مدينتك)';
        if (destMarker) destMarker.setLatLng([STATE.destinationCoords.lat, STATE.destinationCoords.lng]);
      }

      // Reposition simulated captain fleet around user's GPS
      repositionFleetAround(userLat, userLng);

      // Recalculate route & fares
      calculateRouteOSRM();

      AudioEngine.playSuccess();
      showToast(`تم تحديد موقع هاتفك الفعلي بنجاح 📍 (دقة ±${accuracy}م): ${resolvedStreet.split('،')[0]}`);
    },
    (err) => {
      console.warn('Geolocation notice:', err.message);
      let errMsg = 'تعذر قراءة موقع الـ GPS.';
      if (err.code === 1) { // PERMISSION_DENIED
        errMsg = 'تم حظر صلاحية الموقع (GPS) في نافذة المعاينة أو المتصفح. يرجى تفعيل إذن الموقع من إعدادات المتصفح، أو يمكنك استخدام زر "بالخريطة 📍" لتحديد موقعك الفعلي بدقة.';
      } else if (err.code === 2) { // POSITION_UNAVAILABLE
        errMsg = 'إشارة الـ GPS غير متاحة حالياً على هاتفك. تأكد من تفعيل خدمات الموقع (Location).';
      } else if (err.code === 3) { // TIMEOUT
        errMsg = 'انتهت مهلة استجابة الـ GPS. أعد المحاولة في مكان مفتوح أو اختر بالخريطة 📍.';
      }

      if (isManualClick) {
        AudioEngine.playBeep(350, 'sawtooth', 0.2);
        showLocationPermissionBlockedModal(errMsg);
      }
    },
    options
  );
}

function locateUserGPS() {
  fetchRealUserGPS(false);
}

function recenterToUser() {
  fetchRealUserGPS(true);
}

function repositionFleetAround(lat, lng) {
  const offsets = [
    { dLat: 0.006, dLng: 0.005 },
    { dLat: -0.007, dLng: 0.004 },
    { dLat: 0.004, dLng: -0.006 },
    { dLat: -0.005, dLng: -0.005 },
    { dLat: 0.008, dLng: -0.002 }
  ];

  STATE.radarCaptains.forEach((cpt, i) => {
    const off = offsets[i % offsets.length];
    cpt.lat = lat + off.dLat;
    cpt.lng = lng + off.dLng;
  });

  initCaptainRadar();
}

let isSheetCollapsed = false;
function toggleSheetCollapse() {
  const sheet = document.getElementById('bottomSheet');
  const scrollArea = document.getElementById('sheetContentScroll');

  if (!sheet) return;

  isSheetCollapsed = !isSheetCollapsed;
  if (isSheetCollapsed) {
    sheet.style.maxHeight = '52px';
    if (scrollArea) scrollArea.style.display = 'none';
    showToast('تم تصغير القائمة لرؤية كامل الخريطة والكباتن 🗺️');
  } else {
    sheet.style.maxHeight = '45vh';
    if (scrollArea) scrollArea.style.display = 'block';
  }
  updateStickyConfirmVisibility();
}

// ==============================================
// 5. LIVE CAPTAIN RADAR (ANIMATED VEHICLES ON MAP)
// ==============================================
function initCaptainRadar() {
  // Clear any existing markers
  captainMarkers.forEach(m => mapInstance.removeLayer(m));
  captainMarkers = [];

  // Render icons for each captain in fleet
  STATE.radarCaptains.forEach(captain => {
    const isFavorite = STATE.favoriteCaptains.some(fav => fav.id === captain.id);
    const carIcon = L.divIcon({
      className: `captain-car-marker-${captain.id}`,
      html: `
        <div style="transform: rotate(${captain.heading}deg);" class="transition-transform duration-700 ease-out">
          <div class="relative w-8 h-8 rounded-xl ${isFavorite ? 'bg-goldAccent-500 shadow-glow-gold' : 'bg-indigoTheme-900 shadow-glow-emerald'} border ${isFavorite ? 'border-yellow-200' : 'border-emeraldAccent-400'} flex items-center justify-center text-xs">
            <span>🚗</span>
            ${isFavorite ? '<span class="absolute -top-1 -right-1 text-[8px]">⭐</span>' : ''}
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker([captain.lat, captain.lng], { icon: carIcon })
      .bindPopup(`
        <div class="text-right text-xs p-1 font-sans">
          <strong class="text-emeraldAccent-600 block">${captain.name}</strong>
          <span>${captain.car} • ${captain.plate}</span><br/>
          <span>⭐ ${captain.rating} • 0% عمولة</span>
        </div>
      `)
      .addTo(mapInstance);

    captainMarkers.push({ id: captain.id, marker, data: captain });
  });

  // Start smooth live movement simulation around streets
  if (radarInterval) clearInterval(radarInterval);
  radarInterval = setInterval(updateRadarMovement, 3500);
}

function updateRadarMovement() {
  if (!mapInstance) return;

  STATE.radarCaptains.forEach(captain => {
    // Small random step along heading with smooth drift
    const deltaLat = (Math.random() - 0.49) * 0.0006;
    const deltaLng = (Math.random() - 0.49) * 0.0006;
    captain.lat += deltaLat;
    captain.lng += deltaLng;
    captain.heading = (captain.heading + (Math.random() * 20 - 10) + 360) % 360;

    const entry = captainMarkers.find(m => m.id === captain.id);
    if (entry && entry.marker) {
      entry.marker.setLatLng([captain.lat, captain.lng]);
      const iconEl = entry.marker.getElement();
      if (iconEl) {
        const inner = iconEl.querySelector('div');
        if (inner) inner.style.transform = `rotate(${captain.heading}deg)`;
      }
    }
  });

  // Update Radar Badge Count
  const radarText = document.getElementById('radarText');
  if (radarText) {
    const onlineCount = STATE.radarCaptains.length;
    radarText.textContent = `رادار الكباتن نشط: ${onlineCount} مركبات تتحرك بالقرب منك`;
  }
}

// ==============================================
// 5.5 LIVE DEMAND HEATMAP LAYER (LEAFLET.HEAT)
// ==============================================
const DEMAND_HOTSPOTS = {
  airport: { lat: 30.1219, lng: 31.4056, name: 'مطار القاهرة الدولي', count: 42, baseIntensity: 0.98 },
  tagamoa: { lat: 30.0310, lng: 31.4065, name: 'التجمع الخامس / CFC', count: 35, baseIntensity: 0.95 },
  downtown: { lat: 30.0444, lng: 31.2357, name: 'وسط البلد / التحرير', count: 32, baseIntensity: 0.90 },
  zayed: { lat: 30.0074, lng: 30.9733, name: 'الشيخ زايد / مول العرب', count: 28, baseIntensity: 0.88 },
  nasrCity: { lat: 30.0560, lng: 31.3340, name: 'مدينة نصر / سيتي ستارز', count: 25, baseIntensity: 0.85 },
  maadi: { lat: 29.9592, lng: 31.2592, name: 'المعادي / كورنيش النيل', count: 20, baseIntensity: 0.80 }
};

function generateDemandHeatmapPoints() {
  const points = [];

  // Generate dense, realistic Gaussian clusters around each major demand zone
  Object.values(DEMAND_HOTSPOTS).forEach(spot => {
    for (let i = 0; i < spot.count; i++) {
      const u = Math.random() + Math.random() - 1;
      const v = Math.random() + Math.random() - 1;
      const lat = spot.lat + u * 0.007;
      const lng = spot.lng + v * 0.007;
      const intensity = Math.min(1.0, Math.max(0.4, spot.baseIntensity + (Math.random() * 0.2 - 0.1)));
      points.push([lat, lng, intensity]);
    }
  });

  // Seed high rider density around current user's pickup point
  if (STATE.userCoords) {
    for (let i = 0; i < 14; i++) {
      const u = (Math.random() - 0.5) * 0.008;
      const v = (Math.random() - 0.5) * 0.008;
      points.push([STATE.userCoords.lat + u, STATE.userCoords.lng + v, 0.82]);
    }
  }

  // If there's an active or searching ride, give it peak surge heat
  if (STATE.activeRide) {
    points.push([STATE.userCoords.lat, STATE.userCoords.lng, 1.0]);
    points.push([STATE.userCoords.lat + 0.001, STATE.userCoords.lng - 0.001, 0.95]);
  }

  return points;
}

function initHeatmapLayer() {
  if (!window.L || typeof window.L.heatLayer !== 'function') {
    console.warn('Leaflet.heat plugin not loaded yet, retrying in 300ms...');
    setTimeout(initHeatmapLayer, 300);
    return;
  }

  heatmapData = generateDemandHeatmapPoints();

  // Create Heatmap Layer with high-contrast, modern glassmorphic palette
  heatmapLayer = window.L.heatLayer(heatmapData, {
    radius: 26,
    blur: 18,
    maxZoom: 16,
    max: 1.0,
    minOpacity: 0.35,
    gradient: {
      0.2: '#10B981', // emerald glow for moderate demand
      0.45: '#34D399',
      0.65: '#F59E0B', // gold/amber for high density
      0.85: '#EF4444', // crimson red for peak surge hotspots
      1.0: '#DC2626'
    }
  });

  // Heatmap is enabled by default to immediately showcase high-demand zones to captains
  if (STATE.heatmapEnabled !== false) {
    STATE.heatmapEnabled = true;
    heatmapLayer.addTo(mapInstance);
    updateHeatmapUIButtons(true);
  }

  // Periodically fluctuate demand to simulate live ride requests flowing in
  if (heatmapFluctuationInterval) clearInterval(heatmapFluctuationInterval);
  heatmapFluctuationInterval = setInterval(updateLiveHeatmapDemand, 6000);
}

function updateLiveHeatmapDemand() {
  if (!heatmapLayer || !STATE.heatmapEnabled) return;

  // Add 1-2 new scattered live requests and slightly drift intensity
  const hotspots = Object.values(DEMAND_HOTSPOTS);
  const randomSpot = hotspots[Math.floor(Math.random() * hotspots.length)];
  
  const newLat = randomSpot.lat + (Math.random() - 0.5) * 0.006;
  const newLng = randomSpot.lng + (Math.random() - 0.5) * 0.006;
  const newIntensity = 0.85 + Math.random() * 0.15;
  
  heatmapData.push([newLat, newLng, newIntensity]);
  if (heatmapData.length > 220) {
    heatmapData.shift();
  }

  heatmapLayer.setLatLngs(heatmapData);
}

function toggleHeatmap(forcedState) {
  if (!mapInstance || !heatmapLayer) return;

  if (typeof forcedState === 'boolean') {
    STATE.heatmapEnabled = forcedState;
  } else {
    STATE.heatmapEnabled = !STATE.heatmapEnabled;
  }

  if (STATE.heatmapEnabled) {
    if (!mapInstance.hasLayer(heatmapLayer)) {
      heatmapLayer.addTo(mapInstance);
    }
    updateHeatmapUIButtons(true);
    AudioEngine.playBeep(750, 'triangle', 0.12);
    showToast('تم تفعيل الخريطة الحرارية لمناطق الطلب المرتفع 🔥');
  } else {
    if (mapInstance.hasLayer(heatmapLayer)) {
      mapInstance.removeLayer(heatmapLayer);
    }
    updateHeatmapUIButtons(false);
    AudioEngine.playBeep(450, 'sine', 0.1);
    showToast('تم إخفاء الخريطة الحرارية');
  }
}

function updateHeatmapUIButtons(isActive) {
  // Update map floating button
  const mapBtn = document.getElementById('heatmapToggleBtn');
  const dot = document.getElementById('heatStatusDot');
  if (mapBtn) {
    if (isActive) {
      mapBtn.className = 'w-10 h-10 rounded-xl glass-card text-goldAccent-400 flex items-center justify-center shadow-glow-gold border border-goldAccent-500/60 active:scale-95 transition-all relative';
      if (dot) dot.className = 'absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping';
    } else {
      mapBtn.className = 'w-10 h-10 rounded-xl glass-card text-slate-500 hover:text-slate-300 flex items-center justify-center shadow-lg border border-white/10 active:scale-95 transition-all relative opacity-70';
      if (dot) dot.className = 'absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-slate-500';
    }
  }

  // Update Captain View Widget Button
  const cptBtn = document.getElementById('captainHeatToggleBtn');
  const cptIcon = document.getElementById('captainHeatBtnIcon');
  const cptText = document.getElementById('captainHeatBtnText');
  if (cptBtn && cptText) {
    if (isActive) {
      cptBtn.className = 'px-2.5 py-1 rounded-xl bg-goldAccent-500 text-indigoTheme-950 font-extrabold text-xs shadow-glow-gold transition-all flex items-center gap-1';
      if (cptIcon) cptIcon.textContent = '🔥';
      cptText.textContent = 'الحرارية مفعّلة';
    } else {
      cptBtn.className = 'px-2.5 py-1 rounded-xl bg-indigoTheme-900/60 text-slate-300 hover:text-white font-bold text-xs border border-white/10 transition-all flex items-center gap-1';
      if (cptIcon) cptIcon.textContent = '⚡';
      cptText.textContent = 'تشغيل الحرارية';
    }
  }
}

function focusHeatSpot(spotKey) {
  const spot = DEMAND_HOTSPOTS[spotKey];
  if (!spot || !mapInstance) return;

  // Ensure heatmap is visible
  if (!STATE.heatmapEnabled) {
    toggleHeatmap(true);
  }

  mapInstance.flyTo([spot.lat, spot.lng], 14, { duration: 1.2 });
  AudioEngine.playSuccess();
  showToast(`🔥 تم التركيز على ${spot.name} - كثافة طلبات مرتفعة جداً للكباتن`);
}

function injectRideIntoHeatmap(lat, lng) {
  if (!heatmapLayer) return;
  heatmapData.push([lat, lng, 1.0]);
  heatmapData.push([lat + 0.001, lng - 0.001, 0.95]);
  heatmapLayer.setLatLngs(heatmapData);
}

// ==============================================
// 6. FREE OSRM ROUTING & UPFRONT 0% SURGE PRICING
// ==============================================
async function calculateRouteOSRM() {
  const p1 = `${STATE.userCoords.lng},${STATE.userCoords.lat}`;
  const p2 = `${STATE.destinationCoords.lng},${STATE.destinationCoords.lat}`;
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${p1};${p2}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(osrmUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = (route.distance / 1000).toFixed(1);
        const durationMins = Math.ceil(route.duration / 60);

        STATE.routeData.distanceKm = parseFloat(distanceKm);
        STATE.routeData.durationMins = durationMins;

        // Convert GeoJSON coordinates [lng, lat] to Leaflet [lat, lng]
        const latLngs = route.geometry.coordinates.map(c => [c[1], c[0]]);
        drawRoutePolyline(latLngs);
        updatePricingCards();
        return;
      }
    }
    throw new Error('OSRM empty response');
  } catch (err) {
    console.warn('OSRM network fallback to straight bezier line:', err);
    fallbackStraightRoute();
  }
}

function fallbackStraightRoute() {
  // Approximate geodesic distance
  const dLat = STATE.destinationCoords.lat - STATE.userCoords.lat;
  const dLng = STATE.destinationCoords.lng - STATE.userCoords.lng;
  const dist = Math.sqrt(dLat * dLat + dLng * dLng) * 111; // ~111km per deg
  STATE.routeData.distanceKm = parseFloat(dist.toFixed(1));
  STATE.routeData.durationMins = Math.max(5, Math.ceil(dist * 1.8));

  const latLngs = [
    [STATE.userCoords.lat, STATE.userCoords.lng],
    [
      (STATE.userCoords.lat + STATE.destinationCoords.lat) / 2 + 0.005,
      (STATE.userCoords.lng + STATE.destinationCoords.lng) / 2 - 0.005
    ],
    [STATE.destinationCoords.lat, STATE.destinationCoords.lng]
  ];
  drawRoutePolyline(latLngs);
  updatePricingCards();
}

function drawRoutePolyline(points) {
  if (!mapInstance) return;
  if (routePolyline) mapInstance.removeLayer(routePolyline);

  routePolyline = L.polyline(points, {
    color: '#10B981',
    weight: 5,
    opacity: 0.85,
    lineCap: 'round',
    lineJoin: 'round',
    dashArray: null
  }).addTo(mapInstance);

  STATE.routeData.polylinePoints = points;

  // Fit map bounds smoothly
  mapInstance.fitBounds(routePolyline.getBounds(), { padding: [50, 50] });

  // Update Route Summary Box
  const distEl = document.getElementById('routeDistanceText');
  const durEl = document.getElementById('routeDurationText');
  const summaryShort = document.getElementById('routeSummaryShort');
  if (distEl) distEl.textContent = `${STATE.routeData.distanceKm} كم`;
  if (durEl) durEl.textContent = `${STATE.routeData.durationMins} دقيقة`;
  if (summaryShort) summaryShort.textContent = `${STATE.routeData.distanceKm} كم • ${STATE.routeData.durationMins} دقيقة`;
}

// Calculate Upfront Fixed Fares for Each Category (0% Surge)
function calculateCategoryFare(categoryKey) {
  const cfg = STATE.pricing.categories[categoryKey] || STATE.pricing.categories.economy;
  const rawFare = STATE.pricing.baseFare +
    (STATE.routeData.distanceKm * STATE.pricing.perKmRate) +
    (STATE.routeData.durationMins * STATE.pricing.perMinuteRate);
  
  const total = Math.max(STATE.pricing.minimumFare, rawFare * cfg.multiplier);
  return total.toFixed(2);
}

function updatePricingCards() {
  const fareEco = calculateCategoryFare('economy');
  const fareComf = calculateCategoryFare('comfort');
  const fareFam = calculateCategoryFare('family');

  const ecoEl = document.getElementById('fareEconomyText');
  const comfEl = document.getElementById('fareComfortText');
  const famEl = document.getElementById('fareFamilyText');

  if (ecoEl) ecoEl.textContent = `${fareEco} ج.م`;
  if (comfEl) comfEl.textContent = `${fareComf} ج.م`;
  if (famEl) famEl.textContent = `${fareFam} ج.م`;

  const requestBtnText = document.getElementById('requestBtnText');
  if (requestBtnText) {
    const currentFare = calculateCategoryFare(STATE.activeCategory);
    requestBtnText.textContent = `تأكيد طلب الرحلة بالسعر الثابت (${currentFare} ج.م)`;
  }
}

function selectCategory(catKey) {
  STATE.activeCategory = catKey;
  ['catEconomy', 'catComfort', 'catFamily'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.classList.remove('border-2', 'border-emeraldAccent-500', 'bg-emeraldAccent-500/10', 'shadow-glow-emerald');
    btn.classList.add('border', 'border-white/10', 'bg-indigoTheme-900/40');
  });

  const activeId = catKey === 'economy' ? 'catEconomy' : (catKey === 'comfort' ? 'catComfort' : 'catFamily');
  const activeBtn = document.getElementById(activeId);
  if (activeBtn) {
    activeBtn.classList.remove('border', 'border-white/10', 'bg-indigoTheme-900/40');
    activeBtn.classList.add('border-2', 'border-emeraldAccent-500', 'bg-emeraldAccent-500/10', 'shadow-glow-emerald');
  }

  updatePricingCards();
  AudioEngine.playBeep(700, 'sine', 0.08);
}

// Bottom Sheet Step Management
function expandRiderBooking() {
  document.getElementById('riderExploreState')?.classList.add('hidden');
  document.getElementById('riderBookingState')?.classList.remove('hidden');
  updatePricingCards();
  AudioEngine.playBeep(650, 'sine', 0.08);
  updateStickyConfirmVisibility();
}

function minimizeRiderBooking() {
  document.getElementById('riderBookingState')?.classList.add('hidden');
  document.getElementById('riderExploreState')?.classList.remove('hidden');
  updateStickyConfirmVisibility();
}

// Quick Destination Pickers
function selectQuickDestination(name, lat, lng) {
  const dropInput = document.getElementById('dropoffInput');
  if (dropInput) dropInput.value = name;
  setDestination(lat, lng, name);
  expandRiderBooking();
}

function setDestination(lat, lng, label) {
  STATE.destinationCoords = { lat, lng };
  if (destMarker) destMarker.setLatLng([lat, lng]);
  calculateRouteOSRM();
}

// ==============================================
// 6.4 GEOMETRIC & BEARING UTILITIES
// ==============================================
function calculateBearing(startLat, startLng, destLat, destLng) {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLngRad = (startLng * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const destLngRad = (destLng * Math.PI) / 180;

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ==============================================
// 6.5 PHOTON FAST AUTOCOMPLETE SEARCH ENGINE (z-index: 9999)
// ==============================================
function openSearchOverlay(target) {
  STATE.searchTarget = target || 'pickup';
  const modal = document.getElementById('searchOverlayModal');
  const title = document.getElementById('searchModalTitle');
  const input = document.getElementById('searchInputField');
  const clearBtn = document.getElementById('clearSearchBtn');

  if (title) {
    title.textContent = STATE.searchTarget === 'pickup' ? 'بحث عن موقع الانطلاق 🟢' : 'بحث عن وجهة الوصول 🏁';
  }

  if (input) {
    input.value = '';
    input.placeholder = STATE.searchTarget === 'pickup' 
      ? 'اكتب مكان انطلاقك (شارع، ميدان، معلم)...' 
      : 'إلى أين وجهتك؟ (شارع، مول، مطار)...';
    if (clearBtn) clearBtn.classList.add('hidden');
  }

  if (modal) modal.classList.remove('hidden');
  setTimeout(() => input?.focus(), 150);

  if (input) {
    input.oninput = (e) => {
      const q = e.target.value.trim();
      if (clearBtn) {
        clearBtn.classList.toggle('hidden', !q);
      }
      if (STATE.searchDebounceTimer) clearTimeout(STATE.searchDebounceTimer);
      STATE.searchDebounceTimer = setTimeout(() => {
        searchPhotonAPI(q);
      }, 400);
    };

    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        triggerImmediateSearch();
      }
    };
  }

  renderSearchSuggestionsDefault();
}

function closeSearchOverlay() {
  const modal = document.getElementById('searchOverlayModal');
  if (modal) modal.classList.add('hidden');
}

function clearSearchInput() {
  const input = document.getElementById('searchInputField');
  const clearBtn = document.getElementById('clearSearchBtn');
  if (input) {
    input.value = '';
    input.focus();
  }
  if (clearBtn) clearBtn.classList.add('hidden');
  renderSearchSuggestionsDefault();
}

function triggerImmediateSearch() {
  const input = document.getElementById('searchInputField');
  const q = input?.value?.trim() || '';
  if (STATE.searchDebounceTimer) clearTimeout(STATE.searchDebounceTimer);
  searchPhotonAPI(q);
}

async function searchPhotonAPI(query) {
  return searchOpenStreetMapReal(query);
}

async function searchOpenStreetMapReal(query) {
  const listEl = document.getElementById('searchResultsList');
  const loader = document.getElementById('searchLoadingState');

  if (!query || query.length < 2) {
    if (loader) loader.classList.add('hidden');
    renderSearchSuggestionsDefault();
    return;
  }

  if (loader) loader.classList.remove('hidden');

  const biasLat = STATE.userCoords.lat || 30.0444;
  const biasLng = STATE.userCoords.lng || 31.2357;

  // 1. Direct OpenStreetMap Nominatim Real-Time Search
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=10&accept-language=ar`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(nominatimUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        if (loader) loader.classList.add('hidden');
        renderNominatimResults(data);
        return;
      }
    }
  } catch (err) {
    console.warn('Nominatim direct request notice, trying Photon Komoot:', err);
  }

  // 2. Fallback to Photon (OpenStreetMap Geocoder) with User Lat/Lng Biasing
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lang=ar&limit=10&lat=${biasLat}&lon=${biasLng}`;
    const res = await fetch(photonUrl);
    if (res.ok) {
      const data = await res.json();
      if (loader) loader.classList.add('hidden');
      if (data && data.features && data.features.length > 0) {
        renderPhotonResults(data.features);
        return;
      }
    }
  } catch (err) {
    console.warn('Photon Komoot search notice:', err);
  }

  // 3. Zero Results Found (No fake data!)
  if (loader) loader.classList.add('hidden');
  renderNoResultsFound(query);
}

function renderNominatimResults(items) {
  const listEl = document.getElementById('searchResultsList');
  if (!listEl) return;

  listEl.innerHTML = `
    <div class="px-1 py-1">
      <div class="flex items-center justify-between mb-2">
        <span class="text-[10px] font-bold text-emeraldAccent-300">نتائج OpenStreetMap الحية (${items.length}):</span>
        <span class="text-[9px] text-slate-400">بيانات خرائط دقيقة 100%</span>
      </div>
      <div class="space-y-1.5">
        ${items.map(item => {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          const addr = item.address || {};

          const mainName = addr.road || addr.pedestrian || addr.building || addr.amenity || addr.suburb || addr.quarter || addr.neighbourhood || item.name || (item.display_name ? item.display_name.split(',')[0] : 'شارع');
          const subParts = [addr.neighbourhood || addr.suburb, addr.city_district || addr.quarter, addr.city || addr.town || addr.county, addr.state].filter(Boolean);
          const subText = subParts.length > 0 ? subParts.join('، ') : (item.display_name || '');
          const dist = getDistanceFromLatLonInKm(STATE.userCoords.lat, STATE.userCoords.lng, lat, lng).toFixed(1);
          const fullNameToSave = `${mainName} (${subText.split('،').slice(0, 2).join('، ') || 'موقع محدد'})`;

          return `
            <div onclick="selectSearchResult(${lat}, ${lng}, '${escapeJsString(fullNameToSave)}')" class="p-2.5 rounded-2xl glass-elevated hover:border-emeraldAccent-400 cursor-pointer flex items-center justify-between gap-2 active:scale-[0.98] transition-all">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-8 h-8 rounded-xl bg-indigoTheme-900 border border-white/10 flex items-center justify-center text-xs shrink-0 text-emeraldAccent-400">
                  📍
                </div>
                <div class="min-w-0">
                  <span class="text-xs font-bold text-white block truncate">${mainName}</span>
                  <span class="text-[10px] text-slate-300 block truncate">${subText}</span>
                </div>
              </div>
              <span class="text-[9px] font-mono text-emeraldAccent-300 bg-emeraldAccent-500/10 px-1.5 py-0.5 rounded shrink-0">${dist} كم</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderPhotonResults(features) {
  const listEl = document.getElementById('searchResultsList');
  if (!listEl) return;

  listEl.innerHTML = `
    <div class="px-1 py-1">
      <div class="flex items-center justify-between mb-2">
        <span class="text-[10px] font-bold text-emeraldAccent-300">نتائج OpenStreetMap (${features.length}):</span>
        <span class="text-[9px] text-slate-400">بحث حي</span>
      </div>
      <div class="space-y-1.5">
        ${features.map(item => {
          const props = item.properties || {};
          const coords = item.geometry?.coordinates || [0, 0];
          const lng = coords[0];
          const lat = coords[1];

          const mainName = props.name || props.street || props.district || props.city || 'موقع محدد';
          const subParts = [props.street, props.district, props.city, props.state, props.country].filter(Boolean);
          const subText = subParts.join('، ') || 'موقع بالشارع';
          const dist = getDistanceFromLatLonInKm(STATE.userCoords.lat, STATE.userCoords.lng, lat, lng).toFixed(1);
          const fullNameToSave = `${mainName} (${subText.split('،').slice(0, 2).join('، ') || ''})`;

          return `
            <div onclick="selectSearchResult(${lat}, ${lng}, '${escapeJsString(fullNameToSave)}')" class="p-2.5 rounded-2xl glass-elevated hover:border-emeraldAccent-400 cursor-pointer flex items-center justify-between gap-2 active:scale-[0.98] transition-all">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-8 h-8 rounded-xl bg-indigoTheme-900 border border-white/10 flex items-center justify-center text-xs shrink-0 text-emeraldAccent-400">
                  📍
                </div>
                <div class="min-w-0">
                  <span class="text-xs font-bold text-white block truncate">${mainName}</span>
                  <span class="text-[10px] text-slate-300 block truncate">${subText}</span>
                </div>
              </div>
              <span class="text-[9px] font-mono text-emeraldAccent-300 bg-emeraldAccent-500/10 px-1.5 py-0.5 rounded shrink-0">${dist} كم</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderNoResultsFound(query) {
  const listEl = document.getElementById('searchResultsList');
  if (!listEl) return;

  listEl.innerHTML = `
    <div class="py-8 text-center px-4">
      <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xl mx-auto mb-3">
        🔍
      </div>
      <h4 class="text-xs font-bold text-white mb-1">لا توجد نتائج مطابقة لـ "${query}"</h4>
      <p class="text-[11px] text-slate-400 max-w-xs mx-auto mb-3.5">
        تأكد من صحة كتابة اسم الشارع أو المنطقة، أو يمكنك تحديد مكانك بدقة على الخريطة مباشرة.
      </p>
      <button onclick="closeSearchOverlay(); startCenterPinPicker(STATE.searchTarget);" class="px-4 py-2 rounded-xl bg-emeraldAccent-600 hover:bg-emeraldAccent-500 text-white text-xs font-bold shadow-glow-emerald transition-all inline-flex items-center gap-1.5 active:scale-95">
        <span>📍 التحديد بالدبوس على الخريطة</span>
      </button>
    </div>
  `;
}

function escapeJsString(str) {
  return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function renderSearchSuggestionsDefault() {
  const listEl = document.getElementById('searchResultsList');
  if (!listEl) return;

  listEl.innerHTML = `
    <div class="space-y-2 py-1">
      <div onclick="closeSearchOverlay(); fetchRealUserGPS(true);" class="p-3 rounded-2xl glass-elevated hover:border-emeraldAccent-400 cursor-pointer flex items-center justify-between gap-2 active:scale-[0.98] transition-all">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-emeraldAccent-500/20 border border-emeraldAccent-400/30 flex items-center justify-center text-base text-emeraldAccent-400 shrink-0">
            🎯
          </div>
          <div>
            <span class="text-xs font-bold text-white block">استخدام موقع هاتفي الحالي (GPS)</span>
            <span class="text-[10px] text-slate-300 block">قراءة الإحداثيات الفعلية وتحديث اسم الشارع تلقائياً</span>
          </div>
        </div>
        <span class="text-[10px] text-emeraldAccent-300 font-bold bg-emeraldAccent-500/10 px-2 py-1 rounded shrink-0">تحديد ←</span>
      </div>

      <div onclick="closeSearchOverlay(); startCenterPinPicker(STATE.searchTarget);" class="p-3 rounded-2xl glass-elevated hover:border-emeraldAccent-400 cursor-pointer flex items-center justify-between gap-2 active:scale-[0.98] transition-all">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-indigoTheme-900 border border-white/10 flex items-center justify-center text-base text-goldAccent-400 shrink-0">
            📍
          </div>
          <div>
            <span class="text-xs font-bold text-white block">التحديد اليدوي بالدبوس على الخريطة</span>
            <span class="text-[10px] text-slate-300 block">تحريك الخريطة ووضع الدبوس على باب منزلك أو وجهتك</span>
          </div>
        </div>
        <span class="text-[10px] text-goldAccent-300 font-bold bg-goldAccent-500/10 px-2 py-1 rounded shrink-0">بالخريطة ←</span>
      </div>

      <div class="p-3 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
        <p class="text-xs text-slate-300">
          🔍 اكتب أي شارع أو حي في المربع أعلاه للبحث المباشر عبر قاعدة بيانات OpenStreetMap الحية بدون أي بيانات وهمية.
        </p>
      </div>
    </div>
  `;
}

function applyQuickSearchChoice(name, lat, lng) {
  selectSearchResult(lat, lng, name);
}

function selectSearchResult(lat, lng, name) {
  if (STATE.searchTarget === 'pickup') {
    STATE.userCoords = { lat, lng };
    const pInput = document.getElementById('pickupInput');
    if (pInput) pInput.value = name;
    if (userMarker) userMarker.setLatLng([lat, lng]);
  } else {
    STATE.destinationCoords = { lat, lng };
    const dInput = document.getElementById('dropoffInput');
    if (dInput) dInput.value = name;
    if (destMarker) destMarker.setLatLng([lat, lng]);
  }

  closeSearchOverlay();
  if (mapInstance) {
    mapInstance.flyTo([lat, lng], 15, { duration: 1.2 });
  }

  calculateRouteOSRM();
  expandRiderBooking();
  AudioEngine.playSuccess();
  showToast(`تم تحديد ${STATE.searchTarget === 'pickup' ? 'نقطة الانطلاق' : 'الوجهة'}: ${name.split('،')[0]} 📍`);
}

// ==============================================
// 6.6 CENTER MAP PIN PICKER ENGINE (بالخريطة 📍)
// ==============================================
function startCenterPinPicker(target) {
  STATE.pinPickerTarget = target || 'pickup';

  // Temporarily collapse bottom sheet completely
  const sheet = document.getElementById('bottomSheet');
  if (sheet) sheet.classList.add('hidden');

  // Show Center Pin overlay and bottom confirm bar
  const centerPin = document.getElementById('centerPinContainer');
  const confirmBar = document.getElementById('pinConfirmBar');
  const confirmBtnText = document.getElementById('confirmPinBtnText');

  if (centerPin) centerPin.classList.remove('hidden');
  if (confirmBar) confirmBar.classList.remove('hidden');
  updateStickyConfirmVisibility();

  if (confirmBtnText) {
    confirmBtnText.textContent = STATE.pinPickerTarget === 'pickup'
      ? 'تأكيد هذا الموقع كنقطة انطلاق 🟢'
      : 'تأكيد هذا الموقع كوجهة وصول 🏁';
  }

  // Pan to current target position
  const targetCoords = STATE.pinPickerTarget === 'pickup' ? STATE.userCoords : STATE.destinationCoords;
  if (mapInstance && targetCoords) {
    mapInstance.panTo([targetCoords.lat, targetCoords.lng]);
  }

  // Attach map move listeners
  if (mapInstance) {
    mapInstance.on('move', onPinMapMove);
    mapInstance.on('moveend', onPinMapMoveEnd);
  }

  // Trigger initial reverse geocode for current map center
  onPinMapMoveEnd();
  showToast('حرك الخريطة وضع الدبوس على الموقع المطلوب بدقة 📍');
}

function onPinMapMove() {
  const bubbleText = document.getElementById('centerPinAddressText');
  if (bubbleText) bubbleText.textContent = 'جاري تحديد اسم الشارع أسفل الدبوس...';
}

function onPinMapMoveEnd() {
  if (!mapInstance) return;
  const center = mapInstance.getCenter();
  const bubbleText = document.getElementById('centerPinAddressText');

  if (STATE.reverseGeoTimer) clearTimeout(STATE.reverseGeoTimer);
  STATE.reverseGeoTimer = setTimeout(async () => {
    try {
      const url = `https://photon.komoot.io/reverse?lat=${center.lat}&lon=${center.lng}&lang=ar`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data.features && data.features.length > 0) {
          const props = data.features[0].properties || {};
          const streetName = props.name || props.street || props.district || props.city || 'شارع محدد على الخريطة';
          const area = [props.district, props.city].filter(Boolean).join('، ');
          const fullLabel = area ? `${streetName}، ${area}` : streetName;
          
          if (bubbleText) bubbleText.textContent = fullLabel;
          STATE.tempPinCoords = { lat: center.lat, lng: center.lng, name: fullLabel };
          return;
        }
      }
    } catch (e) {
      console.warn('Reverse geocode notice:', e);
    }
    
    const fallbackLabel = `موقع بالخريطة (${center.lat.toFixed(4)}, ${center.lng.toFixed(4)})`;
    if (bubbleText) bubbleText.textContent = fallbackLabel;
    STATE.tempPinCoords = { lat: center.lat, lng: center.lng, name: fallbackLabel };
  }, 350);
}

function confirmPinSelection() {
  if (!mapInstance) return;
  const center = mapInstance.getCenter();
  const coords = STATE.tempPinCoords || {
    lat: center.lat,
    lng: center.lng,
    name: `موقع محدد (${center.lat.toFixed(4)}, ${center.lng.toFixed(4)})`
  };

  if (STATE.pinPickerTarget === 'pickup') {
    STATE.userCoords = { lat: coords.lat, lng: coords.lng };
    const pInput = document.getElementById('pickupInput');
    if (pInput) pInput.value = coords.name;
    if (userMarker) userMarker.setLatLng([coords.lat, coords.lng]);
  } else {
    STATE.destinationCoords = { lat: coords.lat, lng: coords.lng };
    const dInput = document.getElementById('dropoffInput');
    if (dInput) dInput.value = coords.name;
    if (destMarker) destMarker.setLatLng([coords.lat, coords.lng]);
  }

  cleanupPinPicker();
  calculateRouteOSRM();
  expandRiderBooking();
  AudioEngine.playSuccess();
  showToast(`تم تثبيت ${STATE.pinPickerTarget === 'pickup' ? 'نقطة الانطلاق' : 'الوجهة'}: ${coords.name} ✅`);
}

function cancelPinSelection() {
  cleanupPinPicker();
  showToast('تم إلغاء تحديد الموقع بالخريطة');
}

function cleanupPinPicker() {
  if (mapInstance) {
    mapInstance.off('move', onPinMapMove);
    mapInstance.off('moveend', onPinMapMoveEnd);
  }
  const centerPin = document.getElementById('centerPinContainer');
  const confirmBar = document.getElementById('pinConfirmBar');
  const sheet = document.getElementById('bottomSheet');

  if (centerPin) centerPin.classList.add('hidden');
  if (confirmBar) confirmBar.classList.add('hidden');
  if (sheet) sheet.classList.remove('hidden');
  updateStickyConfirmVisibility();
}

// ==============================================
// 6.7 CAPTAIN SCREEN DUAL-ROUTE DISPATCH PREVIEW
// ==============================================
async function renderCaptainDualRoutePreview(ride) {
  if (!mapInstance) return;
  clearCaptainRoutePreview();

  // Position Captain within ~1.5 km of pickup
  const cptLat = STATE.userCoords.lat + 0.010;
  const cptLng = STATE.userCoords.lng - 0.011;
  STATE.captainCoords = { lat: cptLat, lng: cptLng };

  const pickupLat = STATE.userCoords.lat;
  const pickupLng = STATE.userCoords.lng;
  const dropLat = STATE.destinationCoords.lat;
  const dropLng = STATE.destinationCoords.lng;

  // 1. Captain Location Pin (🚗)
  const cptIcon = L.divIcon({
    className: 'captain-preview-marker',
    html: `
      <div class="relative w-9 h-9 rounded-2xl bg-indigoTheme-900 border-2 border-sky-400 shadow-glow-emerald flex items-center justify-center text-sm">
        <span>🚗</span>
        <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping"></span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
  const cptM = L.marker([cptLat, cptLng], { icon: cptIcon })
    .bindPopup('<strong class="text-xs">🚗 موقع الكابتن الحالي</strong>')
    .addTo(mapInstance);

  // 2. Rider Pickup Pin (🟢)
  const pickupIcon = L.divIcon({
    className: 'pickup-preview-marker',
    html: `
      <div class="relative w-8 h-8 rounded-full bg-emeraldAccent-500 border-2 border-white shadow-glow-emerald flex items-center justify-center text-xs font-bold text-white">
        🟢
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
  const pickupM = L.marker([pickupLat, pickupLng], { icon: pickupIcon })
    .bindPopup('<strong class="text-xs">🟢 نقطة انطلاق الراكب</strong>')
    .addTo(mapInstance);

  // 3. Destination Pin (🏁)
  const dropIcon = L.divIcon({
    className: 'dropoff-preview-marker',
    html: `
      <div class="relative w-8 h-8 rounded-full bg-goldAccent-500 border-2 border-white shadow-glow-gold flex items-center justify-center text-xs font-bold text-white">
        🏁
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
  const dropM = L.marker([dropLat, dropLng], { icon: dropIcon })
    .bindPopup('<strong class="text-xs">🏁 وجهة المشوار</strong>')
    .addTo(mapInstance);

  STATE.captainPreviewMarkers = [cptM, pickupM, dropM];

  // Fetch Leg A route via OSRM (Captain -> Pickup)
  try {
    const osrmLegA = `https://router.project-osrm.org/route/v1/driving/${cptLng},${cptLat};${pickupLng},${pickupLat}?overview=full&geometries=geojson`;
    const resA = await fetch(osrmLegA);
    if (resA.ok) {
      const dataA = await resA.json();
      if (dataA.routes && dataA.routes.length > 0) {
        const rA = dataA.routes[0];
        const distA = (rA.distance / 1000).toFixed(1);
        const durA = Math.ceil(rA.duration / 60);
        STATE.captainPreviewData.arrivalDistanceKm = parseFloat(distA);
        STATE.captainPreviewData.arrivalDurationMins = durA;
        STATE.captainPreviewData.legAPoints = rA.geometry.coordinates.map(c => [c[1], c[0]]);

        const distEl = document.getElementById('incomingCaptainToRiderDist');
        if (distEl) distEl.textContent = `${distA} كم • ${durA} دقائق`;
      }
    }
  } catch (e) {
    console.warn('Leg A route notice:', e);
  }

  // Draw Line 1: DASHED LINE (Captain -> Rider)
  const legAPoints = (STATE.captainPreviewData.legAPoints && STATE.captainPreviewData.legAPoints.length > 0)
    ? STATE.captainPreviewData.legAPoints
    : [[cptLat, cptLng], [pickupLat, pickupLng]];

  STATE.captainToRiderPolyline = L.polyline(legAPoints, {
    color: '#38BDF8', // Bright sky blue
    weight: 4,
    opacity: 0.9,
    dashArray: '8, 8', // DASHED LINE
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(mapInstance);

  STATE.captainToRiderPolyline.bindTooltip(`المسافة إليك: ${STATE.captainPreviewData.arrivalDistanceKm} كم • ${STATE.captainPreviewData.arrivalDurationMins} دقيقة`, {
    permanent: true,
    direction: 'top',
    className: 'bg-indigoTheme-950 text-sky-300 font-bold text-[10px] px-2 py-0.5 rounded-lg border border-sky-400/40 shadow-lg'
  });

  // Draw Line 2: SOLID GLOWING EMERALD LINE (Rider -> Destination)
  const legBPoints = (STATE.routeData.polylinePoints && STATE.routeData.polylinePoints.length > 0)
    ? STATE.routeData.polylinePoints
    : [[pickupLat, pickupLng], [dropLat, dropLng]];
  
  STATE.captainPreviewData.legBPoints = legBPoints;
  const tripDistEl = document.getElementById('incomingTripDist');
  if (tripDistEl) {
    tripDistEl.textContent = `${STATE.routeData.distanceKm} كم • ${STATE.routeData.durationMins} دقيقة`;
  }

  STATE.riderToDestPolyline = L.polyline(legBPoints, {
    color: '#10B981', // Solid emerald
    weight: 5,
    opacity: 0.95,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(mapInstance);

  STATE.riderToDestPolyline.bindTooltip(`مسافة الرحلة: ${STATE.routeData.distanceKm} كم (صافي 100% لك)`, {
    permanent: false,
    direction: 'center',
    className: 'bg-indigoTheme-950 text-emeraldAccent-300 font-bold text-[10px] px-2 py-0.5 rounded-lg border border-emeraldAccent-500/40 shadow-lg'
  });

  // Fit all 3 pins and both routes into map view
  const group = L.featureGroup([cptM, pickupM, dropM, STATE.captainToRiderPolyline, STATE.riderToDestPolyline]);
  mapInstance.fitBounds(group.getBounds(), { padding: [50, 50] });
}

function clearCaptainRoutePreview() {
  if (!mapInstance) return;
  if (STATE.captainToRiderPolyline) {
    mapInstance.removeLayer(STATE.captainToRiderPolyline);
    STATE.captainToRiderPolyline = null;
  }
  if (STATE.riderToDestPolyline) {
    mapInstance.removeLayer(STATE.riderToDestPolyline);
    STATE.riderToDestPolyline = null;
  }
  STATE.captainPreviewMarkers.forEach(m => mapInstance.removeLayer(m));
  STATE.captainPreviewMarkers = [];
}

// ==============================================
// 6.8 LIVE STREET POLYLINE VEHICLE TRACKING
// ==============================================
function startLivePolylineVehicleTracking() {
  stopLivePolylineVehicleTracking();

  let pts = STATE.captainPreviewData.legAPoints;
  if (!pts || pts.length < 2) {
    const cptLat = STATE.userCoords.lat + 0.010;
    const cptLng = STATE.userCoords.lng - 0.011;
    pts = [
      [cptLat, cptLng],
      [cptLat - 0.003, cptLng + 0.002],
      [cptLat - 0.007, cptLng + 0.006],
      [STATE.userCoords.lat, STATE.userCoords.lng]
    ];
  }

  STATE.trackingLeg = 'to_pickup';
  STATE.trackingStepIndex = 0;

  const startPt = pts[0];
  const initialBearing = calculateBearing(pts[0][0], pts[0][1], pts[1][0], pts[1][1]);

  const carIcon = L.divIcon({
    className: 'tracked-live-car',
    html: `
      <div id="trackedCarInner" style="transform: rotate(${initialBearing}deg);" class="transition-transform duration-300 ease-linear">
        <div class="relative w-9 h-9 rounded-2xl bg-indigoTheme-950 border-2 border-emeraldAccent-400 shadow-glow-emerald flex items-center justify-center text-sm">
          <span>🚗</span>
          <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emeraldAccent-400 animate-ping"></span>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  if (STATE.trackedCarMarker) {
    mapInstance.removeLayer(STATE.trackedCarMarker);
  }

  STATE.trackedCarMarker = L.marker([startPt[0], startPt[1]], {
    icon: carIcon,
    zIndexOffset: 1000
  }).addTo(mapInstance);

  const initialDist = STATE.captainPreviewData.arrivalDistanceKm || 1.5;
  const initialMins = STATE.captainPreviewData.arrivalDurationMins || 4;

  STATE.liveTrackingInterval = setInterval(() => {
    STATE.trackingStepIndex++;
    if (STATE.trackingStepIndex >= pts.length) {
      clearInterval(STATE.liveTrackingInterval);
      STATE.liveTrackingInterval = null;
      onCaptainArrivedAtPickup();
      return;
    }

    const currentPt = pts[STATE.trackingStepIndex];
    const prevPt = pts[STATE.trackingStepIndex - 1];
    const nextPt = pts[Math.min(STATE.trackingStepIndex + 1, pts.length - 1)];

    STATE.trackedCarMarker.setLatLng([currentPt[0], currentPt[1]]);

    const bearing = calculateBearing(prevPt[0], prevPt[1], nextPt[0], nextPt[1]);
    const inner = document.getElementById('trackedCarInner');
    if (inner) inner.style.transform = `rotate(${bearing}deg)`;

    const progressRatio = STATE.trackingStepIndex / (pts.length - 1);
    const remainingRatio = 1 - progressRatio;
    const remDist = Math.max(0.1, (initialDist * remainingRatio)).toFixed(1);
    const remMins = Math.max(1, Math.ceil(initialMins * remainingRatio));

    const heading = document.getElementById('riderStatusHeading');
    const etaBadge = document.getElementById('riderEtaBadge');
    const ticker = document.getElementById('riderLiveTicker');
    const progressBar = document.getElementById('riderTripProgressBar');

    if (heading) heading.textContent = 'الكابتن في طريقه إليك';
    if (etaBadge) etaBadge.textContent = `وصول ${remMins} د • ${remDist} كم`;
    if (ticker) {
      if (remDist > 0.4) {
        ticker.textContent = `الكابتن يقترب في الشارع: متبقي ${remDist} كم (${remMins} د)`;
      } else {
        ticker.textContent = `الكابتن على بُعد أمتار قليلة من نقطة الانطلاق!`;
      }
    }
    if (progressBar) {
      const pPercent = Math.min(48, Math.round(progressRatio * 48));
      progressBar.style.width = `${pPercent}%`;
    }
  }, 450);
}

function onCaptainArrivedAtPickup() {
  STATE.trackingLeg = 'arrived';
  if (STATE.activeRide) STATE.activeRide.status = 'arrived';

  AudioEngine.playSuccess();
  showToast('الكابتن وصل أمامك وبانتظارك 🚗');

  const heading = document.getElementById('riderStatusHeading');
  const etaBadge = document.getElementById('riderEtaBadge');
  const ticker = document.getElementById('riderLiveTicker');
  const progressBar = document.getElementById('riderTripProgressBar');

  if (heading) heading.textContent = 'الكابتن وصل وبانتظارك';
  if (etaBadge) etaBadge.textContent = 'وصل الآن ✓';
  if (ticker) ticker.textContent = 'الكابتن في موقع الانطلاق، يرجى الصعود للمركبة';
  if (progressBar) progressBar.style.width = '50%';

  const cptActionBtn = document.getElementById('captainActionBtn');
  const cptStepHeading = document.getElementById('captainStepHeading');
  if (cptActionBtn) cptActionBtn.textContent = 'بدء المشوار نحو الوجهة';
  if (cptStepHeading) cptStepHeading.textContent = 'الراكب يستقل المركبة - ابدأ المشوار';
}

function startTripToDestinationTracking() {
  stopLivePolylineVehicleTracking();

  let pts = STATE.routeData.polylinePoints;
  if (!pts || pts.length < 2) {
    pts = [
      [STATE.userCoords.lat, STATE.userCoords.lng],
      [
        (STATE.userCoords.lat + STATE.destinationCoords.lat) / 2,
        (STATE.userCoords.lng + STATE.destinationCoords.lng) / 2
      ],
      [STATE.destinationCoords.lat, STATE.destinationCoords.lng]
    ];
  }

  STATE.trackingLeg = 'to_dropoff';
  STATE.trackingStepIndex = 0;

  const totalDist = STATE.routeData.distanceKm;
  const totalMins = STATE.routeData.durationMins;

  STATE.liveTrackingInterval = setInterval(() => {
    STATE.trackingStepIndex++;
    if (STATE.trackingStepIndex >= pts.length) {
      clearInterval(STATE.liveTrackingInterval);
      STATE.liveTrackingInterval = null;
      completeRideFlow();
      return;
    }

    const currentPt = pts[STATE.trackingStepIndex];
    const prevPt = pts[STATE.trackingStepIndex - 1];
    const nextPt = pts[Math.min(STATE.trackingStepIndex + 1, pts.length - 1)];

    if (STATE.trackedCarMarker) {
      STATE.trackedCarMarker.setLatLng([currentPt[0], currentPt[1]]);
    }

    const bearing = calculateBearing(prevPt[0], prevPt[1], nextPt[0], nextPt[1]);
    const inner = document.getElementById('trackedCarInner');
    if (inner) inner.style.transform = `rotate(${bearing}deg)`;

    const progressRatio = STATE.trackingStepIndex / (pts.length - 1);
    const remainingRatio = 1 - progressRatio;
    const remDist = Math.max(0.1, (totalDist * remainingRatio)).toFixed(1);
    const remMins = Math.max(1, Math.ceil(totalMins * remainingRatio));

    const heading = document.getElementById('riderStatusHeading');
    const etaBadge = document.getElementById('riderEtaBadge');
    const ticker = document.getElementById('riderLiveTicker');
    const progressBar = document.getElementById('riderTripProgressBar');

    if (heading) heading.textContent = 'المشوار جاري حالياً نحو الوجهة';
    if (etaBadge) etaBadge.textContent = `متبقي ${remMins} د • ${remDist} كم`;
    if (ticker) ticker.textContent = `المشوار جاري: متبقي ${remDist} كم للوصول إلى الوجهة`;
    if (progressBar) {
      const pPercent = 50 + Math.min(50, Math.round(progressRatio * 50));
      progressBar.style.width = `${pPercent}%`;
    }
  }, 450);
}

function stopLivePolylineVehicleTracking() {
  if (STATE.liveTrackingInterval) {
    clearInterval(STATE.liveTrackingInterval);
    STATE.liveTrackingInterval = null;
  }
}

// ==============================================
// 7. RIDER BOOKING & RIDE LIFECYCLE
// ==============================================
function requestRide() {
  AudioEngine.playBeep(800, 'triangle', 0.2);
  const fare = calculateCategoryFare(STATE.activeCategory);
  
  // Create Ride Object
  STATE.activeRide = {
    id: 'rd-' + Math.floor(100000 + Math.random() * 900000),
    riderName: 'الراكب (أنت)',
    pickupAddress: document.getElementById('pickupInput')?.value || 'موقعي الحالي',
    dropoffAddress: document.getElementById('dropoffInput')?.value || 'الوجهة المحددة',
    category: STATE.activeCategory,
    fare: fare,
    distanceKm: STATE.routeData.distanceKm,
    durationMins: STATE.routeData.durationMins,
    status: 'searching', // 'searching' | 'accepted' | 'arrived' | 'in_progress' | 'completed'
    captain: null,
    isFavoriteOnly: STATE.isFavoriteOnly,
    createdAt: new Date().toISOString()
  };

  // Switch Rider UI to Active State
  document.getElementById('riderBookingState')?.classList.add('hidden');
  document.getElementById('riderActiveState')?.classList.remove('hidden');
  updateStickyConfirmVisibility();

  const heading = document.getElementById('riderStatusHeading');
  if (heading) heading.textContent = STATE.isFavoriteOnly 
    ? 'جاري إشعار كباتنك المفضلين أولاً...' 
    : 'جاري البحث عن أقرب كابتن متاح (0% عمولة)...';

  showToast('تم إرسال طلب المشوار بنجاح 🚖');

  // Inject active ride request into live heatmap so captains see instant surge heat
  injectRideIntoHeatmap(STATE.userCoords.lat, STATE.userCoords.lng);

  // Trigger Captain View Incoming Alert (Mirroring Realtime Supabase event)
  triggerCaptainIncoming(STATE.activeRide);

  // Simulate auto-acceptance after 2.5 seconds if user is currently watching Rider View
  setTimeout(() => {
    if (STATE.activeRide && STATE.activeRide.status === 'searching') {
      acceptRideWithCaptain(STATE.captainProfile);
    }
  }, 2500);
}

function acceptRideWithCaptain(captain) {
  if (!STATE.activeRide) return;
  STATE.activeRide.status = 'accepted';
  STATE.activeRide.captain = captain;

  AudioEngine.playSuccess();
  showToast(`تم قبول المشوار بواسطة ${captain.name} ⭐`);

  // Update Rider UI
  const heading = document.getElementById('riderStatusHeading');
  if (heading) heading.textContent = 'الكابتن في طريقه إليك الآن';

  const cptName = document.getElementById('activeCaptainName');
  const cptCar = document.getElementById('activeCaptainCar');
  const cptPlate = document.getElementById('activeCaptainPlate');
  const cptFare = document.getElementById('activeTripFare');
  const cptCall = document.getElementById('captainCallBtn');

  if (cptName) cptName.textContent = captain.name;
  if (cptCar) cptCar.textContent = `${captain.carModel} • ${captain.carColor}`;
  if (cptPlate) cptPlate.textContent = captain.plate;
  if (cptFare) cptFare.textContent = `${STATE.activeRide.fare} ج.م (100% للكابتن)`;
  if (cptCall) cptCall.href = `tel:${captain.phone}`;

  // Sync Captain View UI as well
  document.getElementById('captainIncomingCard')?.classList.add('hidden');
  document.getElementById('captainActiveTripCard')?.classList.remove('hidden');
  const cptActionBtn = document.getElementById('captainActionBtn');
  if (cptActionBtn) cptActionBtn.textContent = 'وصلت إلى موقع الراكب';

  // Start Live Polyline Vehicle Tracking (Leg A: Captain -> Pickup)
  startLivePolylineVehicleTracking();
}

function simulateNextRideStep() {
  if (!STATE.activeRide) return;

  if (STATE.activeRide.status === 'accepted') {
    onCaptainArrivedAtPickup();
  } else if (STATE.activeRide.status === 'arrived') {
    STATE.activeRide.status = 'in_progress';
    const heading = document.getElementById('riderStatusHeading');
    if (heading) heading.textContent = 'المشوار جاري حالياً نحو الوجهة';
    showToast('بدأت الرحلة نحو الوجهة، نتمنى لك وصولاً آمناً 🌟');
    startTripToDestinationTracking();
  } else if (STATE.activeRide.status === 'in_progress') {
    completeRideFlow();
  }
}

function completeRideFlow() {
  if (!STATE.activeRide) return;
  stopLivePolylineVehicleTracking();
  clearCaptainRoutePreview();
  if (STATE.trackedCarMarker && mapInstance) {
    mapInstance.removeLayer(STATE.trackedCarMarker);
    STATE.trackedCarMarker = null;
  }

  STATE.activeRide.status = 'completed';
  AudioEngine.playSuccess();

  // Add earnings to Captain (100% no deduction)
  const fareNum = parseFloat(STATE.activeRide.fare);
  STATE.captainProfile.todayEarnings += fareNum;
  const earnEl = document.getElementById('captainTodayEarnings');
  if (earnEl) earnEl.textContent = `${STATE.captainProfile.todayEarnings.toFixed(2)} ج.م`;

  // Open Rating & Favorite Driver Modal
  const ratingModal = document.getElementById('ratingModal');
  if (ratingModal) ratingModal.classList.remove('hidden');
}

function cancelCurrentRide() {
  if (!confirm('هل أنت متأكد من رغبتك في إلغاء الطلب؟')) return;
  stopLivePolylineVehicleTracking();
  clearCaptainRoutePreview();
  if (STATE.trackedCarMarker && mapInstance) {
    mapInstance.removeLayer(STATE.trackedCarMarker);
    STATE.trackedCarMarker = null;
  }

  STATE.activeRide = null;
  document.getElementById('riderActiveState')?.classList.add('hidden');
  document.getElementById('riderBookingState')?.classList.add('hidden');
  document.getElementById('riderExploreState')?.classList.remove('hidden');
  document.getElementById('captainActiveTripCard')?.classList.add('hidden');
  document.getElementById('captainIncomingCard')?.classList.add('hidden');
  updateStickyConfirmVisibility();
  showToast('تم إلغاء الرحلة');
}

// ==============================================
// 8. SMART FEATURE: SOS & LIVE WHATSAPP ROUTE SHARING
// ==============================================
function shareTripViaWhatsApp() {
  if (!STATE.activeRide) {
    showToast('لا توجد رحلة نشطة حالياً لمشاركتها');
    return;
  }

  const captain = STATE.activeRide.captain || STATE.captainProfile;
  const currentCoords = STATE.trackedCarMarker ? STATE.trackedCarMarker.getLatLng() : STATE.userCoords;
  const liveTrackingUrl = `https://maps.google.com/?q=${currentCoords.lat.toFixed(5)},${currentCoords.lng.toFixed(5)}`;

  const message = `🚨 *تتبع مسار رحلتي بأمان عبر MasarX (مسار إكس)*:
🚖 *الكابتن*: ${captain.name}
🚘 *المركبة*: ${captain.carModel || 'نيسان صني'} (${captain.carColor || 'فضي'})
🔢 *اللوحة*: ${captain.plate || 'ق هـ ر 5821'}
📞 *الجوال*: ${captain.phone || '+201012345678'}
📍 *الانطلاق*: ${STATE.activeRide.pickupAddress}
🏁 *الوجهة*: ${STATE.activeRide.dropoffAddress}
💰 *الأجرة الثابتة*: ${STATE.activeRide.fare} ج.م (0% عمولة)
📍 *موقع المركبة الحي*: ${liveTrackingUrl}
🕒 أشاركك مسار الرحلة لحظة بلحظة للاطمئنان على وصولي بسلام!`;

  const encodedMsg = encodeURIComponent(message);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMsg}`;
  window.open(whatsappUrl, '_blank');
  showToast('جاري فتح واتساب لمشاركة مسار الرحلة والإحداثيات 📲');
}

function triggerEmergencySOS() {
  AudioEngine.playSiren();
  
  const sosMsg = `🚨 *نداء استغاثة طارئ SOS - MasarX*:
أنا في رحلة حالياً وأطلب المساعدة العاجلة!
📍 إحداثياتي الحالية: https://maps.google.com/?q=${STATE.userCoords.lat},${STATE.userCoords.lng}
🚖 الكابتن: ${STATE.activeRide?.captain?.name || 'كابتن مسار إكس'}
لوحة المركبة: ${STATE.activeRide?.captain?.plate || 'لوحة رسمية'}`;

  if (confirm(`⚠️ هل تود إطلاق إنذار الطوارئ SOS وإرسال موقعك الفوري للجهات وعائلتك؟\n\nسيتم فتح واتساب والاتصال بالطوارئ فوراً.`)) {
    const encoded = encodeURIComponent(sosMsg);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    window.location.href = 'tel:911';
    showToast('تم تفعيل بروتوكول الطوارئ SOS 🚨');
  }
}

// ==============================================
// 9. SMART FEATURE: FAVORITE DRIVER (الكابتن المفضل)
// ==============================================
function toggleFavoriteMode(enabled) {
  STATE.isFavoriteOnly = enabled;
  if (enabled) {
    const count = STATE.favoriteCaptains.length;
    showToast(`تم تفعيل طلب الكابتن المفضل أولاً (لديك ${count} كابتن مفضل) ⭐`);
  } else {
    showToast('تم تعطيل تفضيل الكباتن - الإرسال للجميع');
  }
}

let selectedRatingStars = 5;
function setRating(stars) {
  selectedRatingStars = stars;
  const starBtns = document.querySelectorAll('.star-btn');
  starBtns.forEach((btn, idx) => {
    btn.style.opacity = idx < stars ? '1' : '0.3';
  });
  AudioEngine.playBeep(600 + stars * 60, 'triangle', 0.1);
}

function submitReviewAndReset() {
  const addFav = document.getElementById('addFavoriteCaptainCheck')?.checked;
  const captain = STATE.activeRide?.captain || STATE.captainProfile;

  if (addFav && captain) {
    const exists = STATE.favoriteCaptains.some(fav => fav.id === captain.id);
    if (!exists) {
      STATE.favoriteCaptains.push({
        id: captain.id,
        name: captain.name,
        car: captain.carModel,
        plate: captain.plate,
        rating: captain.rating
      });
      localStorage.setItem('masarx_favorites', JSON.stringify(STATE.favoriteCaptains));
      showToast(`تمت إضافة ${captain.name} إلى قائمة الكباتن المفضلين ⭐`);
    }
  }

  // Reset Modals & Flow
  document.getElementById('ratingModal')?.classList.add('hidden');
  document.getElementById('riderActiveState')?.classList.add('hidden');
  document.getElementById('riderBookingState')?.classList.add('hidden');
  document.getElementById('riderExploreState')?.classList.remove('hidden');
  document.getElementById('captainActiveTripCard')?.classList.add('hidden');
  STATE.activeRide = null;
  updateStickyConfirmVisibility();

  showToast('شكراً لتقييمك! نتمنى لك يوماً رائعاً');
}

// ==============================================
// 10. SMART GRACE MODE ENGINE (6 HOURS COUNTDOWN)
// ==============================================
function initGraceModeEngine() {
  updateGraceCountdown();
  if (graceTimerInterval) clearInterval(graceTimerInterval);
  graceTimerInterval = setInterval(updateGraceCountdown, 1000);
}

function updateGraceCountdown() {
  const graceCountdownText = document.getElementById('graceCountdownText');
  const badge = document.getElementById('subscriptionStatusBadge');
  if (!graceCountdownText || !badge) return;

  const now = new Date().getTime();
  const graceEnd = new Date(STATE.captainProfile.graceExpiresAt).getTime();
  const subEnd = new Date(STATE.captainProfile.subscriptionExpiresAt).getTime();

  const diffMs = graceEnd - now;

  if (now > graceEnd) {
    // Expired
    STATE.captainProfile.subscriptionStatus = 'expired';
    badge.className = 'text-[10px] text-red-400 font-bold px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 inline-block mt-0.5';
    badge.textContent = 'منتهي الصلاحية (يرجى التجديد)';
    graceCountdownText.textContent = '00:00:00 (انتهت فترة السماح)';
    graceCountdownText.className = 'text-xs font-mono font-extrabold text-red-400';
  } else if (now > subEnd) {
    // In Grace Mode (6 hours)
    STATE.captainProfile.subscriptionStatus = 'grace_mode';
    badge.className = 'text-[10px] text-goldAccent-400 font-bold px-2 py-0.5 rounded-full bg-goldAccent-500/10 border border-goldAccent-500/30 inline-block mt-0.5 animate-pulse';
    badge.textContent = 'فترة سماح ذكية 6 ساعات (0% عمولة نشطة)';
    
    // Format remaining hours/mins/secs
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
    const timeFormatted = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    
    graceCountdownText.textContent = `${timeFormatted} متبقية`;
    graceCountdownText.className = 'text-xs font-mono font-extrabold text-goldAccent-400';
  } else {
    // Active normally
    STATE.captainProfile.subscriptionStatus = 'active';
    badge.className = 'text-[10px] text-emeraldAccent-400 font-bold px-2 py-0.5 rounded-full bg-emeraldAccent-500/10 border border-emeraldAccent-500/30 inline-block mt-0.5';
    badge.textContent = 'اشتراك نشط (0% عمولة مطبقة)';
    
    const diffActive = subEnd - now;
    const days = Math.floor(diffActive / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffActive % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    graceCountdownText.textContent = `${days} يوم و ${hours} ساعة (+ 6س سماح)`;
    graceCountdownText.className = 'text-xs font-mono font-extrabold text-emeraldAccent-400';
  }
}

// ==============================================
// 11. CAPTAIN ROLE LOGIC & WORKFLOW
// ==============================================
function toggleCaptainOnline(isOnline) {
  STATE.captainProfile.isOnline = isOnline;
  const dot = document.getElementById('captainOnlineDot');
  const text = document.getElementById('captainStatusText');

  if (isOnline) {
    if (dot) dot.className = 'w-3.5 h-3.5 rounded-full bg-emeraldAccent-400 radar-beacon';
    if (text) text.textContent = 'أنت متصل وجاهز لتلقي الطلبات';
    showToast('أصبحت متصلاً الآن - ستصلك طلبات الركاب 🚀');
  } else {
    if (dot) dot.className = 'w-3.5 h-3.5 rounded-full bg-slate-600';
    if (text) text.textContent = 'أنت غير متصل حالياً';
    showToast('تم إيقاف استقبال الطلبات');
  }
}

async function triggerCaptainIncoming(ride) {
  AudioEngine.playIncomingRide();
  const card = document.getElementById('captainIncomingCard');
  if (!card) return;

  const fareTag = document.getElementById('incomingFareTag');
  const pickup = document.getElementById('incomingPickupText');
  const dropoff = document.getElementById('incomingDropoffText');

  if (fareTag) fareTag.textContent = `${ride.fare} ج.م`;
  if (pickup) pickup.textContent = ride.pickupAddress;
  if (dropoff) dropoff.textContent = ride.dropoffAddress;

  card.classList.remove('hidden');

  // Trigger Captain View Dual-Route Preview (Pre-Acceptance)
  // Pin 1: Captain, Pin 2: Pickup, Pin 3: Dropoff
  // Line 1: Dashed Line (Captain -> Rider)
  // Line 2: Solid Glowing Line (Rider -> Destination)
  await renderCaptainDualRoutePreview(ride);
}

function captainAcceptRide() {
  if (!STATE.activeRide) {
    // Demo mock request in Cairo
    STATE.activeRide = {
      id: 'rd-' + Math.floor(100000 + Math.random() * 900000),
      fare: '85.00',
      category: 'economy',
      pickupAddress: 'ميدان التحرير، وسط البلد، القاهرة',
      dropoffAddress: 'مطار القاهرة الدولي، صالة 3',
      riderName: 'أحمد محمود',
      status: 'accepted'
    };
  }
  acceptRideWithCaptain(STATE.captainProfile);
  showToast('تم قبول المشوار بنجاح! توجه للراكب 🚗');
}

function captainDeclineRide() {
  document.getElementById('captainIncomingCard')?.classList.add('hidden');
  clearCaptainRoutePreview();
  showToast('تم تخطي الطلب');
}

function captainAdvanceStage() {
  const btn = document.getElementById('captainActionBtn');
  const heading = document.getElementById('captainStepHeading');

  if (!btn || !heading) return;

  if (btn.textContent.includes('وصلت إلى موقع الراكب')) {
    heading.textContent = 'الراكب يستقل المركبة - ابدأ المشوار';
    btn.textContent = 'بدء المشوار نحو الوجهة';
    simulateNextRideStep();
  } else if (btn.textContent.includes('بدء المشوار')) {
    heading.textContent = 'المشوار جاري حالياً نحو الوجهة';
    btn.textContent = 'إنهاء المشوار واستلام المبلغ كاملاً (0% عمولة)';
    simulateNextRideStep();
  } else if (btn.textContent.includes('إنهاء المشوار')) {
    completeRideFlow();
  }
}

// Subscription renewal
function openRenewModal() {
  document.getElementById('renewModal')?.classList.remove('hidden');
}

function closeRenewModal() {
  document.getElementById('renewModal')?.classList.add('hidden');
}

let selectedPlanKey = 'monthly';
function selectPlan(planKey) {
  selectedPlanKey = planKey;
  AudioEngine.playBeep(750, 'sine', 0.1);
}

function confirmPlanRenewal() {
  const days = selectedPlanKey === 'daily' ? 1 : (selectedPlanKey === 'monthly' ? 30 : 90);
  STATE.captainProfile.subscriptionStatus = 'active';
  STATE.captainProfile.subscriptionExpiresAt = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
  STATE.captainProfile.graceExpiresAt = new Date(Date.now() + (days * 24 + 6) * 3600 * 1000).toISOString();
  
  closeRenewModal();
  updateGraceCountdown();
  AudioEngine.playSuccess();
  showToast(`تم تجديد اشتراك الكابتن بنجاح لمدة ${days} يوم + 6 ساعات سماح ذكية 🛡️`);
}

// ==============================================
// 12. ADMIN CONTROL PANEL (PASSWORD PROTECTED)
// ==============================================
function openAdminModal() {
  if (STATE.adminUnlocked) {
    switchRole('admin');
  } else {
    document.getElementById('adminPassModal')?.classList.remove('hidden');
  }
}

function closeAdminModal() {
  document.getElementById('adminPassModal')?.classList.add('hidden');
}

function verifyAdminPin() {
  const pinInput = document.getElementById('adminPinInput');
  const entered = pinInput?.value?.trim();

  if (entered === 'masarx2026') {
    STATE.adminUnlocked = true;
    closeAdminModal();
    switchRole('admin');
    AudioEngine.playSuccess();
    showToast('تمت مصادقة المشرف العام بنجاح 🛡️');
  } else {
    AudioEngine.playBeep(300, 'sawtooth', 0.3);
    alert('كلمة المرور غير صحيحة! كلمة المرور الافتراضية هي: masarx2026');
  }
}

function lockAdminSession() {
  STATE.adminUnlocked = false;
  switchRole('rider');
  showToast('تم قفل جلسة الإدارة بنجاح');
}

function renderAdminCaptainsList() {
  const listEl = document.getElementById('adminCaptainsList');
  if (!listEl) return;

  const demoCaptains = [
    { id: 'cpt-101', name: 'محمود حسن (أنت)', status: STATE.captainProfile.subscriptionStatus, car: 'نيسان صني 2024', plate: 'ق هـ ر 5821' },
    { id: 'cpt-1', name: 'أحمد سامي', status: 'active', car: 'تويوتا كورولا 2023', plate: 'س ي د 4192' },
    { id: 'cpt-2', name: 'إبراهيم فؤاد', status: 'grace_mode', car: 'كيا سيراتو 2023', plate: 'ط ن ط 7731' },
    { id: 'cpt-3', name: 'عمر خطاب', status: 'expired', car: 'هيونداي إلنترا 2024', plate: 'م ص ر 9924' }
  ];

  listEl.innerHTML = demoCaptains.map(c => `
    <div class="p-2 bg-indigoTheme-950/80 rounded-xl border border-white/5 flex items-center justify-between text-xs">
      <div>
        <div class="flex items-center gap-1.5">
          <span class="font-bold text-white">${c.name}</span>
          <span class="text-[9px] px-1.5 py-0.5 rounded-md ${
            c.status === 'active' ? 'bg-emeraldAccent-500/20 text-emeraldAccent-400' :
            c.status === 'grace_mode' ? 'bg-goldAccent-500/20 text-goldAccent-400 animate-pulse' :
            'bg-red-500/20 text-red-400'
          }">${c.status === 'active' ? 'نشط' : (c.status === 'grace_mode' ? 'سماح 6س' : 'منتهي')}</span>
        </div>
        <span class="text-[10px] text-slate-400">${c.car} • ${c.plate}</span>
      </div>
      <div class="flex items-center gap-1">
        <button onclick="adminGrantGrace('${c.id}')" class="px-2 py-1 bg-goldAccent-500/20 hover:bg-goldAccent-500/40 text-goldAccent-300 rounded text-[10px] font-semibold" title="منح 6 ساعات سماح">
          +6س سماح
        </button>
        <button onclick="adminRenewCaptain('${c.id}')" class="px-2 py-1 bg-emeraldAccent-600/30 hover:bg-emeraldAccent-600/50 text-emeraldAccent-300 rounded text-[10px] font-semibold" title="تجديد شهر">
          تجديد شهر
        </button>
      </div>
    </div>
  `).join('');
}

function adminGrantGrace(captainId) {
  STATE.captainProfile.graceExpiresAt = new Date(Date.now() + 6 * 3600 * 1000).toISOString();
  STATE.captainProfile.subscriptionStatus = 'grace_mode';
  updateGraceCountdown();
  renderAdminCaptainsList();
  showToast('تم منح الكابتن 6 ساعات سماح ذكية فورياً');
}

function adminRenewCaptain(captainId) {
  STATE.captainProfile.subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  STATE.captainProfile.graceExpiresAt = new Date(Date.now() + (30 * 24 + 6) * 3600 * 1000).toISOString();
  STATE.captainProfile.subscriptionStatus = 'active';
  updateGraceCountdown();
  renderAdminCaptainsList();
  showToast('تم تجديد اشتراك الكابتن لشهر كامل (0% عمولة)');
}

function savePricingSettings() {
  const base = parseFloat(document.getElementById('settingBaseFare')?.value || '15.0');
  const perKm = parseFloat(document.getElementById('settingPerKm')?.value || '4.5');
  const minFare = parseFloat(document.getElementById('settingMinFare')?.value || '25.0');

  STATE.pricing.baseFare = base;
  STATE.pricing.perKmRate = perKm;
  STATE.pricing.minimumFare = minFare;

  updatePricingCards();
  AudioEngine.playSuccess();
  showToast('تم حفظ وتطبيق تسعيرة المشاوير الثابتة على المنصة بنجاح ✅');
}

// ==============================================
// 13. ROLE SWITCHER
// ==============================================
function switchRole(role) {
  STATE.currentRole = role;

  const tabRider = document.getElementById('tabRider');
  const tabCaptain = document.getElementById('tabCaptain');
  const tabAdmin = document.getElementById('tabAdmin');

  const riderView = document.getElementById('riderView');
  const captainView = document.getElementById('captainView');
  const adminView = document.getElementById('adminView');

  // Reset tab button styles
  [tabRider, tabCaptain, tabAdmin].forEach(tab => {
    if (!tab) return;
    tab.className = 'px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-slate-400 hover:text-white';
  });

  // Hide all views
  riderView?.classList.add('hidden');
  captainView?.classList.add('hidden');
  adminView?.classList.add('hidden');

  if (role === 'rider') {
    tabRider.className = 'px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-white bg-emeraldAccent-600 shadow-glow-emerald font-bold';
    riderView?.classList.remove('hidden');
  } else if (role === 'captain') {
    tabCaptain.className = 'px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-white bg-emeraldAccent-600 shadow-glow-emerald font-bold';
    captainView?.classList.remove('hidden');
    initGraceModeEngine();
    updateHeatmapUIButtons(STATE.heatmapEnabled);
  } else if (role === 'admin') {
    tabAdmin.className = 'px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-indigoTheme-950 bg-goldAccent-500 shadow-glow-gold font-extrabold';
    adminView?.classList.remove('hidden');
    renderAdminCaptainsList();
  }

  AudioEngine.playBeep(role === 'admin' ? 850 : 600, 'sine', 0.08);
  updateStickyConfirmVisibility();
}

// ==============================================
// 14. SUPABASE LIVE INTEGRATION MODAL & CLIENT
// ==============================================
function openSupabaseModal() {
  document.getElementById('supabaseUrlInput').value = STATE.supabaseConfig.url;
  document.getElementById('supabaseKeyInput').value = STATE.supabaseConfig.key;
  document.getElementById('supabaseModal')?.classList.remove('hidden');
}

function closeSupabaseModal() {
  document.getElementById('supabaseModal')?.classList.add('hidden');
}

function saveSupabaseConfig() {
  const url = document.getElementById('supabaseUrlInput')?.value.trim();
  const key = document.getElementById('supabaseKeyInput')?.value.trim();

  STATE.supabaseConfig.url = url;
  STATE.supabaseConfig.key = key;
  localStorage.setItem('masarx_sb_url', url);
  localStorage.setItem('masarx_sb_key', key);

  if (url && key && window.supabase) {
    try {
      STATE.supabaseClient = window.supabase.createClient(url, key);
      showToast('تم الربط المباشر مع Supabase بنجاح! ⚡');
    } catch (e) {
      console.warn('Supabase init notice:', e);
    }
  } else {
    showToast('تم الحفظ، سيستمر التطبيق في وضع المحاكاة اللحظية');
  }
  closeSupabaseModal();
}

function resetSupabaseToDemo() {
  localStorage.removeItem('masarx_sb_url');
  localStorage.removeItem('masarx_sb_key');
  STATE.supabaseConfig.url = '';
  STATE.supabaseConfig.key = '';
  closeSupabaseModal();
  showToast('تمت استعادة الوضع التجريبي الافتراضي فائق السرعة');
}

// ==============================================
// 15. UI HELPERS & TOAST SYSTEM
// ==============================================
function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'glass-card px-4 py-2.5 rounded-2xl border border-emeraldAccent-500/40 text-xs font-bold text-white shadow-glass flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0 pointer-events-auto';
  toast.innerHTML = `
    <span class="w-2 h-2 rounded-full bg-emeraldAccent-400"></span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', '-translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function toggleSound() {
  STATE.soundEnabled = !STATE.soundEnabled;
  const btn = document.getElementById('soundToggleBtn');
  if (btn) {
    btn.className = STATE.soundEnabled
      ? 'w-10 h-10 rounded-xl glass-card text-slate-300 hover:text-white flex items-center justify-center shadow-lg border border-white/10 active:scale-95 transition-transform'
      : 'w-10 h-10 rounded-xl glass-card text-red-400 flex items-center justify-center shadow-lg border border-red-500/30 active:scale-95 transition-transform';
  }
  showToast(STATE.soundEnabled ? 'تم تفعيل التنبيهات الصوتية 🔊' : 'تم كتم الأصوات 🔇');
}

// ==============================================
// 16. SERVICE WORKER REGISTRATION (PWA)
// ==============================================
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('MasarX PWA Service Worker Registered:', reg.scope))
      .catch(err => console.warn('PWA SW Register Notice:', err));
  }
}

// ==============================================
// 17. APP ENTRY BOOTSTRAP
// ==============================================
window.addEventListener('DOMContentLoaded', () => {
  initAutoTheme();
  initMap();
  initGraceModeEngine();
  registerServiceWorker();
  updateStickyConfirmVisibility();

  // Bottom Sheet Touch Gestures (Mobile Friendly)
  const sheet = document.getElementById('bottomSheet');
  const handle = document.getElementById('sheetHandle');
  let startY = 0;
  let isDragging = false;

  if (handle && sheet) {
    handle.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      isDragging = true;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;
      if (deltaY > 60) {
        // swipe down -> collapse slightly
        sheet.style.transform = 'translateY(40%)';
      } else if (deltaY < -60) {
        // swipe up -> expand
        sheet.style.transform = 'translateY(0%)';
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      isDragging = false;
      sheet.style.transform = 'translateY(0%)';
    });
  }

  console.log('MasarX platform ready with 0% Commission & Smart Grace Mode.');
});
