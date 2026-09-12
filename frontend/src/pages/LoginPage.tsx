import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  Eye,
  EyeOff,
  Landmark,
  LockKeyhole,
  ScanSearch,
  ShieldCheck,
  ShoppingCart
} from 'lucide-react';
import { AuthSession, ProtocolRole, readApiJson, saveAuthToken } from '../lib/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';

const roleCards: Array<{
  role: ProtocolRole;
  title: string;
  subtitle: string;
  stage: string;
  loginId: string;
  password: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  {
    role: 'PROJECT_PROPONENT',
    title: 'Project Proponent',
    subtitle: 'Register projects, commit dMRV evidence and mint verified credits.',
    stage: 'DID → Evidence → Risk Gate → Mint',
    loginId: 'proponent.demo',
    password: 'Carbon@2026',
    icon: Building2,
    color: '#00a699'
  },
  {
    role: 'INDEPENDENT_VERIFIER',
    title: 'Independent Verifier',
    subtitle: 'Stake collateral and decide escalated anomaly bundles.',
    stage: 'Stake → Inspect → Sign / Reject',
    loginId: 'verifier.demo',
    password: 'Verify@2026',
    icon: ShieldCheck,
    color: '#F59E0B'
  },
  {
    role: 'CORPORATE_BUYER',
    title: 'Corporate Buyer',
    subtitle: 'Acquire escrow-protected credits and retire them on-chain.',
    stage: 'Discover → Escrow → Hold → Retire',
    loginId: 'buyer.demo',
    password: 'Buyer@2026',
    icon: ShoppingCart,
    color: '#8B5CF6'
  },
  {
    role: 'REGULATOR_AUDITOR',
    title: 'Regulator & Auditor',
    subtitle: 'Trace provenance, disputes, revocations and verifier penalties.',
    stage: 'Search → Prove → Investigate → Resolve',
    loginId: 'auditor.demo',
    password: 'Audit@2026',
    icon: Landmark,
    color: '#008a05'
  }
];

export default function LoginPage({
  onLogin,
  onBack,
  initialMode = 'login'
}: {
  onLogin: (session: AuthSession) => void;
  onBack?: () => void;
  initialMode?: 'login' | 'signup';
}) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [organization, setOrganization] = useState('');
  const [signupRole, setSignupRole] = useState<ProtocolRole>('PROJECT_PROPONENT');
  const [accessCode, setAccessCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const showDemoAccounts = import.meta.env.VITE_SHOW_DEMO_ACCOUNTS !== 'false';

  const chooseDemo = (id: string, demoPassword: string) => {
    setMode('login');
    setLoginId(id);
    setPassword(demoPassword);
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/${mode === 'login' ? 'login' : 'signup'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'login'
            ? { loginId, password }
            : { loginId, password, displayName, organization, role: signupRole, accessCode }
        )
      });
      const data = await readApiJson<{ token: string; user: AuthSession['user']; error?: string }>(response);
      if (!response.ok) throw new Error(data.error || (mode === 'login' ? 'Sign in failed' : 'Sign up failed'));
      saveAuthToken(data.token);
      onLogin({ token: data.token, user: data.user });
    } catch (err: any) {
      setError(err.message || 'Authentication service is unavailable');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="oddox-auth-theme relative min-h-screen overflow-x-hidden bg-[#030919] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(21,237,72,0.24),transparent_35%),radial-gradient(circle_at_78%_82%,rgba(0,166,153,0.12),transparent_34%)]" />
      <div className="absolute left-1/2 top-[44%] h-px w-[80vw] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#00a699]/50 to-transparent shadow-[0_0_70px_24px_rgba(0,166,153,0.08)]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1440px] flex-col px-5 py-6 lg:px-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Carbonyx Logo"
              className="h-9 w-9 object-contain brightness-0 invert"
            />
            <div>
              <div className="font-headline-sm text-lg font-extrabold tracking-[0.12em]">CARBONYX</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#00a699]">Identity Gateway</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300 sm:flex">
              <ShieldCheck className="h-3.5 w-3.5 text-[#008a05]" />
              Role authentication · wallet-signed transactions
            </div>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to exchange
              </button>
            )}
          </div>
        </header>

        <div className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1.1fr_0.9fr]">
          <section>
            <div className="mb-4 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#00a699]">
              <ScanSearch className="h-4 w-4" />
              Evidence-first environmental markets
            </div>
            <h1 className="max-w-3xl font-headline-lg text-4xl font-bold leading-[1.08] tracking-tight md:text-6xl">
              One identity. One role. A complete on-chain chain of custody.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
              Your Carbonyx ID determines which protocol module you can operate. A connected wallet then signs the blockchain actions belonging to that role.
            </p>

            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              {roleCards.map((role) => {
                const Icon = role.icon;
                const selected = mode === 'signup' ? signupRole === role.role : loginId === role.loginId;
                return (
                  <button
                    key={role.role}
                    type="button"
                    onClick={() => {
                      if (mode === 'signup') {
                        setSignupRole(role.role);
                        setError('');
                      } else if (showDemoAccounts) {
                        chooseDemo(role.loginId, role.password);
                      }
                    }}
                    className={`group rounded-2xl border p-4 text-left transition-all ${
                      selected ? 'border-[#15ed48]/60 bg-[#15ed48]/10 shadow-sm' : 'border-white/10 bg-white/5 hover:border-[#00a699]/50 hover:bg-white/10'
                    } ${mode === 'signup' || showDemoAccounts ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl p-2.5" style={{ backgroundColor: `${role.color}18`, color: role.color }}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-headline-sm text-sm font-bold">{role.title}</h2>
                        <p className="mt-1 text-xs leading-5 text-slate-400">{role.subtitle}</p>
                      </div>
                    </div>
                    <div className="mt-3 border-t border-white/10 pt-3 font-mono text-[10px] text-slate-400">
                      {role.stage}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {mode === 'signup'
                ? 'Select the module your new identity should access.'
                : showDemoAccounts
                  ? 'Demo mode: select a role card to load its test credentials.'
                  : 'Your assigned credentials determine the accessible module.'}
            </p>
          </section>

          <section className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-[#081534]/80 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
            <div className="mb-6 grid grid-cols-2 rounded-full border border-[#dddddd] bg-[#f7f7f7] p-1">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === 'login' ? 'bg-white text-[#222222] shadow-sm' : 'text-[#6a6a6a] hover:text-[#222222]'}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setLoginId(''); setPassword(''); setError(''); }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === 'signup' ? 'bg-white text-[#222222] shadow-sm' : 'text-[#6a6a6a] hover:text-[#222222]'}`}
              >
                Create account
              </button>
            </div>

            <div className="mb-7">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#15ed48] text-slate-950 shadow-[0_8px_30px_rgba(21,237,72,0.35)]">
                <LockKeyhole className="h-6 w-6" />
              </div>
              <h2 className="font-headline-md text-2xl font-bold">{mode === 'login' ? 'Protocol sign in' : 'Create protocol identity'}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {mode === 'login'
                  ? 'Credentials assign permissions. They never replace your wallet signature.'
                  : 'Create an application identity, then connect your wallet inside the assigned portal.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'signup' && (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300">Name (optional)</span>
                      <input
                        autoComplete="name"
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        placeholder="Your name"
                        className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#00a699]/70 focus:ring-2 focus:ring-[#00a699]/15"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300">Organization (optional)</span>
                      <input
                        autoComplete="organization"
                        value={organization}
                        onChange={(event) => setOrganization(event.target.value)}
                        placeholder="Organization or DAO"
                        className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#00a699]/70 focus:ring-2 focus:ring-[#00a699]/15"
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300">Protocol role</span>
                    <select
                      value={signupRole}
                      onChange={(event) => {
                        const newRole = event.target.value as ProtocolRole;
                        setSignupRole(newRole);
                        if (newRole === 'INDEPENDENT_VERIFIER') setAccessCode('VERIFIER-2026');
                        else if (newRole === 'REGULATOR_AUDITOR') setAccessCode('AUDITOR-2026');
                        else setAccessCode('');
                      }}
                      className="h-12 w-full rounded-xl border border-white/10 bg-[#071027] px-4 text-sm text-white outline-none transition focus:border-[#00a699]/70 focus:ring-2 focus:ring-[#00a699]/15"
                    >
                      {roleCards.map((role) => <option key={role.role} value={role.role}>{role.title}</option>)}
                    </select>
                  </label>
                </>
              )}
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300">Username / User ID</span>
                <input
                  autoComplete="username"
                  autoFocus
                  value={loginId}
                  onChange={(event) => setLoginId(event.target.value)}
                  placeholder={mode === 'login' ? 'Enter username or ID' : 'Choose a username (min 2 letters/numbers)'}
                  className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#00a699]/70 focus:ring-2 focus:ring-[#00a699]/15"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300">Password</span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter password (min 3 chars)"
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#00a699]/70 focus:ring-2 focus:ring-[#00a699]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              {mode === 'signup' && (signupRole === 'INDEPENDENT_VERIFIER' || signupRole === 'REGULATOR_AUDITOR') && (
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300">Accreditation access code</span>
                  <input
                    value={accessCode}
                    onChange={(event) => setAccessCode(event.target.value)}
                    placeholder="Access code"
                    className="h-12 w-full rounded-xl border border-amber-400/20 bg-black/25 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/15"
                  />
                  {showDemoAccounts && (
                    <span className="mt-1 block font-mono text-[10px] text-amber-300/70">
                      Auto-filled code: {signupRole === 'INDEPENDENT_VERIFIER' ? 'VERIFIER-2026' : 'AUDITOR-2026'}
                    </span>
                  )}
                </label>
              )}

              {error && (
                <div role="alert" className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !loginId.trim() || !password}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#15ed48] text-sm font-bold text-slate-950 shadow-[0_8px_24px_rgba(21,237,72,0.35)] transition hover:bg-[#12d23f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting
                  ? mode === 'login' ? 'Verifying identity…' : 'Creating identity…'
                  : mode === 'login' ? 'Continue to secure portal' : 'Create account and continue'}
                {!isSubmitting && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <div className="mt-6 flex items-start gap-3 border-t border-white/10 pt-5 text-xs leading-5 text-slate-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-[#008a05]" />
              Role permissions are enforced by the API. On-chain policy gates still independently verify every mint, audit, escrow and retirement action.
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
