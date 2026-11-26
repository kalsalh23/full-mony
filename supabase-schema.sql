-- Monus Cloud Mining Platform Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    balance DECIMAL(18, 8) DEFAULT 0,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mining plans
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    min_amount DECIMAL(18, 8) NOT NULL,
    daily_rate DECIMAL(5, 2) NOT NULL, -- percentage, e.g., 1.50 for 1.5%
    duration_days INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User investments
CREATE TABLE investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    amount DECIMAL(18, 8) NOT NULL,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily earnings
CREATE TABLE earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(18, 8) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(investment_id, date)
);

-- Deposits
CREATE TABLE deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(18, 8) NOT NULL,
    network TEXT NOT NULL,
    tx_hash TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Withdrawals
CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(18, 8) NOT NULL,
    fee DECIMAL(18, 8) NOT NULL,
    net_amount DECIMAL(18, 8) NOT NULL,
    address TEXT NOT NULL,
    network TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Neero Ad Card
CREATE TABLE ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    link_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policies
CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_investments_user_id ON investments(user_id);
CREATE INDEX idx_investments_status ON investments(status);
CREATE INDEX idx_earnings_user_id ON earnings(user_id);
CREATE INDEX idx_earnings_date ON earnings(date);
CREATE INDEX idx_deposits_user_id ON deposits(user_id);
CREATE INDEX idx_deposits_status ON deposits(status);
CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Plans policies (public read for active plans)
CREATE POLICY "Anyone can view active plans" ON plans
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON plans
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Investments policies
CREATE POLICY "Users can view own investments" ON investments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create investments" ON investments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Earnings policies
CREATE POLICY "Users can view own earnings" ON earnings
    FOR SELECT USING (auth.uid() = user_id);

-- Deposits policies
CREATE POLICY "Users can view own deposits" ON deposits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create deposits" ON deposits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage deposits" ON deposits
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Withdrawals policies
CREATE POLICY "Users can view own withdrawals" ON withdrawals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawals" ON withdrawals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage withdrawals" ON withdrawals
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Ads policies
CREATE POLICY "Anyone can view active ads" ON ads
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage ads" ON ads
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Policies policies
CREATE POLICY "Anyone can view policies" ON policies
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage policies" ON policies
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Functions for atomic operations
CREATE OR REPLACE FUNCTION create_investment(p_user_id UUID, p_plan_id UUID, p_amount DECIMAL)
RETURNS VOID AS $$
DECLARE
    v_plan plans%ROWTYPE;
    v_balance DECIMAL;
    v_end_date TIMESTAMPTZ;
BEGIN
    -- Get plan details
    SELECT * INTO v_plan FROM plans WHERE id = p_plan_id AND is_active = true;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Plan not found or inactive';
    END IF;

    -- Check minimum amount
    IF p_amount < v_plan.min_amount THEN
        RAISE EXCEPTION 'Amount below minimum';
    END IF;

    -- Check balance
    SELECT balance INTO v_balance FROM profiles WHERE id = p_user_id FOR UPDATE;
    IF v_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- Calculate end date
    v_end_date := NOW() + (v_plan.duration_days || ' days')::INTERVAL;

    -- Deduct balance
    UPDATE profiles SET balance = balance - p_amount WHERE id = p_user_id;

    -- Create investment
    INSERT INTO investments (user_id, plan_id, amount, end_date)
    VALUES (p_user_id, p_plan_id, p_amount, v_end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION confirm_deposit(p_deposit_id UUID, p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE deposits SET status = 'confirmed', processed_at = NOW() WHERE id = p_deposit_id;
    UPDATE profiles SET balance = balance + p_amount WHERE id = (
        SELECT user_id FROM deposits WHERE id = p_deposit_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION refund_withdrawal(p_withdrawal_id UUID, p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE withdrawals SET status = 'rejected', processed_at = NOW() WHERE id = p_withdrawal_id;
    UPDATE profiles SET balance = balance + p_amount WHERE id = (
        SELECT user_id FROM withdrawals WHERE id = p_withdrawal_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_balance(p_user_id UUID, p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles SET balance = balance + p_amount WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Cron job for daily earnings (run via pg_cron or Supabase Edge Function)
-- This function calculates and distributes daily earnings
CREATE OR REPLACE FUNCTION distribute_daily_earnings()
RETURNS VOID AS $$
DECLARE
    v_investment RECORD;
    v_daily_earning DECIMAL;
BEGIN
    FOR v_investment IN
        SELECT i.id, i.user_id, i.amount, p.daily_rate
        FROM investments i
        JOIN plans p ON i.plan_id = p.id
        WHERE i.status = 'active'
        AND i.end_date > NOW()
        AND NOT EXISTS (
            SELECT 1 FROM earnings e
            WHERE e.investment_id = i.id
            AND e.date = CURRENT_DATE
        )
    LOOP
        v_daily_earning := (v_investment.amount * v_investment.daily_rate) / 100;
        
        INSERT INTO earnings (investment_id, user_id, amount, date)
        VALUES (v_investment.id, v_investment.user_id, v_daily_earning, CURRENT_DATE);
        
        UPDATE profiles SET balance = balance + v_daily_earning WHERE id = v_investment.user_id;
    END LOOP;

    -- Mark completed investments
    UPDATE investments
    SET status = 'completed'
    WHERE status = 'active' AND end_date <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_investment TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_deposit TO authenticated;
GRANT EXECUTE ON FUNCTION refund_withdrawal TO authenticated;
GRANT EXECUTE ON FUNCTION increment_balance TO authenticated;
GRANT EXECUTE ON FUNCTION distribute_daily_earnings TO authenticated;

-- Insert default plans
INSERT INTO plans (name, min_amount, daily_rate, duration_days) VALUES
('Starter', 10, 1.00, 30),
('Basic', 100, 1.50, 30),
('Silver', 500, 2.00, 60),
('Gold', 1000, 2.50, 90),
('VIP', 5000, 3.00, 180);

-- Insert default policies
INSERT INTO policies (slug, title, content) VALUES
('privacy', 'Privacy Policy', '<h2>Privacy Policy</h2><p>Content here...</p>'),
('terms', 'Terms of Service', '<h2>Terms of Service</h2><p>Content here...</p>'),
('withdrawal', 'Withdrawal & Fee Policy', '<h2>Withdrawal & Fee Policy</h2><p>Content here...</p>'),
('risk', 'Risk Disclaimer', '<h2>Risk Disclaimer</h2><p>Content here...</p>');

-- Insert sample ad
INSERT INTO ads (title, description, image_url, link_url, is_active) VALUES
('Special Mining Bonus', 'Get 10% extra on your first investment this month!', 'https://via.placeholder.com/400x200/1e293b/22c55e?text=Special+Offer', '/invest', true);