import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, Database, Layers, CheckCircle2, AlertCircle, LogOut, Wallet, UserCheck, ShoppingBag, Search, Compass, BookOpen, Activity } from 'lucide-react';
import { connectMetaMask, truncateAddress, WalletState } from './lib/web3';
import { IssuerStudio } from './pages/IssuerStudio';
import { HomePage } from './pages/HomePage';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'issuer' | 'verifier' | 'marketplace' | 'explorer'>('overview');
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    signer: null,
    chainId: null,
    isConnected: false,
    error: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);

  const backendUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          handleConnect();
        }
      }).catch(console.error);

      ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          setWallet({ address: null, signer: null, chainId: null, isConnected: false, error: null });
        } else {
          handleConnect();
        }
      });

      ethereum.on('chainChanged', () => {
        handleConnect();
      });
    }
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    setWallet(prev => ({ ...prev, error: null }));
    try {
      const { address, signer, chainId } = await connectMetaMask();
      setWallet({
        address,
        signer,
        chainId,
        isConnected: true,
        error: null,
      });
    } catch (err: any) {
      setWallet(prev => ({ ...prev, error: err.message || 'Failed to connect wallet' }));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setWallet({
      address: null,
      signer: null,
      chainId: null,
      isConnected: false,
      error: null,
    });
  };

  return (
    <div className="min-h-screen bg-[#030919] text-white flex flex-col font-sans selection:bg-primary selection:text-white">
      {/* Global Header (Stitch Xpansiv Theme) */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#030919]/80 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="h-20 max-w-7xl mx-auto px-6 flex items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-3 group text-left"
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <svg className="w-8 h-8 transform group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 36 36">
                  <defs>
                    <linearGradient id="logo-blue-header" x1="0%" x2="100%" y1="0%" y2="100%">
                      <stop offset="0%" stopColor="#0047FF" />
                      <stop offset="100%" stopColor="#00D2FF" />
                    </linearGradient>
                  </defs>
                  <path d="M18 2L32 10V26L18 34L4 26V10L18 2Z" fill="#040D21" stroke="url(#logo-blue-header)" strokeWidth="2" />
                  <path d="M18 8C13 13 13 23 18 28C23 23 23 13 18 8Z" fill="url(#logo-blue-header)" fillOpacity="0.35" stroke="#0047FF" strokeWidth="1.2" />
                  <circle cx="18" cy="18" fill="#00D2FF" r="3" />
                  <circle cx="10" cy="13" fill="#0047FF" r="1.5" />
                  <circle cx="26" cy="13" fill="#00D2FF" r="1.5" />
                  <circle cx="18" cy="30" fill="#0047FF" r="1.5" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-base font-extrabold tracking-wider text-white group-hover:text-glow-cyan transition-colors">
                  CARBONYX
                </span>
                <span className="font-mono-proof text-[9px] tracking-widest text-glow-cyan/90 uppercase font-semibold">
                  Protocol v2.4
                </span>
              </div>
            </button>

            <div className="hidden xl:block h-6 w-px bg-white/10" />

            {/* Navigation Tabs (Pill style matching Stitch) */}
            <nav className="hidden lg:flex items-center gap-1">
              {(
                [
                  { id: 'overview', label: 'Protocol Overview' },
                  { id: 'issuer', label: 'Issuer Studio' },
                  { id: 'verifier', label: 'Verifier Portal' },
                  { id: 'marketplace', label: 'Offset Marketplace' },
                  { id: 'explorer', label: 'Auditor Explorer' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`font-label-md text-sm font-medium px-4 py-2 rounded-full transition-all ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-white shadow-inner font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Right Header Status & Action */}
          <div className="flex items-center gap-4">
            {/* Live Block Beacon */}
            <div className="hidden 2xl:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-glow-cyan opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-glow-cyan" />
              </span>
              <span className="font-mono-proof text-[11px] text-slate-300">
                Mainnet Alpha <span className="text-white/30">•</span> <span className="text-glow-cyan font-mono-data">#19,842,109</span>
              </span>
            </div>

            {/* Consensus Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <span className="material-symbols-outlined text-glow-cyan text-[14px]">wifi_tethering</span>
              <span className="font-mono-proof text-[11px] text-slate-300 uppercase">
                Consensus: <span className="text-white font-semibold">99.98%</span>
              </span>
            </div>

            {/* Live Wallet Button */}
            {wallet.isConnected && wallet.address ? (
              <div className="flex items-center gap-2 bg-[#0047FF]/15 border border-[#0047FF]/40 rounded-full px-3.5 py-1.5">
                <div className="w-2 h-2 rounded-full bg-glow-cyan animate-pulse" />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-mono font-bold text-white">
                    {truncateAddress(wallet.address)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Chain ID: {wallet.chainId}
                  </span>
                </div>
                <button
                  onClick={handleDisconnect}
                  title="Disconnect"
                  className="ml-1 p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-[#0047FF] hover:bg-[#0038CC] text-white font-label-md text-sm font-semibold shadow-md shadow-blue-600/30 transition-all duration-200 disabled:opacity-50"
              >
                <span>{isConnecting ? 'Connecting...' : 'Launch App / Connect'}</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            )}

            <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Subnav */}
      <div className="lg:hidden fixed top-20 left-0 right-0 z-40 bg-[#030919]/95 border-b border-white/10 px-4 py-2 flex items-center gap-2 overflow-x-auto">
        {(
          [
            { id: 'overview', label: 'Protocol Overview' },
            { id: 'issuer', label: 'Issuer Studio' },
            { id: 'verifier', label: 'Verifier Portal' },
            { id: 'marketplace', label: 'Offset Marketplace' },
            { id: 'explorer', label: 'Auditor Explorer' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-white/15 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Spacing for fixed header */}
      <div className="h-20" />

      {/* Error Alert */}
      {wallet.error && (
        <div className="bg-[#EF4444]/15 border-b border-[#EF4444]/30 px-6 py-2.5 text-xs text-[#EF4444] flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{wallet.error}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {activeTab === 'overview' && (
          <HomePage
            wallet={wallet}
            onConnectWallet={handleConnect}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'issuer' && (
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            <IssuerStudio wallet={wallet} backendUrl={backendUrl} />
          </div>
        )}

        {activeTab === 'verifier' && (
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto space-y-4 shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                <UserCheck className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white">Verifier Staking Portal</h2>
              <p className="text-sm text-slate-400">
                Assigned verifiers audit anomalous low-confidence carbon credit bundles with 50% economic staking collateral slashing.
              </p>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Slated for Phase C3 Deployment
              </span>
            </div>
          </div>
        )}

        {activeTab === 'marketplace' && (
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto space-y-4 shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white">Verified Offset Marketplace & Escrow</h2>
              <p className="text-sm text-slate-400">
                Browse cryptographically verified ERC-721 carbon certificates with atomic custodial escrow settlement.
              </p>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Slated for Phase C3/C4 Deployment
              </span>
            </div>
          </div>
        )}

        {activeTab === 'explorer' && (
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto space-y-4 shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
                <Search className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white">Auditor Cryptographic Provenance Explorer</h2>
              <p className="text-sm text-slate-400">
                Verify Merkle proofs, historical emissions offsets, and on-chain lifecycle burn states across all issued certificates.
              </p>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Slated for Phase C4 Deployment
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Corporate High-Fidelity Footer (for non-overview tabs) */}
      {activeTab !== 'overview' && (
        <footer className="w-full bg-[#040D21] border-t border-white/10 text-slate-300 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
            {/* Col 1 & 2 */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#10B981] to-[#06B6D4] flex items-center justify-center font-bold text-black text-lg">
                  C
                </div>
                <span className="font-extrabold text-lg text-white tracking-wider">CARBONYX PROTOCOL</span>
              </div>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                Next-generation institutional settlement and cryptographic MRV infrastructure for environmental commodities. Ensuring immutability, zero double-counting, and real-time physical auditing for voluntary and compliance carbon instruments.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                  UNFCCC Art. 6 Compatible
                </span>
                <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                  Verra Verified Registry Bridge
                </span>
                <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                  Gold Standard Certified
                </span>
                <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                  I-REC Settlement Router
                </span>
              </div>
            </div>

            {/* Col 3: Core Protocols */}
            <div className="flex flex-col gap-2.5">
              <span className="font-mono text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
                Core Protocols
              </span>
              <button onClick={() => setActiveTab('overview')} className="text-xs text-left text-slate-400 hover:text-white transition-colors">
                Protocol Overview
              </button>
              <button onClick={() => setActiveTab('issuer')} className="text-xs text-left text-slate-400 hover:text-white transition-colors">
                Issuer Studio & DID
              </button>
              <button onClick={() => setActiveTab('verifier')} className="text-xs text-left text-slate-400 hover:text-white transition-colors">
                Verifier Staking Vault
              </button>
              <button onClick={() => setActiveTab('marketplace')} className="text-xs text-left text-slate-400 hover:text-white transition-colors">
                Offset Escrow Settlement
              </button>
              <button onClick={() => setActiveTab('explorer')} className="text-xs text-left text-slate-400 hover:text-white transition-colors">
                Merkle Provenance Explorer
              </button>
            </div>

            {/* Col 4: Formal Verification */}
            <div className="flex flex-col gap-2.5">
              <span className="font-mono text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
                Formal Verification
              </span>
              <div className="flex items-center gap-1.5 text-xs text-[#06B6D4]">
                <Shield className="w-3.5 h-3.5" />
                <span>CertiK Verified (Score 96.4)</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#10B981]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>OpenZeppelin Foundry v2.4</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Database className="w-3.5 h-3.5" />
                <span>Supabase Vault & IPFS</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Activity className="w-3.5 h-3.5" />
                <span>FastAPI Isolation Forest</span>
              </div>
            </div>

            {/* Col 5: Institutional Access */}
            <div className="flex flex-col gap-3">
              <span className="font-mono text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Institutional Access
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect high-throughput FIX API or sovereign Web3 wallets to execution pools.
              </p>
              <button
                onClick={wallet.isConnected ? () => setActiveTab('issuer') : handleConnect}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15 transition-all text-xs font-semibold border border-white/15"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>{wallet.isConnected ? 'Open Studio' : 'Connect Wallet'}</span>
              </button>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <span className="font-mono text-[11px]">
              © 2026 Carbonyx Protocol Foundation. All cryptographic rights reserved. Anchored to Ethereum & Arbitrum.
            </span>
            <div className="flex items-center gap-6 font-mono text-[11px]">
              <span>Terms of Settlement</span>
              <span>Commodity Disclaimers</span>
              <span>VVB Integrity Charter</span>
            </div>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
}
