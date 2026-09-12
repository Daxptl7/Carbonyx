import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  FilePenLine,
  MessageSquareReply,
  RefreshCw,
  ShieldCheck,
  X
} from 'lucide-react';
import { WalletState } from '../lib/web3';
import { apiFetch, readApiJson } from '../lib/auth';
import { ActivityBarChart, ActivityDonutChart } from '../components/ActivityCharts';

interface MyRegistryProps {
  wallet: WalletState;
  backendUrl: string;
}

type ResponseMode = 'REBUTTAL' | 'BASELINE_REVISION';

const openStatuses = new Set(['OPEN', 'RESPONDED', 'REVISION_SUBMITTED']);

export default function MyRegistry({ wallet, backendUrl }: MyRegistryProps) {
  const [registryProjects, setRegistryProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [selectedObjection, setSelectedObjection] = useState<any | null>(null);
  const [responseMode, setResponseMode] = useState<ResponseMode>('REBUTTAL');
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revision, setRevision] = useState({
    name: '',
    projectType: 'REFORESTATION',
    country: '',
    region: '',
    claimedAnnualTonnage: 0
  });

  const fetchRegistry = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const ownerQuery = wallet.address
        ? `?ownerAddress=${encodeURIComponent(wallet.address)}`
        : '';
      const response = await apiFetch(`${backendUrl}/api/projects/my-registry${ownerQuery}`);
      const data = await readApiJson<any>(response);
      if (!response.ok) throw new Error(data.error || 'Unable to load your project registry');
      setRegistryProjects(data.projects || []);
    } catch (error: any) {
      setLoadError(error.message || 'Unable to load your project registry');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistry();
  }, [backendUrl, wallet.address]);

  const allObjections = useMemo(
    () => registryProjects.flatMap((item) => item.objections || []),
    [registryProjects]
  );
  const activeObjections = allObjections.filter((objection) => openStatuses.has(objection.status));
  const revisionsSubmitted = allObjections.filter((objection) => objection.status === 'REVISION_SUBMITTED').length;
  const scoredProjects = registryProjects.filter((item) => Number.isFinite(Number(item.risk?.confidence_score)));
  const averageConfidence = scoredProjects.length
    ? Math.round(scoredProjects.reduce((total, item) => total + Number(item.risk.confidence_score), 0) / scoredProjects.length)
    : null;
  const registryActivity = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const month = date.getMonth();
      const year = date.getFullYear();
      const projectEvents = registryProjects.filter((item) => {
        const created = new Date(item.project?.created_at);
        return created.getMonth() === month && created.getFullYear() === year;
      }).length;
      const objectionEvents = allObjections.filter((objection) => {
        const created = new Date(objection.created_at);
        return created.getMonth() === month && created.getFullYear() === year;
      }).length;
      return {
        label: date.toLocaleDateString(undefined, { month: 'short' }),
        value: projectEvents + objectionEvents,
        color: '#00a699'
      };
    });
  }, [registryProjects, allObjections]);
  const riskDistribution = useMemo(() => {
    const levels = [
      { label: 'Low risk', key: 'LOW', color: '#15ed48' },
      { label: 'Medium risk', key: 'MEDIUM', color: '#f59e0b' },
      { label: 'High risk', key: 'HIGH', color: '#ef4444' },
      { label: 'Awaiting scan', key: 'UNSCANNED', color: '#94a3b8' }
    ];
    return levels.map((level) => ({
      label: level.label,
      color: level.color,
      value: registryProjects.filter((item) => (item.risk?.risk_level || 'UNSCANNED') === level.key).length
    }));
  }, [registryProjects]);

  const openResponse = (projectItem: any, objection: any, mode: ResponseMode) => {
    const project = projectItem.project;
    setLoadError('');
    setSelectedProject(projectItem);
    setSelectedObjection(objection);
    setResponseMode(mode);
    setResponseText('');
    setRevision({
      name: project.name || '',
      projectType: project.project_type || 'REFORESTATION',
      country: project.location?.country || '',
      region: project.location?.region || '',
      claimedAnnualTonnage: Number(project.claimed_annual_tonnage || 0)
    });
  };

  const submitResponse = async () => {
    if (!selectedObjection || !selectedProject) return;
    setIsSubmitting(true);
    setLoadError('');
    try {
      const response = await apiFetch(
        `${backendUrl}/api/projects/objections/${encodeURIComponent(selectedObjection.objection_id)}/respond`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            responseType: responseMode,
            response: responseText,
            ownerAddress: wallet.address,
            revision: responseMode === 'BASELINE_REVISION'
              ? {
                  name: revision.name,
                  projectType: revision.projectType,
                  location: { country: revision.country, region: revision.region },
                  claimedAnnualTonnage: revision.claimedAnnualTonnage
                }
              : undefined
          })
        }
      );
      const data = await readApiJson<any>(response);
      if (!response.ok) throw new Error(data.error || 'Unable to submit your response');
      setSuccessMessage(data.message || 'Your response was submitted');
      setSelectedObjection(null);
      setSelectedProject(null);
      await fetchRegistry();
    } catch (error: any) {
      setLoadError(error.message || 'Unable to submit your response');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return 'Not recorded';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? 'Not recorded'
      : date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="portal-page-header flex flex-col items-start justify-between gap-4 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-950 p-6 backdrop-blur-md md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400">
            <Database className="h-3.5 w-3.5" /> Proponent-owned records
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">My Project Registry</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Track every baseline you submitted, review objections, reply with supporting context or submit corrected project details.
          </p>
        </div>
        <button
          onClick={fetchRegistry}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh registry
        </button>
      </div>

      {loadError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {loadError}
        </div>
      )}
      {successMessage && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" /> {successMessage}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="metric-summary-card rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Registered projects</div>
          <div className="mt-1 text-2xl font-black text-white">{registryProjects.length}</div>
          <p className="mt-1 text-[11px] text-slate-500">Baselines submitted by your account</p>
        </div>
        <div className="metric-summary-card rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Active objections</div>
          <div className="mt-1 text-2xl font-black text-white">{activeObjections.length}</div>
          <p className="mt-1 text-[11px] text-slate-500">Open or awaiting reviewer decision</p>
        </div>
        <div className="metric-summary-card rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Revisions submitted</div>
          <div className="mt-1 text-2xl font-black text-white">{revisionsSubmitted}</div>
          <p className="mt-1 text-[11px] text-slate-500">Corrected baselines under review</p>
        </div>
        <div className="metric-summary-card rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Average AI confidence</div>
          <div className="mt-1 text-2xl font-black text-white">{averageConfidence === null ? '—' : `${averageConfidence}%`}</div>
          <p className="mt-1 text-[11px] text-slate-500">Across anomaly-scored baselines</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ActivityBarChart
          title="Registry activity"
          subtitle="Projects submitted and objections raised over the last six months"
          data={registryActivity}
          valueLabel="events"
        />
        <ActivityDonutChart
          title="Baseline risk distribution"
          subtitle="Current AI anomaly classification across your registered projects"
          data={riskDistribution}
          valueLabel="projects"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin text-emerald-400" /> Loading your registry…
        </div>
      ) : registryProjects.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
          <Database className="mx-auto h-10 w-10 text-slate-600" />
          <h2 className="mt-3 text-base font-bold text-white">No registered projects yet</h2>
          <p className="mt-1 text-xs text-slate-400">Submit a project and baseline evidence from Project Studio to see it here.</p>
          {!wallet.address && <p className="mt-2 text-[11px] text-amber-300">Connect the project owner wallet to discover older projects.</p>}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <div className="hidden grid-cols-[1.6fr_.8fr_.8fr_.8fr_auto] gap-4 border-b border-white/10 bg-black/20 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 md:grid">
            <span>Project</span><span>Baseline</span><span>AI risk</span><span>Objections</span><span>Manage</span>
          </div>
          <div className="divide-y divide-white/5">
            {registryProjects.map((item) => {
              const project = item.project;
              const objections = item.objections || [];
              const responseNeededCount = objections.filter((objection: any) => objection.status === 'OPEN').length;
              const underReviewCount = objections.filter((objection: any) => ['RESPONDED', 'REVISION_SUBMITTED'].includes(objection.status)).length;
              const riskLevel = item.risk?.risk_level || 'UNSCANNED';
              return (
                <div key={project.project_id} className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.035] md:grid-cols-[1.6fr_.8fr_.8fr_.8fr_auto] md:items-center">
                  <div>
                    <div className="text-sm font-bold text-white">{project.name}</div>
                    <div className="mt-1 font-mono text-[10px] text-emerald-400">{project.project_id}</div>
                    <div className="mt-1 text-[10px] text-slate-500">Added {formatDate(project.created_at)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-slate-500 md:hidden">Baseline</div>
                    <span className="text-xs font-semibold text-slate-300">{item.bundle?.status || 'NOT SUBMITTED'}</span>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-slate-500 md:hidden">AI risk</div>
                    <span className={`text-xs font-bold ${riskLevel === 'HIGH' ? 'text-red-400' : riskLevel === 'MEDIUM' ? 'text-amber-400' : riskLevel === 'LOW' ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {riskLevel}{item.risk ? ` · ${item.risk.confidence_score}%` : ''}
                    </span>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-slate-500 md:hidden">Objections</div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${responseNeededCount ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : underReviewCount ? 'border-sky-500/30 bg-sky-500/10 text-sky-300' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>
                      {responseNeededCount ? `${responseNeededCount} ACTION NEEDED` : underReviewCount ? `${underReviewCount} UNDER REVIEW` : `${objections.length} TOTAL`}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedProject(item)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-white transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300"
                  >
                    <Eye className="h-3.5 w-3.5" /> Manage project
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedProject && !selectedObjection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-emerald-500/25 bg-[#0B0F17] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">{selectedProject.project.project_id}</div>
                <h2 className="mt-1 text-xl font-black text-white">{selectedProject.project.name}</h2>
                <p className="mt-1 text-xs text-slate-400">{selectedProject.project.project_type} · {selectedProject.project.location?.region}, {selectedProject.project.location?.country}</p>
              </div>
              <button onClick={() => setSelectedProject(null)} aria-label="Close project" className="rounded-full border border-white/10 p-2 text-slate-400 hover:bg-white/10 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white/5 bg-white/[0.035] p-3"><div className="text-[10px] uppercase text-slate-500">Claimed volume</div><div className="mt-1 font-mono text-sm font-bold text-white">{Number(selectedProject.project.claimed_annual_tonnage).toLocaleString()} tCO2e</div></div>
              <div className="rounded-xl border border-white/5 bg-white/[0.035] p-3"><div className="text-[10px] uppercase text-slate-500">Bundle status</div><div className="mt-1 text-sm font-bold text-white">{selectedProject.bundle?.status || 'None'}</div></div>
              <div className="rounded-xl border border-white/5 bg-white/[0.035] p-3"><div className="text-[10px] uppercase text-slate-500">AI confidence</div><div className="mt-1 text-sm font-bold text-white">{selectedProject.risk ? `${selectedProject.risk.confidence_score}%` : 'Unscanned'}</div></div>
              <div className="rounded-xl border border-white/5 bg-white/[0.035] p-3"><div className="text-[10px] uppercase text-slate-500">Objections</div><div className="mt-1 text-sm font-bold text-white">{selectedProject.objections?.length || 0}</div></div>
            </div>

            <div className="mt-5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white"><ShieldCheck className="h-4 w-4 text-violet-500" /> Regulatory requirements and decisions</h3>
              {selectedProject.regulatoryActions?.length ? (
                <div className="mt-3 space-y-3">
                  {selectedProject.regulatoryActions.map((action: any) => (
                    <div key={action.action_id} className="rounded-2xl border border-violet-200 bg-white p-4">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                        <div><div className="text-xs font-bold text-slate-900">{String(action.action_type).replace(/_/g, ' ')}</div><div className="mt-1 text-[10px] text-slate-500">Assigned by {action.regulator_name} · {formatDate(action.created_at)}</div></div>
                        <span className="self-start rounded-full border border-violet-200 px-2.5 py-1 text-[10px] font-bold text-violet-700">REGULATOR</span>
                      </div>
                      <p className="mt-3 text-xs leading-5 text-slate-700">{action.reason}</p>
                      {action.action_type === 'REQUIRE_MONITORING' && <div className="mt-2 text-[10px] font-bold text-amber-700">Action required: provide the requested monitoring evidence in your next baseline revision.</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">No regulatory requirements have been assigned to this project.</div>
              )}
            </div>

            <div className="mt-5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white"><MessageSquareReply className="h-4 w-4 text-amber-400" /> Verifier evidence requests</h3>
              {selectedProject.evidenceRequests?.length ? (
                <div className="mt-3 space-y-3">
                  {selectedProject.evidenceRequests.map((request: any) => (
                    <div key={request.id} className="rounded-2xl border border-amber-200 bg-white p-4">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                        <div>
                          <div className="text-xs font-bold text-slate-900">{String(request.payload?.category || 'Additional evidence').replace(/_/g, ' ')}</div>
                          <div className="mt-1 text-[10px] text-slate-500">Requested by {request.payload?.verifierName || 'Independent verifier'} · {formatDate(request.submitted_at)}</div>
                        </div>
                        {request.payload?.dueDate && <span className="self-start rounded-full border border-amber-200 px-2.5 py-1 text-[10px] font-bold text-amber-700">DUE {formatDate(request.payload.dueDate)}</span>}
                      </div>
                      <p className="mt-3 text-xs leading-5 text-slate-700">{request.payload?.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">No additional evidence has been requested by a verifier.</div>
              )}
            </div>

            <div className="mt-5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white"><AlertTriangle className="h-4 w-4 text-amber-400" /> Objection history</h3>
              {selectedProject.objections?.length ? (
                <div className="mt-3 space-y-3">
                  {selectedProject.objections.map((objection: any) => (
                    <div key={objection.objection_id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                        <div>
                          <div className="text-xs font-bold text-white">{objection.category}</div>
                          <div className="mt-1 text-[10px] text-slate-500">Raised by {objection.raised_by_name} · {objection.raised_by_role.replace(/_/g, ' ')} · {formatDate(objection.created_at)}</div>
                        </div>
                        <span className={`self-start rounded-full border px-2.5 py-1 text-[10px] font-bold ${objection.status === 'OPEN' ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-sky-500/30 bg-sky-500/10 text-sky-300'}`}>{objection.status.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="mt-3 rounded-xl bg-black/25 p-3 text-xs leading-5 text-slate-300">{objection.reason}</p>
                      {objection.proponent_response && (
                        <div className="mt-2 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3 text-xs leading-5 text-emerald-100">
                          <span className="font-bold text-emerald-400">Your response: </span>{objection.proponent_response}
                        </div>
                      )}
                      {objection.status === 'OPEN' && (
                        <div className="mt-3 flex flex-wrap justify-end gap-2">
                          <button onClick={() => openResponse(selectedProject, objection, 'REBUTTAL')} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5">
                            <MessageSquareReply className="h-3.5 w-3.5" /> Reply / rebut
                          </button>
                          <button onClick={() => openResponse(selectedProject, objection, 'BASELINE_REVISION')} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400">
                            <FilePenLine className="h-3.5 w-3.5" /> Revise baseline
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-300">
                  <ShieldCheck className="h-4 w-4" /> No objections have been raised against this baseline.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedObjection && selectedProject && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-emerald-500/30 bg-[#0B0F17] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">{responseMode === 'REBUTTAL' ? 'Reply to objection' : 'Submit corrected baseline'}</div>
                <h2 className="mt-1 text-xl font-black text-white">{selectedProject.project.name}</h2>
              </div>
              <button onClick={() => setSelectedObjection(null)} aria-label="Close response" className="rounded-full border border-white/10 p-2 text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-5 text-slate-300">
              <span className="font-bold text-amber-300">Objection: </span>{selectedObjection.reason}
            </div>

            {responseMode === 'BASELINE_REVISION' && (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs text-slate-400 sm:col-span-2">Project name<input value={revision.name} onChange={(event) => setRevision({ ...revision, name: event.target.value })} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-emerald-500" /></label>
                <label className="text-xs text-slate-400">Methodology<select value={revision.projectType} onChange={(event) => setRevision({ ...revision, projectType: event.target.value })} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-emerald-500"><option value="REFORESTATION">Reforestation</option><option value="BLUE_CARBON">Blue Carbon</option><option value="METHANE_CAPTURE">Methane Capture</option><option value="RENEWABLE_ENERGY">Renewable Energy</option><option value="PEATLAND_RESTORATION">Peatland Restoration</option><option value="MANGROVE_BLUE_CARBON">Mangrove Blue Carbon</option><option value="SOIL_CARBON">Soil Carbon</option></select></label>
                <label className="text-xs text-slate-400">Claimed tCO2e / year<input type="number" min="1" value={revision.claimedAnnualTonnage} onChange={(event) => setRevision({ ...revision, claimedAnnualTonnage: Number(event.target.value) })} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 font-mono text-white outline-none focus:border-emerald-500" /></label>
                <label className="text-xs text-slate-400">Country<input value={revision.country} onChange={(event) => setRevision({ ...revision, country: event.target.value })} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-emerald-500" /></label>
                <label className="text-xs text-slate-400">Region<input value={revision.region} onChange={(event) => setRevision({ ...revision, region: event.target.value })} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-emerald-500" /></label>
              </div>
            )}

            <label className="mt-4 block text-xs font-semibold text-slate-300">
              {responseMode === 'REBUTTAL' ? 'Your response and supporting explanation' : 'Explain what you corrected'}
              <textarea rows={4} value={responseText} onChange={(event) => setResponseText(event.target.value)} className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-emerald-500" placeholder={responseMode === 'REBUTTAL' ? 'Explain why the objection is incorrect and reference supporting evidence…' : 'Describe the baseline corrections made in this revision…'} />
            </label>

            {loadError && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" /> {loadError}
              </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
              <p className="flex items-center gap-1.5 text-[10px] text-slate-500"><Clock className="h-3.5 w-3.5" /> Reviewer resolution is still required.</p>
              <div className="flex gap-2">
                <button onClick={() => setSelectedObjection(null)} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300">Cancel</button>
                <button onClick={submitResponse} disabled={isSubmitting || responseText.trim().length < 5} className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50">{isSubmitting ? 'Submitting…' : responseMode === 'REBUTTAL' ? 'Submit response' : 'Submit revision'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
