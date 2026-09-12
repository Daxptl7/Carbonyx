-- Application identities are separate from blockchain wallets. A successful
-- password login grants a protocol role; the wallet remains the transaction signer.
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login_id TEXT UNIQUE NOT NULL CHECK (login_id = lower(login_id)),
    display_name TEXT NOT NULL,
    organization TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN (
        'PROJECT_PROPONENT',
        'INDEPENDENT_VERIFIER',
        'CORPORATE_BUYER',
        'REGULATOR_AUDITOR'
    )),
    wallet_address TEXT,
    password_salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_users FROM anon, authenticated;

-- Local/hackathon identities. Replace these credentials before any deployment.
INSERT INTO app_users (login_id, display_name, organization, role, password_salt, password_hash)
VALUES
  ('proponent.demo', 'Maya Chen', 'Canopy Restoration Labs', 'PROJECT_PROPONENT', '7204a1ce1d4195e26a6e6142d199e9fd', 'fe681a249c7384140c2a1de8188ea75be4bc0884f7b4dba67002da8f02d8f5b777a6bedc006d8422c79b0c5461e2ca29cbefe91eeff3a05f94a07d16ef69974b'),
  ('verifier.demo', 'Elena Rossi', 'Bureau Veritas', 'INDEPENDENT_VERIFIER', '075288a30703f8bb8e520cc237e5d028', '5694fd651311cb0be30e9cfcbd19295ef4ce15cdf1330fe9d6658eadd5fca11dd4f08623f3f255d154bdb0f415a3d4f95f0f40cff9e4c69b8fc704de45bf5881'),
  ('buyer.demo', 'Noah Williams', 'Northstar ESG Fund', 'CORPORATE_BUYER', 'afd5ff0467281588dd8031e9ddf7ca7c', 'e7155be3c67d4013d636767bb4f432655d942ad1244f1a49bd3e805762a272d12129e7de88532ba39b17ce62d805e7675f98993499c746a0a3c61007f5aa3877'),
  ('auditor.demo', 'Amina Okafor', 'Article 6 Supervisory Office', 'REGULATOR_AUDITOR', '064b00bac817dff126ca1bba5d005ea4', '46a5a05f848bfa9098d51aa4b7eec95879d12d72d61873c22bc9ff9bf76cb991c282ab0781d8f512fae4e75287b72a05607e4687fa30a30af4b6cba8d88b7108')
ON CONFLICT (login_id) DO NOTHING;
