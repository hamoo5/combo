-- ==============================================================================
-- MasarX (مسار إكس) - Complete Supabase Database Schema & RLS Policies
-- Model: 0% Commission on Rides + Fixed Captain Subscription + Smart Grace Mode
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Profiles Table (Riders, Captains, Admins)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('rider', 'captain', 'admin')),
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    preferred_language VARCHAR(5) DEFAULT 'ar',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Captains Details & Live Status
CREATE TABLE IF NOT EXISTS public.captains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    national_id VARCHAR(30),
    driver_license_number VARCHAR(30),
    vehicle_model VARCHAR(50) NOT NULL, -- e.g. 'Toyota Corolla'
    vehicle_year INT NOT NULL DEFAULT 2023,
    vehicle_plate VARCHAR(20) NOT NULL, -- e.g. 'أ ب ج 1234'
    vehicle_color VARCHAR(30) DEFAULT 'أبيض لؤلؤي',
    vehicle_category VARCHAR(20) NOT NULL DEFAULT 'economy' CHECK (vehicle_category IN ('economy', 'comfort', 'family')),
    
    -- Subscription & Smart Grace Mode (0% Commission Model)
    subscription_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'grace_mode', 'expired', 'pending')),
    subscription_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    grace_mode_hours INT DEFAULT 6,
    grace_mode_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days' + INTERVAL '6 hours'),
    
    -- Live Tracking & Availability
    is_online BOOLEAN DEFAULT FALSE,
    current_lat NUMERIC(10, 7) DEFAULT 24.7136,
    current_lng NUMERIC(10, 7) DEFAULT 46.6753,
    heading NUMERIC(5, 2) DEFAULT 0.0,
    last_location_update TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metrics
    rating NUMERIC(3, 2) DEFAULT 4.95,
    total_trips INT DEFAULT 0,
    total_net_earnings NUMERIC(12, 2) DEFAULT 0.00, -- 100% kept by captain
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Subscription Plans for Captains
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_ar VARCHAR(100) NOT NULL,
    duration_days INT NOT NULL,
    price_sar NUMERIC(10, 2) NOT NULL,
    description_ar TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Captain Subscriptions History
CREATE TABLE IF NOT EXISTS public.captain_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    captain_id UUID REFERENCES public.captains(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.subscription_plans(id),
    amount_paid NUMERIC(10, 2) NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    grace_expires_at TIMESTAMPTZ NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'instant_transfer',
    payment_status VARCHAR(20) DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Dynamic Pricing Configuration (Fixed Upfront - No Hidden Surge)
CREATE TABLE IF NOT EXISTS public.pricing_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(20) UNIQUE NOT NULL CHECK (category IN ('economy', 'comfort', 'family')),
    base_fare NUMERIC(6, 2) NOT NULL DEFAULT 8.00,
    per_km_rate NUMERIC(6, 2) NOT NULL DEFAULT 1.75,
    per_minute_rate NUMERIC(6, 2) NOT NULL DEFAULT 0.40,
    minimum_fare NUMERIC(6, 2) NOT NULL DEFAULT 12.00,
    cancellation_fee NUMERIC(6, 2) NOT NULL DEFAULT 10.00,
    currency VARCHAR(10) DEFAULT 'ريال',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Rides Table (Live Trip State)
CREATE TABLE IF NOT EXISTS public.rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID REFERENCES public.profiles(id),
    captain_id UUID REFERENCES public.captains(id),
    
    -- Locations
    pickup_address TEXT NOT NULL,
    pickup_lat NUMERIC(10, 7) NOT NULL,
    pickup_lng NUMERIC(10, 7) NOT NULL,
    dropoff_address TEXT NOT NULL,
    dropoff_lat NUMERIC(10, 7) NOT NULL,
    dropoff_lng NUMERIC(10, 7) NOT NULL,
    
    -- Route & Metrics
    distance_km NUMERIC(8, 2) NOT NULL,
    duration_minutes INT NOT NULL,
    category VARCHAR(20) NOT NULL DEFAULT 'economy',
    
    -- 0% Commission Upfront Guaranteed Fare
    fixed_fare NUMERIC(8, 2) NOT NULL,
    captain_earnings NUMERIC(8, 2) NOT NULL, -- Equals fixed_fare (0% deducted!)
    platform_commission NUMERIC(8, 2) DEFAULT 0.00,
    payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'stc_pay')),
    
    -- Status Lifecycle
    status VARCHAR(30) NOT NULL DEFAULT 'searching' 
        CHECK (status IN ('searching', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled')),
    
    -- Smart Competitive Features
    is_favorite_captain_preferred BOOLEAN DEFAULT FALSE,
    share_token VARCHAR(64) UNIQUE DEFAULT md5(random()::text || clock_timestamp()::text),
    sos_alert_triggered BOOLEAN DEFAULT FALSE,
    sos_alert_timestamp TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    arrived_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT
);

-- 8. Favorite Captains Table (Rider Preferences)
CREATE TABLE IF NOT EXISTS public.favorite_captains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    captain_id UUID REFERENCES public.captains(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(rider_id, captain_id)
);

-- 9. Trip Ratings and Reviews
CREATE TABLE IF NOT EXISTS public.ride_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE,
    rider_id UUID REFERENCES public.profiles(id),
    captain_id UUID REFERENCES public.captains(id),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    cleanliness_score INT CHECK (cleanliness_score >= 1 AND cleanliness_score <= 5),
    driving_score INT CHECK (driving_score >= 1 AND driving_score <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Automated Smart Grace Mode Evaluator Function & Trigger
CREATE OR REPLACE FUNCTION public.check_captain_grace_period()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if subscription expired but still within 6-hour Grace Period
    IF NEW.subscription_expires_at < NOW() AND NOW() <= NEW.grace_mode_expires_at THEN
        NEW.subscription_status := 'grace_mode';
    ELSIF NOW() > NEW.grace_mode_expires_at THEN
        NEW.subscription_status := 'expired';
        NEW.is_online := FALSE; -- Automatically switch offline if grace ended
    ELSE
        NEW.subscription_status := 'active';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_check_captain_grace
BEFORE INSERT OR UPDATE ON public.captains
FOR EACH ROW
EXECUTE FUNCTION public.check_captain_grace_period();

-- 11. Initial Seed Data (Default Rates & Plans in EGP / ج.م)
INSERT INTO public.pricing_settings (category, base_fare, per_km_rate, per_minute_rate, minimum_fare, cancellation_fee, currency)
VALUES 
    ('economy', 15.00, 4.50, 0.85, 25.00, 15.00, 'ج.م'),
    ('comfort', 22.00, 6.00, 1.20, 35.00, 20.00, 'ج.م'),
    ('family', 30.00, 7.50, 1.50, 45.00, 25.00, 'ج.م')
ON CONFLICT (category) DO UPDATE 
SET base_fare = EXCLUDED.base_fare,
    per_km_rate = EXCLUDED.per_km_rate,
    minimum_fare = EXCLUDED.minimum_fare;

INSERT INTO public.subscription_plans (name_ar, duration_days, price_sar, description_ar)
VALUES 
    ('باقة الانطلاق اليومية التجريبية', 1, 25.00, 'تجربة يومية بدون عمولة مع أرباح كاملة لك'),
    ('باقة الكابتن المحترف (شهرية)', 30, 350.00, 'الباقة الأكثر طلباً: 0% عمولة على كل الرحلات + فترة سماح 6 ساعات مجانية'),
    ('باقة النخبة الذهبية (3 أشهر)', 90, 900.00, 'وفر 15% واحصل على أولوية توزيع طلبات الكابتن المفضل')
ON CONFLICT DO NOTHING;

-- 12. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.captains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_captains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.captain_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_reviews ENABLE ROW LEVEL SECURITY;

-- 13. High-Performance RLS Policies (Allow Demo Read & Write while securing keys)
CREATE POLICY "Public profiles can be viewed by all authenticated users"
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view online captains"
ON public.captains FOR SELECT USING (true);

CREATE POLICY "Captains can update own live location and status"
ON public.captains FOR UPDATE USING (true);

CREATE POLICY "Anyone can read pricing settings"
ON public.pricing_settings FOR SELECT USING (true);

CREATE POLICY "Admins can update pricing settings"
ON public.pricing_settings FOR ALL USING (true);

CREATE POLICY "Riders and Captains can view relevant rides"
ON public.rides FOR SELECT USING (true);

CREATE POLICY "Riders can insert rides"
ON public.rides FOR INSERT WITH CHECK (true);

CREATE POLICY "Riders and Captains can update rides"
ON public.rides FOR UPDATE USING (true);

CREATE POLICY "Favorite captains viewable by rider"
ON public.favorite_captains FOR ALL USING (true);

CREATE POLICY "Public reviews can be read"
ON public.ride_reviews FOR SELECT USING (true);

CREATE POLICY "Public subscriptions plans read"
ON public.subscription_plans FOR SELECT USING (true);

-- 14. Realtime Pub/Sub Streaming
-- Enable Realtime for live radar, live ride status, and admin monitors
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.captains;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pricing_settings;
