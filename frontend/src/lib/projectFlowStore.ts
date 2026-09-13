/**
 * Carbonyx Protocol - End-to-End Lifecycle Store
 * 
 * Manages the complete multi-role lifecycle flow:
 * 1. Project Developer submits project -> enters 14-Day Baseline Observation Window
 * 2. Anyone can raise objections for 14 days
 * 3. Project routes to randomized Verifier from the accredited pool
 * 4. Proof-of-Stake (PoS): Verifier must stake ETH collateral to audit. If passed/rejected, rotates to next pool verifier.
 * 5. Verifier inspects evidence, can request details, approves audit. Developer gets notified.
 * 6. ONLY Verifier can issue credits as NFTs (decides NFT count, e.g. 100 NFTs for 500 tons, upfront vs linear vesting).
 * 7. Minted NFTs assigned to Developer wallet.
 * 8. Developer sets selling price in ETH and lists NFTs on Marketplace.
 * 9. Buyer purchases NFT -> direct payment to Developer (0% platform commission).
 * 10. Buyer claims / retires NFT -> generates detailed Legal Certificate of Carbon Offset Retirement for Government/Compliance.
 */

export type ProjectLifecycleState =
  | 'BASELINE_WINDOW'        // 14-day public challenge window
  | 'VERIFIER_PENDING_STAKE' // Routed to verifier from pool; waiting for verifier to stake ETH
  | 'VERIFIER_AUDITING'      // Verifier staked ETH; actively auditing telemetry/evidence
  | 'AUDITED'                // Verifier approved audit; ready for Verifier to issue credit NFTs
  | 'CREDITS_ISSUED'         // Verifier minted NFTs to Developer; Developer sets price
  | 'LISTED_ON_MARKETPLACE'  // Developer set price & listed on Marketplace
  | 'PURCHASED'              // Buyer bought NFT; in buyer portfolio
  | 'RETIRED';               // Buyer claimed/burned credit; legal document generated

export interface VerifierPoolMember {
  id: string;
  name: string;
  organization: string;
  address: string;
  reputationScore: number;
  minimumStakeEth: number;
  specialization: string;
  activeAuditsCount: number;
  totalAuditedTonnage: number;
}

export interface ObjectionRecord {
  id: string;
  author: string;
  authorOrg: string;
  reason: string;
  category: string;
  createdAt: string;
  status: 'OPEN' | 'RESPONDED' | 'REVISED' | 'RESOLVED';
  developerResponse?: string;
}

export interface CreditNftRecord {
  nftId: string;
  tokenId: number;
  serialNumber: string;
  co2Tonnage: number;
  vintageYear: number;
  issuanceModel: 'UPFRONT' | 'LINEAR_VESTING';
  vestingMonths?: number;
  developerWallet: string;
  priceEth?: number;
  isListed: boolean;
  status: 'MINTED' | 'LISTED' | 'PURCHASED' | 'RETIRED';
  buyerAddress?: string;
  buyerOrg?: string;
  purchasedAt?: string;
  purchaseTxHash?: string;
  retiredAt?: string;
  burnTxHash?: string;
  retirementReason?: string;
  legalCertificateId?: string;
}

export interface ProtocolNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  category: 'BASELINE' | 'VERIFIER_STAKE' | 'AUDIT_APPROVED' | 'NFT_ISSUED' | 'LISTED' | 'PURCHASED' | 'RETIRED';
  recipientRole: 'PROJECT_PROPONENT' | 'INDEPENDENT_VERIFIER' | 'CORPORATE_BUYER' | 'ALL';
  projectId: string;
  read: boolean;
}

export interface LifecycleProject {
  id: string;
  name: string;
  projectType: string;
  location: { country: string; region: string; coordinates?: string };
  developerWallet: string;
  developerName: string;
  developerDid: string;
  claimedAnnualTonnage: number;
  capexUsd: number;
  merkleRoot: string;
  aiConfidenceScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;

  // Lifecycle state
  lifecycleState: ProjectLifecycleState;

  // Baseline 14-day window
  baselineStartTime: string;
  baselineDurationDays: number;
  baselineFastForwarded?: boolean;
  objections: ObjectionRecord[];

  // Verifier Pool & PoS
  assignedVerifier: VerifierPoolMember;
  passedVerifierIds: string[];
  verifierStakedEth?: number;
  verifierStakeTxHash?: string;
  verifierAuditNotes?: string;
  auditAttestationHash?: string;
  auditedAt?: string;

  // Credit NFT Issuance (Verifier-exclusive)
  totalIssuedTonnage?: number;
  issuedNftCount?: number;
  tonnagePerNft?: number;
  issuanceModel?: 'UPFRONT' | 'LINEAR_VESTING';
  nftIssuanceTxHash?: string;
  nfts: CreditNftRecord[];

  // Developer Pricing
  listingPricePerNftEth?: number;
  isListedOnMarketplace?: boolean;
}

export interface LegalComplianceCertificate {
  certificateId: string;
  serialNumber: string;
  issuanceDate: string;
  complianceStandards: string[];
  beneficiary: {
    legalName: string;
    organizationId: string;
    jurisdiction: string;
    walletAddress: string;
  };
  projectDetails: {
    projectId: string;
    projectName: string;
    methodology: string;
    developerDid: string;
    developerName: string;
    developerWallet: string;
    location: string;
  };
  verificationAttestation: {
    verifierName: string;
    verifierOrg: string;
    verifierDid: string;
    verifierWallet: string;
    posStakeEth: number;
    posStakeTxHash: string;
    auditReportDigest: string;
  };
  carbonAccounting: {
    metricTonsCo2e: number;
    vintageYear: number;
    serializedNftId: string;
    issuanceModel: string;
    merkleRootCommitment: string;
    onChainBurnTx: string;
  };
  legalClauses: {
    nonDuplicationClause: string;
    additionalityClause: string;
    directSettlementDeclaration: string;
    statutoryComplianceNotice: string;
  };
}

// Accredited Verifier Pool
export const VERIFIER_POOL: VerifierPoolMember[] = [
  {
    id: 'ver-sgs-01',
    name: 'Dr. Elena Rostova',
    organization: 'SGS Climate Assurance & BioAudit Group',
    address: '0x71C8F7969315d1B2c842bC7F33894E2b43b4De02',
    reputationScore: 99,
    minimumStakeEth: 0.5,
    specialization: 'Forestry, Peatland & Multispectral Remote Sensing',
    activeAuditsCount: 1,
    totalAuditedTonnage: 420000
  },
  {
    id: 'ver-eco-02',
    name: 'Marcus Vance',
    organization: 'EcoAudit Global Labs & MRV Verification',
    address: '0x92Fa107F89e830eC8850C7737C8De9d7F31f99c1',
    reputationScore: 97,
    minimumStakeEth: 0.5,
    specialization: 'Blue Carbon, Mangrove Restorations & Ground IoT',
    activeAuditsCount: 2,
    totalAuditedTonnage: 310000
  },
  {
    id: 'ver-dnv-03',
    name: 'Astrid Lindholm',
    organization: 'DNV Climate Neutral Services Scandinavia',
    address: '0x4B316Fec03F5E72D714cbD12521c78De1A7bF26E',
    reputationScore: 98,
    minimumStakeEth: 0.5,
    specialization: 'Biochar, Soil Organic Carbon & Direct Air Capture',
    activeAuditsCount: 0,
    totalAuditedTonnage: 580000
  },
  {
    id: 'ver-bv-04',
    name: 'Julian Thorne',
    organization: 'Bureau Veritas Environmental Integrity Node',
    address: '0x3D88D1b28Af14e4b7F667527D5613A849c25F9b0',
    reputationScore: 96,
    minimumStakeEth: 0.5,
    specialization: 'Methane Capture, Landfill Gas & Renewable Sinks',
    activeAuditsCount: 1,
    totalAuditedTonnage: 290000
  }
];

const STORAGE_KEY = 'carbonyx_lifecycle_projects_v2';
const NOTIF_KEY = 'carbonyx_lifecycle_notifications_v2';

// Seed Realistic Initial Projects
const initialSeedProjects: LifecycleProject[] = [
  {
    id: 'PROJ-AMAZON-841',
    name: 'Amazonian Peatland & Canopy Bio-Sink',
    projectType: 'REFORESTATION',
    location: { country: 'Brazil', region: 'Acre State', coordinates: '-9.0238, -70.8120' },
    developerWallet: '0x627306090abaB3A6e1400e9345bC60c78a8BEf57',
    developerName: 'Amazonas BioCarbon Consórcio',
    developerDid: 'did:carbonyx:0x627306090abab3a6e1400e9345bc60c78a8bef57',
    claimedAnnualTonnage: 50000,
    capexUsd: 1450000,
    merkleRoot: '0x4a9b2c7e1f8d3a6c9e0b2d4f8a1c3e5b7d9f2a4c6e8b0d2f4a6c8e0b2d4f6a8c',
    aiConfidenceScore: 92,
    riskLevel: 'LOW',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    lifecycleState: 'BASELINE_WINDOW',
    baselineStartTime: new Date(Date.now() - 3 * 86400000).toISOString(),
    baselineDurationDays: 14,
    objections: [
      {
        id: 'OBJ-771',
        author: '0x3c24...d710',
        authorOrg: 'Rainforest Integrity Watchdog',
        reason: 'Requesting satellite NDVI comparison for contiguous buffer zone during rainy season to confirm canopy density.',
        category: 'Satellite Telemetry Verification',
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        status: 'OPEN'
      }
    ],
    assignedVerifier: VERIFIER_POOL[0],
    passedVerifierIds: [],
    nfts: []
  },
  {
    id: 'PROJ-SUNDAR-209',
    name: 'Sundarbans Mangrove Blue Carbon Initiative',
    projectType: 'MANGROVE_BLUE_CARBON',
    location: { country: 'Bangladesh', region: 'Khulna Division', coordinates: '21.9497, 89.1833' },
    developerWallet: '0x627306090abaB3A6e1400e9345bC60c78a8BEf57',
    developerName: 'Bengal Delta Ecology Ltd',
    developerDid: 'did:carbonyx:0x627306090abab3a6e1400e9345bc60c78a8bef57',
    claimedAnnualTonnage: 32000,
    capexUsd: 890000,
    merkleRoot: '0x7e3a9c2b4d6f8a1c3e5b7d9f2a4c6e8b0d2f4a6c8e0b2d4f6a8c4a9b2c7e1f8d',
    aiConfidenceScore: 89,
    riskLevel: 'LOW',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    lifecycleState: 'VERIFIER_PENDING_STAKE',
    baselineStartTime: new Date(Date.now() - 15 * 86400000).toISOString(),
    baselineDurationDays: 14,
    baselineFastForwarded: true,
    objections: [],
    assignedVerifier: VERIFIER_POOL[1],
    passedVerifierIds: [VERIFIER_POOL[0].id],
    nfts: []
  },
  {
    id: 'PROJ-NORDIC-418',
    name: 'Nordic Peatland & Biochar Carbon Vault',
    projectType: 'SOIL_CARBON',
    location: { country: 'Sweden', region: 'Västerbotten', coordinates: '64.2833, 20.3000' },
    developerWallet: '0x627306090abaB3A6e1400e9345bC60c78a8BEf57',
    developerName: 'Scandic Carbon Removal AB',
    developerDid: 'did:carbonyx:0x627306090abab3a6e1400e9345bc60c78a8bef57',
    claimedAnnualTonnage: 45000,
    capexUsd: 2100000,
    merkleRoot: '0x1c3e5b7d9f2a4c6e8b0d2f4a6c8e0b2d4f6a8c4a9b2c7e1f8d3a6c9e0b2d4f8a',
    aiConfidenceScore: 94,
    riskLevel: 'LOW',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    lifecycleState: 'AUDITED',
    baselineStartTime: new Date(Date.now() - 20 * 86400000).toISOString(),
    baselineDurationDays: 14,
    baselineFastForwarded: true,
    objections: [],
    assignedVerifier: VERIFIER_POOL[2],
    passedVerifierIds: [],
    verifierStakedEth: 0.5,
    verifierStakeTxHash: '0x8f2a4c6e8b0d2f4a6c8e0b2d4f6a8c4a9b2c7e1f8d3a6c9e0b2d4f8a1c3e5b7d',
    verifierAuditNotes: 'Ground IoT core soil organic carbon samples cross-verified with laboratory spectrometry. 100% telemetry integrity confirmed.',
    auditAttestationHash: '0x3a6c9e0b2d4f8a1c3e5b7d9f2a4c6e8b0d2f4a6c8e0b2d4f6a8c4a9b2c7e1f8d',
    auditedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    nfts: []
  },
  {
    id: 'PROJ-RIFT-512',
    name: 'Rift Valley Geothermal & Soil Sink',
    projectType: 'RENEWABLE_ENERGY',
    location: { country: 'Kenya', region: 'Nakuru County', coordinates: '-0.3031, 36.0800' },
    developerWallet: '0x627306090abaB3A6e1400e9345bC60c78a8BEf57',
    developerName: 'Great Rift Geothermal Clean Power Ltd',
    developerDid: 'did:carbonyx:0x627306090abab3a6e1400e9345bc60c78a8bef57',
    claimedAnnualTonnage: 25000,
    capexUsd: 1750000,
    merkleRoot: '0x9f2a4c6e8b0d2f4a6c8e0b2d4f6a8c4a9b2c7e1f8d3a6c9e0b2d4f8a1c3e5b7d',
    aiConfidenceScore: 96,
    riskLevel: 'LOW',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    lifecycleState: 'CREDITS_ISSUED',
    baselineStartTime: new Date(Date.now() - 25 * 86400000).toISOString(),
    baselineDurationDays: 14,
    baselineFastForwarded: true,
    objections: [],
    assignedVerifier: VERIFIER_POOL[3],
    passedVerifierIds: [],
    verifierStakedEth: 0.5,
    verifierStakeTxHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    verifierAuditNotes: 'Geothermal displace factor audited against Kenyan national grid emission factor (0.332 tCO2/MWh). Verification approved for 500 tCO2e tranche.',
    auditAttestationHash: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
    auditedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    totalIssuedTonnage: 500,
    issuedNftCount: 100,
    tonnagePerNft: 5,
    issuanceModel: 'UPFRONT',
    nftIssuanceTxHash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
    isListedOnMarketplace: false,
    listingPricePerNftEth: 0.045,
    nfts: Array.from({ length: 100 }, (_, i) => ({
      nftId: `NFT-RIFT-710${i + 1}`,
      tokenId: 7101 + i,
      serialNumber: `CRX-KE-2026-${7101 + i}`,
      co2Tonnage: 5,
      vintageYear: 2026,
      issuanceModel: 'UPFRONT',
      developerWallet: '0x627306090abaB3A6e1400e9345bC60c78a8BEf57',
      isListed: false,
      priceEth: 0.045,
      status: 'MINTED'
    }))
  },
  {
    id: 'PROJ-SUMATRA-307',
    name: 'Sumatra Rainforest Canopy Restoration',
    projectType: 'REFORESTATION',
    location: { country: 'Indonesia', region: 'Riau Province', coordinates: '0.5071, 101.4478' },
    developerWallet: '0x627306090abaB3A6e1400e9345bC60c78a8BEf57',
    developerName: 'PT Rimba Sumatra Lestari',
    developerDid: 'did:carbonyx:0x627306090abab3a6e1400e9345bc60c78a8bef57',
    claimedAnnualTonnage: 60000,
    capexUsd: 2800000,
    merkleRoot: '0x5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
    aiConfidenceScore: 91,
    riskLevel: 'LOW',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    lifecycleState: 'LISTED_ON_MARKETPLACE',
    baselineStartTime: new Date(Date.now() - 30 * 86400000).toISOString(),
    baselineDurationDays: 14,
    baselineFastForwarded: true,
    objections: [],
    assignedVerifier: VERIFIER_POOL[0],
    passedVerifierIds: [],
    verifierStakedEth: 0.5,
    verifierStakeTxHash: '0x6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e',
    verifierAuditNotes: 'Sentinel-2 multispectral NDVI + LiDAR measurements verified. 250 tCO2e issued in 50 NFTs.',
    auditAttestationHash: '0x7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f',
    auditedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    totalIssuedTonnage: 250,
    issuedNftCount: 50,
    tonnagePerNft: 5,
    issuanceModel: 'UPFRONT',
    nftIssuanceTxHash: '0x8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a',
    isListedOnMarketplace: true,
    listingPricePerNftEth: 0.038,
    nfts: Array.from({ length: 50 }, (_, i) => ({
      nftId: `NFT-SUMATRA-820${i + 1}`,
      tokenId: 8201 + i,
      serialNumber: `CRX-ID-2026-${8201 + i}`,
      co2Tonnage: 5,
      vintageYear: 2026,
      issuanceModel: 'UPFRONT',
      developerWallet: '0x627306090abaB3A6e1400e9345bC60c78a8BEf57',
      isListed: true,
      priceEth: 0.038,
      status: 'LISTED'
    }))
  },
  {
    id: 'PROJ-PATAGONIA-904',
    name: 'Patagonian Wind & Afforestation Sink',
    projectType: 'RENEWABLE_ENERGY',
    location: { country: 'Chile', region: 'Magallanes', coordinates: '-53.1638, -70.9171' },
    developerWallet: '0x627306090abaB3A6e1400e9345bC60c78a8BEf57',
    developerName: 'Austral Wind & BioCarbon SpA',
    developerDid: 'did:carbonyx:0x627306090abab3a6e1400e9345bc60c78a8bef57',
    claimedAnnualTonnage: 40000,
    capexUsd: 1950000,
    merkleRoot: '0x2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b',
    aiConfidenceScore: 98,
    riskLevel: 'LOW',
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    lifecycleState: 'RETIRED',
    baselineStartTime: new Date(Date.now() - 40 * 86400000).toISOString(),
    baselineDurationDays: 14,
    baselineFastForwarded: true,
    objections: [],
    assignedVerifier: VERIFIER_POOL[2],
    passedVerifierIds: [],
    verifierStakedEth: 0.5,
    verifierStakeTxHash: '0x3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c',
    verifierAuditNotes: 'Wind generation SCADA meters integrated with sub-metered grid feed. 100 tCO2e issued in 20 NFTs.',
    auditAttestationHash: '0x4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d',
    auditedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    totalIssuedTonnage: 100,
    issuedNftCount: 20,
    tonnagePerNft: 5,
    issuanceModel: 'UPFRONT',
    nftIssuanceTxHash: '0x5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e',
    isListedOnMarketplace: true,
    listingPricePerNftEth: 0.05,
    nfts: Array.from({ length: 20 }, (_, i) => ({
      nftId: `NFT-PATA-930${i + 1}`,
      tokenId: 9301 + i,
      serialNumber: `CRX-CL-2026-${9301 + i}`,
      co2Tonnage: 5,
      vintageYear: 2026,
      issuanceModel: 'UPFRONT',
      developerWallet: '0x627306090abaB3A6e1400e9345bC60c78a8BEf57',
      isListed: false,
      priceEth: 0.05,
      status: (i < 5 ? 'RETIRED' : i < 12 ? 'PURCHASED' : 'LISTED') as any,
      buyerAddress: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
      buyerOrg: 'Microsoft Global Sustainability & Climate Tech Fund',
      purchasedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      purchaseTxHash: `0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a${i}`,
      retiredAt: i < 5 ? new Date(Date.now() - 2 * 86400000).toISOString() : undefined,
      burnTxHash: i < 5 ? `0x8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b${i}` : undefined,
      retirementReason: i < 5 ? 'Scope 1 & 2 Net Zero Carbon Accounting FY2026 Compliance' : undefined,
      legalCertificateId: i < 5 ? `CRX-LEGAL-CERT-2026-${9301 + i}` : undefined
    }))
  }
];

const initialNotifications: ProtocolNotification[] = [
  {
    id: 'notif-1',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    title: 'Audit Approved & Staked',
    message: 'Dr. Elena Rostova (SGS Assurance) completed verification for Nordic Peatland & Biochar Vault. 0.5 ETH stake confirmed.',
    category: 'AUDIT_APPROVED',
    recipientRole: 'PROJECT_PROPONENT',
    projectId: 'PROJ-NORDIC-418',
    read: false
  },
  {
    id: 'notif-2',
    timestamp: new Date(Date.now() - 6 * 3600000).toISOString(),
    title: 'Credits Minted by Verifier',
    message: 'Verifier Julian Thorne minted 100 Credit NFTs (500 tCO2e total) to your project Rift Valley Geothermal.',
    category: 'NFT_ISSUED',
    recipientRole: 'PROJECT_PROPONENT',
    projectId: 'PROJ-RIFT-512',
    read: false
  },
  {
    id: 'notif-3',
    timestamp: new Date(Date.now() - 18 * 3600000).toISOString(),
    title: 'Direct Purchase Settled',
    message: 'Microsoft Global Sustainability acquired 5 credits from Patagonian Wind. 0.25 ETH transferred directly to your developer address (0% fee).',
    category: 'PURCHASED',
    recipientRole: 'PROJECT_PROPONENT',
    projectId: 'PROJ-PATAGONIA-904',
    read: false
  }
];

// In-Memory & LocalStorage singleton store
class ProjectFlowStore {
  private projects: LifecycleProject[] = [];
  private notifications: ProtocolNotification[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const savedProjects = localStorage.getItem(STORAGE_KEY);
      if (savedProjects) {
        this.projects = JSON.parse(savedProjects);
      } else {
        this.projects = initialSeedProjects;
        this.saveProjects();
      }

      const savedNotifs = localStorage.getItem(NOTIF_KEY);
      if (savedNotifs) {
        this.notifications = JSON.parse(savedNotifs);
      } else {
        this.notifications = initialNotifications;
        this.saveNotifications();
      }
    } catch (e) {
      console.error('Failed to load lifecycle store:', e);
      this.projects = initialSeedProjects;
      this.notifications = initialNotifications;
    }
  }

  private saveProjects() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.projects));
    } catch (e) {
      console.error('Failed to save projects to localStorage:', e);
    }
    this.notify();
  }

  private saveNotifications() {
    try {
      localStorage.setItem(NOTIF_KEY, JSON.stringify(this.notifications));
    } catch (e) {
      console.error('Failed to save notifications to localStorage:', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('Listener callback error:', e);
      }
    });
    // Also dispatch a browser window event for cross-component sync
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('carbonyx:lifecycle-update'));
    }
  }

  // Getters
  public getAllProjects(): LifecycleProject[] {
    return [...this.projects];
  }

  public getProjectById(id: string): LifecycleProject | undefined {
    return this.projects.find((p) => p.id === id);
  }

  public getProjectsForDeveloper(developerWallet?: string | null): LifecycleProject[] {
    if (!developerWallet) return this.getAllProjects();
    return this.projects.filter(
      (p) => p.developerWallet.toLowerCase() === developerWallet.toLowerCase()
    );
  }

  public getVerifierQueue(verifierAddress?: string | null): LifecycleProject[] {
    // Return projects that are in VERIFIER_PENDING_STAKE, VERIFIER_AUDITING, or AUDITED
    return this.projects.filter((p) =>
      ['VERIFIER_PENDING_STAKE', 'VERIFIER_AUDITING', 'AUDITED'].includes(p.lifecycleState)
    );
  }

  public getMarketplaceNfts(): Array<{ project: LifecycleProject; nft: CreditNftRecord }> {
    const list: Array<{ project: LifecycleProject; nft: CreditNftRecord }> = [];
    this.projects.forEach((proj) => {
      proj.nfts
        .filter((nft) => nft.isListed && nft.status === 'LISTED')
        .forEach((nft) => {
          list.push({ project: proj, nft });
        });
    });
    return list;
  }

  public getBuyerPortfolioNfts(buyerAddress?: string | null): Array<{ project: LifecycleProject; nft: CreditNftRecord }> {
    const list: Array<{ project: LifecycleProject; nft: CreditNftRecord }> = [];
    this.projects.forEach((proj) => {
      proj.nfts
        .filter((nft) => {
          if (!buyerAddress) return ['PURCHASED', 'RETIRED'].includes(nft.status);
          return (
            ['PURCHASED', 'RETIRED'].includes(nft.status) &&
            nft.buyerAddress?.toLowerCase() === buyerAddress.toLowerCase()
          );
        })
        .forEach((nft) => {
          list.push({ project: proj, nft });
        });
    });
    return list;
  }

  public getNotifications(recipientRole?: string): ProtocolNotification[] {
    if (!recipientRole) return this.notifications;
    return this.notifications.filter(
      (n) => n.recipientRole === recipientRole || n.recipientRole === 'ALL'
    );
  }

  public markNotificationAsRead(id: string) {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.saveNotifications();
    }
  }

  // --- Core Lifecycle Flow Actions ---

  /**
   * 1. Submit Project: Enters 14-day Baseline Observation Window
   */
  public submitProject(newProjectData: Partial<LifecycleProject>): LifecycleProject {
    const projectId = newProjectData.id || `PROJ-${Date.now().toString().slice(-6)}`;
    const randomVerifier = VERIFIER_POOL[Math.floor(Math.random() * VERIFIER_POOL.length)];

    const project: LifecycleProject = {
      id: projectId,
      name: newProjectData.name || 'New Ecosystem Bio-Sink',
      projectType: newProjectData.projectType || 'REFORESTATION',
      location: newProjectData.location || { country: 'Global', region: 'Protected Zone' },
      developerWallet: newProjectData.developerWallet || '0x627306090abaB3A6e1400e9345bC60c78a8BEf57',
      developerName: newProjectData.developerName || 'Registered Carbon Proponent',
      developerDid: newProjectData.developerDid || `did:carbonyx:${newProjectData.developerWallet?.toLowerCase()}`,
      claimedAnnualTonnage: newProjectData.claimedAnnualTonnage || 10000,
      capexUsd: newProjectData.capexUsd || 500000,
      merkleRoot: newProjectData.merkleRoot || `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      aiConfidenceScore: newProjectData.aiConfidenceScore || 92,
      riskLevel: newProjectData.riskLevel || 'LOW',
      createdAt: new Date().toISOString(),

      lifecycleState: 'BASELINE_WINDOW',
      baselineStartTime: new Date().toISOString(),
      baselineDurationDays: 14,
      objections: [],

      assignedVerifier: randomVerifier,
      passedVerifierIds: [],
      nfts: []
    };

    this.projects.unshift(project);
    this.saveProjects();

    this.addNotification({
      title: 'Project In Baseline Window',
      message: `${project.name} has been anchored and entered the 14-day public challenge window.`,
      category: 'BASELINE',
      recipientRole: 'PROJECT_PROPONENT',
      projectId: project.id
    });

    return project;
  }

  /**
   * 2. Fast-forward / complete 14-day Baseline Window -> assigns to Verifier Pool
   */
  public advanceBaselineWindow(projectId: string): boolean {
    const project = this.getProjectById(projectId);
    if (!project) return false;

    // Move to next state
    project.lifecycleState = 'VERIFIER_PENDING_STAKE';
    project.baselineFastForwarded = true;
    this.saveProjects();

    this.addNotification({
      title: 'Baseline Completed · Assigned to Verifier',
      message: `${project.name} has successfully concluded its 14-day baseline challenge window. Assigned to ${project.assignedVerifier.name} (${project.assignedVerifier.organization}).`,
      category: 'BASELINE',
      recipientRole: 'PROJECT_PROPONENT',
      projectId: project.id
    });

    this.addNotification({
      title: 'New Verification Task Assigned',
      message: `${project.name} has been assigned to your verification pool queue. Stake ${project.assignedVerifier.minimumStakeEth} ETH to begin audit.`,
      category: 'VERIFIER_STAKE',
      recipientRole: 'INDEPENDENT_VERIFIER',
      projectId: project.id
    });

    return true;
  }

  /**
   * 3. Verifier Rejects / Passes -> Rotates to Next Verifier in Pool (Proof of Stake)
   */
  public passToNextVerifier(projectId: string, reason?: string): VerifierPoolMember | null {
    const project = this.getProjectById(projectId);
    if (!project) return null;

    const currentVerifierId = project.assignedVerifier.id;
    if (!project.passedVerifierIds.includes(currentVerifierId)) {
      project.passedVerifierIds.push(currentVerifierId);
    }

    // Pick next available verifier from pool who hasn't passed yet
    const available = VERIFIER_POOL.filter((v) => !project.passedVerifierIds.includes(v.id));
    const nextVerifier = available.length > 0 ? available[0] : VERIFIER_POOL[0];

    project.assignedVerifier = nextVerifier;
    project.lifecycleState = 'VERIFIER_PENDING_STAKE';
    project.verifierStakedEth = undefined;
    project.verifierStakeTxHash = undefined;
    this.saveProjects();

    this.addNotification({
      title: 'Project Rotated to Next Verifier',
      message: `Auditor passed on ${project.name}${reason ? ` (${reason})` : ''}. Re-assigned to ${nextVerifier.name} (${nextVerifier.organization}).`,
      category: 'VERIFIER_STAKE',
      recipientRole: 'PROJECT_PROPONENT',
      projectId: project.id
    });

    return nextVerifier;
  }

  /**
   * 4. Verifier Stakes ETH & Enters Audit Mode (PoS)
   */
  public stakeAndAcceptAudit(projectId: string, stakeEth: number = 0.5): boolean {
    const project = this.getProjectById(projectId);
    if (!project) return false;

    project.lifecycleState = 'VERIFIER_AUDITING';
    project.verifierStakedEth = stakeEth;
    project.verifierStakeTxHash = `0xstake_${Math.floor(Date.now() / 1000).toString(16)}_${Math.random().toString(36).slice(2, 8)}`;
    this.saveProjects();

    this.addNotification({
      title: 'Verifier Staked Collateral (PoS)',
      message: `${project.assignedVerifier.name} staked ${stakeEth} ETH in protocol escrow to audit ${project.name}.`,
      category: 'VERIFIER_STAKE',
      recipientRole: 'PROJECT_PROPONENT',
      projectId: project.id
    });

    return true;
  }

  /**
   * 5. Verifier Audits & Approves Project
   */
  public completeAudit(
    projectId: string,
    params: {
      notes: string;
      confidence: number;
      approved: boolean;
    }
  ): boolean {
    const project = this.getProjectById(projectId);
    if (!project) return false;

    if (!params.approved) {
      // If rejected during audit, rotate to next verifier or fail
      this.passToNextVerifier(projectId, 'Audit findings did not meet additionality standards');
      return true;
    }

    project.lifecycleState = 'AUDITED';
    project.verifierAuditNotes = params.notes;
    project.auditAttestationHash = `0xaudit_${Math.floor(Date.now() / 1000).toString(16)}_${Math.random().toString(36).slice(2, 10)}`;
    project.auditedAt = new Date().toISOString();
    this.saveProjects();

    this.addNotification({
      title: 'Project Audited & Verified',
      message: `Your project ${project.name} was audited & approved by ${project.assignedVerifier.name}. Credit NFTs can now be minted!`,
      category: 'AUDIT_APPROVED',
      recipientRole: 'PROJECT_PROPONENT',
      projectId: project.id
    });

    return true;
  }

  /**
   * 6. ONLY Verifier Can Issue Credits as NFTs
   * Verifier decides:
   * - Total approved CO2 tonnage (e.g. 500 tons)
   * - Number of NFTs to issue (e.g. 100 NFTs = 5 tons CO2/NFT)
   * - Issuance model (Upfront vs Linear Vesting)
   * Minted NFTs are assigned directly to Developer's wallet!
   */
  public issueCreditsAsNfts(
    projectId: string,
    params: {
      totalTonnage: number;
      nftCount: number;
      issuanceModel: 'UPFRONT' | 'LINEAR_VESTING';
      vestingMonths?: number;
    }
  ): CreditNftRecord[] {
    const project = this.getProjectById(projectId);
    if (!project) return [];

    const { totalTonnage, nftCount, issuanceModel, vestingMonths } = params;
    const tonnagePerNft = Number((totalTonnage / nftCount).toFixed(2));
    const startTokenId = 5000 + Math.floor(Math.random() * 4000);
    const txHash = `0xmint_nfts_${Date.now().toString(16)}_${Math.random().toString(36).slice(2, 8)}`;

    const newNfts: CreditNftRecord[] = Array.from({ length: nftCount }, (_, i) => ({
      nftId: `NFT-${project.id.slice(5, 10)}-${startTokenId + i}`,
      tokenId: startTokenId + i,
      serialNumber: `CRX-${project.location.country.slice(0, 2).toUpperCase()}-2026-${startTokenId + i}`,
      co2Tonnage: tonnagePerNft,
      vintageYear: 2026,
      issuanceModel,
      vestingMonths: issuanceModel === 'LINEAR_VESTING' ? vestingMonths || 12 : undefined,
      developerWallet: project.developerWallet,
      isListed: false,
      priceEth: 0.045, // default suggested price
      status: 'MINTED'
    }));

    project.lifecycleState = 'CREDITS_ISSUED';
    project.totalIssuedTonnage = totalTonnage;
    project.issuedNftCount = nftCount;
    project.tonnagePerNft = tonnagePerNft;
    project.issuanceModel = issuanceModel;
    project.nftIssuanceTxHash = txHash;
    project.nfts = newNfts;
    this.saveProjects();

    this.addNotification({
      title: 'Carbon Credit NFTs Minted & Issued',
      message: `${project.assignedVerifier.name} minted ${nftCount} NFTs (${totalTonnage} tCO2e total, ${tonnagePerNft} tCO2e/NFT) directly to your developer wallet. You can now set pricing and list on the marketplace.`,
      category: 'NFT_ISSUED',
      recipientRole: 'PROJECT_PROPONENT',
      projectId: project.id
    });

    return newNfts;
  }

  /**
   * 7. Developer Sets Price & Lists NFTs on Marketplace
   */
  public listNftsOnMarketplace(projectId: string, pricePerNftEth: number): boolean {
    const project = this.getProjectById(projectId);
    if (!project) return false;

    project.listingPricePerNftEth = pricePerNftEth;
    project.isListedOnMarketplace = true;
    project.lifecycleState = 'LISTED_ON_MARKETPLACE';

    project.nfts.forEach((nft) => {
      if (nft.status === 'MINTED') {
        nft.status = 'LISTED';
        nft.isListed = true;
        nft.priceEth = pricePerNftEth;
      }
    });

    this.saveProjects();

    this.addNotification({
      title: 'Credits Listed on Marketplace',
      message: `${project.nfts.filter((n) => n.isListed).length} Carbon Credit NFTs from ${project.name} are now live on Marketplace at ${pricePerNftEth} ETH each. (Direct settlement · 0% protocol fee).`,
      category: 'LISTED',
      recipientRole: 'PROJECT_PROPONENT',
      projectId: project.id
    });

    return true;
  }

  /**
   * 8. Buyer Buys NFT -> Direct Payment from Buyer to Developer (0% platform cut)
   */
  public buyCreditNft(
    projectId: string,
    tokenId: number,
    buyer: { address: string; organizationName: string }
  ): CreditNftRecord | null {
    const project = this.getProjectById(projectId);
    if (!project) return null;

    const nft = project.nfts.find((n) => n.tokenId === tokenId);
    if (!nft || nft.status !== 'LISTED') return null;

    const purchaseTx = `0xsettle_p2p_${Date.now().toString(16)}_${Math.random().toString(36).slice(2, 8)}`;

    nft.status = 'PURCHASED';
    nft.isListed = false;
    nft.buyerAddress = buyer.address;
    nft.buyerOrg = buyer.organizationName;
    nft.purchasedAt = new Date().toISOString();
    nft.purchaseTxHash = purchaseTx;

    // Check if all are purchased
    const anyRemaining = project.nfts.some((n) => n.status === 'LISTED');
    if (!anyRemaining) {
      project.lifecycleState = 'PURCHASED';
    }

    this.saveProjects();

    this.addNotification({
      title: 'Credit Sold · Direct Settlement',
      message: `${buyer.organizationName} bought NFT #${nft.tokenId} for ${nft.priceEth} ETH. 100% of funds sent directly to your wallet ${project.developerWallet.slice(0, 8)}...`,
      category: 'PURCHASED',
      recipientRole: 'PROJECT_PROPONENT',
      projectId: project.id
    });

    this.addNotification({
      title: 'Carbon Credit NFT Acquired',
      message: `You acquired ${nft.co2Tonnage} tCO2e (NFT #${nft.tokenId}) from ${project.name}. Available in your portfolio to hold or retire.`,
      category: 'PURCHASED',
      recipientRole: 'CORPORATE_BUYER',
      projectId: project.id
    });

    return nft;
  }

  /**
   * 9. Buyer Claims / Retires NFT -> Generates Detailed Legal Compliance Document
   */
  public retireCreditNft(
    projectId: string,
    tokenId: number,
    params: {
      retirementReason: string;
      beneficiaryLegalName: string;
      beneficiaryJurisdiction?: string;
    }
  ): LegalComplianceCertificate | null {
    const project = this.getProjectById(projectId);
    if (!project) return null;

    const nft = project.nfts.find((n) => n.tokenId === tokenId);
    if (!nft) return null;

    const burnTx = `0xburn_permanent_${Date.now().toString(16)}_${Math.random().toString(36).slice(2, 8)}`;
    const certId = `CRX-LEGAL-CERT-2026-${nft.tokenId}`;

    nft.status = 'RETIRED';
    nft.retiredAt = new Date().toISOString();
    nft.burnTxHash = burnTx;
    nft.retirementReason = params.retirementReason;
    nft.legalCertificateId = certId;

    project.lifecycleState = 'RETIRED';
    this.saveProjects();

    this.addNotification({
      title: 'Carbon Offset Retired On-Chain',
      message: `Certificate ${certId} generated for ${params.beneficiaryLegalName}. ${nft.co2Tonnage} tCO2e permanently taken out of circulation.`,
      category: 'RETIRED',
      recipientRole: 'CORPORATE_BUYER',
      projectId: project.id
    });

    return this.generateLegalDocument(project, nft, params);
  }

  /**
   * 10. Generate Official Legal & Government Compliance Document
   */
  public generateLegalDocument(
    project: LifecycleProject,
    nft: CreditNftRecord,
    params?: {
      retirementReason?: string;
      beneficiaryLegalName?: string;
      beneficiaryJurisdiction?: string;
    }
  ): LegalComplianceCertificate {
    const certId = nft.legalCertificateId || `CRX-LEGAL-CERT-2026-${nft.tokenId}`;
    const beneficiaryName =
      params?.beneficiaryLegalName || nft.buyerOrg || 'Enterprise ESG Compliance Entity';
    const jurisdiction = params?.beneficiaryJurisdiction || 'United States / Delaware & Global Scope';
    const reason =
      params?.retirementReason || nft.retirementReason || 'Scope 1 & 2 Corporate Greenhouse Gas Neutrality';

    return {
      certificateId: certId,
      serialNumber: nft.serialNumber,
      issuanceDate: nft.retiredAt || new Date().toISOString(),
      complianceStandards: [
        'UNFCCC Article 6.2 & 6.4 (International Mitigation Compliance)',
        'ISO 14064-3:2019 (Specification with Guidance for the Verification of GHG Assertions)',
        'EU Corporate Sustainability Reporting Directive (CSRD / ESRS E1)',
        'US SEC Climate-Related Disclosures (Regulation S-K / Scope 1-3 Offsets)',
        'GHG Protocol Corporate Accounting and Reporting Standard'
      ],
      beneficiary: {
        legalName: beneficiaryName,
        organizationId: `CORP-LEI-${Math.floor(100000 + Math.random() * 900000)}`,
        jurisdiction,
        walletAddress: nft.buyerAddress || '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955'
      },
      projectDetails: {
        projectId: project.id,
        projectName: project.name,
        methodology: project.projectType.replace(/_/g, ' '),
        developerDid: project.developerDid,
        developerName: project.developerName,
        developerWallet: project.developerWallet,
        location: `${project.location.region}, ${project.location.country} (${project.location.coordinates || 'GPS Locked'})`
      },
      verificationAttestation: {
        verifierName: project.assignedVerifier.name,
        verifierOrg: project.assignedVerifier.organization,
        verifierDid: `did:carbonyx:${project.assignedVerifier.address.toLowerCase()}`,
        verifierWallet: project.assignedVerifier.address,
        posStakeEth: project.verifierStakedEth || 0.5,
        posStakeTxHash: project.verifierStakeTxHash || '0xstake_pos_attestation_verified',
        auditReportDigest: project.auditAttestationHash || '0xaudit_cryptographic_digest_anchored'
      },
      carbonAccounting: {
        metricTonsCo2e: nft.co2Tonnage,
        vintageYear: nft.vintageYear,
        serializedNftId: `#${nft.tokenId} (${nft.serialNumber})`,
        issuanceModel: nft.issuanceModel === 'UPFRONT' ? 'Upfront Certified Removal' : 'Linear Vintage Vesting',
        merkleRootCommitment: project.merkleRoot,
        onChainBurnTx: nft.burnTxHash || '0xburn_permanent_ledger_record'
      },
      legalClauses: {
        nonDuplicationClause:
          'The issuing authority and protocol smart contract guarantee that the greenhouse gas reductions certified herein have been permanently retired, serialized, and burned on-chain. These credits cannot be sold, transferred, recycled, or claimed by any party other than the designated beneficiary.',
        additionalityClause:
          'Multi-source environmental telemetry (ground IoT, Sentinel-2 multispectral vegetation index, and audited financial capital expenditures) has verified that the carbon sequestration would not have occurred in the counterfactual absence of this project.',
        directSettlementDeclaration:
          'Financial consideration for this carbon credit was transferred peer-to-peer directly from the corporate buyer to the project developer’s wallet without intermediary protocol commission, maintaining unencumbered legal title.',
        statutoryComplianceNotice:
          'This cryptographic instrument constitutes an official, verifiable proof of voluntary GHG reduction for submission to tax authorities, environmental regulators, and ESG audit committees under applicable environmental governance statutes.'
      }
    };
  }

  private addNotification(data: Omit<ProtocolNotification, 'id' | 'timestamp' | 'read'>) {
    const notif: ProtocolNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...data
    };
    this.notifications.unshift(notif);
    this.saveNotifications();
  }
}

// Global Singleton Instance
export const projectFlowStore = new ProjectFlowStore();
