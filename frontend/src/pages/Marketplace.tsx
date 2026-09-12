import React, { useState, useEffect } from 'react';
import { BriefcaseBusiness, Flame, RefreshCw, CheckCircle2, ShieldCheck, Store, Wallet } from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiFetch, readApiJson } from '../lib/auth';

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
  const [retirementReason, setRetirementReason] = useState('Scope 1 & 2 Corporate Carbon Neutrality 2026');
  const [retiredCertificate, setRetiredCertificate] = useState<any | null>(null);
  const [escrowDeposit, setEscrowDeposit] = useState(0.15);
  const [pendingEscrow, setPendingEscrow] = useState<any | null>(null);
  const [isSubmittingEscrow, setIsSubmittingEscrow] = useState(false);
  const [actionError, setActionError] = useState('');
  const isPortfolio = view === 'portfolio';

  const fetchCredits = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/api/marketplace/credits`);
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
  }, []);

  const handleRetire = async (credit: any) => {
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
        fetchCredits();
      }
    } catch (err: any) {
      alert(`Retirement failed: ${err.message}`);
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

  return (
    <div className="space-y-8 text-left w-full max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-glass">
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

      {walletAddress && visibleCredits.length === 0 && !isLoading && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
          {isPortfolio ? <BriefcaseBusiness className="mx-auto h-9 w-9 text-slate-600" /> : <Store className="mx-auto h-9 w-9 text-slate-600" />}
          <h3 className="mt-3 text-base font-bold text-white">{isPortfolio ? 'No owned credits yet' : 'No credits currently available'}</h3>
          <p className="mt-1 text-xs text-slate-400">
            {isPortfolio ? 'Purchase a credit from the Marketplace and complete escrow to see it here.' : 'Refresh again after a verifier issues new credits.'}
          </p>
        </div>
      )}

      {/* Marketplace catalog and owned portfolio remain separate views. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {visibleCredits.map((credit) => (
          <div
            key={credit.id}
            className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-glass flex flex-col justify-between hover:border-[#8B5CF6]/40 transition-all space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-[#008a05]/20 text-[#008a05] border border-[#008a05]/30 text-xs font-mono font-bold">
                  NFT #{credit.token_id}
                </span>
                <span className={`text-xs font-mono font-bold ${credit.status === 'RETIRED' ? 'text-[#EF4444]' : 'text-[#00a699]'}`}>
                  {credit.status}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-white text-base">
                  {credit.projects?.name || 'Verified Carbon Project'}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Project: {credit.project_id} • Vintage: {credit.vintage_year}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Captured Volume:</span>
                  <span className="font-mono text-white font-bold">{credit.co2_tonnage} tCO2e</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Merkle Root:</span>
                  <span className="font-mono text-[#00a699] truncate max-w-[140px]">{credit.merkle_root}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              {credit.status === 'RETIRED' ? (
                <div className="text-xs text-slate-500 font-mono flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-[#EF4444]" />
                  Burned & Retired
                </div>
              ) : walletAddress && credit.current_owner?.toLowerCase() === walletAddress.toLowerCase() ? (
                <button
                  onClick={() => handleRetire(credit)}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-[#EF4444] to-[#F59E0B] text-white font-bold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow"
                >
                  <Flame className="w-3.5 h-3.5" />
                  Retire & Burn Credit
                </button>
              ) : (
                <button
                  onClick={() => { setActionError(''); setSelectedCredit(credit); }}
                  disabled={!walletAddress}
                  className="w-full py-2 rounded-xl bg-[#15ed48] text-slate-950 font-bold text-xs hover:bg-[#12d23f] transition-all disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {walletAddress ? 'Buy with Escrow' : 'Connect Buyer Wallet'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

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
