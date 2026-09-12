import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Database,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Shield,
  ShieldCheck,
  Sprout,
  Store,
  UserRound,
  Wallet
} from 'lucide-react';
import { connectMetaMask, truncateAddress, WalletState } from './lib/web3';
import { IssuerStudio } from './pages/IssuerStudio';
import { HomePage } from './pages/HomePage';
import VerifierPortal from './pages/VerifierPortal';
import Marketplace from './pages/Marketplace';
import AuditorExplorer from './pages/AuditorExplorer';
import { BaselineExplorer } from './pages/BaselineExplorer';
import MyRegistry from './pages/MyRegistry';
import LoginPage from './pages/LoginPage';
import Sidebar from './components/Sidebar';
import { apiFetch, AuthSession, AuthUser, clearAuthToken, getAuthToken, readApiJson } from './lib/auth';

type ActiveTab = 'overview' | 'issuer' | 'my-registry' | 'baseline' | 'verifier' | 'marketplace' | 'portfolio' | 'explorer';

const rolePortal: Record<AuthUser['role'], { label: string; home: ActiveTab; tabs: ActiveTab[] }> = {
  PROJECT_PROPONENT: { label: 'Project Proponent', home: 'issuer', tabs: ['issuer', 'my-registry', 'baseline'] },
  INDEPENDENT_VERIFIER: { label: 'Independent Verifier & Auditor', home: 'verifier', tabs: ['verifier'] },
  CORPORATE_BUYER: { label: 'Corporate ESG Buyer', home: 'marketplace', tabs: ['marketplace', 'portfolio', 'baseline'] },
  REGULATOR_AUDITOR: { label: 'Regulator & Independent Auditor', home: 'explorer', tabs: ['baseline', 'explorer'] }
};

const navigationTabs: Array<{
  id: ActiveTab;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'overview', label: 'Protocol Overview', description: 'Network activity and controls', icon: LayoutDashboard },
  { id: 'issuer', label: 'Project Studio', description: 'Register and submit evidence', icon: Sprout },
  { id: 'my-registry', label: 'My Registry', description: 'Projects, objections and revisions', icon: Database },
  { id: 'baseline', label: 'Baseline Registry', description: 'Observe and inspect projects', icon: Globe2 },
  { id: 'verifier', label: 'Verifier Portal', description: 'Stake and review anomalies', icon: ShieldCheck },
  { id: 'marketplace', label: 'Buyer Marketplace', description: 'Discover and acquire credits', icon: Store },
  { id: 'portfolio', label: 'My Portfolio', description: 'Holdings and retirements', icon: BriefcaseBusiness },
  { id: 'explorer', label: 'Audit Explorer', description: 'Trace protocol provenance', icon: Search }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [authEntryMode, setAuthEntryMode] = useState<'login' | 'signup'>('login');
  const [isPublicScrolled, setIsPublicScrolled] = useState(false);
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    signer: null,
    chainId: null,
    isConnected: false,
    error: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserMenuOpen]);

  const backendUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5005';

  useEffect(() => {
    const restoreSession = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsRestoringSession(false);
        return;
      }
      try {
        const response = await apiFetch(`${backendUrl}/api/auth/session`);
        if (!response.ok) throw new Error('Session expired');
        const data = await readApiJson<{ user: AuthUser }>(response);
        setAuthUser(data.user);
        setActiveTab(rolePortal[data.user.role as AuthUser['role']].home);
      } catch {
        clearAuthToken();
      } finally {
        setIsRestoringSession(false);
      }
    };

    restoreSession();
    const expireSession = () => {
      setAuthUser(null);
      setActiveTab('overview');
    };
    window.addEventListener('carbonyx:session-expired', expireSession);
    return () => window.removeEventListener('carbonyx:session-expired', expireSession);
  }, [backendUrl]);

  useEffect(() => {
    const onScroll = () => setIsPublicScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Check if wallet was already connected
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

  const handleLogin = (session: AuthSession) => {
    setAuthUser(session.user);
    setShowLogin(false);
    setActiveTab(rolePortal[session.user.role].home);
  };

  const handleLogout = async () => {
    try {
      await apiFetch(`${backendUrl}/api/auth/logout`, { method: 'POST' });
    } catch {
      // The local session is cleared even when the API is unavailable.
    }
    clearAuthToken();
    handleDisconnect();
    setAuthUser(null);
    setShowLogin(false);
    setActiveTab('overview');
  };

  if (isRestoringSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f7] text-[#222222]">
        <div className="flex items-center gap-3 rounded-full border border-[#dddddd] bg-white px-5 py-3 text-sm font-semibold shadow-sm">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#15ed48]" />
          Restoring secure session…
        </div>
      </div>
    );
  }

  if (!authUser && showLogin) {
    return <LoginPage onLogin={handleLogin} onBack={() => setShowLogin(false)} initialMode={authEntryMode} />;
  }

  if (!authUser) {
    return (
      <div className="oddox-public-theme min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-primary selection:text-white">
        <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${
          isPublicScrolled
            ? 'bg-white/95 border-card-stroke shadow-sm'
            : 'bg-black/20 border-white/10'
        }`}>
          <div className="h-[68px] max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-5">
            <button className="flex items-center gap-2 group text-left" aria-label="Carbonyx home" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img
                src="/logo.png"
                alt="Carbonyx Logo"
                className={`h-8 w-8 object-contain transition-transform group-hover:scale-105 ${isPublicScrolled ? '' : 'brightness-0 invert'}`}
              />
              <span className={`text-xl font-extrabold tracking-tight transition-colors ${isPublicScrolled ? 'text-[#222222]' : 'text-white'}`}>Carbonyx</span>
            </button>

            <nav className="hidden items-center gap-1 md:flex">
              {[
                ['#about', 'About'],
                ['#protocol', 'Protocol'],
                ['#roles', 'Roles'],
                ['#security', 'Security']
              ].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                    isPublicScrolled
                      ? 'text-[#6a6a6a] hover:bg-[#f7f7f7] hover:text-[#222222]'
                      : 'text-white/85 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  {label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button
                onClick={() => { setAuthEntryMode('login'); setShowLogin(true); }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  isPublicScrolled
                    ? 'text-[#222222] hover:bg-[#f7f7f7]'
                    : 'text-white hover:bg-white/15'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => { setAuthEntryMode('signup'); setShowLogin(true); }}
                className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold shadow-sm transition-all hover:shadow-md ${
                  isPublicScrolled
                    ? 'border-[#dddddd] bg-white text-[#222222] hover:bg-[#f7f7f7]'
                    : 'border-white/30 bg-white/15 text-white backdrop-blur hover:bg-white/25'
                }`}
              >
                <Menu className="h-4 w-4" />
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-white ${isPublicScrolled ? 'bg-[#222222]' : 'bg-white/30'}`}>
                  <UserRound className="h-3.5 w-3.5" />
                </span>
                <span className="hidden sm:inline">Sign up</span>
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 w-full">
          <HomePage
            wallet={wallet}
            onConnectWallet={() => { setAuthEntryMode('login'); setShowLogin(true); }}
            onNavigateTab={() => { setAuthEntryMode('login'); setShowLogin(true); }}
          />
        </main>
      </div>
    );
  }

  const portal = rolePortal[authUser.role];
  const visibleTabs = portal.tabs
    .map((tabId) => navigationTabs.find((tab) => tab.id === tabId))
    .filter((tab): tab is (typeof navigationTabs)[number] => Boolean(tab));
  const navigateTo = (tab: ActiveTab) => {
    if (portal.tabs.includes(tab)) setActiveTab(tab);
  };

  return (
    <div className="oddox-dashboard-theme min-h-screen bg-[#030919] text-white flex flex-col font-sans selection:bg-primary selection:text-white">
      {/* Upper navbar identical in structure and brand to home page. */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#dddddd] bg-white/95 backdrop-blur transition-all">
        <div className="h-[68px] max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-5">
          <div className="flex items-center gap-8">
            <button
              onClick={() => navigateTo(portal.home)}
              className="flex items-center gap-2 group text-left"
              aria-label="Carbonyx home"
            >
              <img
                src="/logo.png"
                alt="Carbonyx Logo"
                className="h-8 w-8 object-contain transition-transform group-hover:scale-105"
              />
              <span className="text-xl font-extrabold tracking-tight text-[#222222]">Carbonyx</span>
            </button>
          </div>

          {/* Wallet and account controls. */}
          <div className="flex items-center gap-4">
            <div className="hidden 2xl:flex items-center gap-2 rounded-full bg-[#f7f7f7] px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-glow-cyan opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-glow-cyan" />
              </span>
              <span className="font-mono-proof text-[11px] text-[#6a6a6a]">
                Mainnet Alpha <span className="text-[#b0b0b0]">•</span> <span className="text-[#00a699] font-mono-data">#19,842,109</span>
              </span>
            </div>

            {wallet.isConnected && wallet.address ? (
              <div className="hidden items-center gap-2 rounded-full border border-[#dddddd] bg-white px-3 py-1.5 shadow-sm md:flex">
                <span className="h-2 w-2 rounded-full bg-[#00a699]" />
                <span className="text-xs font-mono font-bold text-[#222222]">{truncateAddress(wallet.address)}</span>
                <button
                  onClick={handleDisconnect}
                  title="Disconnect"
                  className="ml-1 rounded-full p-1 text-[#6a6a6a] transition hover:bg-[#f7f7f7] hover:text-[#222222]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="inline-flex items-center gap-2 rounded-full bg-[#15ed48] px-4 py-2 text-sm font-bold text-slate-950 shadow-sm transition-colors hover:bg-[#12d23f] disabled:opacity-50"
              >
                <Wallet className="h-4 w-4" />
                <span className="hidden md:inline">{isConnecting ? 'Connecting...' : 'Connect wallet'}</span>
              </button>
            )}

            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
                className="flex items-center gap-2 rounded-full border border-[#dddddd] bg-white px-2 py-1.5 text-sm font-semibold text-[#222222] shadow-sm transition-all hover:shadow-md hover:border-[#b0b0b0] focus:outline-none focus:ring-2 focus:ring-[#15ed48]/50"
              >
                <Menu className="h-5 w-5 text-[#6a6a6a]" />
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#222222] text-white">
                  <UserRound className="h-4 w-4" />
                </span>
                <span className="hidden max-w-[120px] truncate pr-2 xl:inline">{authUser.displayName}</span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#222222] text-white font-bold text-sm">
                        {authUser.displayName.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 truncate">{authUser.displayName}</p>
                        <p className="text-xs text-slate-500 truncate">{authUser.organization || authUser.loginId}</p>
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60 truncate">
                        {portal.label}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 hover:text-rose-700"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Shared role-aware workspace sidebar with inverted curved tabs. */}
      <Sidebar
        activeItem={activeTab}
        onSelectItem={(tab) => navigateTo(tab)}
        navItems={visibleTabs}
        pendingApprovalCount={authUser.role === 'INDEPENDENT_VERIFIER' ? 3 : 0}
        authUser={authUser}
        roleLabel={portal.label}
        walletAddress={wallet.address}
        isWalletConnected={wallet.isConnected}
        showUserDetails={true}
        onLogout={handleLogout}
      />

      {/* Mobile Subnav */}
      <div className="lg:hidden fixed top-[68px] left-0 right-0 z-40 border-b border-[#dddddd] bg-white px-4 py-2 flex items-center gap-2 overflow-x-auto">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => navigateTo(tab.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-50 font-semibold text-emerald-800'
                  : 'text-[#6a6a6a] hover:text-[#222222]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Spacing for fixed header */}
      <div className="h-[109px] lg:h-[68px]" />

      {/* Error Alert */}
      {wallet.error && (
        <div className="bg-[#EF4444]/15 border-b border-[#EF4444]/30 px-6 py-2.5 text-xs text-[#EF4444] flex items-center justify-center gap-2 lg:ml-64">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{wallet.error}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full lg:pl-64">
        {activeTab === 'overview' && (
          <HomePage
            wallet={wallet}
            onConnectWallet={handleConnect}
            onNavigateTab={navigateTo}
          />
        )}

        {activeTab === 'issuer' && (
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            {wallet.isConnected && wallet.address ? (
              <IssuerStudio
                wallet={wallet}
                backendUrl={backendUrl}
                onNavigateToRegistry={() => navigateTo('my-registry')}
              />
            ) : (
              <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-[#00a699]/20 bg-white/5 p-8 text-center shadow-[0_24px_80px_rgba(21,237,72,0.15)] backdrop-blur-xl md:p-12">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#15ed48]/20 text-[#15ed48]">
                  <Wallet className="h-7 w-7" />
                </div>
                <div className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#00a699]">Identity verified · Step 2 of 2</div>
                <h2 className="mt-3 font-headline-md text-2xl font-bold md:text-3xl">Connect the project owner wallet</h2>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-400">
                  Signed in as {authUser.displayName} from {authUser.organization}. Connect the wallet that will own the project DID and receive its policy-approved ERC-721 credits.
                </p>
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="mx-auto mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#15ed48] px-7 text-sm font-bold text-slate-950 shadow-[0_8px_28px_rgba(21,237,72,0.35)] transition hover:bg-[#12d23f] disabled:opacity-50"
                >
                  <Wallet className="h-4 w-4" />
                  {isConnecting ? 'Connecting wallet…' : 'Connect owner wallet'}
                </button>
                <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-5 font-mono text-[10px] text-slate-500">
                  <span>01 · DID owner</span>
                  <span>02 · Evidence signer</span>
                  <span>03 · NFT recipient</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'my-registry' && (
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            <MyRegistry wallet={wallet} backendUrl={backendUrl} />
          </div>
        )}

        {activeTab === 'baseline' && (
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            <BaselineExplorer
              wallet={wallet}
              backendUrl={backendUrl}
              canChallenge={authUser.role === 'REGULATOR_AUDITOR' || authUser.role === 'CORPORATE_BUYER'}
            />
          </div>
        )}

        {activeTab === 'verifier' && (
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            <VerifierPortal walletAddress={wallet.address} />
          </div>
        )}

        {activeTab === 'marketplace' && (
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            <Marketplace walletAddress={wallet.address} view="marketplace" />
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            <Marketplace walletAddress={wallet.address} view="portfolio" />
          </div>
        )}

        {activeTab === 'explorer' && (
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            <AuditorExplorer />
          </div>
        )}
      </main>

      {/* Corporate High-Fidelity Footer (for non-overview tabs) */}
      {activeTab !== 'overview' && (
        <footer className="w-full bg-[#040D21] border-t border-white/10 text-slate-300 mt-12 lg:pl-64">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
            {/* Col 1 & 2 */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="Carbonyx Logo"
                  className="h-8 w-8 object-contain brightness-0 invert"
                />
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
              {visibleTabs.map((tab) => (
                <button key={tab.id} onClick={() => navigateTo(tab.id)} className="text-xs text-left text-slate-400 hover:text-white transition-colors">
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Col 4: Formal Verification */}
            <div className="flex flex-col gap-2.5">
              <span className="font-mono text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
                Formal Verification
              </span>
              <div className="flex items-center gap-1.5 text-xs text-[#00a699]">
                <Shield className="w-3.5 h-3.5" />
                <span>CertiK Verified (Score 96.4)</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#008a05]">
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
                onClick={wallet.isConnected ? () => navigateTo(portal.home) : handleConnect}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15 transition-all text-xs font-semibold border border-white/15"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>{wallet.isConnected ? 'Open My Portal' : 'Connect Wallet'}</span>
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
