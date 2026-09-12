import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, Bell, CheckCircle2, Database, Download, Eye, FileSearch,
  Gavel, MapPin, RefreshCw, Search, Settings2, ShieldAlert, Star,
  UserCheck, X
} from 'lucide-react';
import { apiFetch, readApiJson } from '../lib/auth';
import { ActivityBarChart, ActivityDonutChart } from '../components/ActivityCharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';
const ACTIONS = [
  ['SUSPEND_PROJECT', 'Suspend project'],
  ['CLEAR_PROJECT', 'Clear project'],
  ['FREEZE_TRANSFERS', 'Freeze credit transfers'],
  ['REVOKE_CREDITS', 'Revoke active credits'],
  ['REOPEN_REVIEW', 'Reopen verification'],
  ['REQUIRE_MONITORING', 'Require additional monitoring']
];
const DEFAULT_POLICY = {
  minimumAiConfidence: 85,
  maximumEvidenceDeviation: 15,
  highRiskVerifierQuorum: 2,
  observationWindowDays: 14,
  automaticEscalation: true
};

export default function AuditorExplorer() {
  const [data, setData] = useState<any>({ investigations: [], credits: [], verifiers: [], disputes: [], integrityAlerts: [], actions: [], watchlist: [], policy: DEFAULT_POLICY });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [showActionForm, setShowActionForm] = useState(false);
  const [actionType, setActionType] = useState('SUSPEND_PROJECT');
  const [actionReason, setActionReason] = useState('');
  const [showPolicy, setShowPolicy] = useState(false);
  const [policy, setPolicy] = useState<any>(DEFAULT_POLICY);

  const fetchOverview = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await apiFetch(`${API_URL}/api/regulator/overview`);
      const payload = await readApiJson<any>(response);
      if (!response.ok) throw new Error(payload.error || 'Unable to load regulatory overview');
      setData(payload);
      setPolicy({ ...DEFAULT_POLICY, ...(payload.policy || {}) });
      setSelectedCase((current: any) => payload.investigations?.find((item: any) => item.project.project_id === current?.project?.project_id) || null);
    } catch (loadError: any) {
      setError(loadError.message || 'Unable to load regulatory overview');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchOverview(); }, []);

  const investigations = data.investigations || [];
  const credits = data.credits || [];
  const verifiers = data.verifiers || [];
  const alerts = data.integrityAlerts || [];
  const openDisputes = (data.disputes || []).filter((item: any) => item.status === 'OPEN');
  const highRisk = investigations.filter((item: any) => item.risk?.risk_level === 'HIGH');
  const suspended = investigations.filter((item: any) => item.project?.status === 'SUSPENDED');
  const issuedVolume = credits.reduce((sum: number, item: any) => sum + (Number(item.co2_tonnage) || 0), 0);
  const retiredVolume = credits.filter((item: any) => item.status === 'RETIRED').reduce((sum: number, item: any) => sum + (Number(item.co2_tonnage) || 0), 0);
  const watched = (type: string, id: string) => (data.watchlist || []).some((item: any) => item.entity_type === type && item.entity_id === id);

  const filtered = investigations.filter((item: any) => {
    const searchable = [item.project?.name, item.project?.project_id, item.project?.location?.country, item.project?.location?.region].join(' ').toLowerCase();
    return (!query.trim() || searchable.includes(query.trim().toLowerCase()))
      && (riskFilter === 'ALL' || (riskFilter === 'UNSCANNED' ? !item.risk : item.risk?.risk_level === riskFilter));
  });

  const riskDistribution = ['LOW', 'MEDIUM', 'HIGH', 'UNSCANNED'].map((risk, index) => ({
    label: risk === 'UNSCANNED' ? 'Awaiting scan' : `${risk[0]}${risk.slice(1).toLowerCase()} risk`,
    value: investigations.filter((item: any) => risk === 'UNSCANNED' ? !item.risk : item.risk?.risk_level === risk).length,
    color: ['#15ed48', '#f59e0b', '#ef4444', '#94a3b8'][index]
  }));

  const jurisdictions = useMemo(() => {
    const totals: Record<string, number> = investigations.reduce((result: Record<string, number>, item: any) => {
      const country = item.project?.location?.country || 'Unknown';
      result[country] = (result[country] || 0) + 1;
      return result;
    }, {});
    return Object.entries(totals).map(([label, value], index) => ({ label, value: Number(value), color: ['#00a699', '#15ed48', '#38bdf8', '#f59e0b', '#8b5cf6'][index % 5] }));
  }, [investigations]);

  const issuanceByVintage = useMemo(() => {
    const totals: Record<string, number> = credits.reduce((result: Record<string, number>, item: any) => {
      const vintage = String(item.vintage_year || 'Unknown');
      result[vintage] = (result[vintage] || 0) + (Number(item.co2_tonnage) || 0);
      return result;
    }, {});
    return Object.entries(totals).sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label, value: Number(value), color: '#00a699' }));
  }, [credits]);

  const callRegulatorApi = async (path: string, body: any) => {
    const response = await apiFetch(`${API_URL}/api/regulator/${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    const payload = await readApiJson<any>(response);
    if (!response.ok) throw new Error(payload.error || 'Regulatory action failed');
    return payload;
  };

  const toggleWatch = async (type: string, id: string) => {
    setIsSubmitting(true); setError(''); setMessage('');
    try {
      const payload = await callRegulatorApi('watchlist', { entityType: type, entityId: id });
      setMessage(payload.message); await fetchOverview();
    } catch (submitError: any) { setError(submitError.message); }
    finally { setIsSubmitting(false); }
  };

  const submitAction = async () => {
    if (!selectedCase || actionReason.trim().length < 10) return setError('Provide an enforcement reason of at least 10 characters.');
    setIsSubmitting(true); setError(''); setMessage('');
    try {
      const payload = await callRegulatorApi('actions', { projectId: selectedCase.project.project_id, actionType, reason: actionReason });
      setMessage(payload.message); setActionReason(''); setShowActionForm(false); await fetchOverview();
    } catch (submitError: any) { setError(submitError.message); }
    finally { setIsSubmitting(false); }
  };

  const resolveDispute = async (disputeId: string, ruling: 'UPHELD' | 'DISMISSED') => {
    const reason = window.prompt(`Enter the reason for the ${ruling.toLowerCase()} ruling:`)?.trim();
    if (!reason || reason.length < 10) {
      setError('A dispute ruling requires a reason of at least 10 characters.');
      return;
    }
    setIsSubmitting(true); setError(''); setMessage('');
    try {
      const payload = await callRegulatorApi(`disputes/${disputeId}/resolve`, { ruling, reason });
      setMessage(payload.message); await fetchOverview();
    } catch (submitError: any) { setError(submitError.message); }
    finally { setIsSubmitting(false); }
  };

  const savePolicy = async () => {
    setIsSubmitting(true); setError('');
    try {
      const payload = await callRegulatorApi('policy', { settings: policy });
      setMessage(payload.message); setShowPolicy(false); await fetchOverview();
    } catch (submitError: any) { setError(submitError.message); }
    finally { setIsSubmitting(false); }
  };

  const downloadReport = () => {
    const report = { generatedAt: new Date().toISOString(), summary: { projects: investigations.length, highRisk: highRisk.length, openDisputes: openDisputes.length, issuedVolume, retiredVolume }, policy, alerts, investigations, verifiers, actions: data.actions || [] };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `carbonyx-regulatory-report-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url);
  };

  const openCase = (item: any) => {
    setSelectedCase(item); setShowActionForm(false); setActionReason(''); setError(''); setMessage('');
  };

  const formatDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Not recorded' : date.toLocaleString();
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 text-left">
      <div className="portal-page-header flex flex-col items-start justify-between gap-4 p-5 md:flex-row md:items-center">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#008a83]">Institutional oversight workspace</div>
          <h1 className="mt-2 flex items-center gap-3 font-black text-slate-900"><Database className="h-8 w-8 text-[#15ed48]" /> Regulator Market Integrity Console</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">Monitor the complete carbon market, investigate suspicious projects, supervise verifiers, and record enforceable regulatory decisions.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowPolicy(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700"><Settings2 className="h-3.5 w-3.5" /> Policy controls</button>
          <button onClick={downloadReport} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700"><Download className="h-3.5 w-3.5" /> Export report</button>
          <button onClick={fetchOverview} disabled={isLoading} className="inline-flex items-center gap-1.5 rounded-xl bg-[#15ed48] px-3.5 py-2 text-xs font-bold text-slate-950"><RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh</button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-white px-4 py-3 text-xs text-red-600">{error}</div>}
      {message && <div className="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-xs font-medium text-emerald-700">{message}</div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {[
          ['Registered projects', investigations.length, 'Complete market registry'],
          ['Issued volume', issuedVolume.toLocaleString(), 'Verified tCO2e'],
          ['Retired volume', retiredVolume.toLocaleString(), 'Permanently retired tCO2e'],
          ['High-risk cases', highRisk.length, 'AI or evidence escalation'],
          ['Open disputes', openDisputes.length, 'Awaiting a ruling'],
          ['Suspended', suspended.length, 'Projects under enforcement']
        ].map(([label, value, description]) => (
          <div key={label} className="metric-summary-card rounded-2xl border p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
            <div className="mt-2 font-mono text-2xl font-black text-slate-900">{value}</div>
            <p className="mt-1 text-[10px] text-slate-500">{description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ActivityDonutChart title="Market risk distribution" subtitle="AI classification across registered projects" data={riskDistribution} valueLabel="projects" />
        <ActivityBarChart title="Issuance by vintage" subtitle="Total verified carbon volume by credit vintage" data={issuanceByVintage} valueLabel="tCO2e" formatValue={(value) => value.toLocaleString()} />
        <ActivityDonutChart title="Geographic oversight" subtitle="Registered projects grouped by jurisdiction" data={jurisdictions} valueLabel="projects" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div><h2 className="flex items-center gap-2 text-base font-bold text-slate-900"><ShieldAlert className="h-5 w-5 text-red-500" /> Double-counting and integrity alerts</h2><p className="mt-1 text-xs text-slate-500">Automated checks for reused roots, snapshots, and overlapping jurisdictions.</p></div>
            <span className="rounded-full border border-slate-300 px-2.5 py-1 text-[10px] font-bold text-slate-600">{alerts.length} ALERTS</span>
          </div>
          <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
            {alerts.length ? alerts.map((alert: any) => (
              <div key={alert.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-2"><div className="text-xs font-bold text-slate-900">{alert.title}</div><span className={`text-[9px] font-bold ${alert.severity === 'CRITICAL' ? 'text-red-600' : alert.severity === 'HIGH' ? 'text-orange-600' : 'text-amber-700'}`}>{alert.severity}</span></div>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">{alert.detail}</p>
              </div>
            )) : <div className="rounded-xl border border-emerald-200 p-4 text-xs text-emerald-700"><CheckCircle2 className="mr-2 inline h-4 w-4" />No duplicate evidence signals detected.</div>}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-base font-bold text-slate-900"><UserCheck className="h-5 w-5 text-[#00a699]" /> Verifier supervision</h2><p className="mt-1 text-xs text-slate-500">Stake, reputation, review volume, and slashing exposure.</p></div><span className="rounded-full border border-slate-300 px-2.5 py-1 text-[10px] font-bold text-slate-600">{verifiers.length} VERIFIERS</span></div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="border-b border-slate-200 text-[9px] uppercase tracking-wider text-slate-500"><tr><th className="pb-2">Wallet</th><th className="pb-2">Stake</th><th className="pb-2">Reputation</th><th className="pb-2">Reviews</th><th className="pb-2">Slashed</th><th className="pb-2 text-right">Watch</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{verifiers.map((verifier: any) => (
                <tr key={verifier.verifier_address}><td className="py-3 font-mono text-[10px] text-slate-700">{String(verifier.verifier_address).slice(0, 8)}…{String(verifier.verifier_address).slice(-6)}</td><td className="py-3 font-mono font-bold">{verifier.staked_amount} ETH</td><td className="py-3 font-bold text-emerald-700">{verifier.reputation_score}/100</td><td className="py-3">{verifier.total_verified || 0}</td><td className="py-3 text-red-600">{verifier.total_slashed || 0}</td><td className="py-3 text-right"><button onClick={() => toggleWatch('VERIFIER', verifier.verifier_address)} disabled={isSubmitting} aria-label="Toggle verifier watchlist"><Star className={`h-4 w-4 ${watched('VERIFIER', verifier.verifier_address) ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} /></button></td></tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center">
          <div><h2 className="flex items-center gap-2 text-base font-bold text-slate-900"><FileSearch className="h-5 w-5 text-[#00a699]" /> Regulatory investigation registry</h2><p className="mt-1 text-xs text-slate-500">Open a complete case file before applying an enforcement action.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects or regions…" className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-[#00a699] sm:w-64" /></label>
            <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700"><option value="ALL">All risk levels</option><option value="HIGH">High risk</option><option value="MEDIUM">Medium risk</option><option value="LOW">Low risk</option><option value="UNSCANNED">Awaiting scan</option></select>
          </div>
        </div>
        <div className="hidden grid-cols-[1.7fr_1fr_.7fr_.7fr_.7fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 md:grid"><span>Project</span><span>Jurisdiction</span><span>Risk</span><span>Credits</span><span>Status</span><span>Actions</span></div>
        <div className="divide-y divide-slate-200">
          {filtered.map((item: any) => (
            <div key={item.project.project_id} className="grid gap-4 px-5 py-4 hover:bg-slate-50 md:grid-cols-[1.7fr_1fr_.7fr_.7fr_.7fr_auto] md:items-center">
              <div><div className="text-[10px] uppercase text-slate-500 md:hidden">Project</div><div className="text-sm font-semibold text-slate-900">{item.project.name}</div><div className="mt-1 font-mono text-[10px] text-[#008a83]">{item.project.project_id}</div></div>
              <div><div className="text-[10px] uppercase text-slate-500 md:hidden">Jurisdiction</div><div className="flex items-center gap-1 text-xs text-slate-700"><MapPin className="h-3.5 w-3.5" />{item.project.location?.region}, {item.project.location?.country}</div></div>
              <div><div className="text-[10px] uppercase text-slate-500 md:hidden">Risk</div><span className={`text-xs font-bold ${item.risk?.risk_level === 'HIGH' ? 'text-red-600' : item.risk?.risk_level === 'MEDIUM' ? 'text-amber-700' : item.risk ? 'text-emerald-700' : 'text-slate-500'}`}>{item.risk ? `${item.risk.risk_level} · ${item.risk.confidence_score}%` : 'UNSCANNED'}</span></div>
              <div><div className="text-[10px] uppercase text-slate-500 md:hidden">Credits</div><div className="font-mono text-xs font-bold">{item.credits?.length || 0}</div></div>
              <div><div className="text-[10px] uppercase text-slate-500 md:hidden">Status</div><span className={`text-xs font-bold ${item.project.status === 'SUSPENDED' ? 'text-red-600' : 'text-slate-700'}`}>{item.project.status}</span></div>
              <div className="flex items-center justify-end gap-2"><button onClick={() => toggleWatch('PROJECT', item.project.project_id)} disabled={isSubmitting} className="rounded-xl border border-slate-300 p-2" aria-label="Toggle project watchlist"><Star className={`h-4 w-4 ${watched('PROJECT', item.project.project_id) ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} /></button><button onClick={() => openCase(item)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-800"><Eye className="h-3.5 w-3.5" /> View full case</button></div>
            </div>
          ))}
          {!isLoading && filtered.length === 0 && <div className="p-10 text-center text-xs text-slate-500">No investigations match the selected filters.</div>}
        </div>
      </section>

      {showPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-xl rounded-3xl border border-slate-300 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between"><div><div className="text-[10px] font-bold uppercase tracking-wider text-[#008a83]">Policy administration</div><h2 className="mt-1 text-xl font-black text-slate-900">Global issuance controls</h2></div><button onClick={() => setShowPolicy(false)} className="rounded-full border border-slate-300 p-2"><X className="h-4 w-4" /></button></div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <label className="text-xs font-semibold text-slate-600">Minimum AI confidence (%)<input type="number" min="0" max="100" value={policy.minimumAiConfidence} onChange={(event) => setPolicy({ ...policy, minimumAiConfidence: Number(event.target.value) })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
              <label className="text-xs font-semibold text-slate-600">Maximum evidence deviation (%)<input type="number" min="0" value={policy.maximumEvidenceDeviation} onChange={(event) => setPolicy({ ...policy, maximumEvidenceDeviation: Number(event.target.value) })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
              <label className="text-xs font-semibold text-slate-600">High-risk verifier quorum<input type="number" min="1" max="10" value={policy.highRiskVerifierQuorum} onChange={(event) => setPolicy({ ...policy, highRiskVerifierQuorum: Number(event.target.value) })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
              <label className="text-xs font-semibold text-slate-600">Observation window (days)<input type="number" min="1" value={policy.observationWindowDays} onChange={(event) => setPolicy({ ...policy, observationWindowDays: Number(event.target.value) })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
            </div>
            <label className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-xs text-slate-700"><input type="checkbox" checked={policy.automaticEscalation} onChange={(event) => setPolicy({ ...policy, automaticEscalation: event.target.checked })} className="accent-emerald-500" />Automatically escalate policy violations to verifier review</label>
            <div className="mt-5 flex justify-end gap-2"><button onClick={() => setShowPolicy(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold">Cancel</button><button onClick={savePolicy} disabled={isSubmitting} className="rounded-xl bg-[#15ed48] px-4 py-2 text-xs font-bold text-slate-950">{isSubmitting ? 'Saving…' : 'Save policy'}</button></div>
          </div>
        </div>
      )}

      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true">
          <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-300 bg-[#f7f7f7] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4"><div><div className="text-[10px] font-bold uppercase tracking-wider text-[#008a83]">Regulatory case file</div><h2 className="mt-1 text-xl font-black text-slate-900">{selectedCase.project.name}</h2><p className="mt-1 font-mono text-[10px] text-slate-500">{selectedCase.project.project_id} · {selectedCase.bundle?.bundle_id || 'No evidence bundle'}</p></div><button onClick={() => setSelectedCase(null)} className="rounded-full border border-slate-300 p-2"><X className="h-4 w-4" /></button></div>
            <div className="space-y-4 p-6">
              {error && <div className="rounded-xl border border-red-200 bg-white p-3 text-xs text-red-600">{error}</div>}
              {message && <div className="rounded-xl border border-emerald-200 bg-white p-3 text-xs text-emerald-700">{message}</div>}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[
                ['Project status', selectedCase.project.status], ['AI risk', selectedCase.risk ? `${selectedCase.risk.risk_level} · ${selectedCase.risk.confidence_score}%` : 'Unscanned'], ['Credits issued', selectedCase.credits?.length || 0], ['Open objections', selectedCase.objections?.filter((item: any) => item.status === 'OPEN').length || 0]
              ].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-3"><div className="text-[10px] font-bold uppercase text-slate-500">{label}</div><div className="mt-1 text-sm font-bold text-slate-900">{value}</div></div>)}</div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <section className="rounded-2xl border border-slate-200 bg-white p-4"><h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Bell className="h-4 w-4 text-amber-500" /> Evidence and anomaly findings</h3><div className="mt-3 space-y-2"><p className="text-xs leading-5 text-slate-600">{selectedCase.risk?.explanation_reason || 'No AI assessment is available.'}</p>{(selectedCase.risk?.anomaly_flags || []).map((flag: string, index: number) => <div key={index} className="rounded-lg border border-red-100 p-2 text-[10px] font-mono text-red-700">{flag}</div>)}</div></section>
                <section className="rounded-2xl border border-slate-200 bg-white p-4"><h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Gavel className="h-4 w-4 text-violet-500" /> Disputes and objections</h3><div className="mt-3 space-y-2">{selectedCase.objections?.map((objection: any) => <div key={objection.id} className="rounded-lg border border-slate-200 p-3"><div className="flex justify-between text-[10px] font-bold"><span>{objection.category}</span><span>{objection.status}</span></div><p className="mt-1 text-[11px] text-slate-600">{objection.reason}</p></div>)}{(data.disputes || []).filter((dispute: any) => selectedCase.credits?.some((credit: any) => String(credit.token_id) === String(dispute.token_id))).map((dispute: any) => <div key={dispute.dispute_id} className="rounded-lg border border-violet-200 p-3"><div className="flex justify-between text-[10px] font-bold"><span>{dispute.dispute_id}</span><span>{dispute.status}</span></div><p className="mt-1 text-[11px] text-slate-600">{dispute.reason}</p>{dispute.status === 'OPEN' && <div className="mt-2 flex justify-end gap-2"><button onClick={() => resolveDispute(dispute.dispute_id, 'DISMISSED')} disabled={isSubmitting} className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-[10px] font-bold">Dismiss</button><button onClick={() => resolveDispute(dispute.dispute_id, 'UPHELD')} disabled={isSubmitting} className="rounded-lg border border-red-300 px-2.5 py-1.5 text-[10px] font-bold text-red-600">Uphold & revoke</button></div>}</div>)}{!selectedCase.objections?.length && !(data.disputes || []).some((dispute: any) => selectedCase.credits?.some((credit: any) => String(credit.token_id) === String(dispute.token_id))) && <p className="text-xs text-slate-500">No formal disputes or objections recorded.</p>}</div></section>
              </div>

              <section className="rounded-2xl border border-slate-200 bg-white p-4"><h3 className="text-sm font-bold text-slate-900">Complete regulatory audit trail</h3><div className="mt-4 space-y-3"><div className="border-l-2 border-[#00a699] pl-3"><div className="text-xs font-bold">Project registered</div><div className="text-[10px] text-slate-500">{formatDate(selectedCase.project.created_at)}</div></div>{selectedCase.bundle && <div className="border-l-2 border-[#00a699] pl-3"><div className="text-xs font-bold">Evidence bundle anchored</div><div className="text-[10px] text-slate-500">{formatDate(selectedCase.bundle.created_at)} · {selectedCase.bundle.merkle_root}</div></div>}{selectedCase.regulatoryActions?.map((action: any) => <div key={action.id} className="border-l-2 border-red-400 pl-3"><div className="text-xs font-bold">{action.action_type.replace(/_/g, ' ')}</div><p className="text-[10px] text-slate-600">{action.reason}</p><div className="text-[10px] text-slate-500">{formatDate(action.created_at)} · {action.regulator_name}</div></div>)}</div></section>

              <section className="rounded-2xl border border-red-200 bg-white p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Gavel className="h-4 w-4 text-red-500" /> Regulatory enforcement</h3><p className="mt-1 text-xs text-slate-500">Every action records the previous state, regulator identity, reason, and timestamp.</p></div><button onClick={() => setShowActionForm(!showActionForm)} className="rounded-xl border border-red-300 px-4 py-2 text-xs font-bold text-red-600">{showActionForm ? 'Cancel action' : 'Take action'}</button></div>{showActionForm && <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[220px_1fr_auto]"><select value={actionType} onChange={(event) => setActionType(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs">{ACTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><input value={actionReason} onChange={(event) => setActionReason(event.target.value)} placeholder="Required enforcement reason…" className="rounded-xl border border-slate-300 px-3 py-2.5 text-xs" /><button onClick={submitAction} disabled={isSubmitting || actionReason.trim().length < 10} className="rounded-xl bg-red-500 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40">Confirm action</button></div>}</section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
