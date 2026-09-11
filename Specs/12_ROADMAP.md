# Spec 12 — Enterprise Roadmap & Technical Architecture Specification
## Carbonyx | Verifiable Carbon Credit & Offset Tracking Protocol (Patent-Aligned Edition)
**Hackathon Target Deadline:** HackOut'26 — 36-Hour Sprint  
**Document Purpose:** Complete technical architecture, explicit data contracts, and module ownership specification optimized for AI IDE team collaboration (Cursor, Windsurf, Antigravity, Gemini).

---

## 🏛️ Executive Summary & Core Technical Pillars

Carbonyx is an evidence-first carbon credit verification, issuance, and lifecycle tracking protocol based on the 12-Module Process Patent (*"An Automated System and Method for Evidence-First Verification, Issuance, and Lifecycle Management of Carbon Credits Using Blockchain-Based Multi-Source Validation"*). 

To ensure our 4-person team builds a first-place, production-grade prototype within 36 hours, the system is organized across **4 core technical pillars**:

1. **Multi-Source Evidence Cryptography & Merkle Tree Commitment (Modules 104, 106, 108):** Ingestion and cryptographic validation of IoT sensor streams, Sentinel-2 satellite vegetation indices (NDVI), and operational audit documents into SHA-256 Merkle tree roots committed on-chain.
2. **Advanced AI/ML Anomaly & Explainable Reasoner Engine (Module 110):** Standalone Python FastAPI microservice utilizing Isolation Forest multivariate outlier detection, Z-Score divergence checks, and plain-language XAI reason synthesis.
3. **Protocol Verifier Staking Ledger & Slashing Economy (Modules 112 & 114):** Economic game-theoretic security requiring independent verifiers to lock `MIN_STAKE` collateral, earning fees for accurate audits while facing an automated **50% stake slashing penalty** for approving fraudulent bundles.
4. **Dynamic ERC-721 NFT Lifecycle & Escrow Settlement Marketplace (Modules 116, 118, 120, 122, 124):** Smart-contract policy-gated minting of dynamic NFTs with on-chain metadata, secondary trading via custodial escrow with guaranteed buyer refunds, and irreversible retirement burn proofs.

---

## 📂 Monorepo Ownership & Teammate Module Map

This specification establishes clean, decoupled boundaries so Jash, Dax, Siddhant, and Hilag can code concurrently in their AI IDEs without merge conflicts or broken contracts:

```
Carbonyx/
├── .gitignore
├── README.md
├── Specs/                                      → SHARED: 13 Frozen Specifications (Source of Truth)
│
├── contracts/                                  → [JASH BOHARE - BLOCKCHAIN LEAD & WEB3]
│   ├── foundry.toml                            → Foundry configuration (Solidity 0.8.20, Anvil & Sepolia RPCs)
│   ├── src/
│   │   ├── CarbonRegistry.sol                  → [Mod 102, 106, 116] Project DID, Merkle commits & policy gates
│   │   ├── CarbonCreditNFT.sol                 → [Mod 118, 120] Dynamic ERC-721 token, metadata & retirement
│   │   ├── VerifierStakingLedger.sol           → [Mod 112, 114] Collateral staking, reputation & 50% slashing
│   │   ├── EscrowSettlement.sol                → [Mod 124] Custodial trading escrow & 100% buyer refund
│   │   └── interfaces/                         → Shared contract interfaces (ICarbonRegistry, etc.)
│   ├── test/                                   → Foundry unit, fuzz & invariant test suites
│   └── script/                                 → Deploy.s.sol (Local Anvil & Sepolia deployment)
│
├── backend/                                    → [DAX - FULL-STACK BACKEND & RELAYER]
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── server.ts                           → Express orchestrator & REST API routing
│   │   ├── config/
│   │   │   ├── supabase.ts                     → Supabase PostgreSQL client initialization
│   │   │   └── web3.ts                         → Relayer wallet & Ethers.js contract instances
│   │   ├── routes/                             → REST endpoints (/identity, /projects, /evidence, /risk, /verifiers, /marketplace, /disputes)
│   │   ├── services/
│   │   │   ├── merkle.service.ts               → SHA-256 tree computation & leaf proof generator
│   │   │   ├── cryptographic.service.ts        → DID generator (did:carbonyx:0x...) & signature checker
│   │   │   ├── relayer.service.ts              → Automated on-chain transaction submission
│   │   │   └── eventListener.service.ts        → Realtime blockchain event listener syncing to Supabase
│   │   └── utils/
│   └── tests/                                  → Jest / Supertest integration tests
│
├── ml-engine/                                  → [SIDDHANT - AI/ML ENGINE LEAD]
│   ├── requirements.txt                        → FastAPI, Uvicorn, Scikit-learn, Numpy, Pandas, Supabase
│   ├── Dockerfile
│   ├── app/
│   │   ├── main.py                             → FastAPI server & HTTP endpoints
│   │   ├── config.py                           → Environment & Supabase credentials
│   │   ├── api/
│   │   │   └── score.py                        → POST /score risk evaluation endpoint
│   │   ├── models/
│   │   │   ├── anomaly_detector.py             → Isolation Forest multivariate outlier model
│   │   │   ├── correlation_checker.py          → N-of-M cross-source sensor/satellite delta analyzer
│   │   │   └── xai_reasoner.py                 → Plain-language natural language reason generator
│   │   ├── schemas/
│   │   │   └── evidence_schema.py              → Pydantic validation models
│   │   └── utils/
│   │       └── verifier_matcher.py             → Multi-criteria verifier assignment algorithm
│   └── tests/                                  → Pytest unit tests for Clean vs. Anomalous scenarios
│
├── frontend/                                   → [HILAG - MERN FRONTEND & UI/UX LEAD]
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js                      → Dark mode bio-luminescent tokens & glassmorphism
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx                             → Global router & Supabase Realtime WebSocket hub
│   │   ├── lib/
│   │   │   ├── supabase.ts                     → Frontend Supabase client & table subscriptions
│   │   │   ├── web3.ts                         → MetaMask provider & contract interaction hooks
│   │   │   └── contracts.json                  → Deployed contract addresses and ABIs
│   │   ├── components/
│   │   │   ├── layout/ (Header.tsx, Sidebar.tsx)
│   │   │   ├── cards/ (NFTCertificateCard.tsx, AnomalyDiffViewer.tsx, VerifierStakingCard.tsx)
│   │   │   └── modals/ (EscrowBuyModal.tsx, EvidenceUploadModal.tsx, RetireCreditModal.tsx)
│   │   └── pages/
│   │       ├── IssuerStudio.tsx                → Project registration, DID badge, Evidence upload
│   │       ├── VerifierPortal.tsx              → Staking balance, Anomaly queue, Side-by-side diff
│   │       ├── Marketplace.tsx                 → Catalog of verified credits, Escrow buy flow
│   │       ├── BuyerPortfolio.tsx              → Held NFT certificates & on-chain retirement burn
│   │       └── AuditorExplorer.tsx             → End-to-end cryptographic provenance stepper & slashing log
│
└── supabase/                                   → [SHARED DATABASE LAYER]
    ├── config.toml
    └── migrations/
        └── 20260912000000_init_schema.sql      → Complete PostgreSQL DDL migrations & Storage buckets
```

---

## 🎯 Phase Breakdown & Module Specifications

---

### Phase C1 — Environment, Supabase Schema & Scaffolding (Hours 00 – 06)
**Objective:** Deploy the Supabase PostgreSQL database with all tables, storage buckets, and RLS policies; initialize the Foundry contract suite; scaffold Express backend and FastAPI ML services; and configure the React/Tailwind frontend shell.

#### 1. Technical Data Contracts (`supabase/migrations/20260912000000_init_schema.sql`)
```sql
-- Core PostgreSQL Tables
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT UNIQUE NOT NULL,
    did TEXT NOT NULL,
    owner_address TEXT NOT NULL,
    name TEXT NOT NULL,
    project_type TEXT NOT NULL CHECK (project_type IN ('REFORESTATION', 'BLUE_CARBON', 'METHANE_CAPTURE', 'RENEWABLE_ENERGY')),
    location JSONB NOT NULL,
    claimed_annual_tonnage NUMERIC NOT NULL,
    kyc_status TEXT DEFAULT 'VERIFIED',
    kyc_attestation_hash TEXT,
    baseline_challenge_expiry TIMESTAMPTZ,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE evidence_bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id TEXT UNIQUE NOT NULL,
    project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    merkle_root TEXT NOT NULL,
    item_count INT DEFAULT 0,
    monitoring_period JSONB NOT NULL,
    status TEXT DEFAULT 'INGESTED',
    on_chain_tx_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE evidence_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id TEXT NOT NULL REFERENCES evidence_bundles(bundle_id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('IOT_SENSOR', 'SATELLITE_NDVI', 'OPERATIONAL_DOC', 'VERIFIER_AUDIT')),
    payload JSONB NOT NULL,
    payload_hash TEXT NOT NULL,
    signature TEXT,
    signer_address TEXT,
    storage_file_path TEXT,
    integrity_status TEXT DEFAULT 'VALID',
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE risk_assessments (
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

CREATE TABLE verifier_stakes (
    verifier_address TEXT PRIMARY KEY,
    staked_amount NUMERIC NOT NULL DEFAULT 0,
    reputation_score INT DEFAULT 100,
    active_in_pool BOOLEAN DEFAULT TRUE,
    specialization TEXT DEFAULT 'REFORESTATION',
    total_verified INT DEFAULT 0,
    total_slashed INT DEFAULT 0,
    last_stake_timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE carbon_credit_nfts (
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

CREATE TABLE escrows (
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

CREATE TABLE disputes (
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
```

#### 2. Presentable Milestone Criteria (C1)
- `forge build` compiles cleanly in `/contracts`.
- Backend Express server connects to Supabase and responds to `GET /health`.
- FastAPI service responds to `GET /health`.
- Frontend displays live dark-mode navigation header with working MetaMask wallet connect button showing truncated address.

---

### Phase C2 — Core Ingestion, Merkle Engine & Gated Minting (Hours 06 – 16)
**Objective:** Connect the end-to-end happy path: project registration with DID generation, multi-source evidence upload, SHA-256 Merkle root computation, AI anomaly scoring, and on-chain policy-gated minting of dynamic ERC-721 tokens.

#### 1. Technical Data Contract & Solidity Interfaces (`contracts/src/interfaces/`)
```solidity
// ICarbonRegistry.sol
interface ICarbonRegistry {
    event ProjectRegistered(bytes32 indexed projectId, string did, address indexed owner);
    event EvidenceCommitted(bytes32 indexed bundleId, bytes32 indexed projectId, bytes32 merkleRoot);
    event RiskResultRecorded(bytes32 indexed bundleId, bool correlationMet, bool confidenceMet, bool verifierRequired);
    event CreditIssued(uint256 indexed tokenId, bytes32 indexed projectId, bytes32 indexed bundleId, address recipient);

    function registerProject(bytes32 projectId, string calldata did, bytes32 kycHash, uint256 challengeDuration) external;
    function commitEvidenceBundle(bytes32 bundleId, bytes32 projectId, bytes32 merkleRoot) external;
    function recordRiskResult(bytes32 bundleId, bool correlationMet, bool confidenceMet, bool verifierRequired) external;
    function mintCredit(bytes32 bundleId, uint256 co2Tonnage, uint16 vintageYear) external returns (uint256 tokenId);
}

// ICarbonCreditNFT.sol
interface ICarbonCreditNFT {
    enum CreditStatus { ISSUED, ESCROWED, TRANSFERRED, RETIRED, DISPUTED, REVOKED }
    
    function mint(address recipient, bytes32 projectId, bytes32 bundleId, bytes32 merkleRoot, uint256 tonnage, uint16 vintage) external returns (uint256);
    function setCreditStatus(uint256 tokenId, CreditStatus newStatus) external;
    function retireCredit(uint256 tokenId, string calldata retirementReason) external;
    function getCreditDetails(uint256 tokenId) external view returns (bytes32 projectId, bytes32 bundleId, bytes32 merkleRoot, uint256 tonnage, uint16 vintage, CreditStatus status);
}
```

#### 2. ML Scoring Contract (`ml-engine/app/schemas/evidence_schema.py`)
```python
class EvidenceItemInput(BaseModel):
    sourceType: Literal['IOT_SENSOR', 'SATELLITE_NDVI', 'OPERATIONAL_DOC']
    metric: str
    value: float
    calculatedTonnage: float
    timestamp: int

class ScoreRequest(BaseModel):
    bundleId: str
    projectId: str
    projectType: str
    declaredTonnage: float
    evidenceItems: List[EvidenceItemInput]

class ScoreResponse(BaseModel):
    bundleId: str
    confidenceScore: int          # 0 - 100
    riskLevel: Literal['LOW', 'MEDIUM', 'HIGH']
    autoMintEligible: bool        # True if confidenceScore >= 85
    verifierRequired: bool        # True if confidenceScore < 85
    anomalyFlags: List[str]
    explanationReason: str        # Plain-English XAI justification
    executionTimeMs: int
```

#### 3. Presentable Milestone Criteria (C2)
- In the **Issuer Studio**, the user registers a project, sees their `did:carbonyx:0x...` badge, uploads 3 telemetry files, and watches the live Merkle root generate on-screen.
- The backend triggers FastAPI `/score`, evaluates the evidence, submits the relayer transaction, and **mints an on-chain ERC-721 Carbon Credit NFT** displayed with its token ID and Merkle root link.

---

### Phase C3 — Verifier Staking Ledger, Slashing & Escrow Marketplace (Hours 16 – 24)
**Objective:** Implement the protocol's core patent differentiators: Verifier Staking with 50% Slashing, Verifier Review Portal for low-confidence bundles, Dynamic NFT Certificate visualization, and Marketplace trading via Custodial Escrow.

#### 1. Solidity Staking & Escrow Interfaces (`contracts/src/interfaces/`)
```solidity
// IVerifierStakingLedger.sol
interface IVerifierStakingLedger {
    event VerifierStaked(address indexed verifier, uint256 amount);
    event VerifierSlashed(address indexed verifier, uint256 amount, bytes32 indexed bundleId);
    event ReputationUpdated(address indexed verifier, uint256 newScore);

    function stake() external payable;
    function unstake(uint256 amount) external;
    function slashVerifier(address verifier, uint256 percentage) external returns (uint256 slashedAmount);
    function updateReputation(address verifier, bool successfulAudit) external;
    function isStaked(address verifier) external view returns (bool);
    function getVerifierProfile(address verifier) external view returns (uint256 stakedAmount, uint256 reputationScore, uint256 totalVerified, uint256 totalSlashed);
}

// IEscrowSettlement.sol
interface IEscrowSettlement {
    enum EscrowStatus { LOCKED, RELEASED, REFUNDED }
    event EscrowCreated(bytes32 indexed escrowId, uint256 indexed tokenId, address buyer, uint256 amount);
    event EscrowReleased(bytes32 indexed escrowId, address seller, uint256 amount);
    event EscrowRefunded(bytes32 indexed escrowId, address buyer, uint256 amount);

    function buyWithEscrow(uint256 tokenId) external payable returns (bytes32 escrowId);
    function releaseEscrow(bytes32 escrowId) external;
    function refundEscrow(bytes32 escrowId) external;
}
```

#### 2. Presentable Milestone Criteria (C3)
- In the **Verifier Portal**, verifiers deposit `0.1 ETH` stake to activate their profile and view the Anomaly Queue.
- Flagged low-confidence evidence displays in the **`AnomalyDiffViewer`**, rendering an interactive side-by-side comparison of IoT sensor flux vs. Satellite canopy NDVI with highlighted divergence points.
- In the **Marketplace**, buyers purchase credits using the **`EscrowBuyModal`** with funds held safely on-chain in escrow.
- Buyers can click **"Retire Credit"** in their portfolio to permanently burn the NFT and render a downloadable, tamper-proof **Certificate of Retirement**.

---

### Phase C4 — Dispute Resolution, Automated Slashing & Realtime Sync (Hours 24 – 30)
**Objective:** Finalize the community dispute mechanism and automated 50% verifier stake slashing; connect Supabase Realtime WebSocket subscriptions across all frontend dashboards; and seed the definitive live demo scenarios.

#### 1. Invariant & Dispute Execution Logic (`contracts/src/CarbonRegistry.sol`)
```solidity
function resolveDispute(uint256 tokenId, bool upholdDispute, string calldata resolutionDetails) external onlyAdmin {
    require(credits[tokenId].status == CreditStatus.DISPUTED, "Credit not in disputed state");
    
    if (upholdDispute) {
        // 1. Permanently revoke credit
        credits[tokenId].status = CreditStatus.REVOKED;
        carbonCreditNFT.setCreditStatus(tokenId, ICarbonCreditNFT.CreditStatus.REVOKED);
        
        // 2. Refund buyer if held in escrow
        bytes32 escrowId = tokenToEscrow[tokenId];
        if (escrowId != bytes32(0)) {
            escrowSettlement.refundEscrow(escrowId);
        }
        
        // 3. Slash 50% of the approving verifier's staked collateral
        address approvingVerifier = bundleVerifiers[credits[tokenId].bundleId];
        if (approvingVerifier != address(0)) {
            verifierStakingLedger.slashVerifier(approvingVerifier, 50);
        }
        
        emit CreditRevoked(tokenId, resolutionDetails);
    } else {
        credits[tokenId].status = CreditStatus.ISSUED;
        carbonCreditNFT.setCreditStatus(tokenId, ICarbonCreditNFT.CreditStatus.ISSUED);
        emit DisputeDismissed(tokenId);
    }
}
```

#### 2. Presentable Milestone Criteria (C4)
- **The Live Show-Stopper Demo Works:** 
  1. A suspect project is flagged by AI (Confidence: 38%).
  2. If a compromised verifier approves it, a stakeholder raises an on-chain Dispute.
  3. When the dispute is upheld: the credit is **REVOKED**, the buyer is **REFUNDED 100% via Escrow**, and **50% of the Verifier's Stake is SLASHED LIVE** on-chain!
- The **Auditor Explorer** reflects the slashing event and complete cryptographic provenance stepper in real time without refreshing the page.

---

### Phase C5 — Testnet Deployment, Polish & Pitch Deck Alignment (Hours 30 – 36)
**Objective:** Deploy contracts to public testnet (Sepolia/Base Sepolia), deploy frontend and backend to production hosting (Vercel/Render), run stress tests, and rehearse the 3-minute hackathon winning pitch.

#### 1. Presentable Milestone Criteria (C5)
- Public live URLs active: Frontend on Vercel, Backend on Render/Fly.io, Contracts verified on Etherscan/Basescan.
- Rehearsed 3-minute live pitch delivering both Demo Path A (Clean Auto-Mint) and Demo Path B (Fraud Caught & Stake Slashed).

---

## 🤖 Instructions for Teammates Using AI IDEs (Cursor / Windsurf / Antigravity)

When teammates prompt their AI coding assistants, instruct them to include the following prompt header:

```markdown
"I am working on the Carbonyx Verifiable Carbon Protocol monorepo. 
Please read Specs/12_ROADMAP.md and Specs/07_TECHNICAL_ARCHITECTURE.md to understand the repository architecture, module ownership, and data contracts. 
My task is in [contracts/ | backend/ | ml-engine/ | frontend/ | supabase/]. 
Ensure all schemas, functions, and interfaces adhere strictly to Specs/08_DOMAIN_DATA_MODEL.md, Specs/09_SMART_CONTRACT_SPECIFICATION.md, and Specs/11_API_SPECIFICATION.md."
```

---

## ⏱️ Timeline & Presentable Milestones Schedule

| Phase | Description | Target Hour | Presentable Output |
| :--- | :--- | :--- | :--- |
| **Phase C1** | Monorepo Scaffolding & Supabase PostgreSQL Setup | Hour 06 | Working database, compilation clean, dark-mode frontend header & wallet connect |
| **Phase C2** | Core Multi-Source Ingestion, Merkle Hashing & Gated Minting | Hour 16 | End-to-end clean flow: evidence upload → Merkle root → ML score → ERC-721 NFT mint |
| **Phase C3** | Verifier Staking Ledger, Escrow Marketplace & Dynamic NFT Cards | Hour 24 | Verifier collateral staking, Anomaly Diff Viewer, Escrow purchase modal, Retirement certificate |
| **Phase C4** | Dispute Resolution, 50% Stake Slashing & Realtime Sync | Hour 30 | Live fraud demonstration: Dispute upheld → Credit revoked → Escrow refund → 50% Stake Slashed |
| **Phase C5** | Testnet Deployment, Vercel Hosting & Pitch Deck Rehearsals | Hour 36 | **1st Place Ready Platform:** Public testnet contracts, live Vercel app, rehearsed 3-min pitch |
