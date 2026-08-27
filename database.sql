-- ============================================
-- Fox Store Admin Panel - Database Schema
-- ============================================

-- Users Table (Admins, Resellers)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'reseller', -- 'ruler', 'superadmin', 'reseller'
  balance REAL DEFAULT 0,
  isActive INTEGER DEFAULT 1,
  avatarUrl TEXT,
  discountPercent INTEGER DEFAULT 0,
  permissions TEXT, -- JSON string
  telegramLinked INTEGER DEFAULT 0,
  telegramUsername TEXT,
  telegramChatId TEXT,
  telegramLinkCode TEXT,
  resetOtp TEXT,
  resetOtpExpires TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Keys Table
CREATE TABLE IF NOT EXISTS keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'banned', 'expired'
  keyType TEXT DEFAULT 'regular', -- 'regular', 'trial'
  access INTEGER DEFAULT 1,
  packageId INTEGER,
  sellerId INTEGER,
  hwid TEXT,
  deviceCount INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  expiresAt DATETIME,
  FOREIGN KEY (packageId) REFERENCES packages(id),
  FOREIGN KEY (sellerId) REFERENCES users(id)
);

-- Key Devices Table
CREATE TABLE IF NOT EXISTS key_devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key_id INTEGER NOT NULL,
  device_id TEXT,
  device_name TEXT,
  ip_address TEXT,
  last_active DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (key_id) REFERENCES keys(id)
);

-- Packages Table
CREATE TABLE IF NOT EXISTS packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  duration INTEGER DEFAULT 30, -- days
  price REAL DEFAULT 0,
  description TEXT,
  sortOrder INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Mods/Apps Table
CREATE TABLE IF NOT EXISTS mods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  displayName TEXT,
  description TEXT,
  isActive INTEGER DEFAULT 1,
  sortOrder INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL, -- 'purchase', 'recharge', 'deduct', 'refund'
  description TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  adminId INTEGER NOT NULL,
  action TEXT NOT NULL,
  details TEXT, -- JSON string
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (adminId) REFERENCES users(id)
);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  settingKey TEXT UNIQUE NOT NULL,
  settingValue TEXT NOT NULL,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_keys_status ON keys(status);
CREATE INDEX IF NOT EXISTS idx_keys_seller ON keys(sellerId);
CREATE INDEX IF NOT EXISTS idx_keys_created ON keys(createdAt);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(userId);
CREATE INDEX IF NOT EXISTS idx_audit_admin ON audit_logs(adminId);
CREATE INDEX IF NOT EXISTS idx_key_devices_key ON key_devices(key_id);

-- ============================================
-- Default Data
-- ============================================

-- Default Ruler/Admin (password: admin123)
INSERT INTO users (username, password, role, balance, isActive) 
VALUES ('ruler', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'ruler', 0, 1)
ON CONFLICT(username) DO NOTHING;

-- Default Packages
INSERT INTO packages (name, duration, price, description, sortOrder) VALUES 
('Weekly', 7, 50, '7 days access', 1),
('Monthly', 30, 150, '30 days access', 2),
('Quarterly', 90, 400, '90 days access', 3),
('Yearly', 365, 1200, '365 days access', 4)
ON CONFLICT(id) DO NOTHING;

-- Default Settings
INSERT INTO settings (settingKey, settingValue) VALUES 
('branding', '{"brandName":"Fox Store","logoUrl":"","supportLink":"","themeColor":"#007bff"}')
ON CONFLICT(settingKey) DO NOTHING;

-- ============================================
-- IMPORTANT NOTES:
-- ============================================
-- 1. Password 'admin123' hashed with SHA-256
-- 2. Run this entire file in Cloudflare D1 Database Console
-- 3. If tables already exist, they won't be recreated
-- 4. Default admin login: username='ruler', password='admin123'
