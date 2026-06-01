-- PostgreSQL Production Schema Blueprint
-- Targeted Deployment: Multi-Chain Industrial Co-location Architecture

-- EXTENSIONS: Enable UUID generation for high-security transaction hashing
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- TABLE 1: users (The Master Account Ledger)
-- ====================================================================
CREATE TABLE IF NOT EXISTS users (
    telegram_id BIGINT PRIMARY KEY,
    username VARCHAR(100),
    vault_balance NUMERIC(16, 6) DEFAULT 0.000000,
    operator_rank VARCHAR(30) DEFAULT 'Bronze Operator',
    is_activated BOOLEAN DEFAULT FALSE,
    app_registered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_claim_at TIMESTAMP WITHOUT TIME ZONE,
    level VARCHAR(50),
    total_usdc_earned NUMERIC(16, 6) DEFAULT 0.000000,
    total_usdc_leaked NUMERIC(16, 6) DEFAULT 0.000000
);

-- ====================================================================
-- TABLE 2: user_machines (The Active Fleet Ledger)
-- ====================================================================
CREATE TABLE IF NOT EXISTS user_machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    telegram_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    machine_tier VARCHAR(50) NOT NULL,
    hourly_yield_rate NUMERIC(16, 6) NOT NULL,
    price_usdc NUMERIC(16, 6),
    lease_days INTEGER,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITHOUT TIME ZONE,
    last_ignition_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_claim_at TIMESTAMP WITHOUT TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    unmined_loss_pool NUMERIC(16, 6) DEFAULT 0.000000
);
CREATE INDEX IF NOT EXISTS idx_user_machines_user_id ON user_machines(user_id);
CREATE INDEX IF NOT EXISTS idx_user_machines_last_ignition ON user_machines(last_ignition_time);

-- ====================================================================
-- TABLE 3: activation_keys (The Secure Access Ledger)
-- ====================================================================
CREATE TABLE IF NOT EXISTS activation_keys (
    id SERIAL PRIMARY KEY,
    key_signature VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'UNUSED',
    owner_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP WITH TIME ZONE
);

-- ====================================================================
-- TABLE 4: distributed_keys (The Bonus & Affiliate Ledger)
-- ====================================================================
CREATE TABLE IF NOT EXISTS distributed_keys (
    id SERIAL PRIMARY KEY,
    key_code VARCHAR(255) UNIQUE NOT NULL,
    owner_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITHOUT TIME ZONE,
    used_by_telegram_id BIGINT REFERENCES users(telegram_id) ON DELETE SET NULL,
    bonus_deposit_usdc NUMERIC(16, 6) DEFAULT 0.000000,
    bonus_mining_usdc NUMERIC(16, 6) DEFAULT 0.000000,
    gifted_by BIGINT REFERENCES users(telegram_id) ON DELETE SET NULL
);

-- ====================================================================
-- TABLE 5: historical_ledgers (The Financial Event Tracker)
-- ====================================================================
CREATE TABLE IF NOT EXISTS historical_ledgers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(16, 6) NOT NULL,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- TABLE 6: node_network_balances (The Master Affiliate Metrics)
-- ====================================================================
CREATE TABLE IF NOT EXISTS node_network_balances (
    telegram_id BIGINT PRIMARY KEY REFERENCES users(telegram_id) ON DELETE CASCADE,
    deposit_rewards_20 NUMERIC(16, 6) DEFAULT 0.000000,
    lifetime_yields_2 NUMERIC(16, 6) DEFAULT 0.000000
);

-- ====================================================================
-- TABLE 7: machine_monthly_epochs (The 6-Month Ledger Tracker)
-- ====================================================================
CREATE TABLE IF NOT EXISTS machine_monthly_epochs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relational Anchors
    machine_id UUID NOT NULL REFERENCES user_machines(id) ON DELETE CASCADE,
    telegram_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    
    -- The Epoch Core
    month_number INTEGER NOT NULL CHECK (month_number BETWEEN 1 AND 6),
    ucredits_mined NUMERIC(16, 5) DEFAULT 0.00000,
    ucredits_leaked NUMERIC(16, 5) DEFAULT 0.00000,
    
    -- State Management
    claim_status VARCHAR(50) DEFAULT 'LOCKED', 
    
    -- Time Boundaries (Crucial for the "Days Remaining" UI)
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes to ensure the frontend loads the full 6-month ledger instantly
CREATE INDEX IF NOT EXISTS idx_epochs_machine ON machine_monthly_epochs(machine_id);
CREATE INDEX IF NOT EXISTS idx_epochs_user ON machine_monthly_epochs(telegram_id);