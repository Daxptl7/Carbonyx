-- Carbonyx Core Database Schema
-- 1. Projects Table (Module 102)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT UNIQUE NOT NULL,
    did TEXT NOT NULL,
    owner_address TEXT NOT NULL,
    name TEXT NOT NULL,
    project_type TEXT NOT NULL CHECK (project_type IN ('REFORESTATION', 'BLUE_CARBON', 'METHANE_CAPTURE', 'RENEWABLE_ENERGY')),
    location JSONB NOT NULL,
    claimed_annual_tonnage NUMERIC NOT NULL,
    kyc_status TEXT DEFAULT 'VERIFIED' CHECK (kyc_status IN ('UNVERIFIED', 'VERIFIED', 'REJECTED')),
    kyc_attestation_hash TEXT,
    baseline_challenge_expiry TIMESTAMPTZ,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('PENDING_CHALLENGE', 'ACTIVE', 'SUSPENDED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Evidence Bundles Table (Module 106)
CREATE TABLE IF NOT EXISTS evidence_bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id TEXT UNIQUE NOT NULL,
    project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    merkle_root TEXT NOT NULL,
    item_count INT DEFAULT 0,
    monitoring_period JSONB NOT NULL,
    status TEXT DEFAULT 'INGESTED' CHECK (status IN ('INGESTED', 'CORRELATED', 'ANOMALOUS', 'VERIFIED', 'ISSUED', 'REJECTED')),
    on_chain_tx_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Evidence Items Table (Module 104 & 108)
CREATE TABLE IF NOT EXISTS evidence_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id TEXT NOT NULL REFERENCES evidence_bundles(bundle_id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('IOT_SENSOR', 'SATELLITE_NDVI', 'OPERATIONAL_DOC', 'VERIFIER_AUDIT')),
    payload JSONB NOT NULL,
    payload_hash TEXT NOT NULL,
    signature TEXT,
    signer_address TEXT,
    storage_file_path TEXT,
    integrity_status TEXT DEFAULT 'VALID' CHECK (integrity_status IN ('VALID', 'CORRUPTED', 'INVALID_SIGNATURE')),
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Risk Assessments Table (Module 110)
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id TEXT UNIQUE NOT NULL REFERENCES evidence_bundles(bundle_id) ON DELETE CASCADE,
    confidence_score INT NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    anomaly_flags JSONB DEFAULT '[]'::jsonb,
    explanation_reason TEXT NOT NULL,
    auto_mint_eligible BOOLEAN DEFAULT FALSE,
    verifier_required BOOLEAN DEFAULT FALSE,
    computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Verifier Stakes Table (Module 112 & 114)
CREATE TABLE IF NOT EXISTS verifier_stakes (
    verifier_address TEXT PRIMARY KEY,
    staked_amount NUMERIC NOT NULL DEFAULT 0,
    reputation_score INT DEFAULT 100 CHECK (reputation_score BETWEEN 0 AND 100),
    active_in_pool BOOLEAN DEFAULT TRUE,
    specialization TEXT DEFAULT 'REFORESTATION',
    total_verified INT DEFAULT 0,
    total_slashed INT DEFAULT 0,
    last_stake_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Carbon Credit NFTs Table (Module 118 & 120)
CREATE TABLE IF NOT EXISTS carbon_credit_nfts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id BIGINT UNIQUE NOT NULL,
    project_id TEXT NOT NULL REFERENCES projects(project_id),
    bundle_id TEXT NOT NULL REFERENCES evidence_bundles(bundle_id),
    current_owner TEXT NOT NULL,
    co2_tonnage NUMERIC NOT NULL,
    vintage_year INT NOT NULL,
    merkle_root TEXT NOT NULL,
    status TEXT DEFAULT 'ISSUED' CHECK (status IN ('ISSUED', 'ESCROWED', 'TRANSFERRED', 'RETIRED', 'DISPUTED', 'REVOKED')),
    retirement_reason TEXT,
    retired_at TIMESTAMPTZ,
    token_uri TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Escrows Table (Module 124)
CREATE TABLE IF NOT EXISTS escrows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escrow_id TEXT UNIQUE NOT NULL,
    token_id BIGINT NOT NULL REFERENCES carbon_credit_nfts(token_id),
    buyer_address TEXT NOT NULL,
    seller_address TEXT NOT NULL,
    deposit_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'LOCKED' CHECK (status IN ('LOCKED', 'RELEASED', 'REFUNDED')),
    challenge_window_expiry TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Disputes Table (Module 122)
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id TEXT UNIQUE NOT NULL,
    token_id BIGINT NOT NULL REFERENCES carbon_credit_nfts(token_id),
    initiator_address TEXT NOT NULL,
    reason TEXT NOT NULL,
    evidence_url TEXT,
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'UPHELD', 'DISMISSED')),
    resolved_by TEXT,
    resolved_at TIMESTAMPTZ,
    slashed_amount NUMERIC DEFAULT 0
);
