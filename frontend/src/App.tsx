import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Sparkles, 
  Database, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  Wallet, 
  UserCheck, 
  ShoppingBag, 
  Search,
  Users,
  ChevronDown,
  Globe2
} from 'lucide-react';
import { connectMetaMask, truncateAddress, WalletState } from './lib/web3';
import { IssuerStudio } from './pages/IssuerStudio';
import VerifierPortal from './pages/VerifierPortal';
import Marketplace from './pages/Marketplace';
import { BaselineExplorer } from './pages/BaselineExplorer';

export const DEMO_PERSONAS = [
  {
    role: 'DEVELOPER',
    name: 'Alice (Project Developer)',
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    did: 'did:carbonyx:0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  },
  {
    role: 'VERIFIER',
    name: 'Bob (Staked Verifier & Auditor)',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    did: 'did:carbonyx:0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  },
  {
    role: 'BUYER',
    name: 'Acme CleanTech ESG (Corporate Buyer)',
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    did: 'did:carbonyx:0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
    badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30'
  },
  {
    role: 'ADMIN',
    name: 'Registry Relayer / Admin',
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    did: 'did:carbonyx:0x90f79bf6eb2c4f870365e785982e1f101e93b906',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'issuer' | 'explorer' | 'verifier' | 'marketplace'>('issuer');
  const [selectedPersona, setSelectedPersona] = useState(DEMO_PERSONAS[0]);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  const [wallet, setWallet] = useState<WalletState>({
    address: DEMO_PERSONAS[0].address,
    signer: null,
    chainId: 31337,
    isConnected: true,
    error: null,
  });

  const backendUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';

  const selectPersona = (persona: typeof DEMO_PERSONAS[0]) => {
    setSelectedPersona(persona);
    setWallet({
      address: persona.address,
      signer: null,
      chainId: 31337,
      isConnected: true,
      error: null
    });
    setShowPersonaMenu(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-sans selection:bg-[#10B981]/30 selection:text-[#10B981]">
      {/* Global Header */}
      <header className="border-b border-white/10 px-4 md:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3 backdrop-blur-glass bg-[#111827]/80 sticky top-0 z-50">
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#10B981] to-[#06B6D4] flex items-center justify-center font-bold text-black text-xl shadow-lg shadow-[#10B981]/20">
              C
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                CARBONYX
              </span>
              <span className="ml-2 text-[10px] uppercase px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] font-mono border border-[#10B981]/30 hidden sm:inline-block">
                Patent Protocol C3
              </span>
            </div>
          </div>

          {/* Persona Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className="flex items-center gap-2 bg-slate-900 border border-slate-700 hover:border-emerald-500/50 px-3 py-1.5 rounded-xl text-xs transition-all shadow"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-white truncate max-w-[140px] sm:max-w-[200px]">
                {selectedPersona.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showPersonaMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-950 border border-slate-800 rounded-2xl p-2 shadow-2xl z-50 space-y-1 backdrop-blur-xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">
                  Active Demo Persona
                </div>
                {DEMO_PERSONAS.map((p) => (
                  <button
                    key={p.role}
                    onClick={() => selectPersona(p)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start justify-between gap-2 ${
                      selectedPersona.role === p.role 
                        ? 'bg-emerald-950/60 border border-emerald-500/30 text-white' 
                        : 'hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-white">
                        {p.name}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-400 truncate mt-0.5">
                        {truncateAddress(p.address)}
                      </div>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-bold border ${p.badgeColor}`}>
                      {p.role}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Persona Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto max-w-full">
          {(['issuer', 'explorer', 'verifier', 'marketplace'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-[#10B981] to-[#06B6D4] text-black font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab === 'issuer' && '🌱 Issuer Studio'}
              {tab === 'explorer' && '🔍 Baseline Explorer'}
              {tab === 'verifier' && '🛡️ Verifier Portal'}
              {tab === 'marketplace' && '🛒 Marketplace'}
            </button>
          ))}
        </nav>

        {/* Identity Pill */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <div className="flex flex-col text-left">
              <span className="text-xs font-mono font-bold text-emerald-300">
                {truncateAddress(wallet.address || selectedPersona.address)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {selectedPersona.role} Account
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        {activeTab === 'issuer' && (
          <IssuerStudio 
            wallet={wallet} 
            backendUrl={backendUrl} 
            onNavigateToExplorer={() => setActiveTab('explorer')}
          />
        )}

        {activeTab === 'explorer' && (
          <BaselineExplorer wallet={wallet} backendUrl={backendUrl} />
        )}

        {activeTab === 'verifier' && (
          <VerifierPortal walletAddress={wallet.address || selectedPersona.address} />
        )}

        {activeTab === 'marketplace' && (
          <Marketplace walletAddress={wallet.address || selectedPersona.address} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-8 py-4 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span>Carbonyx Protocol • Patent-Pending Multi-Source MRV</span>
        </div>
        <div>
          <span>Foundry Contracts • Supabase Vault • FastAPI ML • React 18</span>
        </div>
      </footer>
    </div>
  );
}
