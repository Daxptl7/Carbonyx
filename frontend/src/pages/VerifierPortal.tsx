import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle2, TrendingUp, Cpu, RefreshCw, Layers } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';

export default function VerifierPortal({ walletAddress }: { walletAddress: string | null }) {
  const [stakedAmount, setStakedAmount] = useState<number>(0.25);
  const [reputationScore, setReputationScore] = useState<number>(98);
  const [anomalyQueue, setAnomalyQueue] = useState<any[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<any | null>(null);

  const fetchQueue = async () => {
    setIsLoadingQueue(true);
    try {
      const res = await fetch(`${API_URL}/api/verifiers/queue`);
      const data = await res.json();
      if (data.queue) {
        setAnomalyQueue(data.queue);
        if (data.queue.length > 0 && !selectedBundle) {
          setSelectedBundle(data.queue[0]);
        }
      }
    } catch (err: any) {
      console.error('Error fetching verifier queue:', err);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleStake = () => {
    setStakedAmount(prev => +(prev + 0.1).toFixed(2));
    alert('Successfully deposited 0.1 ETH stake into VerifierStakingLedger contract!');
  };

  return (
    <div className="space-y-8 text-left w-full max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-glass">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#F59E0B]" />
            Independent Verifier Staking & Review Portal
          </h2>
          <p className="text-sm text-slate-400">
            Audit low-confidence evidence bundles. High stake & reputation ensures uncompromised verification.
          </p>
        </div>

        <button
          onClick={fetchQueue}
          className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold flex items-center gap-1.5 text-slate-300"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQueue ? 'animate-spin' : ''}`} />
          Refresh Anomaly Queue
        </button>
      </div>

      {/* Verifier Staking Ledger Profile */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-glass">
          <span className="text-xs text-slate-400">Staked Collateral</span>
          <div className="text-2xl font-black font-mono text-[#10B981] mt-1">{stakedAmount} ETH</div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
            Active in Verifier Pool (Min 0.1 ETH)
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-glass">
          <span className="text-xs text-slate-400">Reputation Score</span>
          <div className="text-2xl font-black font-mono text-[#06B6D4] mt-1">{reputationScore} / 100</div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-[#06B6D4]" />
            Top 5% Auditor Tier
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-glass">
          <span className="text-xs text-slate-400">Slashing Protection</span>
          <div className="text-2xl font-black font-mono text-[#EF4444] mt-1">50% Slash</div>
          <div className="text-[11px] text-slate-400 mt-2">
            Automated slashing if dispute upheld
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-glass flex flex-col justify-center">
          <button
            onClick={handleStake}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#EF4444] text-black font-bold text-xs hover:opacity-90 transition-all shadow"
          >
            Deposit +0.1 ETH Stake
          </button>
        </div>
      </div>

      {/* Anomaly Review Queue & Side-by-side Diff Viewer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Queue List */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-glass space-y-3">
          <h3 className="font-bold text-sm text-slate-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
            Anomaly Escrow Queue ({anomalyQueue.length})
          </h3>

          {anomalyQueue.length === 0 ? (
            <div className="text-xs text-slate-500 py-6 text-center">
              No flagged evidence bundles currently in queue.
            </div>
          ) : (
            <div className="space-y-2">
              {anomalyQueue.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedBundle(item)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedBundle?.id === item.id
                      ? 'bg-white/10 border-[#EF4444]'
                      : 'bg-black/30 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-white font-bold">{item.bundle_id}</span>
                    <span className="text-[#EF4444] font-bold">{item.confidence_score}% Conf</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-1">
                    Project: {item.evidence_bundles?.project_id || 'PRJ-AMZ-001'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side-by-Side Telemetry Diff & Action */}
        <div className="md:col-span-2 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-glass space-y-4">
          <h3 className="font-bold text-sm text-slate-300 flex items-center justify-between">
            <span>Evidence Discrepancy Inspection</span>
            {selectedBundle && (
              <span className="text-xs font-mono text-[#EF4444]">
                Confidence: {selectedBundle.confidence_score}% (HIGH RISK)
              </span>
            )}
          </h3>

          {selectedBundle ? (
            <div className="space-y-4">
              {/* Divergence Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                  <div className="text-xs font-mono text-[#10B981] font-bold">IoT Flux Soil Sensors</div>
                  <div className="text-xl font-bold font-mono text-white mt-1">1,050 tCO2e</div>
                  <div className="text-[11px] text-slate-400 mt-1">Reported Net Influx: 412 ppm</div>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-[#EF4444]/40 bg-[#EF4444]/5">
                  <div className="text-xs font-mono text-[#EF4444] font-bold">Sentinel-2 NDVI Satellite</div>
                  <div className="text-xl font-bold font-mono text-[#EF4444] mt-1">150 tCO2e (-85.7%)</div>
                  <div className="text-[11px] text-[#EF4444] mt-1">Canopy Cover Delta: -0.35 (Loss)</div>
                </div>
              </div>

              {/* Anomaly Flags */}
              <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-2">
                <div className="text-xs font-bold text-[#EF4444]">Raised Anomaly Flags:</div>
                <div className="space-y-1">
                  {(selectedBundle.anomaly_flags || []).map((flag: string, idx: number) => (
                    <div key={idx} className="text-xs font-mono text-slate-300 flex items-start gap-1.5">
                      <span className="text-[#EF4444]">•</span>
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* XAI Narrative */}
              <div className="text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5 leading-relaxed">
                <span className="font-bold text-[#06B6D4]">AI Analysis: </span>
                {selectedBundle.explanation_reason}
              </div>

              {/* Auditor Verdict Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => alert('Evidence bundle rejected. Fraud alert logged on-chain.')}
                  className="px-4 py-2 rounded-xl bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#EF4444] hover:bg-[#EF4444]/30 font-semibold text-xs transition-all"
                >
                  Reject & Flag Fraud
                </button>
                <button
                  onClick={() => alert('Secondary physical on-site audit requested from issuer.')}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-xs transition-all"
                >
                  Request Field Samples
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 py-12 text-center">
              Select a bundle from the queue to inspect telemetry divergence.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
