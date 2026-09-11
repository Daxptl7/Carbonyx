# UI/UX Specification

## 1. Design Aesthetics & Visual Tokens

- **Theme:** High-contrast, state-of-the-art Dark Mode with emerald/cyan bio-luminescent accents and subtle glassmorphism (`backdrop-filter: blur(16px)`).
- **Color Palette:**
  - Background: Obsidian Black (`#0B0F17`) and Dark Slate (`#111827`)
  - Accent Primary: Emerald Cyan (`#10B981`, `#06B6D4`)
  - Warning/Escalation: Amber Neon (`#F59E0B`)
  - Danger/Anomaly/Revocation: Crimson Coral (`#EF4444`)
  - Card Surfaces: Semi-transparent glass with subtle borders (`rgba(255, 255, 255, 0.08)`)
- **Typography:** Modern Google Fonts (`Inter` for UI clarity, `JetBrains Mono` for cryptographic hashes, DIDs, and Merkle roots).

## 2. Core Navigation & Layout

- **Global Header:**
  - Carbonyx Brand & Live Network Status (Local Anvil / Sepolia Testnet).
  - Role Switcher & Persona Indicator (Issuer / Verifier / Buyer / Auditor).
  - Wallet Connect Button (MetaMask) showing DID badge (`did:carbonyx:0x12...89`).
- **Main Views:**
  1. **Issuer Studio:** Project onboarding, DID & KYC generation, Evidence upload portal, Mint status tracker.
  2. **Verifier Staking & Audit Portal:** Stake deposit & balance card, Reputation level, Assigned anomaly queue, Side-by-side evidence comparator.
  3. **Marketplace & Escrow Suite:** Verified credit listings, Filter by project & confidence tier, "Buy with Escrow" modal, Active escrow orders.
  4. **Buyer Portfolio & Retirement:** Dynamic NFT certificate gallery, 1-click on-chain retirement, Downloadable proof-of-offset.
  5. **Auditor Provenance Explorer:** Search by `tokenId`, `projectId`, or `did`; Interactive Merkle tree visualizer; Slashing & Dispute log.

## 3. Key Component UI Specifications

### A. Dynamic NFT Certificate Card
- **Visual Design:** Sleek, animated glassmorphic card displaying:
  - Project Name & Vintage Year
  - High-resolution SVG badge depicting project type (Forestry, Blue Carbon, Methane)
  - Real-time Lifecycle Badge (`ACTIVE` [Green], `ESCROWED` [Cyan], `RETIRED` [Purple], `REVOKED` [Red])
  - On-Chain Merkle Root hash snippet with copy button and Explorer link
  - Carbon Tonnage (e.g. `500 tCO2e`) and AI Confidence Rating (`94% Trust Score`)

### B. Verifier Staking Widget & Anomaly Inspector
- **Staking Box:** Shows current stake (e.g., `500 TEST`), minimum required stake (`100 TEST`), staking yield earned, and reputation meter (e.g., `98/100`).
- **Anomaly Diff Viewer:** Visual side-by-side comparison of claimed IoT sensor absorption vs. satellite vegetation index (NDVI), highlighting discrepancy areas in amber/red.

### C. Escrow Buyer Protection Modal
- Step-by-step progress indicator:
  `1. Payment Deposited in Escrow` ➔ `2. Inspection Window Active` ➔ `3. Funds Released & NFT Delivered`
- Clear security guarantee badge: *"Protected by Carbonyx Escrow Settlement Contract. 100% refund guaranteed if credit is contested during challenge window."*

### D. Cryptographic Lifecycle Audit Timeline
- Chronological vertical stepper showing every on-chain event with transaction hashes, block timestamps, and actor DIDs:
  - `[01] Project Registered (did:carbonyx:0x...)`
  - `[02] Evidence Bundle Hashed (Merkle Root: 0x8f4c...)`
  - `[03] AI Risk Assessment Completed (Score: 94%, Flags: None)`
  - `[04] ERC-721 NFT Minted (Token ID #1042)`
  - `[05] Escrow Purchase Completed (Buyer: 0x7a3e...)`
  - `[06] Retired & Burned (Offset Cert #8821)`
