-- Phase 3 adds new project methodologies and lifecycle states used by the
-- baseline challenge and verifier-settlement flows.
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_project_type_check;
ALTER TABLE projects ADD CONSTRAINT projects_project_type_check CHECK (project_type IN (
  'REFORESTATION',
  'BLUE_CARBON',
  'METHANE_CAPTURE',
  'RENEWABLE_ENERGY',
  'PEATLAND_RESTORATION',
  'MANGROVE_BLUE_CARBON',
  'SOIL_CARBON'
));

ALTER TABLE evidence_bundles DROP CONSTRAINT IF EXISTS evidence_bundles_status_check;
ALTER TABLE evidence_bundles ADD CONSTRAINT evidence_bundles_status_check CHECK (status IN (
  'INGESTED',
  'CORRELATED',
  'ANOMALOUS',
  'CHALLENGED',
  'VERIFIED',
  'ISSUED',
  'REJECTED'
));
