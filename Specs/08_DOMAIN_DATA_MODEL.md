# Domain & Data Model

## 1. Core Domain Entities

```
┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐
│     Project     │◄──────┤  EvidenceBundle │◄──────┤   EvidenceItem   │
│  - projectId    │       │  - bundleId     │       │  - evidenceId    │
│  - did          │       │  - merkleRoot   │       │  - sourceType    │
│  - kycHash      │       │  - status       │       │  - payloadHash   │
└────────┬────────┘       └────────┬────────┘       └──────────────────┘
         │                         │
         │                         ▼
         │                ┌─────────────────┐
         │                │  RiskAssessment │
         │                │  - score (0-100)│
         │                │  - xaiReason    │
         │                └────────┬────────┘
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐
│  VerifierStake  │       │ CarbonCreditNFT │       │      Escrow      │
│  - verifierAddr │       │  - tokenId      │◄──────┤  - escrowId      │
│  - stakedAmount │       │  - tonnage      │       │  - buyerAddress  │
│  - reputation   │       │  - status       │       │  - depositAmount │
└─────────────────┘       └────────┬────────┘       └──────────────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │     Dispute     │
                          │  - disputeId    │
                          │  - status       │
                          └─────────────────┘
```

## 2. Entity Schemas & Enums

### Project
```json
{
  "projectId": "bytes32 / string",
  "did": "string (did:carbonyx:0x...)",
  "ownerAddress": "address (0x...)",
  "name": "string",
  "projectType": "REFORESTATION | BLUE_CARBON | METHANE_CAPTURE | RENEWABLE_ENERGY",
  "location": {
    "country": "string",
    "coordinates": "string (lat,long)",
    "region": "string"
  },
  "claimedAnnualTonnage": "number (uint256)",
  "kycStatus": "UNVERIFIED | VERIFIED | REJECTED",
  "kycAttestationHash": "bytes32",
  "baselineChallengeExpiry": "number (UNIX timestamp)",
  "status": "PENDING_CHALLENGE | ACTIVE | SUSPENDED",
  "createdAt": "number (UNIX timestamp)"
}
```

### EvidenceItem
```json
{
  "evidenceId": "string (UUID)",
  "bundleId": "bytes32",
  "sourceType": "IOT_SENSOR | SATELLITE_NDVI | OPERATIONAL_DOC | VERIFIER_AUDIT",
  "payload": "object (raw measurements / image metadata)",
  "payloadHash": "bytes32 (SHA-256)",
  "signature": "string (hex)",
  "signerAddress": "address (0x...)",
  "submittedAt": "number (UNIX timestamp)",
  "integrityStatus": "VALID | CORRUPTED | INVALID_SIGNATURE"
}
```

### EvidenceBundle
```json
{
  "bundleId": "bytes32 (keccak256)",
  "projectId": "bytes32",
  "merkleRoot": "bytes32",
  "itemCount": "number",
  "monitoringPeriod": {
    "startDate": "string",
    "endDate": "string"
  },
  "status": "INGESTED | CORRELATED | ANOMALOUS | VERIFIED | ISSUED | REJECTED",
  "onChainTxHash": "string"
}
```

### RiskAssessment
```json
{
  "assessmentId": "string",
  "bundleId": "bytes32",
  "confidenceScore": "number (0-100)",
  "riskLevel": "LOW | MEDIUM | HIGH",
  "anomalyFlags": ["string"],
  "explanationReason": "string (Plain-language XAI summary)",
  "autoMintEligible": "boolean",
  "verifierRequired": "boolean",
  "computedAt": "number"
}
```

### VerifierStake
```json
{
  "verifierAddress": "address (0x...)",
  "stakedAmount": "number (in wei/tokens)",
  "reputationScore": "number (0-100)",
  "activeInPool": "boolean",
  "specialization": "REFORESTATION | INDUSTRIAL | METHANE",
  "totalVerifiedCount": "number",
  "slashedCount": "number",
  "lastStakeTimestamp": "number"
}
```

### CarbonCreditNFT
```json
{
  "tokenId": "uint256",
  "projectId": "bytes32",
  "bundleId": "bytes32",
  "currentOwner": "address (0x...)",
  "co2Tonnage": "uint256 (tCO2e)",
  "vintageYear": "number (uint16)",
  "merkleRoot": "bytes32",
  "status": "ISSUED | ESCROWED | TRANSFERRED | RETIRED | DISPUTED | REVOKED",
  "retirementReason": "string (optional)",
  "retiredAt": "number (optional)",
  "tokenURI": "string (IPFS/JSON metadata endpoint)"
}
```

### Escrow
```json
{
  "escrowId": "bytes32",
  "tokenId": "uint256",
  "buyerAddress": "address (0x...)",
  "sellerAddress": "address (0x...)",
  "depositAmount": "uint256 (wei / USDC)",
  "status": "LOCKED | RELEASED | REFUNDED",
  "challengeWindowExpiry": "number (UNIX timestamp)",
  "createdAt": "number"
}
```

### Dispute
```json
{
  "disputeId": "bytes32",
  "tokenId": "uint256",
  "initiatorAddress": "address (0x...)",
  "reason": "string",
  "evidenceCid": "string",
  "status": "OPEN | UPHELD | DISMISSED",
  "resolvedBy": "address",
  "resolvedAt": "number",
  "slashedAmount": "uint256"
}
```
