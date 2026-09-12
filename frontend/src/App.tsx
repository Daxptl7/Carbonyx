import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, Database, Layers, CheckCircle2, AlertCircle, LogOut, Wallet, UserCheck, ShoppingBag, Search } from 'lucide-react';
import { connectMetaMask, truncateAddress, WalletState } from './lib/web3';
import { IssuerStudio } from './pages/IssuerStudio';

export default function App() {
  const [activeTab, setActiveTab] = useState<'issuer' | 'verifier' | 'marketplace' | 'explorer'>('issuer');
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
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-sans selection:bg-[#10B981]/30 selection:text-[#10B981]">
      {/* Global Header */}
      <header className="border-b border-white/10 px-6 md:px-8 py-4 flex items-center justify-between backdrop-blur-glass bg-[#111827]/80 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#10B981] to-[#06B6D4] flex items-center justify-center font-bold text-black text-xl shadow-lg shadow-[#10B981]/20">
            C
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              CARBONYX
            </span>
            <span className="ml-2 text-xs uppercase px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] font-mono border border-[#10B981]/30 hidden sm:inline-block">
              Patent-Verified
            </span>
          </div>
        </div>

        {/* Persona Tabs */}
        <nav className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
          {(['issuer', 'verifier', 'marketplace', 'explorer'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-[#10B981] to-[#06B6D4] text-black font-semibold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab === 'issuer' && 'Issuer Studio'}
              {tab === 'verifier' && 'Verifier Portal'}
              {tab === 'marketplace' && 'Marketplace'}
              {tab === 'explorer' && 'Auditor Explorer'}
            </button>
          ))}
        </nav>

        {/* Live MetaMask Connect Button */}
        <div className="flex items-center gap-2">
          {wallet.isConnected && wallet.address ? (
            <div className="flex items-center gap-2 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
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
                className="ml-1 p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#06B6D4] hover:opacity-90 text-black text-sm font-semibold flex items-center gap-2 shadow-lg shadow-[#10B981]/20 transition-all disabled:opacity-50"
            >
              <Wallet className="w-4 h-4" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </header>

      {/* Error Alert */}
      {wallet.error && (
        <div className="bg-[#EF4444]/15 border-b border-[#EF4444]/30 px-6 py-2.5 text-xs text-[#EF4444] flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{wallet.error}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {activeTab === 'issuer' && (
          <IssuerStudio wallet={wallet} backendUrl={backendUrl} />
        )}

        {activeTab === 'verifier' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto space-y-4">
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
        )}

        {activeTab === 'marketplace' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto space-y-4">
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
        )}

        {activeTab === 'explorer' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto space-y-4">
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
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-8 py-5 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span>Carbonyx Protocol • 12-Module Process Architecture</span>
        </div>
        <div>
          <span>Foundry Contracts • Supabase Vault • FastAPI ML • React Web3</span>
        </div>
      </footer>
    </div>
  );
}
