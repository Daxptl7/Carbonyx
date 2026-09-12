-- Persistent regulator oversight, enforcement, policy, and watchlist records.
CREATE TABLE IF NOT EXISTS regulatory_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id TEXT UNIQUE NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  token_id BIGINT REFERENCES carbon_credit_nfts(token_id) ON DELETE SET NULL,
  regulator_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  regulator_name TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'SUSPEND_PROJECT',
    'CLEAR_PROJECT',
    'FREEZE_TRANSFERS',
    'REVOKE_CREDITS',
    'REOPEN_REVIEW',
    'REQUIRE_MONITORING'
  )),
  reason TEXT NOT NULL,
  previous_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  new_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_regulatory_actions_project
  ON regulatory_actions(project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS regulator_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name TEXT UNIQUE NOT NULL,
  settings JSONB NOT NULL,
  updated_by_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  updated_by_name TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS regulator_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regulator_user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('PROJECT', 'VERIFIER', 'WALLET', 'REGION')),
  entity_id TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(regulator_user_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_regulator_watchlist_user
  ON regulator_watchlist(regulator_user_id, created_at DESC);
