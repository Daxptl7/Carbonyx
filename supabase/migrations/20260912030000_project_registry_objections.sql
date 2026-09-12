-- Project ownership and baseline objection workflow for the proponent registry.
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_created_by_user_id
  ON projects(created_by_user_id);

CREATE TABLE IF NOT EXISTS project_objections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objection_id TEXT UNIQUE NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  bundle_id TEXT REFERENCES evidence_bundles(bundle_id) ON DELETE SET NULL,
  raised_by_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  raised_by_role TEXT NOT NULL CHECK (raised_by_role IN ('CORPORATE_BUYER', 'REGULATOR_AUDITOR')),
  raised_by_name TEXT NOT NULL,
  challenger_address TEXT,
  category TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN (
    'OPEN',
    'RESPONDED',
    'REVISION_SUBMITTED',
    'RESOLVED',
    'DISMISSED'
  )),
  response_type TEXT CHECK (response_type IN ('REBUTTAL', 'BASELINE_REVISION')),
  proponent_response TEXT,
  revision_snapshot JSONB,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_objections_project_id
  ON project_objections(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_objections_status
  ON project_objections(status);
