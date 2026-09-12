import React, { useState, useEffect } from 'react';
import { WalletState } from '../lib/web3';

interface HomePageProps {
  wallet: WalletState;
  onConnectWallet: () => void;
  onNavigateTab: (tab: 'issuer' | 'verifier' | 'marketplace' | 'explorer') => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  wallet,
  onConnectWallet,
  onNavigateTab,
}) => {
  const [activePersona, setActivePersona] = useState<string>('all');
  const [terminalStep, setTerminalStep] = useState<number>(6);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  const handleReplayTerminal = () => {
    setIsStreaming(true);
    setTerminalStep(0);
  };

  useEffect(() => {
    if (!isStreaming) return;
    if (terminalStep < 6) {
      const timer = setTimeout(() => {
        setTerminalStep(prev => prev + 1);
      }, 550);
      return () => clearTimeout(timer);
    } else {
      setIsStreaming(false);
    }
  }, [terminalStep, isStreaming]);

  const personas = [
    { id: 'all', label: 'All Participants' },
    { id: 'proponents', label: 'Project Proponents' },
    { id: 'verifiers', label: 'VVBs & Certifiers' },
    { id: 'buyers', label: 'Commodity Buyers' },
    { id: 'traders', label: 'Traders & Brokers' },
    { id: 'regulators', label: 'Regulators & Public' },
  ];

  return (
    <div className="w-full bg-white font-body-md text-slate-900 antialiased selection:bg-primary selection:text-white">
      {/* ==================== HERO SECTION (XPANSIV CELESTIAL ATMOSPHERE) ==================== */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#02041A] via-[#030919] to-[#06122E] pt-24 pb-36 px-6">
        {/* Celestial glowing planetary horizon curve (Xpansiv signature) with subtle breathing animation */}
        <div className="absolute bottom-[-180px] left-1/2 -translate-x-1/2 w-[1600px] h-[460px] pointer-events-none rounded-[100%] border-t border-[#00D2FF]/60 shadow-[0_-25px_120px_rgba(0,210,255,0.45),inset_0_20px_80px_rgba(0,71,255,0.5)] bg-gradient-to-t from-transparent via-[#0047FF]/10 to-[#00D2FF]/20 animate-horizon-pulse" />
        
        {/* Ambient celestial aurora glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-[#0047FF]/25 via-[#00D2FF]/20 to-transparent blur-[160px] pointer-events-none rounded-full animate-aurora-glow" />

        <div className="relative max-w-5xl mx-auto flex flex-col items-center text-center z-10">
          {/* Tagline Pill (Landing Entrance) */}
          <div className="animate-fade-in-up inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/[0.08] border border-white/25 shadow-lg mb-8 backdrop-blur-md transition-all hover:bg-white/15 hover:border-white/40">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D2FF] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D2FF]" />
            </span>
            <span className="font-mono-proof text-xs !text-white uppercase tracking-widest font-bold" style={{ color: '#ffffff' }}>
              The Verifiable Protocol For High-Integrity Carbon Offsets
            </span>
          </div>

          {/* Headline (Landing Entrance - Stagger 1) */}
          <h1 className="animate-fade-in-up animation-delay-100 font-display-hero text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight leading-[1.15] mb-6">
            Don't Just Tokenize Credits.<br />
            <span className="text-white">
              Validate The Evidence.
            </span>
          </h1>

          {/* Subhead (Landing Entrance - Stagger 2) */}
          <p className="animate-fade-in-up animation-delay-200 font-body-lg text-lg md:text-xl text-slate-200 max-w-3xl mb-10 leading-relaxed font-normal">
            Cryptographically anchoring IoT & satellite telemetry with explainable AI anomaly scoring, verifier collateral staking, and policy-gated ERC-721 minting to eliminate phantom carbon credits.
          </p>

          {/* Primary & Secondary CTAs (Landing Entrance - Stagger 3) */}
          <div className="animate-fade-in-up animation-delay-300 flex flex-wrap items-center justify-center gap-4 mb-16">
            {wallet.isConnected ? (
              <button
                onClick={() => onNavigateTab('issuer')}
                className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#0047FF] hover:bg-[#0038CC] text-white font-label-lg text-sm font-semibold shadow-lg shadow-blue-600/40 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Launch Issuer Studio</span>
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            ) : (
              <button
                onClick={onConnectWallet}
                className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#0047FF] hover:bg-[#0038CC] text-white font-label-lg text-sm font-semibold shadow-lg shadow-blue-600/40 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Launch App / Connect Wallet</span>
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            )}

            <button
              onClick={() => onNavigateTab('marketplace')}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full border border-white/30 text-white hover:bg-white/10 font-label-lg text-sm font-semibold backdrop-blur-sm transition-all duration-200 hover:border-glow-cyan/50 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span className="material-symbols-outlined text-[18px] text-glow-cyan">explore</span>
              <span>Explore Verified Offsets</span>
            </button>
          </div>

          {/* Continuous Sliding Marquee: Integrated Ledger Standards & Verification Interoperability */}
          <div className="animate-fade-in animation-delay-400 w-full max-w-6xl pt-8 border-t border-white/10 flex flex-col items-center gap-6 relative">
            <span className="font-mono-proof text-[11px] text-slate-300 uppercase tracking-widest font-semibold flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-glow-cyan animate-pulse" />
              Integrated Ledger Standards & Verification Interoperability
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-glow-cyan animate-pulse" />
            </span>

            {/* Marquee Wrapper with Smooth Left/Right Gradient Edge Fades */}
            <div className="relative w-full overflow-hidden marquee-mask marquee-container py-2">
              {/* Left & Right Edge Vignette Fades */}
              <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#030919] via-[#030919]/80 to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#030919] via-[#030919]/80 to-transparent z-10 pointer-events-none" />

              {/* Continuous Sliding Track (Guaranteed Infinite Marquee) */}
              <div 
                className="marquee-track flex items-center gap-6"
                style={{ animation: 'marqueeSlide 22s linear infinite' }}
              >
                {[
                  { name: 'Verra VCS', icon: 'verified' },
                  { name: 'Gold Standard', icon: 'workspace_premium' },
                  { name: 'Climate Action Reserve', icon: 'public' },
                  { name: 'I-REC Standard', icon: 'bolt' },
                  { name: 'Chainlink Oracles', icon: 'link' },
                  { name: 'Foundry v2.4', icon: 'terminal' },
                  { name: 'Filecoin / IPFS', icon: 'cloud_sync' },
                  { name: 'UNFCCC Article 6', icon: 'balance' },
                  { name: 'OpenZeppelin Contracts', icon: 'shield' },
                  { name: 'CertiK Tier-1', icon: 'verified_user' },
                  // Exact duplicate for seamless infinite loop
                  { name: 'Verra VCS', icon: 'verified' },
                  { name: 'Gold Standard', icon: 'workspace_premium' },
                  { name: 'Climate Action Reserve', icon: 'public' },
                  { name: 'I-REC Standard', icon: 'bolt' },
                  { name: 'Chainlink Oracles', icon: 'link' },
                  { name: 'Foundry v2.4', icon: 'terminal' },
                  { name: 'Filecoin / IPFS', icon: 'cloud_sync' },
                  { name: 'UNFCCC Article 6', icon: 'balance' },
                  { name: 'OpenZeppelin Contracts', icon: 'shield' },
                  { name: 'CertiK Tier-1', icon: 'verified_user' },
                ].map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/10 hover:border-glow-cyan/60 hover:bg-white/[0.12] text-slate-200 hover:text-white font-mono-data text-xs font-medium transition-all duration-200 transform hover:scale-105 shadow-sm cursor-default"
                  >
                    <span className="material-symbols-outlined text-glow-cyan text-[18px]">
                      {item.icon}
                    </span>
                    <span className="whitespace-nowrap">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== LIVE PROTOCOL TELEMETRY METRICS ==================== */}
      <section className="w-full bg-ice-bg border-b border-card-stroke py-14 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Metric 1 */}
          <div className="p-6 rounded-2xl bg-white border border-card-stroke hover:border-blue-400 hover:shadow-lg transition-all duration-300 shadow-sm transform hover:-translate-y-1 group">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono-proof text-xs text-black font-bold uppercase tracking-wider">Total CO₂ Sequestered</span>
              <span className="font-mono-proof text-[11px] text-primary bg-blue-50 px-2 py-0.5 rounded-full font-bold group-hover:bg-blue-100 transition-colors">
                +14.2% MoM
              </span>
            </div>
            <div className="font-headline-lg text-3xl font-extrabold text-black mb-1">
              482,910 <span className="text-sm font-mono-data text-slate-700 font-semibold">tCO₂e</span>
            </div>
            <span className="font-body-sm text-xs text-slate-800 font-medium">Directly verified via on-site telemetry</span>
          </div>

          {/* Metric 2 */}
          <div className="p-6 rounded-2xl bg-white border border-card-stroke hover:border-blue-400 hover:shadow-lg transition-all duration-300 shadow-sm transform hover:-translate-y-1 group">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono-proof text-xs text-black font-bold uppercase tracking-wider">Active Staked Collateral</span>
              <span className="material-symbols-outlined text-primary text-[18px] group-hover:scale-110 transition-transform">shield</span>
            </div>
            <div className="font-headline-lg text-3xl font-extrabold text-black mb-1">
              1,450 <span className="text-sm font-mono-data text-slate-700 font-semibold">ETH</span>
            </div>
            <span className="font-body-sm text-xs text-slate-800 font-medium">$4.8M TVL economic slashing pool</span>
          </div>

          {/* Metric 3 */}
          <div className="p-6 rounded-2xl bg-white border border-card-stroke hover:border-blue-400 hover:shadow-lg transition-all duration-300 shadow-sm transform hover:-translate-y-1 group">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono-proof text-xs text-black font-bold uppercase tracking-wider">Merkle Proofs Anchored</span>
              <span className="font-mono-proof text-[11px] text-primary bg-blue-50 px-2 py-0.5 rounded-full font-bold group-hover:bg-blue-100 transition-colors">
                0% Double-Count
              </span>
            </div>
            <div className="font-headline-lg text-3xl font-extrabold text-black mb-1">
              12,840 <span className="text-sm font-mono-data text-slate-700 font-semibold">Roots</span>
            </div>
            <span className="font-body-sm text-xs text-slate-800 font-medium">Anchored to Ethereum L1 blocks</span>
          </div>

          {/* Metric 4 */}
          <div className="p-6 rounded-2xl bg-white border border-card-stroke hover:border-blue-400 hover:shadow-lg transition-all duration-300 shadow-sm transform hover:-translate-y-1 group">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono-proof text-xs text-black font-bold uppercase tracking-wider">Certificates Retired</span>
              <span className="font-mono-proof text-[11px] text-primary bg-blue-50 px-2 py-0.5 rounded-full font-bold group-hover:bg-blue-100 transition-colors">
                $0 Fraud Loss
              </span>
            </div>
            <div className="font-headline-lg text-3xl font-extrabold text-black mb-1">
              318,400 <span className="text-sm font-mono-data text-slate-700 font-semibold">ERC-721s</span>
            </div>
            <span className="font-body-sm text-xs text-slate-800 font-medium">Permanent on-chain burn audit trails</span>
          </div>
        </div>
      </section>

      {/* ==================== PARADIGM SHIFT: COMPARISON & PILLARS ==================== */}
      <section className="w-full py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col gap-16">
          {/* Section Title Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <span className="font-mono-proof text-xs font-bold text-primary uppercase tracking-widest block mb-2">
                Infrastructure Comparison
              </span>
              <h2 className="font-headline-lg text-3xl md:text-4xl font-extrabold text-black tracking-tight leading-snug">
                The Paradigm Shift: From Retroactive Paper Audits to Cryptographic Evidence-First Integrity
              </h2>
            </div>
            <p className="font-body-md text-base text-slate-900 font-medium max-w-md leading-relaxed">
              Traditional carbon markets suffer from opacity, multi-year verification lags, and phantom issuance. Carbonyx enforces continuous automated truth.
            </p>
          </div>

          {/* Side-by-Side Architectural Contrast Table */}
          <div className="w-full overflow-x-auto rounded-2xl border border-slate-300 shadow-sm bg-white">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-100">
                  <th className="py-4 px-6 font-mono-proof text-xs font-bold text-black uppercase tracking-wider">Structural Dimension</th>
                  <th className="py-4 px-6 font-mono-proof text-xs font-bold text-black uppercase tracking-wider">Legacy Voluntary Carbon Markets</th>
                  <th className="py-4 px-6 font-mono-proof text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px]">bolt</span> Carbonyx Protocol Architecture
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-body-md text-sm">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-bold text-black">Data Provenance</td>
                  <td className="py-4 px-6 text-slate-900 font-normal leading-relaxed">Manual annual PDF reports, self-reported spreadsheets, sampled site visits every 2–5 years.</td>
                  <td className="py-4 px-6 text-primary bg-blue-50/70 font-semibold border-l-2 border-primary leading-relaxed">Continuous real-time ingestion from multispectral satellite (Sentinel/Landsat) &amp; IoT ground sensors.</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-bold text-black">Fraud Detection</td>
                  <td className="py-4 px-6 text-slate-900 font-normal leading-relaxed">Post-hoc manual spot-checks. Fraud or canopy over-estimation discovered years after token retirement.</td>
                  <td className="py-4 px-6 text-primary bg-blue-50/70 font-semibold border-l-2 border-primary leading-relaxed">Automated Isolation Forest anomaly scoring runs per ingestion telemetry batch before verification.</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-bold text-black">Auditor Incentives</td>
                  <td className="py-4 px-6 text-slate-900 font-normal leading-relaxed">VVBs paid by project proponents with zero financial skin-in-the-game for erroneous certifications.</td>
                  <td className="py-4 px-6 text-primary bg-blue-50/70 font-semibold border-l-2 border-primary leading-relaxed">Bonded staking pools. Approving anomalous claims results in on-chain 50% collateral slashing.</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-bold text-black">Minting Mechanism</td>
                  <td className="py-4 px-6 text-slate-900 font-normal leading-relaxed">Arbitrary off-chain batch issuance with high vulnerability to double-registry listings.</td>
                  <td className="py-4 px-6 text-primary bg-blue-50/70 font-semibold border-l-2 border-primary leading-relaxed">Smart contract policy-gated ERC-721 minting conditioned directly on cryptographic Merkle root proofs.</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4 Core Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group transform hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-primary mb-6 group-hover:scale-105 group-hover:bg-blue-100 transition-all">
                  <span className="material-symbols-outlined text-[26px]">satellite_alt</span>
                </div>
                <span className="font-mono-proof text-[11px] text-slate-700 uppercase font-bold">Pillar 01</span>
                <h3 className="font-headline-sm text-lg font-bold text-black mt-1 mb-2">
                  Multi-Source Telemetry
                </h3>
                <p className="font-body-sm text-xs text-slate-900 font-normal leading-relaxed">
                  Real-time IoT sensor telemetry paired with Sentinel-2 and Landsat multispectral reflectance indexes, cryptographically anchored into SHA-256 Merkle roots.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-1.5 text-primary font-mono-proof text-xs font-bold">
                <span className="material-symbols-outlined text-[14px]">dataset</span> Raw Ingestion Proofs
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group transform hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-primary mb-6 group-hover:scale-105 group-hover:bg-blue-100 transition-all">
                  <span className="material-symbols-outlined text-[26px]">psychology</span>
                </div>
                <span className="font-mono-proof text-[11px] text-slate-700 uppercase font-bold">Pillar 02</span>
                <h3 className="font-headline-sm text-lg font-bold text-black mt-1 mb-2">
                  Explainable AI Scoring
                </h3>
                <p className="font-body-sm text-xs text-slate-900 font-normal leading-relaxed">
                  FastAPI-orchestrated Isolation Forest and spatial-temporal gradient models detect sensor drift, biomass fabrication, and statistical outliers instantly.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-1.5 text-primary font-mono-proof text-xs font-bold">
                <span className="material-symbols-outlined text-[14px]">analytics</span> Real-Time Anomaly Rank
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group transform hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-primary mb-6 group-hover:scale-105 group-hover:bg-blue-100 transition-all">
                  <span className="material-symbols-outlined text-[26px]">gavel</span>
                </div>
                <span className="font-mono-proof text-[11px] text-slate-700 uppercase font-bold">Pillar 03</span>
                <h3 className="font-headline-sm text-lg font-bold text-black mt-1 mb-2">
                  Verifier Staking &amp; Slashing
                </h3>
                <p className="font-body-sm text-xs text-slate-900 font-normal leading-relaxed">
                  Auditors bond ETH into sovereign staking contracts. Approving fraudulent or invalidated telemetry bundles triggers an irrevocable 50% collateral slash.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-1.5 text-primary font-mono-proof text-xs font-bold">
                <span className="material-symbols-outlined text-[14px]">account_balance</span> Bonded Auditor Pool
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group transform hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-primary mb-6 group-hover:scale-105 group-hover:bg-blue-100 transition-all">
                  <span className="material-symbols-outlined text-[26px]">token</span>
                </div>
                <span className="font-mono-proof text-[11px] text-slate-700 uppercase font-bold">Pillar 04</span>
                <h3 className="font-headline-sm text-lg font-bold text-black mt-1 mb-2">
                  Policy-Gated ERC-721s
                </h3>
                <p className="font-body-sm text-xs text-slate-900 font-normal leading-relaxed">
                  Credits are only minted once cryptographic consensus is satisfied. Includes automated buyer protection escrow and permanent on-chain burn certificates.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-1.5 text-primary font-mono-proof text-xs font-bold">
                <span className="material-symbols-outlined text-[14px]">local_fire_department</span> Provable Retirement
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== PROTOCOL LIFECYCLE (4-STEP INTERACTION) ==================== */}
      <section className="w-full py-24 px-6 bg-ice-bg border-t border-card-stroke">
        <div className="max-w-7xl mx-auto flex flex-col gap-14">
          <div>
            <span className="font-mono-proof text-xs font-bold text-primary uppercase tracking-widest block mb-2">
              End-to-End Execution
            </span>
            <h2 className="font-headline-lg text-3xl font-extrabold text-black">
              How Carbonyx Works: Cryptographic Pipeline
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono-data text-xs text-primary font-bold">01 / INGEST &amp; ANCHOR</span>
                <span className="material-symbols-outlined text-slate-700 text-[20px]">fingerprint</span>
              </div>
              <div>
                <h4 className="font-headline-sm text-base font-bold text-black mb-2">DID Registration</h4>
                <p className="font-body-sm text-xs text-slate-900 font-normal mb-5 leading-relaxed">
                  IoT sensors and satellites transmit raw telemetry bundles bound to decentralized identifiers (<code className="text-primary font-mono-proof font-semibold">did:carbonyx:iss_7f9b</code>) and hashed into SHA-256 Merkle roots.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-300 font-mono-proof text-[11px] text-black font-semibold truncate">
                Merkle: 0x9f2a...e41c (Block #19842109)
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono-data text-xs text-primary font-bold">02 / AI EVALUATION</span>
                <span className="material-symbols-outlined text-slate-700 text-[20px]">model_training</span>
              </div>
              <div>
                <h4 className="font-headline-sm text-base font-bold text-black mb-2">Anomaly Scoring</h4>
                <p className="font-body-sm text-xs text-slate-900 font-normal mb-5 leading-relaxed">
                  Machine learning models benchmark temporal variance, vegetation density indices, and physical canopy bounds to generate an Explainable Anomaly Score.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-300 font-mono-proof text-[11px] text-primary flex items-center justify-between font-bold">
                <span>Score: 0.041</span>
                <span className="text-slate-800">98.4% Confidence</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono-data text-xs text-primary font-bold">03 / STAKED VERIFY</span>
                <span className="material-symbols-outlined text-slate-700 text-[20px]">verified_user</span>
              </div>
              <div>
                <h4 className="font-headline-sm text-base font-bold text-black mb-2">Collateral Audit</h4>
                <p className="font-body-sm text-xs text-slate-900 font-normal mb-5 leading-relaxed">
                  Licensed VVBs review flagged or borderline anomaly claims with bonded ETH. Multi-sig consensus approves evidence or triggers staking pool slashing.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-300 font-mono-proof text-[11px] text-primary flex items-center justify-between font-bold">
                <span>Quorum: 3/3 Signed</span>
                <span className="text-slate-800">Stake Locked</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono-data text-xs text-primary font-bold">04 / MINT, TRADE &amp; BURN</span>
                <span className="material-symbols-outlined text-slate-700 text-[20px]">currency_exchange</span>
              </div>
              <div>
                <h4 className="font-headline-sm text-base font-bold text-black mb-2">Settlement &amp; Retiring</h4>
                <p className="font-body-sm text-xs text-slate-900 font-normal mb-5 leading-relaxed">
                  ERC-721 minted directly with verifiable cryptographic roots. Corporate buyers settle via atomic escrow contracts or burn permanently with public cryptographic receipts.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-300 font-mono-proof text-[11px] text-primary truncate font-bold">
                Tx: 0x5a18...39fd (Retired)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== USER PERSONAS: WHO WE SERVE (XPANSIV PILLS) ==================== */}
      <section className="w-full py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
          <div className="flex flex-col items-center text-center">
            <h2 className="font-headline-lg text-3xl md:text-4xl font-extrabold text-black mb-3">
              Who We Serve
            </h2>
            <p className="font-body-md text-base text-slate-900 font-medium max-w-2xl">
              Carbonyx provides tailored solutions for institutional investors, verifiers, corporate buyers, and registry stakeholders worldwide.
            </p>
            {/* Persona Pill Navigation Matching Xpansiv */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
              {personas.map(p => (
                <button
                  key={p.id}
                  onClick={() => setActivePersona(p.id)}
                  className={`px-5 py-2 rounded-full text-xs transition-all duration-200 ${
                    activePersona === p.id
                      ? 'bg-[#030919] text-white font-bold shadow-md scale-105'
                      : 'bg-white text-black font-semibold border-2 border-slate-300 hover:border-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bento Grid of Solutions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Portal Card 1: Project Issuers */}
            {(activePersona === 'all' || activePersona === 'proponents') && (
              <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all duration-300 flex flex-col justify-between group transform hover:-translate-y-1">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-primary border border-blue-200 font-mono-proof text-[11px] font-bold uppercase">
                      Project Proponents
                    </span>
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-primary group-hover:bg-blue-100 transition-colors">
                      <span className="material-symbols-outlined text-[20px]">forest</span>
                    </div>
                  </div>
                  <h3 className="font-headline-md text-2xl font-bold text-black mb-2">
                    Issuer Studio
                  </h3>
                  <p className="font-body-md text-base text-slate-900 font-normal mb-6 leading-relaxed">
                    Tokenize forestry, blue carbon, biochar, or direct air capture projects. Provision device DIDs, synchronize telemetry feeds, and monitor anomaly pre-audits in real-time.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-black font-mono-proof text-xs font-semibold">DID Onboarding</span>
                    <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-black font-mono-proof text-xs font-semibold">Batch Upload API</span>
                    <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-black font-mono-proof text-xs font-semibold">Pre-Verification Telemetry</span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateTab('issuer')}
                  className="inline-flex items-center gap-2 text-primary font-label-md text-sm font-bold group-hover:translate-x-1 transition-transform w-fit"
                >
                  <span>Enter Issuer Studio</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            )}

            {/* Portal Card 2: Verifiers & Auditors */}
            {(activePersona === 'all' || activePersona === 'verifiers') && (
              <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all duration-300 flex flex-col justify-between group transform hover:-translate-y-1">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-primary border border-blue-200 font-mono-proof text-[11px] font-bold uppercase">
                      VVBs &amp; Certifiers
                    </span>
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-primary group-hover:bg-blue-100 transition-colors">
                      <span className="material-symbols-outlined text-[20px]">policy</span>
                    </div>
                  </div>
                  <h3 className="font-headline-md text-2xl font-bold text-black mb-2">
                    Verifier Portal
                  </h3>
                  <p className="font-body-md text-base text-slate-900 font-normal mb-6 leading-relaxed">
                    Stake collateral into consensus vaults. Review anomaly-flagged project batches with geospatial overlay inspection tools, and sign cryptographically binding approvals.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-black font-mono-proof text-xs font-semibold">Collateral Staking (ETH)</span>
                    <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-black font-mono-proof text-xs font-semibold">Anomaly Queue</span>
                    <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-black font-mono-proof text-xs font-semibold">Cryptographic Multi-Sig</span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateTab('verifier')}
                  className="inline-flex items-center gap-2 text-primary font-label-md text-sm font-bold group-hover:translate-x-1 transition-transform w-fit"
                >
                  <span>Enter Verifier Portal</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            )}

            {/* Portal Card 3: Enterprise Buyers */}
            {(activePersona === 'all' || activePersona === 'buyers' || activePersona === 'traders') && (
              <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all duration-300 flex flex-col justify-between group transform hover:-translate-y-1">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-primary border border-blue-200 font-mono-proof text-[11px] font-bold uppercase">
                      Institutional Buyers
                    </span>
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-primary group-hover:bg-blue-100 transition-colors">
                      <span className="material-symbols-outlined text-[20px]">storefront</span>
                    </div>
                  </div>
                  <h3 className="font-headline-md text-2xl font-bold text-black mb-2">
                    Offset Marketplace &amp; Escrow
                  </h3>
                  <p className="font-body-md text-base text-slate-900 font-normal mb-6 leading-relaxed">
                    Source verified high-durability credits with embedded cryptographic proofs. Settle transactions through fraud-resistant smart contract escrow with instantaneous immutable retirement burns.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-black font-mono-proof text-xs font-semibold">Spot Order Books</span>
                    <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-black font-mono-proof text-xs font-semibold">Zero-Slippage Escrow</span>
                    <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-black font-mono-proof text-xs font-semibold">Instant Retirement Receipts</span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateTab('marketplace')}
                  className="inline-flex items-center gap-2 text-primary font-label-md text-sm font-bold group-hover:translate-x-1 transition-transform w-fit"
                >
                  <span>Explore Marketplace</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            )}

            {/* Portal Card 4: Regulators & Public */}
            {(activePersona === 'all' || activePersona === 'regulators') && (
              <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all duration-300 flex flex-col justify-between group transform hover:-translate-y-1">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-primary border border-blue-200 font-mono-proof text-[11px] font-bold uppercase">
                      Regulators &amp; Public
                    </span>
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-primary group-hover:bg-blue-100 transition-colors">
                      <span className="material-symbols-outlined text-[20px]">manage_search</span>
                    </div>
                  </div>
                  <h3 className="font-headline-md text-2xl font-bold text-black mb-2">
                    Auditor Explorer
                  </h3>
                  <p className="font-body-md text-base text-slate-900 font-normal mb-6 leading-relaxed">
                    Inspect the entire lifecycle of any carbon credit token. Trace directly from the physical satellite imagery batch and sensor ping down to the retirement transaction hash.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-black font-mono-proof text-xs font-semibold">Merkle Proof Verifier</span>
                    <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-black font-mono-proof text-xs font-semibold">Public Ledger Search</span>
                    <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-black font-mono-proof text-xs font-semibold">Article 6 Accounting</span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateTab('explorer')}
                  className="inline-flex items-center gap-2 text-primary font-label-md text-sm font-bold group-hover:translate-x-1 transition-transform w-fit"
                >
                  <span>Open Ledger Explorer</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================== LIVE PROVENANCE VERIFICATION TERMINAL (NAVY & ELECTRIC BLUE) ==================== */}
      <section className="w-full py-24 px-6 bg-[#030919] relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-1/2 right-10 -translate-y-1/2 w-96 h-96 bg-primary/20 blur-[130px] pointer-events-none rounded-full" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Explainer Column */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-glow-cyan font-mono-proof text-xs w-fit">
              <span className="material-symbols-outlined text-[14px]">terminal</span>
              <span>LIVE MRV PROOF ENGINE</span>
            </div>
            <h2 className="font-headline-lg text-3xl md:text-4xl font-extrabold text-white leading-tight">
              Cryptographic Assurance at Machine Speed
            </h2>
            <p className="font-body-md text-sm md:text-base text-slate-300 leading-relaxed">
              Carbonyx bridges physical environmental reality to EVM consensus. Ingested telemetry is passed through automated anomaly models, signed by bonded validators, and issued into verified token pools.
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center gap-3 text-sm text-white">
                <span className="material-symbols-outlined text-glow-cyan text-[18px]">check_circle</span>
                <span>Tamper-evident SHA-256 Merkle root trees</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white">
                <span className="material-symbols-outlined text-glow-cyan text-[18px]">check_circle</span>
                <span>FastAPI Isolation Forest statistical confidence checks</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white">
                <span className="material-symbols-outlined text-glow-cyan text-[18px]">check_circle</span>
                <span>Slashing enforcement smart contract (0x4a92...88df)</span>
              </div>
            </div>
            <div className="pt-2">
              <button
                onClick={handleReplayTerminal}
                disabled={isStreaming}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-mono-proof text-glow-cyan transition-all duration-200 disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[16px] ${isStreaming ? 'animate-spin' : ''}`}>sync</span>
                <span>{isStreaming ? 'Streaming Telemetry Ingestion...' : 'Re-run Telemetry Audit Stream'}</span>
              </button>
            </div>
          </div>

          {/* Live Terminal Column */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl bg-[#081534] border border-blue-900/60 shadow-2xl overflow-hidden font-mono-proof text-xs">
              {/* Bar */}
              <div className="bg-[#030919] px-4 py-3 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-glow-cyan/80" />
                  <span className="ml-2 text-slate-400 text-[11px]">mrv-daemon@carbonyx-l2-node-04:~$</span>
                </div>
                <span className="text-[11px] text-glow-cyan flex items-center gap-1.5 font-mono-data">
                  <span className="h-2 w-2 rounded-full bg-glow-cyan animate-pulse" />
                  SYNCED [ETH #19842109]
                </span>
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col gap-2.5 text-slate-300 overflow-x-auto leading-relaxed min-h-[280px]">
                <div className="text-slate-400"># Ingesting Sentinel-2 Multispectral Tile &amp; IoT Soil Telemetry...</div>
                
                {terminalStep >= 1 && (
                  <div className="flex items-start gap-2 transition-opacity duration-300">
                    <span className="text-glow-cyan">&gt;</span>
                    <div>
                      <span className="text-white font-semibold">PROJECT_ID:</span>{' '}
                      <span className="text-white">PRJ-AMAZON-0491 (Acre Forest Conservation)</span>
                    </div>
                  </div>
                )}

                {terminalStep >= 2 && (
                  <div className="flex items-start gap-2 transition-opacity duration-300">
                    <span className="text-glow-cyan">&gt;</span>
                    <div>
                      <span className="text-white font-semibold">ISSUER_DID:</span>{' '}
                      <span className="text-glow-cyan">did:carbonyx:iss_7f9b841a0e9c</span>
                    </div>
                  </div>
                )}

                {terminalStep >= 3 && (
                  <div className="flex items-start gap-2 transition-opacity duration-300">
                    <span className="text-glow-cyan">&gt;</span>
                    <div>
                      <span className="text-white font-semibold">MERKLE_ROOT:</span>{' '}
                      <span className="text-slate-200">0x7b4ac91e8432a10bfca3199854d19aa2e04f98124b8109d... <span className="text-glow-cyan font-bold">[VERIFIED]</span></span>
                    </div>
                  </div>
                )}

                {terminalStep >= 4 && (
                  <div className="flex items-start gap-2 transition-opacity duration-300">
                    <span className="text-glow-cyan">&gt;</span>
                    <div>
                      <span className="text-white font-semibold">AI_ANOMALY_SCORE:</span>{' '}
                      <span className="text-glow-cyan font-bold">0.041 (Normal / Low Risk — Model Confidence: 98.4%)</span>
                    </div>
                  </div>
                )}

                {terminalStep >= 5 && (
                  <div className="flex items-start gap-2 transition-opacity duration-300">
                    <span className="text-glow-cyan">&gt;</span>
                    <div>
                      <span className="text-white font-semibold">VERIFIER_CONSENSUS:</span>{' '}
                      <span className="text-glow-cyan font-bold">100% (3/3 Independent Staked Nodes Confirmed)</span>
                    </div>
                  </div>
                )}

                {terminalStep >= 6 && (
                  <>
                    <div className="flex items-start gap-2 transition-opacity duration-300">
                      <span className="text-glow-cyan">&gt;</span>
                      <div>
                        <span className="text-white font-semibold">STAKE_LOCK_STATUS:</span>{' '}
                        <span className="text-white">150 ETH Collateral Secured in Slashing Pool</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-blue-950/60 border border-glow-cyan/40 text-glow-cyan mt-2 flex items-center justify-between transition-all duration-300">
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                        <span>STATUS: Ready for Escrow Minting [ERC-721 #49102]</span>
                      </span>
                      <span className="font-mono-data text-[11px] text-slate-400">Gas: 42,108 gwei</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== INSTITUTIONAL SECURITY & INFRASTRUCTURE TRUST ==================== */}
      <section className="w-full py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
          <div className="max-w-3xl">
            <span className="font-mono-proof text-xs font-bold text-primary uppercase tracking-widest block mb-2">
              Engineered For Sovereign &amp; Capital Market Scale
            </span>
            <h2 className="font-headline-lg text-3xl font-extrabold text-black">
              Audited Cryptographic Infrastructure
            </h2>
            <p className="font-body-md text-base text-slate-900 font-medium mt-2">
              Carbonyx core contracts undergo continuous fuzzing, formal invariant verification, and battle-tested penetration audits.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Trust Box 1 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-400 transition-all duration-300 flex flex-col justify-between transform hover:-translate-y-1">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">terminal</span>
                  </div>
                  <span className="font-mono-data text-sm text-black font-bold">Foundry Invariant Tested</span>
                </div>
                <p className="font-body-sm text-xs text-slate-900 font-normal leading-relaxed">
                  Over 2,400 stateful fuzzing tests and mathematical invariants validating zero-reentrancy on escrow settlement and minting routines.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="font-mono-proof text-xs text-black font-bold">Coverage: 99.4%</span>
                <span className="font-mono-proof text-xs font-bold text-primary">Invariant Verified</span>
              </div>
            </div>

            {/* Trust Box 2 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-400 transition-all duration-300 flex flex-col justify-between transform hover:-translate-y-1">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">verified</span>
                  </div>
                  <span className="font-mono-data text-sm text-black font-bold">CertiK &amp; OpenZeppelin</span>
                </div>
                <p className="font-body-sm text-xs text-slate-900 font-normal leading-relaxed">
                  Dual institutional third-party security audits verifying collateral slashing mechanics, ERC-721 logic, and Merkle tree leaf computation.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="font-mono-proof text-xs text-black font-bold">Security Score: 96.4</span>
                <span className="font-mono-proof text-xs font-bold text-primary">Tier-1 Validated</span>
              </div>
            </div>

            {/* Trust Box 3 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-400 transition-all duration-300 flex flex-col justify-between transform hover:-translate-y-1">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">cloud_done</span>
                  </div>
                  <span className="font-mono-data text-sm text-black font-bold">Off-Chain Relational Vault</span>
                </div>
                <p className="font-body-sm text-xs text-slate-900 font-normal leading-relaxed">
                  High-throughput Supabase and IPFS storage clusters guarantee sub-second raw telemetry retrieval without burdening on-chain gas dynamics.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="font-mono-proof text-xs text-black font-bold">Uptime: 99.99%</span>
                <span className="font-mono-proof text-xs font-bold text-primary">High Availability</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== INSTITUTIONAL CALL-TO-ACTION BANNER (XPANSIV DEEP BLUE GLOW) ==================== */}
      <section className="w-full py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto rounded-3xl bg-[#030919] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl border border-white/10">
          {/* Xpansiv Radial Celestial Glow inside box */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[600px] h-[350px] bg-gradient-to-r from-[#00D2FF]/25 via-[#0047FF]/20 to-transparent blur-[90px] rounded-full" />
          </div>
          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            <span className="font-mono-proof text-xs text-glow-cyan uppercase tracking-widest mb-3 font-semibold">
              Eliminate Risk Today
            </span>
            <h2 className="font-display-hero text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Ready to eliminate phantom credits from your balance sheet?
            </h2>
            <p className="font-body-lg text-base md:text-lg text-slate-300 mb-10 leading-relaxed">
              Connect your organization to the Carbonyx cryptographic settlement pool or schedule an architectural walkthrough with our core engineering team.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {wallet.isConnected ? (
                <button
                  onClick={() => onNavigateTab('issuer')}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#0047FF] hover:bg-[#0038CC] text-white font-label-lg text-sm font-semibold shadow-lg shadow-blue-600/40 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span className="material-symbols-outlined text-[18px]">token</span>
                  <span>Enter Issuer Studio</span>
                </button>
              ) : (
                <button
                  onClick={onConnectWallet}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#0047FF] hover:bg-[#0038CC] text-white font-label-lg text-sm font-semibold shadow-lg shadow-blue-600/40 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                  <span>Connect Wallet &amp; Launch</span>
                </button>
              )}
              <button
                onClick={() => onNavigateTab('marketplace')}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-white/30 text-white hover:bg-white/10 font-label-lg text-sm font-semibold backdrop-blur-sm transition-all duration-200 hover:border-glow-cyan/50 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="material-symbols-outlined text-[18px] text-glow-cyan">storefront</span>
                <span>Explore Offset Marketplace</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER (XPANSIV CORPORATE DEEP NAVY) ==================== */}
      <footer className="w-full bg-[#040D21] border-t border-white/10 text-slate-300">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-14 border-b border-white/10">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 36 36">
                    <path d="M18 2L32 10V26L18 34L4 26V10L18 2Z" fill="#040D21" stroke="#0047FF" strokeWidth="2" />
                    <path d="M18 8C13 13 13 23 18 28C23 23 23 13 18 8Z" fill="#0047FF" fillOpacity="0.35" stroke="#0047FF" strokeWidth="1.2" />
                    <circle cx="18" cy="18" fill="#00D2FF" r="3" />
                  </svg>
                </div>
                <span className="font-headline-sm text-lg font-bold text-white tracking-wider">CARBONYX PROTOCOL</span>
              </div>
              <p className="font-body-sm text-xs text-slate-400 max-w-md leading-relaxed">
                Next-generation institutional settlement and cryptographic MRV infrastructure for environmental commodities. Ensuring immutability, zero double-counting, and real-time physical auditing for voluntary and compliance carbon instruments.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="font-mono-proof text-[10px] px-3 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10">UNFCCC Art. 6 Compatible</span>
                <span className="font-mono-proof text-[10px] px-3 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10">Verra Verified Registry Bridge</span>
                <span className="font-mono-proof text-[10px] px-3 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10">Gold Standard Certified</span>
                <span className="font-mono-proof text-[10px] px-3 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10">I-REC Settlement Router</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-mono-proof text-xs uppercase tracking-wider text-slate-400 font-semibold">Core Protocols</span>
              <button onClick={() => onNavigateTab('marketplace')} className="font-body-sm text-xs text-left text-slate-300 hover:text-white transition-colors">
                Settlement Engine (L2)
              </button>
              <button onClick={() => onNavigateTab('issuer')} className="font-body-sm text-xs text-left text-slate-300 hover:text-white transition-colors">
                Asset Tokenization Studio
              </button>
              <button onClick={() => onNavigateTab('verifier')} className="font-body-sm text-xs text-left text-slate-300 hover:text-white transition-colors">
                Automated dMRV Ingestion
              </button>
              <button onClick={() => onNavigateTab('explorer')} className="font-body-sm text-xs text-left text-slate-300 hover:text-white transition-colors">
                Cryptographic Ledger Explorer
              </button>
              <button onClick={() => onNavigateTab('marketplace')} className="font-body-sm text-xs text-left text-slate-300 hover:text-white transition-colors">
                Sovereign Custody Gateway
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-mono-proof text-xs uppercase tracking-wider text-slate-400 font-semibold">Formal Verification</span>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 font-body-sm text-xs text-glow-cyan">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  <span>CertiK Verified (Score 96.4)</span>
                </div>
                <div className="flex items-center gap-1.5 font-body-sm text-xs text-glow-cyan">
                  <span className="material-symbols-outlined text-[14px]">shield</span>
                  <span>OpenZeppelin Foundry v2.4</span>
                </div>
                <div className="flex items-center gap-1.5 font-body-sm text-xs text-slate-300">
                  <span className="material-symbols-outlined text-[14px]">code</span>
                  <span>Open Source Github Repo</span>
                </div>
                <div className="flex items-center gap-1.5 font-body-sm text-xs text-slate-300">
                  <span className="material-symbols-outlined text-[14px]">monitoring</span>
                  <span>Telemetry Status Dashboard</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-mono-proof text-xs uppercase tracking-wider text-slate-400 font-semibold">Institutional Access</span>
              <p className="font-body-sm text-xs text-slate-400">
                Connect high-throughput FIX API or sovereign cold wallets to execution pools.
              </p>
              <button
                onClick={wallet.isConnected ? () => onNavigateTab('issuer') : onConnectWallet}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/15 transition-all font-label-md text-xs font-semibold border border-white/15"
              >
                <span className="material-symbols-outlined text-[15px]">terminal</span>
                <span>{wallet.isConnected ? 'Open Studio' : 'Developer Portal API'}</span>
              </button>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <span className="font-mono-proof text-[11px]">
              © 2026 Carbonyx Protocol Foundation. All cryptographic rights reserved. Cryptographically anchored to Ethereum L1.
            </span>
            <div className="flex items-center gap-6">
              <span className="font-mono-proof text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer">Terms of Settlement</span>
              <span className="font-mono-proof text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer">Commodity Disclaimers</span>
              <span className="font-mono-proof text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer">VVB Integrity Charter</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
