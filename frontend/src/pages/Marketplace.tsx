import React, { useState, useEffect } from 'react';
import { Layers, Award, Flame, ExternalLink, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';

export default function Marketplace({ walletAddress }: { walletAddress: string | null }) {
  const [credits, setCredits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<any | null>(null);
  const [retirementReason, setRetirementReason] = useState('Scope 1 & 2 Corporate Carbon Neutrality 2026');
  const [retiredCertificate, setRetiredCertificate] = useState<any | null>(null);

  const fetchCredits = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/marketplace/credits`);
      const data = await res.json();
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
      const res = await fetch(`${API_URL}/api/marketplace/retire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: credit.token_id,
          retirementReason,
          ownerAddress: walletAddress || credit.current_owner
        })
      });
      const data = await res.json();
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

  return (
    <div className="space-y-8 text-left w-full max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-glass">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#8B5CF6]" />
            Verified Carbon Credit Escrow Marketplace
          </h2>
          <p className="text-sm text-slate-400">
            Browse only AI-corroborated, Merkle-anchored ERC-721 carbon credit tokens.
          </p>
        </div>

        <button
          onClick={fetchCredits}
          className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold flex items-center gap-1.5 text-slate-300"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Listings
        </button>
      </div>

      {/* Credit Catalog */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {credits.map((credit) => (
          <div
            key={credit.id}
            className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-glass flex flex-col justify-between hover:border-[#8B5CF6]/40 transition-all space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 text-xs font-mono font-bold">
                  NFT #{credit.token_id}
                </span>
                <span className={`text-xs font-mono font-bold ${credit.status === 'RETIRED' ? 'text-[#EF4444]' : 'text-[#06B6D4]'}`}>
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
                  <span className="font-mono text-[#06B6D4] truncate max-w-[140px]">{credit.merkle_root}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              {credit.status === 'RETIRED' ? (
                <div className="text-xs text-slate-500 font-mono flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-[#EF4444]" />
                  Burned & Retired
                </div>
              ) : (
                <button
                  onClick={() => handleRetire(credit)}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-[#EF4444] to-[#F59E0B] text-white font-bold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow"
                >
                  <Flame className="w-3.5 h-3.5" />
                  Retire & Burn Credit
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Retirement Certificate Modal */}
      {retiredCertificate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="max-w-lg w-full p-6 rounded-3xl bg-[#0B0F17] border border-[#10B981]/40 shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#10B981]/20 text-[#10B981] mx-auto flex items-center justify-center">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest text-[#10B981] font-mono font-bold">
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
                <span className="font-mono text-[#10B981] font-bold">{retiredCertificate.co2_tonnage} tCO2e</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Project:</span>
                <span className="text-white truncate max-w-[200px]">{retiredCertificate.projects?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Merkle Root:</span>
                <span className="font-mono text-[#06B6D4] truncate max-w-[200px]">{retiredCertificate.merkle_root}</span>
              </div>
              <div className="pt-2 border-t border-white/10">
                <span className="text-slate-400">Beneficiary Reason:</span>
                <p className="text-white mt-0.5 italic">{retiredCertificate.retirement_reason}</p>
              </div>
            </div>

            <button
              onClick={() => setRetiredCertificate(null)}
              className="w-full py-2.5 rounded-xl bg-[#10B981] text-black font-bold text-sm hover:opacity-90 transition-all"
            >
              Close Certificate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
