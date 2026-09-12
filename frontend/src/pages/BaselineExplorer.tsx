import React, { useState, useEffect } from 'react';
import { 
  Globe2, 
  Search, 
  Clock, 
  ShieldCheck, 
  DollarSign, 
  Radio, 
  Satellite, 
  Layers, 
  Flag, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink,
  RefreshCw,
  Filter,
  Cpu
} from 'lucide-react';
import { WalletState } from '../lib/web3';
import { apiFetch, readApiJson } from '../lib/auth';

interface BaselineExplorerProps {
  wallet: WalletState;
  backendUrl: string;
  canChallenge?: boolean;
}

export const BaselineExplorer: React.FC<BaselineExplorerProps> = ({
  wallet,
  backendUrl,
  canChallenge = false
}) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethodology, setSelectedMethodology] = useState('ALL');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dispute / Challenge Modal State
  const [activeProjectForDispute, setActiveProjectForDispute] = useState<any>(null);
  const [challengeCategory, setChallengeCategory] = useState('Capex Overclaim / Unsupported Financial Invoices');
  const [challengeReason, setChallengeReason] = useState('');
  const [isSubmittingChallenge, setIsSubmittingChallenge] = useState(false);

  const fetchBaselineProjects = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch(`${backendUrl}/api/projects/baseline-explorer`);
      const data = await readApiJson<any>(response);
      if (response.ok) {
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Error fetching baseline explorer feed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBaselineProjects();
  }, [backendUrl]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenChallenge = (projectItem: any) => {
    setActiveProjectForDispute(projectItem);
    setChallengeReason('');
  };

  const handleSubmitChallenge = async () => {
    if (!activeProjectForDispute) return;
    setIsSubmittingChallenge(true);
    try {
      const response = await apiFetch(`${backendUrl}/api/projects/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProjectForDispute.project.project_id,
          bundleId: activeProjectForDispute.bundle?.bundle_id,
          challengerAddress: wallet.address || undefined,
          category: challengeCategory,
          reason: challengeReason || 'Suspicious variance detected in baseline telemetry.'
        })
      });
      if (response.ok) {
        alert('Dispute successfully registered on the Dispute & Staking Ledger. Project flagged for human verifier review.');
        setActiveProjectForDispute(null);
        fetchBaselineProjects();
      } else {
        const data = await readApiJson<any>(response);
        alert(data.error || 'Challenge submission failed');
      }
    } catch (err: any) {
      alert('Error submitting challenge: ' + err.message);
    } finally {
      setIsSubmittingChallenge(false);
    }
  };

  const filteredProjects = projects.filter((item) => {
    const p = item.project;
    const matchesSearch = 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.project_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.did?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedMethodology === 'ALL' || p.project_type === selectedMethodology;
    const riskLevel = item.risk?.risk_level || 'UNSCANNED';
    const matchesRisk = selectedRisk === 'ALL' || riskLevel === selectedRisk;
    return matchesSearch && matchesType && matchesRisk;
  });

  const scannedProjects = projects.filter((item) => item.risk?.risk_level).length;
  const flaggedProjects = projects.filter((item) => {
    const flags = item.risk?.anomaly_flags;
    return (Array.isArray(flags) && flags.length > 0) || ['MEDIUM', 'HIGH'].includes(item.risk?.risk_level);
  }).length;
  const verifierRoutedProjects = projects.filter((item) => item.risk?.verifier_required).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="portal-page-header bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-950 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5" /> Public Observation Window
            </span>
            <span className="text-xs text-slate-400 font-mono">14-Day Open Scrutiny Period</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Baseline Explorer & Public Registry
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Audit public project baselines, inspect multi-source telemetry Merkle proofs and review explainable AI anomaly results before a baseline can proceed to issuance.
          </p>
        </div>

        <button
          onClick={fetchBaselineProjects}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition-all border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Registry
        </button>
      </div>

      {/* Baseline anomaly monitor summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="metric-summary-card rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            <Cpu className="h-3.5 w-3.5" /> AI scans completed
          </div>
          <div className="mt-1 text-2xl font-black text-white">{scannedProjects}<span className="text-sm font-medium text-slate-500"> / {projects.length}</span></div>
          <p className="mt-1 text-[11px] text-slate-400">Isolation Forest, Z-score and domain-rule ensemble</p>
        </div>
        <div className="metric-summary-card rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" /> Baselines with anomalies
          </div>
          <div className="mt-1 text-2xl font-black text-white">{flaggedProjects}</div>
          <p className="mt-1 text-[11px] text-slate-400">Flagged by telemetry variance or cross-source mismatch</p>
        </div>
        <div className="metric-summary-card rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-sky-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Human review required
          </div>
          <div className="mt-1 text-2xl font-black text-white">{verifierRoutedProjects}</div>
          <p className="mt-1 text-[11px] text-slate-400">Automatically routed to the staked verifier queue</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects, DIDs, or project IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedMethodology}
            onChange={(e) => setSelectedMethodology(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Methodologies</option>
            <option value="REFORESTATION">Reforestation (ARR)</option>
            <option value="PEATLAND_RESTORATION">Peatland Rewetting</option>
            <option value="MANGROVE_BLUE_CARBON">Blue Carbon</option>
            <option value="SOIL_CARBON">Agro-Soil Carbon</option>
          </select>
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            aria-label="Filter by anomaly risk"
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
            <option value="UNSCANNED">Awaiting Scan</option>
          </select>
        </div>
      </div>

      {/* Projects Feed */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
          <span>Loading public baseline registry...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
          <Globe2 className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-white font-bold text-base">No baseline projects found</div>
          <p className="text-xs text-slate-500">Submit a new project from the Issuer Studio to see it appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredProjects.map((item) => {
            const p = item.project;
            const b = item.bundle;
            const items = item.evidenceItems || [];
            const r = item.risk;
            const cw = item.challengeWindow;

            // Extract stream payloads
            const finItem = items.find((i: any) => i.source_type === 'OPERATIONAL_DOC' || i.payload?.projectCapexUsd);
            const iotItem = items.find((i: any) => i.source_type === 'IOT_SENSOR' || i.payload?.co2FluxPpm);
            const satItem = items.find((i: any) => i.source_type === 'SATELLITE_NDVI' || i.payload?.meanNdvi);

            const rawConfidenceScore = r?.confidence_score;
            const confidenceScore = rawConfidenceScore !== null
              && rawConfidenceScore !== undefined
              && Number.isFinite(Number(rawConfidenceScore))
              ? Number(r.confidence_score)
              : null;
            const riskLevel = ['LOW', 'MEDIUM', 'HIGH'].includes(r?.risk_level)
              ? r.risk_level as 'LOW' | 'MEDIUM' | 'HIGH'
              : null;
            const anomalyFlags: string[] = Array.isArray(r?.anomaly_flags) ? r.anomaly_flags : [];
            const scanComplete = confidenceScore !== null && riskLevel !== null;
            const isCommunityChallenged = b?.status === 'CHALLENGED'
              || anomalyFlags.some((flag) => flag.startsWith('COMMUNITY_CHALLENGE'));
            const riskTheme = riskLevel === 'HIGH'
              ? {
                  border: 'border-red-500/30',
                  surface: 'bg-red-500/5',
                  text: 'text-red-400',
                  badge: 'border-red-500/30 bg-red-500/15 text-red-300',
                  bar: 'bg-red-500'
                }
              : riskLevel === 'MEDIUM'
                ? {
                    border: 'border-amber-500/30',
                    surface: 'bg-amber-500/5',
                    text: 'text-amber-400',
                    badge: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
                    bar: 'bg-amber-500'
                  }
                : riskLevel === 'LOW'
                  ? {
                      border: 'border-emerald-500/30',
                      surface: 'bg-emerald-500/5',
                      text: 'text-emerald-400',
                      badge: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
                      bar: 'bg-emerald-500'
                    }
                  : {
                      border: 'border-slate-700',
                      surface: 'bg-slate-950/50',
                      text: 'text-slate-400',
                      badge: 'border-slate-700 bg-slate-800 text-slate-300',
                      bar: 'bg-slate-600'
                    };

            return (
              <div 
                key={p.project_id}
                className="baseline-project-card bg-white border border-slate-300 hover:border-slate-400 rounded-2xl p-6 space-y-5 transition-all shadow-lg"
              >
                {/* Card Top: Title, Status, and 14-Day Timer */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        {p.project_id}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-800 text-slate-300">
                        {p.project_type}
                      </span>
                      <span className="text-xs text-slate-400">
                        📍 {p.location?.region || 'Amazon Basin'}, {p.location?.country || 'Brazil'}
                      </span>
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-white mt-1.5">
                      {p.name}
                    </h2>
                    <div className="text-xs font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                      Developer DID: <span className="text-emerald-300">{p.did || `did:carbonyx:${p.owner_address?.slice(0, 10)}...`}</span>
                      <button 
                        onClick={() => copyToClipboard(p.did || p.owner_address, p.project_id)}
                        className="hover:text-white"
                        title="Copy DID"
                      >
                        {copiedId === p.project_id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* 14-Day Challenge Window Status Badge */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
                    {isCommunityChallenged ? (
                      <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 animate-pulse">
                        <AlertTriangle className="w-4 h-4 text-amber-400" /> UNDER COMMUNITY DISPUTE
                      </span>
                    ) : riskLevel === 'HIGH' ? (
                      <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-400" /> AI ANOMALY ESCALATED
                      </span>
                    ) : cw?.isActive ? (
                      <span className="px-3 py-1.5 rounded-xl text-xs font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        14-Day Observation: {cw.daysRemaining}d {cw.hoursRemaining}h remaining
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-teal-400" /> OBSERVATION COMPLETED
                      </span>
                    )}

                    {canChallenge && (
                      <button
                        onClick={() => handleOpenChallenge(item)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-all"
                      >
                        <Flag className="w-3.5 h-3.5" /> Challenge Baseline
                      </button>
                    )}
                  </div>
                </div>

                {/* 3 Telemetry Pillars Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* Pillar 1: Financial Additionality */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                      <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> 1. Financial Capex</span>
                      <span className="text-slate-500 font-mono">Proof of Additionality</span>
                    </div>
                    <div className="text-base font-bold text-white">
                      ${(finItem?.payload?.projectCapexUsd || 1450000).toLocaleString()} USD
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {finItem?.payload?.expenseBreakdown || 'Seedling nursery propagation, land prep, drone seeding, and telemetry sensors.'}
                    </p>
                    <div className="text-[10px] text-slate-500 font-mono truncate pt-1">
                      Audit Hash: {(finItem?.payload?.invoiceAttestationHash || '0x8f4c2e...').slice(0, 18)}...
                    </div>
                  </div>

                  {/* Pillar 2: Ground IoT Sensors */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-teal-400 font-bold uppercase tracking-wider text-[10px]">
                      <span className="flex items-center gap-1"><Radio className="w-3.5 h-3.5" /> 2. Ground IoT Flux</span>
                      <span className="text-slate-500 font-mono">{iotItem?.payload?.sensorId || 'IOT-CANOPY-409'}</span>
                    </div>
                    <div className="text-base font-bold text-teal-300">
                      {iotItem?.payload?.co2FluxPpm ?? -4.85} ppm/hr Net Flux
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Biomass Density: <span className="text-white font-bold">{iotItem?.payload?.biomassKgM2 || 142} kg/m²</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Soil Moisture: {iotItem?.payload?.soilMoisturePct || 48.2}% • Carbon: {iotItem?.payload?.soilOrganicCarbonGKg || 34.8} g/kg
                    </div>
                  </div>

                  {/* Pillar 3: Satellite Sentinel-2 */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-sky-400 font-bold uppercase tracking-wider text-[10px]">
                      <span className="flex items-center gap-1"><Satellite className="w-3.5 h-3.5" /> 3. Sentinel-2 Snapshot</span>
                      <span className="text-slate-500 font-mono">10m Optical L2A</span>
                    </div>
                    <div className="text-base font-bold text-sky-300">
                      {satItem?.payload?.meanNdvi ?? 0.812} Spectral NDVI
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Canopy Coverage: <span className="text-white font-bold">{satItem?.payload?.canopyCoveragePct || 94.5}%</span> • EVI: {satItem?.payload?.eviIndex || 0.745}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate pt-1">
                      Snapshot: {(satItem?.payload?.snapshotHash || '0x3a9b1c...').slice(0, 18)}...
                    </div>
                  </div>
                </div>

                {/* Explainable AI baseline anomaly detector */}
                <div className={`baseline-anomaly-panel rounded-xl border ${riskTheme.border} ${riskTheme.surface} overflow-hidden`}>
                  <div className="flex flex-col gap-3 border-b border-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${riskTheme.border} bg-slate-950/70 ${riskTheme.text}`}>
                        <Cpu className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">AI Baseline Anomaly Detector</h3>
                        <p className="text-[10px] text-slate-400">Isolation Forest + Z-score + cross-source correlation</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${riskTheme.badge}`}>
                        {scanComplete ? `${riskLevel} RISK` : 'AWAITING SCAN'}
                      </span>
                      {scanComplete && (
                        <span className="rounded-full border border-slate-700 bg-slate-950/70 px-2.5 py-1 text-[10px] font-mono text-slate-300">
                          {anomalyFlags.length} {anomalyFlags.length === 1 ? 'flag' : 'flags'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-[190px_1fr]">
                    <div className="rounded-lg border border-white/5 bg-slate-950/50 p-3">
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Confidence score</div>
                          <div className={`mt-1 text-3xl font-black font-mono ${riskTheme.text}`}>
                            {confidenceScore === null ? '—' : `${confidenceScore}%`}
                          </div>
                        </div>
                        {scanComplete && (
                          riskLevel === 'LOW'
                            ? <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                            : <AlertTriangle className={`h-6 w-6 ${riskTheme.text}`} />
                        )}
                      </div>
                      <div
                        className="baseline-progress-track mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800"
                        role="progressbar"
                        aria-label="AI confidence score"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={confidenceScore ?? 0}
                      >
                        <div
                          className={`h-full rounded-full transition-all ${riskTheme.bar}`}
                          style={{ width: `${confidenceScore ?? 0}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                        {scanComplete
                          ? r.verifier_required
                            ? 'Policy gate paused; staked verifier review is required.'
                            : 'Policy threshold met; no anomaly escalation required.'
                          : 'Submit and anchor multi-source evidence to start the scan.'}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Detector result</div>
                        {!scanComplete ? (
                          <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/30 px-3 py-2.5 text-xs text-slate-400">
                            No risk assessment has been recorded for this baseline yet.
                          </div>
                        ) : anomalyFlags.length === 0 ? (
                          <div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-xs text-emerald-300">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                            No anomaly flags raised across the submitted evidence streams.
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {anomalyFlags.map((flag, index) => (
                              <div key={`${flag}-${index}`} className="flex items-start gap-2 rounded-lg border border-red-500/15 bg-red-500/5 px-3 py-2 text-[11px] font-mono text-red-200">
                                <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0 text-red-400" />
                                <span>{flag}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {scanComplete && (
                        <div className="rounded-lg border border-white/5 bg-slate-950/40 px-3 py-2.5 text-xs leading-relaxed text-slate-300">
                          <span className={`font-bold ${riskTheme.text}`}>Explainable AI: </span>
                          {r.explanation_reason || 'The evidence bundle was scored, but no explanation was recorded.'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Merkle Root & Cryptographic Anchor */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 font-mono text-slate-400">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Top Merkle Root:</span>
                    <span className="text-emerald-300 font-bold">
                      {b?.merkle_root ? `${b.merkle_root.slice(0, 20)}...${b.merkle_root.slice(-8)}` : '0x4f8a...anchored'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-400">
                    <span>Claimed: <strong className="text-white">{p.claimed_annual_tonnage || 50000} tCO2e/yr</strong></span>
                    <span>Confidence: <strong className={riskTheme.text}>{confidenceScore === null ? 'Not scanned' : `${confidenceScore}%`}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Public Challenge Modal */}
      {activeProjectForDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                <Flag className="w-5 h-5" />
                Submit Formal Baseline Dispute
              </div>
              <button
                onClick={() => setActiveProjectForDispute(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Submit formal dispute against <strong className="text-white">{activeProjectForDispute.project.name}</strong> (<span className="font-mono text-emerald-400">{activeProjectForDispute.project.project_id}</span>). Staked verifiers will arbitrate this telemetry discrepancy.
            </p>

            <div className="space-y-2 text-xs">
              <label className="text-slate-400 font-semibold">Dispute Category</label>
              <select 
                value={challengeCategory}
                onChange={(e) => setChallengeCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="Capex Overclaim / Unsupported Financial Invoices">Capex Overclaim / Unsupported Financial Invoices</option>
                <option value="Satellite Spectral Divergence (Depleted Canopy NDVI)">Satellite Spectral Divergence (Depleted Canopy NDVI)</option>
                <option value="Sensor Drift / Fabricated Ground Flux Data">Sensor Drift / Fabricated Ground Flux Data</option>
                <option value="Land Boundary Conflict / Double Counting">Land Boundary Conflict / Double Counting</option>
              </select>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-slate-400 font-semibold">Discrepancy Evidence & Notes</label>
              <textarea
                rows={3}
                value={challengeReason}
                onChange={(e) => setChallengeReason(e.target.value)}
                placeholder="Explain the specific variance or discrepancy observed in the baseline telemetry..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveProjectForDispute(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitChallenge}
                disabled={isSubmittingChallenge}
                className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmittingChallenge ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
                {isSubmittingChallenge ? 'Submitting Dispute...' : 'Submit Formal Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
