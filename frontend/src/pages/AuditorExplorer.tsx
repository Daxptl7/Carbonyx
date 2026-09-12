import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Layers, 
  Cpu, 
  FileCheck2, 
  Clock, 
  RefreshCw, 
  ArrowRight, 
  Scale, 
  Zap, 
  AlertTriangle,
  History,
  Activity,
  ExternalLink
} from 'lucide-react';

interface AuditorExplorerProps {
  walletAddress: string | null;
  backendUrl?: string;
}

export const AuditorExplorer: React.FC<AuditorExplorerProps> = ({
  walletAddress,
  backendUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000'
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('PROJ-AMAZON-004');
  const [provenanceData, setProvenanceData] = useState<any>(null);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [slashingLogs, setSlashingLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchProvenance = async (projId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/audit/provenance/${projId}`);
      const json = await res.json();
      if (json.success) {
        setProvenanceData(json.data);
      }
    } catch (_) {}
    setLoading(false);
  };

  const fetchDisputesAndLogs = async () => {
    try {
      const [dispRes, slashRes] = await Promise.all([
        fetch(`${backendUrl}/api/disputes`),
        fetch(`${backendUrl}/api/audit/slashing-log`)
      ]);
      const dispJson = await dispRes.json();
      const slashJson = await slashRes.json();

      if (dispJson.success) setDisputes(dispJson.data);
      if (slashJson.success) setSlashingLogs(slashJson.data);
    } catch (_) {}
  };

  useEffect(() => {
    fetchProvenance(selectedProjectId);
    fetchDisputesAndLogs();
  }, [selectedProjectId]);

  const handleResolveDispute = async (disputeId: string, uphold: boolean) => {
    setResolvingId(disputeId);
    try {
      const res = await fetch(`${backendUrl}/api/disputes/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disputeId,
          upholdDispute: uphold,
          resolutionNotes: uphold 
            ? 'Upheld by DAO Governance: Synthetic sensor readings diverging 42% from Sentinel-2 ground truth' 
            : 'Dismissed: Secondary sensor recalibration proved valid telemetry'
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(data.message);
        fetchDisputesAndLogs();
        fetchProvenance(selectedProjectId);
      }
    } catch (err: any) {
      setActionNotice(`Resolution failed: ${err.message}`);
    }
    setResolvingId(null);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-semibold border border-indigo-500/30">
              <Scale className="w-3.5 h-3.5" />
              Institutional MRV Audit & Dispute Arbitration
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Cryptographic Provenance & Slashing Explorer
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Inspect the end-to-end cryptographic verification lifecycle of carbon offsets from sensor genesis to on-chain retirement. Arbitrate disputes with automated 50% verifier stake slashing.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex flex-col text-right">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Current Inspector</span>
              <span className="text-xs font-mono text-indigo-400 font-bold">
                {walletAddress ? `${walletAddress.slice(0, 10)}...` : '0x90F7...Admin'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Notice Alert */}
      {actionNotice && (
        <div className="bg-emerald-950/70 border-2 border-emerald-500/50 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-300 text-sm shadow-xl shadow-emerald-950/50 animate-bounce">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <span className="font-semibold">{actionNotice}</span>
          </div>
          <button 
            onClick={() => setActionNotice(null)}
            className="text-xs text-emerald-400 hover:text-white px-2 py-1 rounded bg-emerald-900/50"
          >
            ✕
          </button>
        </div>
      )}

      {/* Project Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-300">Select Project to Audit:</span>
          <div className="flex gap-2">
            {['PROJ-AMAZON-004', 'PROJ-BORNEO-002', 'PROJ-KENYA-001'].map((id) => (
              <button
                key={id}
                onClick={() => setSelectedProjectId(id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                  selectedProjectId === id 
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' 
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            fetchProvenance(selectedProjectId);
            fetchDisputesAndLogs();
          }}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Provenance Trail
        </button>
      </div>

      {/* 6-Stage Cryptographic Stepper */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">6-Stage Cryptographic Provenance Stepper</h2>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {provenanceData?.overall_integrity || 'VERIFIED_PRISTINE'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {provenanceData?.provenance_stages?.map((stage: any) => (
            <div 
              key={stage.stage}
              className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3 relative group transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-black font-mono">
                  {stage.stage}
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                  stage.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  stage.status === 'MONITORED_ACTIVE' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                  'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {stage.status}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white">{stage.title}</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {new Date(stage.timestamp).toLocaleString()}
              </p>

              <div className="bg-slate-900/80 border border-slate-800/60 rounded-xl p-3 text-[11px] font-mono space-y-1 text-slate-300">
                {Object.entries(stage.details || {}).map(([key, val]: any) => (
                  <div key={key} className="flex justify-between items-start gap-2 truncate">
                    <span className="text-slate-500 capitalize">{key.replace('_', ' ')}:</span>
                    <span className="text-indigo-300 font-semibold truncate max-w-[150px]">
                      {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Community Disputes & Slashing Arbitration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Disputes Panel */}
        <div className="bg-slate-900/50 border border-amber-500/30 rounded-3xl p-6 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-base">
              <ShieldAlert className="w-5 h-5" />
              Community Dispute Arbitration
            </div>
            <span className="text-xs font-mono bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/30">
              {disputes.filter(d => d.status === 'PENDING').length} Pending Review
            </span>
          </div>

          <div className="space-y-4">
            {disputes.map((dispute) => (
              <div 
                key={dispute.id}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  dispute.status === 'PENDING' 
                    ? 'bg-amber-950/20 border-amber-500/40' 
                    : dispute.status === 'UPHELD'
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono">{dispute.project_id} (Credit #{dispute.token_id})</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                    dispute.status === 'PENDING' ? 'bg-amber-500 text-slate-950' :
                    dispute.status === 'UPHELD' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {dispute.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-semibold text-amber-300">{dispute.category}</div>
                  <p className="text-xs text-slate-300">{dispute.reason}</p>
                </div>

                <div className="text-[10px] font-mono text-slate-400 bg-slate-950/60 p-2.5 rounded-lg space-y-1">
                  <div>Approving Verifier: <span className="text-emerald-400">{dispute.approving_verifier}</span></div>
                  <div>Initiator: <span className="text-slate-300">{dispute.initiator}</span></div>
                  {dispute.slashed_amount_eth && (
                    <div className="text-rose-400 font-bold">
                      Penalty Applied: -{dispute.slashed_amount_eth} ETH Slashed (50% Collateral Penalty)
                    </div>
                  )}
                </div>

                {dispute.status === 'PENDING' && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => handleResolveDispute(dispute.id, false)}
                      disabled={resolvingId === dispute.id}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    >
                      Dismiss (Valid)
                    </button>
                    <button
                      onClick={() => handleResolveDispute(dispute.id, true)}
                      disabled={resolvingId === dispute.id}
                      className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-rose-600/30"
                    >
                      {resolvingId === dispute.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                      Uphold Dispute & Slash 50% Stake
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Slashing Log */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-rose-400 font-bold text-base">
              <History className="w-5 h-5" />
              On-Chain Slashing & Penalty Log
            </div>
            <span className="text-xs font-mono bg-rose-500/20 text-rose-300 px-2.5 py-1 rounded-full border border-rose-500/30">
              Realtime Sync
            </span>
          </div>

          <div className="space-y-3">
            {slashingLogs.map((log) => (
              <div 
                key={log.id}
                className="bg-slate-950/80 border border-rose-500/20 rounded-2xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono">{log.project_id}</span>
                  <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
                    -{log.slashed_amount_eth} ETH ({log.slashed_percent}%)
                  </span>
                </div>

                <p className="text-xs text-slate-300">{log.penalty_reason}</p>

                <div className="text-[10px] font-mono text-slate-500 space-y-0.5 pt-1 border-t border-slate-900">
                  <div>Verifier: <span className="text-slate-400">{log.verifier_address}</span></div>
                  <div className="truncate">Tx Hash: <span className="text-indigo-400">{log.transaction_hash}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditorExplorer;
