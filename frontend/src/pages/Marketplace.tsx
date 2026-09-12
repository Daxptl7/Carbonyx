import React, { useState, useEffect } from 'react';
import { BriefcaseBusiness, Flame, RefreshCw, CheckCircle2, ShieldCheck, Store, Wallet, Eye, Layers, BarChart3 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiFetch, readApiJson } from '../lib/auth';
import { ActivityBarChart, ActivityDonutChart } from '../components/ActivityCharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';

export default function Marketplace({
  walletAddress,
  view = 'marketplace'
}: {
  walletAddress: string | null;
  view?: 'marketplace' | 'portfolio';
}) {
  const [credits, setCredits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<any | null>(null);
  const [detailsCredit, setDetailsCredit] = useState<any | null>(null);
  const [retirementReason, setRetirementReason] = useState('Scope 1 & 2 Corporate Carbon Neutrality 2026');
  const [retiredCertificate, setRetiredCertificate] = useState<any | null>(null);
  const [escrowDeposit, setEscrowDeposit] = useState(0.15);
  const [pendingEscrow, setPendingEscrow] = useState<any | null>(null);
  const [isSubmittingEscrow, setIsSubmittingEscrow] = useState(false);
  const [isRetiring, setIsRetiring] = useState(false);
  const [actionError, setActionError] = useState('');
  const isPortfolio = view === 'portfolio';

  const fetchCredits = async () => {
    setIsLoading(true);
    if (isPortfolio && !walletAddress) {
      setCredits([]);
      setIsLoading(false);
      return;
    }
    try {
      const portfolioQuery = isPortfolio && walletAddress
        ? `?scope=portfolio&ownerAddress=${encodeURIComponent(walletAddress)}`
        : '';
      const res = await apiFetch(`${API_URL}/api/marketplace/credits${portfolioQuery}`);
      const data = await readApiJson<any>(res);
      if (!res.ok) throw new Error(data.error || 'Unable to load marketplace credits');
      if (data.credits) {
        setCredits(data.credits);
      }
    } catch (err) {
      console.error('Failed to fetch marketplace credits:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, [isPortfolio, walletAddress]);

  const handleRetire = async (credit: any) => {
    setIsRetiring(true);
    try {
      const res = await apiFetch(`${API_URL}/api/marketplace/retire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: credit.token_id,
          retirementReason,
          ownerAddress: walletAddress || credit.current_owner
        })
      });
      const data = await readApiJson<any>(res);
      if (!res.ok) throw new Error(data.error || 'Unable to retire credit');
      if (data.success) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
        setRetiredCertificate({
          ...credit,
          retirement_reason: retirementReason,
          retired_at: new Date().toISOString()
        });
        setDetailsCredit(null);
        await fetchCredits();
      }
    } catch (err: any) {
      alert(`Retirement failed: ${err.message}`);
    } finally {
      setIsRetiring(false);
    }
  };

  const handleEscrowBuy = async () => {
    if (!selectedCredit || !walletAddress) {
      setActionError('Connect the corporate buyer wallet before opening escrow.');
      return;
    }

    setIsSubmittingEscrow(true);
    setActionError('');
    try {
      const response = await apiFetch(`${API_URL}/api/marketplace/escrow/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: selectedCredit.token_id,
          buyerAddress: walletAddress,
          depositAmount: escrowDeposit
        })
      });
      const data = await readApiJson<any>(response);
      if (!response.ok) throw new Error(data.error || 'Unable to open escrow');
      setPendingEscrow({ ...data.escrow, credit: selectedCredit });
      setSelectedCredit(null);
      await fetchCredits();
    } catch (error: any) {
      setActionError(error.message || 'Unable to open escrow');
    } finally {
      setIsSubmittingEscrow(false);
    }
  };

  const handleEscrowRelease = async () => {
    if (!pendingEscrow?.escrow_id) return;
    setIsSubmittingEscrow(true);
    setActionError('');
    try {
      const response = await apiFetch(`${API_URL}/api/marketplace/escrow/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escrowId: pendingEscrow.escrow_id })
      });
      const data = await readApiJson<any>(response);
      if (!response.ok) throw new Error(data.error || 'Unable to settle escrow');
      setPendingEscrow(null);
      await fetchCredits();
    } catch (error: any) {
      setActionError(error.message || 'Unable to settle escrow');
    } finally {
      setIsSubmittingEscrow(false);
    }
  };

  const visibleCredits = credits.filter((credit) => {
    const ownedByConnectedWallet = Boolean(
      walletAddress && credit.current_owner?.toLowerCase() === walletAddress.toLowerCase()
    );
    return isPortfolio ? ownedByConnectedWallet : !ownedByConnectedWallet;
  });

  const activeHoldings = visibleCredits.filter((credit) => credit.status !== 'RETIRED');
  const retiredHoldings = visibleCredits.filter((credit) => credit.status === 'RETIRED');
  const totalPortfolioTonnage = visibleCredits.reduce(
    (total, credit) => total + (Number(credit.co2_tonnage) || 0),
    0
  );
  const retiredTonnage = retiredHoldings.reduce(
    (total, credit) => total + (Number(credit.co2_tonnage) || 0),
    0
  );
  const volumeByVintage = Object.entries(
    visibleCredits.reduce<Record<string, number>>((totals, credit) => {
      const vintage = String(credit.vintage_year || 'Unknown');
      totals[vintage] = (totals[vintage] || 0) + (Number(credit.co2_tonnage) || 0);
      return totals;
    }, {})
  )
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-6)
    .map(([label, value], index) => ({
      label,
      value,
      color: ['#15ed48', '#00a699', '#38bdf8', '#8b5cf6', '#f59e0b', '#ef4444'][index % 6]
    }));
  const portfolioLifecycle = [
    { label: 'Active holdings', value: activeHoldings.length, color: '#15ed48' },
    { label: 'Retired credits', value: retiredHoldings.length, color: '#ef4444' }
  ];
  const marketplaceMethodologies = Object.entries(
    visibleCredits.reduce<Record<string, number>>((totals, credit) => {
      const methodology = String(credit.projects?.project_type || 'Other').replace(/_/g, ' ');
      totals[methodology] = (totals[methodology] || 0) + 1;
      return totals;
    }, {})
  ).map(([label, value], index) => ({
    label,
    value,
    color: ['#15ed48', '#00a699', '#38bdf8', '#8b5cf6', '#f59e0b', '#ef4444'][index % 6]
  }));

  const formatDate = (value?: string) => {
    if (!value) return 'Not recorded';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? 'Not recorded'
      : date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-8 text-left w-full max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="portal-page-header flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-glass">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-[#15ed48]">
              {isPortfolio ? <BriefcaseBusiness className="h-5 w-5" /> : <Store className="h-5 w-5" />}
            </span>
            {isPortfolio ? 'My Carbon Credit Portfolio' : 'Verified Carbon Credit Marketplace'}
          </h2>
          <p className="text-sm text-slate-400">
            {isPortfolio
              ? 'Manage credits owned by the connected corporate wallet and permanently retire completed offsets.'
              : 'Discover AI-corroborated, Merkle-anchored credits and acquire them through protected escrow.'}
          </p>
        </div>

        <button
          onClick={fetchCredits}
          className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold flex items-center gap-1.5 text-slate-300"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          {isPortfolio ? 'Refresh Holdings' : 'Refresh Listings'}
        </button>
      </div>

      {actionError && (
        <div className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 px-4 py-3 text-xs text-[#EF4444]">
          {actionError}
        </div>
      )}

      {isPortfolio && !walletAddress && (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-8 text-center">
          <Wallet className="mx-auto h-8 w-8 text-amber-300" />
          <h3 className="mt-3 text-base font-bold text-white">Connect your buyer wallet</h3>
          <p className="mt-1 text-xs text-slate-400">Portfolio holdings are matched to the wallet connected from the header.</p>
        </div>
      )}

      {isPortfolio && walletAddress && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="metric-summary-card rounded-2xl border border-black/20 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-black">
              <BriefcaseBusiness className="h-3.5 w-3.5" /> Credits purchased
            </div>
            <div className="mt-2 text-2xl font-black font-mono text-black">{visibleCredits.length}</div>
            <p className="mt-1 text-[11px] text-black/60">Active and retired credits held by this wallet</p>
          </div>
          <div className="metric-summary-card rounded-2xl border border-black/20 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-black">
              <Layers className="h-3.5 w-3.5" /> Active holdings
            </div>
            <div className="mt-2 text-2xl font-black font-mono text-black">{activeHoldings.length}</div>
            <p className="mt-1 text-[11px] text-black/60">Available to hold or retire</p>
          </div>
          <div className="metric-summary-card rounded-2xl border border-black/20 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-black">
              <BarChart3 className="h-3.5 w-3.5" /> Portfolio volume
            </div>
            <div className="mt-2 text-2xl font-black font-mono text-black">{totalPortfolioTonnage.toLocaleString()} <span className="text-xs text-black/60">tCO2e</span></div>
            <p className="mt-1 text-[11px] text-black/60">Combined verified carbon volume</p>
          </div>
          <div className="metric-summary-card rounded-2xl border border-black/20 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-black">
              <Flame className="h-3.5 w-3.5" /> Retired offsets
            </div>
            <div className="mt-2 text-2xl font-black font-mono text-black">{retiredTonnage.toLocaleString()} <span className="text-xs text-black/60">tCO2e</span></div>
            <p className="mt-1 text-[11px] text-black/60">Across {retiredHoldings.length} retired credit{retiredHoldings.length === 1 ? '' : 's'}</p>
          </div>
        </div>
      )}

      {(!isPortfolio || walletAddress) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ActivityBarChart
            title={isPortfolio ? 'Owned volume by vintage' : 'Available volume by vintage'}
            subtitle={isPortfolio
              ? 'Verified carbon volume across active and retired holdings'
              : 'Carbon volume currently available across marketplace vintages'}
            data={volumeByVintage}
            valueLabel="tCO2e"
            formatValue={(value) => value.toLocaleString()}
          />
          <ActivityDonutChart
            title={isPortfolio ? 'Credit lifecycle' : 'Marketplace methodology mix'}
            subtitle={isPortfolio
              ? 'Active credits compared with permanently retired offsets'
              : 'Available credits grouped by carbon project methodology'}
            data={isPortfolio ? portfolioLifecycle : marketplaceMethodologies}
            valueLabel="credits"
          />
        </div>
      )}

      {walletAddress && visibleCredits.length === 0 && !isLoading && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
          {isPortfolio ? <BriefcaseBusiness className="mx-auto h-9 w-9 text-slate-600" /> : <Store className="mx-auto h-9 w-9 text-slate-600" />}
          <h3 className="mt-3 text-base font-bold text-white">{isPortfolio ? 'No owned credits yet' : 'No credits currently available'}</h3>
          <p className="mt-1 text-xs text-slate-400">
            {isPortfolio ? 'Purchase a credit from the Marketplace and complete escrow to see it here.' : 'Refresh again after a verifier issues new credits.'}
          </p>
        </div>
      )}

      {/* Portfolio uses a scannable holdings list; marketplace keeps the visual catalog. */}
      {isPortfolio ? (
        walletAddress && visibleCredits.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-glass">
            <div className="hidden grid-cols-[1.1fr_1.6fr_.7fr_.8fr_.8fr_auto] gap-4 border-b border-white/10 bg-black/20 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 md:grid">
              <span>Credit</span>
              <span>Project</span>
              <span>Vintage</span>
              <span>Volume</span>
              <span>Status</span>
              <span className="text-right">Details</span>
            </div>
            <div className="divide-y divide-white/5">
              {visibleCredits.map((credit) => (
                <div
                  key={credit.id}
                  className="grid gap-4 px-5 py-4 transition-colors hover:bg-white/[0.035] md:grid-cols-[1.1fr_1.6fr_.7fr_.8fr_.8fr_auto] md:items-center"
                >
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500 md:hidden">Credit</div>
                    <div className="mt-0.5 font-mono text-sm font-bold text-white">NFT #{credit.token_id}</div>
                    <div className="mt-0.5 max-w-[150px] truncate font-mono text-[10px] text-[#00a699]">{credit.merkle_root}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500 md:hidden">Project</div>
                    <div className="mt-0.5 text-sm font-semibold text-white">{credit.projects?.name || 'Verified Carbon Project'}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-slate-500">{credit.project_id}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500 md:hidden">Vintage</div>
                    <div className="mt-0.5 font-mono text-xs text-slate-300">{credit.vintage_year}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500 md:hidden">Volume</div>
                    <div className="mt-0.5 font-mono text-xs font-bold text-white">{Number(credit.co2_tonnage || 0).toLocaleString()} tCO2e</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500 md:hidden">Status</div>
                    <span className={`mt-0.5 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${credit.status === 'RETIRED' ? 'border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444]' : 'border-[#15ed48]/30 bg-[#15ed48]/10 text-[#15ed48]'}`}>
                      {credit.status === 'RETIRED' ? 'RETIRED' : 'ACTIVE'}
                    </span>
                  </div>
                  <button
                    onClick={() => setDetailsCredit(credit)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:border-[#15ed48]/40 hover:bg-[#15ed48]/10 hover:text-[#15ed48]"
                  >
                    <Eye className="h-3.5 w-3.5" /> View full details
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {visibleCredits.map((credit) => (
            <div
              key={credit.id}
              className="flex flex-col justify-between space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-glass transition-all hover:border-[#8B5CF6]/40"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-[#008a05]/30 bg-[#008a05]/20 px-2.5 py-0.5 font-mono text-xs font-bold text-[#008a05]">
                    NFT #{credit.token_id}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#00a699]">{credit.status}</span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{credit.projects?.name || 'Verified Carbon Project'}</h3>
                  <p className="mt-0.5 font-mono text-xs text-slate-400">Project: {credit.project_id} • Vintage: {credit.vintage_year}</p>
                </div>

                <div className="space-y-1 rounded-xl border border-white/5 bg-black/40 p-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Captured Volume:</span>
                    <span className="font-mono font-bold text-white">{credit.co2_tonnage} tCO2e</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Merkle Root:</span>
                    <span className="max-w-[140px] truncate font-mono text-[#00a699]">{credit.merkle_root}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-2">
                <button
                  onClick={() => { setActionError(''); setSelectedCredit(credit); }}
                  disabled={!walletAddress}
                  className="w-full rounded-xl bg-[#15ed48] py-2 text-xs font-bold text-slate-950 transition-all hover:bg-[#12d23f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {walletAddress ? 'Buy with Escrow' : 'Connect Buyer Wallet'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Portfolio credit details */}
      {detailsCredit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#15ed48]/25 bg-[#0B0F17] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-[#15ed48]/30 bg-[#15ed48]/10 px-2.5 py-1 font-mono text-[10px] font-bold text-[#15ed48]">
                    NFT #{detailsCredit.token_id}
                  </span>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${detailsCredit.status === 'RETIRED' ? 'border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444]' : 'border-[#00a699]/30 bg-[#00a699]/10 text-[#00a699]'}`}>
                    {detailsCredit.status === 'RETIRED' ? 'RETIRED' : 'ACTIVE HOLDING'}
                  </span>
                </div>
                <h3 className="mt-3 text-xl font-black text-white">{detailsCredit.projects?.name || 'Verified Carbon Project'}</h3>
                <p className="mt-1 text-xs text-slate-400">Complete asset, project and cryptographic provenance details.</p>
              </div>
              <button
                onClick={() => setDetailsCredit(null)}
                aria-label="Close credit details"
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/10 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white/5 bg-white/[0.035] p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Volume</div>
                <div className="mt-1 font-mono text-sm font-bold text-white">{Number(detailsCredit.co2_tonnage || 0).toLocaleString()} tCO2e</div>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.035] p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Vintage</div>
                <div className="mt-1 font-mono text-sm font-bold text-white">{detailsCredit.vintage_year}</div>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.035] p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Project type</div>
                <div className="mt-1 truncate text-sm font-bold text-white">{detailsCredit.projects?.project_type || 'Verified project'}</div>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.035] p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Registry date</div>
                <div className="mt-1 text-sm font-bold text-white">{formatDate(detailsCredit.created_at)}</div>
              </div>
            </div>

            <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-black/25 p-4 text-xs">
              <div className="flex flex-col justify-between gap-1 border-b border-white/5 py-2 sm:flex-row">
                <span className="text-slate-500">Project ID</span>
                <span className="font-mono text-white">{detailsCredit.project_id}</span>
              </div>
              <div className="flex flex-col justify-between gap-1 border-b border-white/5 py-2 sm:flex-row">
                <span className="text-slate-500">Evidence bundle</span>
                <span className="font-mono text-white">{detailsCredit.bundle_id || 'Not recorded'}</span>
              </div>
              <div className="flex flex-col justify-between gap-1 border-b border-white/5 py-2 sm:flex-row">
                <span className="text-slate-500">Location</span>
                <span className="text-white">
                  {[detailsCredit.projects?.location?.region, detailsCredit.projects?.location?.country].filter(Boolean).join(', ') || 'Not recorded'}
                </span>
              </div>
              <div className="flex flex-col justify-between gap-1 py-2 sm:flex-row">
                <span className="text-slate-500">Current owner</span>
                <span className="break-all font-mono text-[#00a699] sm:max-w-[430px]">{detailsCredit.current_owner}</span>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#00a699]/20 bg-[#00a699]/5 p-4">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#00a699]">
                <ShieldCheck className="h-3.5 w-3.5" /> Merkle-anchored provenance
              </div>
              <div className="mt-2 break-all font-mono text-[11px] leading-5 text-slate-300">{detailsCredit.merkle_root}</div>
            </div>

            {detailsCredit.status === 'RETIRED' ? (
              <div className="mt-4 rounded-2xl border border-[#EF4444]/20 bg-[#EF4444]/5 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#EF4444]">
                  <Flame className="h-4 w-4" /> Permanently retired {formatDate(detailsCredit.retired_at)}
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-300">{detailsCredit.retirement_reason || 'No retirement reason was recorded.'}</p>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <label className="text-xs font-bold text-white" htmlFor="retirement-reason">Retirement beneficiary and purpose</label>
                <textarea
                  id="retirement-reason"
                  rows={2}
                  value={retirementReason}
                  onChange={(event) => setRetirementReason(event.target.value)}
                  className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none focus:border-[#EF4444]/50"
                />
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => setDetailsCredit(null)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleRetire(detailsCredit)}
                    disabled={isRetiring || !retirementReason.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#EF4444] to-[#F59E0B] px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    <Flame className="h-3.5 w-3.5" /> {isRetiring ? 'Retiring…' : 'Retire & burn credit'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedCredit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md space-y-5 rounded-3xl border border-[#15ed48]/30 bg-[#0B0F17] p-6 shadow-2xl">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#15ed48]">Escrow-protected purchase</div>
              <h3 className="mt-1 text-xl font-black text-white">Credit #{selectedCredit.token_id}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                The deposit is locked before ownership transfers. The resulting escrow remains traceable in the Phase 3 settlement ledger.
              </p>
            </div>
            <label className="block text-xs font-semibold text-slate-300">
              Deposit amount (ETH)
              <input
                type="number"
                min="0.0001"
                step="0.01"
                value={escrowDeposit}
                onChange={(event) => setEscrowDeposit(Number(event.target.value))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-white outline-none focus:border-[#15ed48]"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setSelectedCredit(null)} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300">
                Cancel
              </button>
              <button
                onClick={handleEscrowBuy}
                disabled={isSubmittingEscrow || escrowDeposit <= 0}
                className="rounded-xl bg-[#15ed48] px-5 py-2 text-xs font-bold text-slate-950 disabled:opacity-50"
              >
                {isSubmittingEscrow ? 'Locking…' : 'Lock Deposit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingEscrow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md space-y-5 rounded-3xl border border-[#00a699]/40 bg-[#0B0F17] p-6 text-center shadow-2xl">
            <CheckCircle2 className="mx-auto h-12 w-12 text-[#15ed48]" />
            <div>
              <h3 className="text-xl font-black text-white">Escrow deposit locked</h3>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Settlement ID <span className="font-mono text-[#00a699]">{pendingEscrow.escrow_id}</span> is ready for release and ownership transfer.
              </p>
            </div>
            <button
              onClick={handleEscrowRelease}
              disabled={isSubmittingEscrow}
              className="w-full rounded-xl bg-[#15ed48] py-2.5 text-xs font-bold text-slate-950 disabled:opacity-50"
            >
              {isSubmittingEscrow ? 'Settling…' : 'Release Escrow & Transfer Credit'}
            </button>
          </div>
        </div>
      )}

      {/* Retirement Certificate Modal */}
      {retiredCertificate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="max-w-lg w-full p-6 rounded-3xl bg-[#0B0F17] border border-[#008a05]/40 shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#008a05]/20 text-[#008a05] mx-auto flex items-center justify-center">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest text-[#008a05] font-mono font-bold">
                Official Proof of Retirement
              </span>
              <h3 className="text-2xl font-black text-white mt-1">
                Certificate of Carbon Offset
              </h3>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Token ID:</span>
                <span className="font-mono text-white font-bold">#{retiredCertificate.token_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tonnage Offset:</span>
                <span className="font-mono text-[#008a05] font-bold">{retiredCertificate.co2_tonnage} tCO2e</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Project:</span>
                <span className="text-white truncate max-w-[200px]">{retiredCertificate.projects?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Merkle Root:</span>
                <span className="font-mono text-[#00a699] truncate max-w-[200px]">{retiredCertificate.merkle_root}</span>
              </div>
              <div className="pt-2 border-t border-white/10">
                <span className="text-slate-400">Beneficiary Reason:</span>
                <p className="text-white mt-0.5 italic">{retiredCertificate.retirement_reason}</p>
              </div>
            </div>

            <button
              onClick={() => setRetiredCertificate(null)}
              className="w-full py-2.5 rounded-xl bg-[#008a05] text-black font-bold text-sm hover:opacity-90 transition-all"
            >
              Close Certificate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
