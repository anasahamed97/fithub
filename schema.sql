-- FitHub Gym Management System SQL Database Schema for MySQL
-- Run this DDL script in your MySQL instance to initialize your fithub database.

-- Drop existing tables if they exist to start clean
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS members;
DROP TABLE IF EXISTS trainers;
DROP TABLE IF EXISTS plans;
DROP TABLE IF EXISTS equipments;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. PLANS TABLE
CREATE TABLE plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  duration INT NOT NULL, -- duration in months
  features JSON -- MySQL supports JSON
);

-- 2. TRAINERS TABLE
CREATE TABLE trainers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  specialty VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL DEFAULT 'changeme',
  status VARCHAR(20) DEFAULT 'Active'
);

-- 3. MEMBERS TABLE
CREATE TABLE members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL DEFAULT 'changeme',
  join_date DATE,
  status VARCHAR(20) DEFAULT 'Active',
  plan_id INT,
  trainer_id INT,
  gender VARCHAR(20) DEFAULT 'Other',
  notes TEXT,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL,
  FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL
);

-- 4. ATTENDANCE TABLE
CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  date DATE,
  time TIME,
  check_in_type VARCHAR(100) DEFAULT 'Gym Access',
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- 5. PAYMENTS TABLE
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  plan_id INT,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE,
  payment_method VARCHAR(50) DEFAULT 'Card',
  status VARCHAR(20) DEFAULT 'Paid',
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL
);

-- 6. EQUIPMENTS TABLE
CREATE TABLE equipments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'Operational',
  notes TEXT
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
(1, 'Basic Gym Access', 29.00, 1, '["Full gym floor access", "Standard locker room access", "1 complementary fitness assessment"]'),
(2, 'Elite Fitness Pro', 59.00, 1, '["Full gym floor access", "All group fitness classes", "Sauna & Steam room access", "1 personal trainer session/mo"]'),
(3, 'VIP Unlimited VIP', 99.00, 1, '["24/7 unlimited access", "All group & VIP specialty classes", "Weekly personal trainer session", "Towel service & VIP lounge access", "Custom nutrition plan"]');
