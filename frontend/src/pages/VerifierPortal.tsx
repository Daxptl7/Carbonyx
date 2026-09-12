import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  ClipboardCheck,
  FileQuestion,
  History,
  Vote,
  Scale,
  Send,
  FileText,
  Radio,
  Satellite,
  Eye,
  MapPin,
  X
} from 'lucide-react';
import { apiFetch, readApiJson } from '../lib/auth';
import { ActivityBarChart, ActivityDonutChart } from '../components/ActivityCharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';
const CHECKLIST_ITEMS = [
  { key: 'identity', label: 'Project identity and ownership confirmed' },
  { key: 'financial', label: 'Financial additionality evidence reviewed' },
  { key: 'iot', label: 'Ground IoT readings and signatures validated' },
  { key: 'satellite', label: 'Satellite observations match the monitoring period' },
  { key: 'duplicate', label: 'Duplicate issuance and prior-credit check completed' }
] as const;

const emptyChecklist = () => Object.fromEntries(CHECKLIST_ITEMS.map((item) => [item.key, false])) as Record<string, boolean>;

export default function VerifierPortal({ walletAddress }: { walletAddress: string | null }) {
  const [stakedAmount, setStakedAmount] = useState<number>(0.25);
  const [reputationScore, setReputationScore] = useState<number>(98);
  const [anomalyQueue, setAnomalyQueue] = useState<any[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<any | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [checklist, setChecklist] = useState<Record<string, boolean>>(emptyChecklist);
  const [auditNotes, setAuditNotes] = useState('');
  const [decisionConfidence, setDecisionConfidence] = useState(85);
  const [recommendedTonnage, setRecommendedTonnage] = useState(0);
  const [conflictConfirmed, setConflictConfirmed] = useState(false);
  const [showEvidenceRequest, setShowEvidenceRequest] = useState(false);
  const [requestCategory, setRequestCategory] = useState('ADDITIONAL_DOCUMENTATION');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestDueDate, setRequestDueDate] = useState('');

  const fetchQueue = async () => {
    setIsLoadingQueue(true);
    try {
      const res = await apiFetch(`${API_URL}/api/verifiers/queue`);
      const data = await readApiJson<any>(res);
      if (!res.ok) throw new Error(data.error || 'Unable to load verifier queue');
      if (data.queue) {
        setAnomalyQueue(data.queue);
        setSelectedBundle((current: any) =>
          data.queue.find((item: any) => item.id === current?.id) || null
        );
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

  useEffect(() => {
    setChecklist(emptyChecklist());
    setAuditNotes('');
    setDecisionConfidence(Number(selectedBundle?.confidence_score || 85));
    setRecommendedTonnage(Number(selectedBundle?.evidence_bundles?.projects?.claimed_annual_tonnage || 0));
    setConflictConfirmed(false);
    setShowEvidenceRequest(false);
    setRequestMessage('');
    setActionError('');
    setActionMessage('');
  }, [selectedBundle?.id]);

  const handleStake = async () => {
    if (!walletAddress) {
      setActionError('Connect the accredited verifier wallet before staking.');
      return;
    }

    setIsSubmittingAction(true);
    setActionError('');
    const nextStake = +(stakedAmount + 0.1).toFixed(2);
    try {
      const response = await apiFetch(`${API_URL}/api/verifiers/stake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verifierAddress: walletAddress, stakedAmount: nextStake })
      });
      const data = await readApiJson<any>(response);
      if (!response.ok) throw new Error(data.error || 'Unable to record verifier stake');
      setStakedAmount(Number(data.verifier?.staked_amount ?? nextStake));
    } catch (error: any) {
      setActionError(error.message || 'Unable to record verifier stake');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleReview = async (approved: boolean) => {
    if (!selectedBundle || !walletAddress) {
      setActionError('Select a bundle and connect the accredited verifier wallet.');
      return;
    }
    if (!CHECKLIST_ITEMS.every((item) => checklist[item.key])) {
      setActionError('Complete all five verification checks before submitting your decision.');
      return;
    }
    if (!conflictConfirmed) {
      setActionError('Confirm the conflict-of-interest declaration before submitting.');
      return;
    }
    if (auditNotes.trim().length < 10) {
      setActionError('Add detailed audit notes before submitting your decision.');
      return;
    }

    setIsSubmittingAction(true);
    setActionError('');
    setActionMessage('');
    try {
      const response = await apiFetch(`${API_URL}/api/verifiers/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bundleId: selectedBundle.bundle_id,
          verifierAddress: walletAddress,
          approved,
          auditNotes,
          checklist,
          conflictConfirmed,
          decisionConfidence,
          recommendedTonnage
        })
      });
      const data = await readApiJson<any>(response);
      if (!response.ok) throw new Error(data.error || 'Unable to submit verifier decision');
      setActionMessage(data.message || 'Verifier decision recorded.');
      if (data.finalized) setSelectedBundle(null);
      await fetchQueue();
    } catch (error: any) {
      setActionError(error.message || 'Unable to submit verifier decision');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleEvidenceRequest = async () => {
    if (!selectedBundle || !walletAddress) {
      setActionError('Select a bundle and connect the accredited verifier wallet.');
      return;
    }
    if (requestMessage.trim().length < 10) {
      setActionError('Describe the additional evidence needed in at least 10 characters.');
      return;
    }

    setIsSubmittingAction(true);
    setActionError('');
    setActionMessage('');
    try {
      const response = await apiFetch(`${API_URL}/api/verifiers/request-evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bundleId: selectedBundle.bundle_id,
          verifierAddress: walletAddress,
          category: requestCategory,
          message: requestMessage,
          dueDate: requestDueDate || null
        })
      });
      const data = await readApiJson<any>(response);
      if (!response.ok) throw new Error(data.error || 'Unable to request additional evidence');
      setActionMessage(data.message || 'Evidence request recorded.');
      setShowEvidenceRequest(false);
      setRequestMessage('');
      await fetchQueue();
    } catch (error: any) {
      setActionError(error.message || 'Unable to request additional evidence');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const selectBundle = (item: any) => {
    setSelectedBundle(item);
    setActionError('');
    setActionMessage('');
  };

  const queueRiskDistribution = [
    { label: 'High risk', value: anomalyQueue.filter((item) => item.risk_level === 'HIGH').length, color: '#ef4444' },
    { label: 'Medium risk', value: anomalyQueue.filter((item) => item.risk_level === 'MEDIUM').length, color: '#f59e0b' },
    { label: 'Low risk', value: anomalyQueue.filter((item) => item.risk_level === 'LOW').length, color: '#15ed48' }
  ];
  const queueConfidence = anomalyQueue.slice(0, 6).map((item) => ({
    label: String(item.evidence_bundles?.project_id || item.bundle_id || 'Bundle').slice(-12),
    value: Number(item.confidence_score) || 0,
    color: item.risk_level === 'HIGH' ? '#ef4444' : item.risk_level === 'MEDIUM' ? '#f59e0b' : '#15ed48'
  }));
  const project = selectedBundle?.evidence_bundles?.projects || null;
  const evidenceItems = selectedBundle?.evidence_bundles?.evidence_items || [];
  const operationalEvidence = evidenceItems.find((item: any) => item.source_type === 'OPERATIONAL_DOC')?.payload || {};
  const iotEvidence = evidenceItems.find((item: any) => item.source_type === 'IOT_SENSOR')?.payload || {};
  const satelliteEvidence = evidenceItems.find((item: any) => item.source_type === 'SATELLITE_NDVI')?.payload || {};
  const currentVerifierVoted = Boolean(walletAddress && selectedBundle?.quorum?.votes?.some(
    (voteItem: any) => String(voteItem.verifierAddress || '').toLowerCase() === walletAddress.toLowerCase()
  ));
  const checklistComplete = CHECKLIST_ITEMS.every((item) => checklist[item.key]);
  const reviewTimeline = [
    ...(selectedBundle?.evidence_bundles?.created_at ? [{
      id: 'submitted',
      action: 'BUNDLE_SUBMITTED',
      submitted_at: selectedBundle.evidence_bundles.created_at,
      payload: { message: 'Multi-source evidence bundle submitted by the project proponent.' }
    }] : []),
    ...(selectedBundle?.computed_at ? [{
      id: 'risk',
      action: 'AI_RISK_ASSESSED',
      submitted_at: selectedBundle.computed_at,
      payload: { message: `${selectedBundle.risk_level} risk classification at ${selectedBundle.confidence_score}% confidence.` }
    }] : []),
    ...(selectedBundle?.review_history || []).map((item: any) => ({
      ...item,
      action: item.payload?.action || (typeof item.payload?.approved === 'boolean' ? 'DECISION' : 'REVIEW_NOTE')
    }))
  ].sort((a: any, b: any) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Time not recorded' : date.toLocaleString();
  };

  return (
    <div className="space-y-8 text-left w-full max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="portal-page-header flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-glass">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-[#15ed48]">
              <Shield className="h-5 w-5" />
            </span>
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
        <div className="metric-summary-card p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-glass">
          <span className="text-xs text-slate-400">Staked Collateral</span>
          <div className="text-2xl font-black font-mono text-[#008a05] mt-1">{stakedAmount} ETH</div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#008a05]" />
            Active in Verifier Pool (Min 0.1 ETH)
          </div>
        </div>

        <div className="metric-summary-card p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-glass">
          <span className="text-xs text-slate-400">Reputation Score</span>
          <div className="text-2xl font-black font-mono text-[#00a699] mt-1">{reputationScore} / 100</div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-[#00a699]" />
            Top 5% Auditor Tier
          </div>
        </div>

        <div className="metric-summary-card p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-glass">
          <span className="text-xs text-slate-400">Slashing Protection</span>
          <div className="text-2xl font-black font-mono text-[#EF4444] mt-1">50% Slash</div>
          <div className="text-[11px] text-slate-400 mt-2">
            Automated slashing if dispute upheld
          </div>
        </div>

        <div className="metric-summary-card p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-glass flex flex-col justify-center">
          <button
            onClick={handleStake}
            disabled={isSubmittingAction || !walletAddress}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#EF4444] text-black font-bold text-xs hover:opacity-90 transition-all shadow"
          >
            {isSubmittingAction ? 'Submitting…' : 'Deposit +0.1 ETH Stake'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ActivityBarChart
          title="Review queue confidence"
          subtitle="AI confidence for the next evidence bundles awaiting human review"
          data={queueConfidence}
          formatValue={(value) => `${value}%`}
        />
        <ActivityDonutChart
          title="Anomaly queue risk mix"
          subtitle="Distribution of verifier-required bundles by AI risk level"
          data={queueRiskDistribution}
          valueLabel="bundles"
        />
      </div>

      {actionError && (
        <div className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 px-4 py-3 text-xs text-[#EF4444]">
          {actionError}
        </div>
      )}
      {actionMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-700">
          {actionMessage}
        </div>
      )}

      {/* Portfolio-style anomaly queue */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-300">
                <AlertTriangle className="h-4 w-4 text-[#EF4444]" />
                Anomaly review queue
              </h3>
              <p className="mt-1 text-[10px] text-slate-500">Review every escalated baseline in a single list, then open the full case workspace.</p>
            </div>
            <span className="rounded-full border border-slate-300 px-2.5 py-1 text-[10px] font-bold text-slate-600">{anomalyQueue.length} CASES</span>
          </div>

          {anomalyQueue.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No flagged evidence bundles currently in queue.
            </div>
          ) : (
            <div>
              <div className="hidden grid-cols-[1.7fr_1.25fr_.7fr_.7fr_.7fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 md:grid">
                <span>Project</span><span>Bundle</span><span>Risk</span><span>Confidence</span><span>Quorum</span><span>Details</span>
              </div>
              <div className="divide-y divide-slate-200">
              {anomalyQueue.map((item) => (
                <article
                  key={item.id}
                  className="grid gap-4 px-5 py-4 transition hover:bg-slate-50 md:grid-cols-[1.7fr_1.25fr_.7fr_.7fr_.7fr_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 md:hidden">Project</div>
                    <div className="mt-0.5 truncate text-sm font-semibold text-slate-900">{item.evidence_bundles?.projects?.name || item.evidence_bundles?.project_id || 'Unnamed project'}</div>
                    <div className="mt-1 flex items-center gap-1 truncate text-[10px] text-slate-500"><MapPin className="h-3 w-3 flex-shrink-0" />{item.evidence_bundles?.projects?.location?.region || 'Location unavailable'}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 md:hidden">Bundle</div>
                    <div className="mt-0.5 truncate font-mono text-[10px] text-[#008a83]">{item.bundle_id}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 md:hidden">Risk</div>
                    <span className={`mt-0.5 inline-flex rounded-full border px-2.5 py-1 text-[9px] font-bold ${item.risk_level === 'HIGH' ? 'border-red-200 text-red-600' : item.risk_level === 'MEDIUM' ? 'border-amber-200 text-amber-700' : 'border-emerald-200 text-emerald-700'}`}>
                      {item.risk_level}
                    </span>
                  </div>
                  <div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 md:hidden">Confidence</div><div className="mt-0.5 font-mono text-xs font-bold text-slate-900">{item.confidence_score}%</div></div>
                  <div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 md:hidden">Quorum</div><div className="mt-0.5 font-mono text-xs font-bold text-slate-900">{Math.max(item.quorum?.approvals || 0, item.quorum?.rejections || 0)}/{item.quorum?.required || 1} votes</div></div>
                  <button
                    type="button"
                    onClick={() => selectBundle(item)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 transition hover:border-[#00a699] hover:text-[#008a83]"
                    aria-label={`View full details for ${item.evidence_bundles?.projects?.name || item.bundle_id}`}
                  >
                    <Eye className="h-3.5 w-3.5" /> View full details
                  </button>
                </article>
              ))}
              </div>
            </div>
          )}
      </div>

      {/* Full case workspace opens only from the list action. */}
      {selectedBundle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-labelledby="verifier-case-title">
          <section className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-slate-300 bg-[#f7f7f7] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#008a83]">Anomaly case review</div>
                <h2 id="verifier-case-title" className="mt-1 truncate text-xl font-black text-slate-900">{project?.name || selectedBundle.evidence_bundles?.project_id}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] text-slate-500">
                  <span>{selectedBundle.bundle_id}</span><span>•</span><span>{selectedBundle.confidence_score}% confidence</span><span>•</span><span className="font-bold text-red-600">{selectedBundle.risk_level} risk</span>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedBundle(null)} aria-label="Close case details" className="rounded-full border border-slate-300 bg-white p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              {actionError && <div className="rounded-xl border border-red-200 bg-white px-4 py-3 text-xs text-red-600">{actionError}</div>}
              {actionMessage && <div className="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-xs font-medium text-emerald-700">{actionMessage}</div>}
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-900">Complete evidence and verification details</h3>
                <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[10px] font-bold text-slate-600">FULL CASE FILE</span>
              </div>
            <div className="space-y-4">
              {/* Quorum and project context */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <Vote className="h-4 w-4 text-violet-500" /> Independent review quorum
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      High-risk cases require matching decisions from two distinct staked wallets.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-emerald-200 px-3 py-1 text-[10px] font-bold text-emerald-700">
                      {selectedBundle.quorum?.approvals || 0} APPROVE
                    </span>
                    <span className="rounded-full border border-red-200 px-3 py-1 text-[10px] font-bold text-red-600">
                      {selectedBundle.quorum?.rejections || 0} REJECT
                    </span>
                    <span className="rounded-full border border-slate-300 px-3 py-1 text-[10px] font-bold text-slate-700">
                      {Math.max(selectedBundle.quorum?.approvals || 0, selectedBundle.quorum?.rejections || 0)}/{selectedBundle.quorum?.required || 1} QUORUM
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Project</div>
                  <div className="mt-1 truncate text-xs font-bold text-slate-900">{project?.name || selectedBundle.evidence_bundles?.project_id}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Methodology</div>
                  <div className="mt-1 text-xs font-bold text-slate-900">{String(project?.project_type || 'Not recorded').replace(/_/g, ' ')}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Declared volume</div>
                  <div className="mt-1 font-mono text-xs font-bold text-slate-900">{Number(project?.claimed_annual_tonnage || 0).toLocaleString()} tCO2e</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Evidence integrity</div>
                  <div className="mt-1 text-xs font-bold text-emerald-700">{evidenceItems.filter((item: any) => item.integrity_status === 'VALID').length}/{evidenceItems.length} VALID</div>
                </div>
              </div>

              {/* Evidence comparison */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 text-xs font-bold text-slate-900">
                  <Scale className="h-4 w-4 text-[#00a699]" /> Cross-source evidence comparison
                </div>
                <div className="grid grid-cols-1 divide-y divide-slate-200 md:grid-cols-3 md:divide-x md:divide-y-0">
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-700"><FileText className="h-3.5 w-3.5" /> Financial proof</div>
                    <div className="mt-2 font-mono text-lg font-black text-slate-900">${Number(operationalEvidence.projectCapexUsd || 0).toLocaleString()}</div>
                    <p className="mt-1 truncate text-[11px] text-slate-500">{operationalEvidence.auditorFirm || 'Auditor not recorded'}</p>
                    <p className="mt-1 text-[10px] font-semibold text-emerald-700">Additionality evidence submitted</p>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-cyan-700"><Radio className="h-3.5 w-3.5" /> Ground IoT</div>
                    <div className="mt-2 font-mono text-lg font-black text-slate-900">{iotEvidence.co2FluxPpm ?? '—'} ppm/hr</div>
                    <p className="mt-1 text-[11px] text-slate-500">Biomass {iotEvidence.biomassKgM2 ?? '—'} kg/m² · Moisture {iotEvidence.soilMoisturePct ?? '—'}%</p>
                    <p className="mt-1 text-[10px] font-semibold text-slate-600">Sensor {iotEvidence.sensorId || 'not recorded'}</p>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-sky-700"><Satellite className="h-3.5 w-3.5" /> Satellite</div>
                    <div className="mt-2 font-mono text-lg font-black text-slate-900">{satelliteEvidence.meanNdvi ?? '—'} NDVI</div>
                    <p className="mt-1 text-[11px] text-slate-500">Canopy {satelliteEvidence.canopyCoveragePct ?? '—'}% · Cloud {satelliteEvidence.cloudCoverPct ?? '—'}%</p>
                    <p className="mt-1 truncate text-[10px] font-semibold text-slate-600">{satelliteEvidence.satellite || 'Provider not recorded'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {/* Anomaly Flags and XAI */}
                <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-bold text-red-600">Raised anomaly flags</div>
                  <div className="max-h-40 space-y-1.5 overflow-y-auto">
                    {(selectedBundle.anomaly_flags || []).length ? (selectedBundle.anomaly_flags || []).map((flag: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-1.5 rounded-lg border border-red-100 px-2.5 py-2 text-[11px] font-mono text-slate-700">
                        <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0 text-red-500" />
                        <span>{flag}</span>
                      </div>
                    )) : <p className="text-[11px] text-slate-500">No structured anomaly flags were returned.</p>}
                  </div>
                  <div className="border-t border-slate-200 pt-3 text-xs leading-relaxed text-slate-700">
                    <span className="font-bold text-[#008a83]">Explainable AI: </span>{selectedBundle.explanation_reason}
                  </div>
                </div>

                {/* Mandatory checklist */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900"><ClipboardCheck className="h-4 w-4 text-emerald-600" /> Mandatory verification checklist</div>
                    <span className="text-[10px] font-bold text-slate-500">{Object.values(checklist).filter(Boolean).length}/5</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {CHECKLIST_ITEMS.map((item) => (
                      <label key={item.key} className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 px-3 py-2 text-[11px] text-slate-700 hover:border-emerald-300">
                        <input
                          type="checkbox"
                          checked={Boolean(checklist[item.key])}
                          onChange={(event) => setChecklist({ ...checklist, [item.key]: event.target.checked })}
                          className="mt-0.5 h-3.5 w-3.5 accent-emerald-500"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detailed verdict */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Detailed verifier verdict</div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="text-[11px] font-semibold text-slate-600">
                    Decision confidence
                    <div className="mt-1.5 flex items-center gap-3">
                      <input type="range" min="0" max="100" value={decisionConfidence} onChange={(event) => setDecisionConfidence(Number(event.target.value))} className="w-full accent-emerald-500" />
                      <span className="w-10 font-mono text-xs font-bold text-slate-900">{decisionConfidence}%</span>
                    </div>
                  </label>
                  <label className="text-[11px] font-semibold text-slate-600">
                    Recommended issuance (tCO2e)
                    <input type="number" min="0" value={recommendedTonnage} onChange={(event) => setRecommendedTonnage(Number(event.target.value))} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 outline-none focus:border-emerald-500" />
                  </label>
                  <label className="text-[11px] font-semibold text-slate-600 sm:col-span-2">
                    Findings and decision rationale
                    <textarea rows={4} value={auditNotes} onChange={(event) => setAuditNotes(event.target.value)} placeholder="Explain the evidence reviewed, anomalies resolved, and basis for your decision…" className="mt-1.5 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs leading-5 text-slate-900 outline-none focus:border-emerald-500" />
                  </label>
                </div>
                <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 p-3 text-[11px] text-slate-700">
                  <input type="checkbox" checked={conflictConfirmed} onChange={(event) => setConflictConfirmed(event.target.checked)} className="mt-0.5 h-3.5 w-3.5 accent-emerald-500" />
                  <span><strong>Conflict-of-interest declaration:</strong> I confirm that I have no financial, employment, or organizational relationship with this project proponent.</span>
                </label>
                {currentVerifierVoted && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
                    This wallet has already voted. A different staked verifier must provide the next decision.
                  </div>
                )}
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4">
                  <button onClick={() => setShowEvidenceRequest(!showEvidenceRequest)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <FileQuestion className="h-3.5 w-3.5" /> Request more evidence
                  </button>
                  <button onClick={() => handleReview(false)} disabled={isSubmittingAction || !walletAddress || currentVerifierVoted || !checklistComplete || !conflictConfirmed} className="rounded-xl border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40">
                    Reject baseline
                  </button>
                  <button onClick={() => handleReview(true)} disabled={isSubmittingAction || !walletAddress || currentVerifierVoted || !checklistComplete || !conflictConfirmed} className="rounded-xl bg-[#15ed48] px-4 py-2 text-xs font-bold text-slate-950 hover:bg-[#12d23f] disabled:opacity-40">
                    {isSubmittingAction ? 'Submitting…' : 'Submit approval vote'}
                  </button>
                </div>
              </div>

              {/* Evidence request */}
              {showEvidenceRequest && (
                <div className="rounded-xl border border-amber-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900"><FileQuestion className="h-4 w-4 text-amber-500" /> Request additional evidence</div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="text-[11px] font-semibold text-slate-600">Request category
                      <select value={requestCategory} onChange={(event) => setRequestCategory(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900">
                        <option value="ADDITIONAL_DOCUMENTATION">Additional documentation</option>
                        <option value="IOT_READING">New IoT sensor reading</option>
                        <option value="SATELLITE_SNAPSHOT">Updated satellite snapshot</option>
                        <option value="FIELD_SAMPLE">Physical field sample</option>
                        <option value="FINANCIAL_CLARIFICATION">Financial clarification</option>
                      </select>
                    </label>
                    <label className="text-[11px] font-semibold text-slate-600">Requested response date
                      <input type="date" value={requestDueDate} onChange={(event) => setRequestDueDate(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900" />
                    </label>
                    <label className="text-[11px] font-semibold text-slate-600 sm:col-span-2">Instructions for the project proponent
                      <textarea rows={3} value={requestMessage} onChange={(event) => setRequestMessage(event.target.value)} placeholder="Describe exactly what evidence is missing and the acceptable format…" className="mt-1.5 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-400" />
                    </label>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button onClick={handleEvidenceRequest} disabled={isSubmittingAction || requestMessage.trim().length < 10} className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-40"><Send className="h-3.5 w-3.5" /> Send evidence request</button>
                  </div>
                </div>
              )}

              {/* Audit timeline */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900"><History className="h-4 w-4 text-violet-500" /> Immutable review activity</div>
                <div className="mt-4 space-y-0">
                  {reviewTimeline.map((event: any, index: number) => {
                    const isDecision = event.action === 'DECISION';
                    const title = event.action === 'BUNDLE_SUBMITTED'
                      ? 'Evidence bundle submitted'
                      : event.action === 'AI_RISK_ASSESSED'
                        ? 'AI risk assessment completed'
                        : event.action === 'EVIDENCE_REQUESTED'
                          ? 'Additional evidence requested'
                          : isDecision
                            ? `${event.payload?.approved ? 'Approval' : 'Rejection'} vote submitted`
                            : 'Verifier review updated';
                    const detail = event.payload?.message || event.payload?.auditNotes || 'Signed audit event recorded.';
                    return (
                      <div key={event.id || `${event.action}-${index}`} className="relative flex gap-3 pb-4 last:pb-0">
                        {index < reviewTimeline.length - 1 && <span className="absolute left-[7px] top-4 h-full w-px bg-slate-200" />}
                        <span className="relative mt-1 h-4 w-4 flex-shrink-0 rounded-full border-4 border-white bg-[#00a699]" />
                        <div>
                          <div className="text-[11px] font-bold text-slate-900">{title}</div>
                          <p className="mt-0.5 text-[10px] leading-4 text-slate-500">{detail}</p>
                          <div className="mt-1 font-mono text-[9px] text-slate-400">{formatDateTime(event.submitted_at)}{event.payload?.verifierAddress ? ` · ${String(event.payload.verifierAddress).slice(0, 8)}…${String(event.payload.verifierAddress).slice(-6)}` : ''}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
