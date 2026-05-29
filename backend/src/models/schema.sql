-- PostgreSQL Production Schema Blueprint
-- Targeted Deployment: Multi-Chain Industrial Co-location Architecture

-- EXTENSIONS: Enable UUID generation for high-security transaction hashing
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- TABLE 1: users (The Master Account Ledger)
-- ====================================================================
CREATE TABLE IF NOT EXISTS users (
    telegram_id BIGINT PRIMARY KEY, -- Checked against raw Telegram packet IDs
    username VARCHAR(100),
    vault_balance NUMERIC(16, 6) DEFAULT 0.000000, -- Permanent spending vault (USDC)
    operator_rank VARCHAR(30) DEFAULT 'Bronze Operator', -- Level-scaling badge
    is_activated BOOLEAN DEFAULT FALSE, -- Premium rental system gate key status
    app_registered BOOLEAN DEFAULT FALSE, -- Funnel tracking: False = Bot Only, True = opened Mini App
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- TABLE 2: user_machines (The Active Fleet Ledger)
-- ====================================================================
CREATE TABLE IF NOT EXISTS user_machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    machine_tier VARCHAR(50) NOT NULL, -- e.g., 'SOL Core', 'SOL Flux'
    hourly_yield_rate NUMERIC(16, 6) NOT NULL, -- Fixed production velocity factor
    last_ignition_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 24h Engine anchor point
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Permanent 30/60/90 contract end marker
    unmined_loss_pool NUMERIC(16, 6) DEFAULT 0.000000, -- Real-time leakage tracking accumulator
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXING FOR PERFORMANCE: Optimizes speed calculations when thousands of nodes tick simultaneously
CREATE INDEX IF NOT EXISTS idx_user_machines_user_id ON user_machines(user_id);
CREATE INDEX IF NOT EXISTS idx_user_machines_last_ignition ON user_machines(last_ignition_time);

-- ====================================================================
-- TABLE 3: activation_keys (The Distribution Ledger)
-- ====================================================================
CREATE TABLE IF NOT EXISTS activation_keys (
    key_code VARCHAR(50) PRIMARY KEY, -- The generated unique alpha-token
    creator_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE RESTRICT, -- Whale pack owner
    status VARCHAR(20) DEFAULT 'UNUSED', -- 'UNUSED' | 'ACTIVE'
    used_by BIGINT REFERENCES users(telegram_id) ON DELETE SET NULL, -- Target referral friend ID
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP WITH TIME ZONE,
    
    -- SAFETY CONSTRAINT: Prevents a key code from holding corrupt status fields
    CONSTRAINT chk_key_status CHECK (status IN ('UNUSED', 'ACTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_activation_keys_creator ON activation_keys(creator_id);