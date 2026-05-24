-- FitHub Gym Management System SQL Database Schema
-- Run this DDL script in your Supabase SQL Editor to initialize your Postgres database.

-- Drop existing tables if they exist to start clean
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS trainers CASCADE;
DROP TABLE IF EXISTS plans CASCADE;

-- 1. PLANS TABLE
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  duration INTEGER NOT NULL, -- duration in months
  features TEXT[] DEFAULT '{}'
);

-- 2. TRAINERS TABLE
CREATE TABLE trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  specialty VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL DEFAULT 'changeme',
  status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive'))
);

-- 3. MEMBERS TABLE
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL DEFAULT 'changeme',
  join_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Pending')),
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
  gender VARCHAR(20) DEFAULT 'Other' CHECK (gender IN ('Male', 'Female', 'Other')),
  notes TEXT
);

-- 4. ATTENDANCE TABLE
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  time TIME DEFAULT CURRENT_TIME,
  check_in_type VARCHAR(100) DEFAULT 'Gym Access'
);

-- 5. PAYMENTS TABLE
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  payment_method VARCHAR(50) DEFAULT 'Card',
  status VARCHAR(20) DEFAULT 'Paid' CHECK (status IN ('Paid', 'Unpaid', 'Refunded'))
);

-- Indexing for search performance optimization
CREATE INDEX idx_members_name ON members(name);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_trainers_email ON trainers(email);
CREATE INDEX idx_attendance_member ON attendance(member_id);
CREATE INDEX idx_payments_member ON payments(member_id);


-- ================= SEED DATA INSERTIONS =================

-- A. Insert Base Plans
INSERT INTO plans (id, name, price, duration, features) VALUES
('8b3c66f5-0955-46cb-84cc-3d441113ea4b', 'Basic Gym Access', 29.00, 1, ARRAY['Full gym floor access', 'Standard locker room access', '1 complementary fitness assessment']),
('0ee846d0-994c-4ba3-8b77-d64bf991da2c', 'Elite Fitness Pro', 59.00, 1, ARRAY['Full gym floor access', 'All group fitness classes', 'Sauna & Steam room access', '1 personal trainer session/mo']),
('b00a06ef-2a78-433c-83b6-e265c0bbf028', 'VIP Unlimited VIP', 99.00, 1, ARRAY['24/7 unlimited access', 'All group & VIP specialty classes', 'Weekly personal trainer session', 'Towel service & VIP lounge access', 'Custom nutrition plan']);
