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
  X,
  Bell,
  Sparkles,
  Scale,
  Coins,
  Store,
  Tag,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Layers,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WalletState } from '../lib/web3';
import { apiFetch, readApiJson } from '../lib/auth';
import { ActivityBarChart, ActivityDonutChart } from '../components/ActivityCharts';
import {
  projectFlowStore,
  LifecycleProject,
  ProjectLifecycleState,
  ProtocolNotification
} from '../lib/projectFlowStore';

interface MyRegistryProps {
  wallet: WalletState;
  backendUrl: string;
}

type ResponseMode = 'REBUTTAL' | 'BASELINE_REVISION';

const LIFECYCLE_STAGES: Array<{
  state: ProjectLifecycleState;
  label: string;
  shortLabel: string;
  step: number;
}> = [
  { state: 'BASELINE_WINDOW', label: '14-Day Baseline Window', shortLabel: '1. Baseline (14d)', step: 1 },
  { state: 'VERIFIER_PENDING_STAKE', label: 'Verifier Pool Assignment', shortLabel: '2. Verifier Pool', step: 2 },
  { state: 'VERIFIER_AUDITING', label: 'PoS Stake & Telemetry Audit', shortLabel: '3. Staked Audit', step: 3 },
  { state: 'AUDITED', label: 'Audited & Verified', shortLabel: '4. Audited', step: 4 },
  { state: 'CREDITS_ISSUED', label: 'NFT Credits Minted', shortLabel: '5. NFTs Minted', step: 5 },
  { state: 'LISTED_ON_MARKETPLACE', label: 'Active on Marketplace', shortLabel: '6. Trading Live', step: 6 },
  { state: 'RETIRED', label: 'Purchased & Retired', shortLabel: '7. Retired', step: 7 }
];

export default function MyRegistry({ wallet, backendUrl }: MyRegistryProps) {
  const [projects, setProjects] = useState<LifecycleProject[]>([]);
  const [notifications, setNotifications] = useState<ProtocolNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Selected project for detailed modal
  const [selectedProject, setSelectedProject] = useState<LifecycleProject | null>(null);
  const [selectedObjection, setSelectedObjection] = useState<any | null>(null);
  const [responseMode, setResponseMode] = useState<ResponseMode>('REBUTTAL');
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pricing Studio State
  const [pricingProjectId, setPricingProjectId] = useState<string | null>(null);
  const [pricingEth, setPricingEth] = useState<number>(0.045);
  const [isListingLoading, setIsListingLoading] = useState(false);

  // Notification Drawer
  const [showNotifications, setShowNotifications] = useState(false);

  const syncProjects = () => {
    const loadedProjects = projectFlowStore.getProjectsForDeveloper(wallet.address);
    setProjects(loadedProjects);
    const notifs = projectFlowStore.getNotifications('PROJECT_PROPONENT');
    setNotifications(notifs);

    // Keep selected project in sync
    if (selectedProject) {
      const updated = projectFlowStore.getProjectById(selectedProject.id);
      if (updated) setSelectedProject(updated);
    }
  };

  useEffect(() => {
    syncProjects();
    const unsubscribe = projectFlowStore.subscribe(() => {
      syncProjects();
    });
    return () => unsubscribe();
  }, [wallet.address]);

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  const handleAdvanceBaseline = (projectId: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    const success = projectFlowStore.advanceBaselineWindow(projectId);
    if (success) {
      setSuccessMessage('14-day baseline challenge window completed! Project routed to Verifier Pool.');
      syncProjects();
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  };

  const handleOpenPricing = (project: LifecycleProject, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    setPricingProjectId(project.id);
    setPricingEth(project.listingPricePerNftEth || 0.045);
  };

  const handleListOnMarketplace = () => {
    if (!pricingProjectId) return;
    setIsListingLoading(true);
    setTimeout(() => {
      projectFlowStore.listNftsOnMarketplace(pricingProjectId, pricingEth);
      setIsListingLoading(false);
      setPricingProjectId(null);
      setSuccessMessage(`Carbon Credit NFTs successfully listed on Marketplace at ${pricingEth} ETH each!`);
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#3B82F6', '#F59E0B']
      });
      syncProjects();
      setTimeout(() => setSuccessMessage(''), 5000);
    }, 600);
  };

  const getStepNumber = (state: ProjectLifecycleState): number => {
    const map: Record<ProjectLifecycleState, number> = {
      BASELINE_WINDOW: 1,
      VERIFIER_PENDING_STAKE: 2,
      VERIFIER_AUDITING: 3,
      AUDITED: 4,
      CREDITS_ISSUED: 5,
      LISTED_ON_MARKETPLACE: 6,
      PURCHASED: 6,
      RETIRED: 7
    };
    return map[state] || 1;
  };

  const formatDate = (value?: string) => {
    if (!value) return 'Not recorded';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? 'Not recorded'
      : date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      
      {/* Top Header Banner */}
      <div className="portal-page-header flex flex-col items-start justify-between gap-4 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-950 p-6 backdrop-blur-md md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400">
            <Database className="h-3.5 w-3.5" /> Project Developer Management Portal
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
            My Project Registry & Issuance Pipeline
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Monitor the 14-day baseline challenge window, track Proof-of-Stake verifier audits, review verifier-issued NFTs, and list carbon credits on the public marketplace.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications Trigger */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            <Bell className="h-3.5 w-3.5 text-emerald-400" />
            <span>Notifications</span>
            {unreadNotifsCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-slate-950">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          <button
            onClick={syncProjects}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Success / Error Messages */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300 animate-fadeIn">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {errorMessage}
        </div>
      )}

      {/* Notifications Drawer */}
      {showNotifications && (
        <div className="rounded-2xl border border-emerald-500/30 bg-[#0B0F17] p-5 shadow-2xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <Bell className="h-4 w-4 text-emerald-400" /> Protocol Notifications
            </div>
            <button
              onClick={() => setShowNotifications(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Close
            </button>
          </div>

          <div className="divide-y divide-white/5 max-h-64 overflow-y-auto space-y-2">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No notifications yet.</p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => projectFlowStore.markNotificationAsRead(notif.id)}
                  className={`pt-2 pb-2 text-xs cursor-pointer transition hover:bg-white/5 rounded-lg px-2 ${
                    !notif.read ? 'border-l-2 border-emerald-400 pl-3 bg-emerald-950/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{notif.title}</span>
                    <span className="text-[10px] text-slate-500">{formatDate(notif.timestamp)}</span>
                  </div>
                  <p className="text-slate-300 mt-1">{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="metric-summary-card rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Total Registered</div>
          <div className="mt-1 text-2xl font-black text-white">{projects.length}</div>
          <p className="mt-1 text-[11px] text-slate-500">Projects submitted by your entity</p>
        </div>
        <div className="metric-summary-card rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">In 14-Day Baseline</div>
          <div className="mt-1 text-2xl font-black text-white">
            {projects.filter((p) => p.lifecycleState === 'BASELINE_WINDOW').length}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Public observation & objection window</p>
        </div>
        <div className="metric-summary-card rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">PoS Audited</div>
          <div className="mt-1 text-2xl font-black text-white">
            {projects.filter((p) => ['AUDITED', 'CREDITS_ISSUED', 'LISTED_ON_MARKETPLACE', 'RETIRED'].includes(p.lifecycleState)).length}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Verified by accredited verifiers</p>
        </div>
        <div className="metric-summary-card rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-violet-400">NFTs Minted</div>
          <div className="mt-1 text-2xl font-black text-white">
            {projects.reduce((acc, p) => acc + p.nfts.length, 0)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Tradable carbon credit tokens</p>
        </div>
      </div>

      {/* Projects List with Lifecycle Steppers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Active Projects & Status Stepper</h2>
          <span className="text-xs text-slate-400">{projects.length} projects loaded</span>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
            <Database className="mx-auto h-10 w-10 text-slate-600" />
            <h3 className="mt-3 text-base font-bold text-white">No projects registered yet</h3>
            <p className="mt-1 text-xs text-slate-400">Submit a project from Project Studio to begin the baseline challenge window.</p>
          </div>
        ) : (
          projects.map((project) => {
            const currentStep = getStepNumber(project.lifecycleState);
            const isBaselineActive = project.lifecycleState === 'BASELINE_WINDOW';
            const isAuditedWaitingMint = project.lifecycleState === 'AUDITED';
            const isCreditsMinted = project.lifecycleState === 'CREDITS_ISSUED';
            const isListed = project.lifecycleState === 'LISTED_ON_MARKETPLACE';
            const isRetired = project.lifecycleState === 'RETIRED';

            return (
              <div
                key={project.id}
                className="rounded-2xl border border-white/10 bg-[#0B0F17]/80 p-5 space-y-4 hover:border-emerald-500/30 transition-all shadow-xl"
              >
                {/* Project Header Info */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        {project.id}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {project.projectType.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-slate-400">
                        📍 {project.location.region}, {project.location.country}
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-white mt-1">
                      {project.name}
                    </h3>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      Claimed: <span className="text-white font-bold">{project.claimedAnnualTonnage.toLocaleString()} tCO2e/yr</span> · Capex: <span className="text-white font-bold">${project.capexUsd.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions & Quick Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Fast-forward baseline button */}
                    {isBaselineActive && (
                      <button
                        onClick={(e) => handleAdvanceBaseline(project.id, e)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-all"
                        title="Simulate conclusion of 14-day window for demo"
                      >
                        <Clock className="h-3.5 w-3.5" /> Advance 14d Baseline ⚡
                      </button>
                    )}

                    {/* Set Price & List Button for Developer */}
                    {(isCreditsMinted || isListed) && (
                      <button
                        onClick={(e) => handleOpenPricing(project, e)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all"
                      >
                        <Tag className="h-3.5 w-3.5" />
                        {isListed ? `Price: ${project.listingPricePerNftEth} ETH (Edit)` : 'Set Price & List on Marketplace'}
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedProject(project)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/10 transition-all"
                    >
                      <Eye className="h-3.5 w-3.5" /> Manage & Details
                    </button>
                  </div>
                </div>

                {/* 5-Stage Visual Progress Stepper */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-400">
                    <span>LIFECYCLE PIPELINE PROGRESS</span>
                    <span className="text-emerald-400">
                      Stage {currentStep} of 6: {project.lifecycleState.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {[
                      { step: 1, label: '1. Baseline 14d', desc: isBaselineActive ? '11d remaining' : 'Completed' },
                      { step: 2, label: '2. Verifier Pool', desc: project.assignedVerifier?.name?.split(' ')[0] || 'Assigned' },
                      { step: 3, label: '3. PoS Staked', desc: project.verifierStakedEth ? `${project.verifierStakedEth} ETH Locked` : 'Pending' },
                      { step: 4, label: '4. Audited', desc: project.auditedAt ? 'Verified' : 'In Review' },
                      { step: 5, label: '5. NFTs Minted', desc: project.nfts.length > 0 ? `${project.nfts.length} NFTs` : 'Awaiting Verifier' },
                      { step: 6, label: '6. Marketplace', desc: isListed ? `${project.listingPricePerNftEth} ETH` : isRetired ? 'Retired' : 'Unlisted' }
                    ].map((st) => {
                      const isComplete = currentStep > st.step;
                      const isCurrent = currentStep === st.step;

                      return (
                        <div
                          key={st.step}
                          className={`rounded-xl p-2.5 border transition-all text-left ${
                            isComplete
                              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                              : isCurrent
                              ? 'border-emerald-400 bg-emerald-500/10 text-white ring-1 ring-emerald-400/40'
                              : 'border-white/5 bg-white/[0.02] text-slate-500'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-xs font-bold truncate">
                            {isComplete ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                            ) : isCurrent ? (
                              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                            ) : (
                              <span className="h-2 w-2 rounded-full bg-slate-600 flex-shrink-0" />
                            )}
                            <span className="truncate">{st.label}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 truncate pl-3.5">
                            {st.desc}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Dynamic Status Callout Alert */}
                <div className="rounded-xl bg-slate-900/60 border border-white/5 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    {isBaselineActive ? (
                      <>
                        <Clock className="h-4 w-4 text-amber-400" />
                        <span className="text-slate-300">
                          <strong>14-Day Baseline Observation Window Active:</strong> Open for public objections ({project.objections.length} active).
                        </span>
                      </>
                    ) : project.lifecycleState === 'VERIFIER_PENDING_STAKE' ? (
                      <>
                        <Scale className="h-4 w-4 text-sky-400" />
                        <span className="text-slate-300">
                          <strong>Verifier Pool Assignment:</strong> Routed to {project.assignedVerifier.name} ({project.assignedVerifier.organization}). Awaiting verifier PoS collateral stake.
                        </span>
                      </>
                    ) : project.lifecycleState === 'VERIFIER_AUDITING' ? (
                      <>
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                        <span className="text-slate-300">
                          <strong>Active PoS Audit:</strong> Verifier staked {project.verifierStakedEth} ETH collateral. Evaluating ground IoT + Sentinel-2 multispectral evidence.
                        </span>
                      </>
                    ) : isAuditedWaitingMint ? (
                      <>
                        <Award className="h-4 w-4 text-emerald-400" />
                        <span className="text-slate-300">
                          <strong>Audit Approved:</strong> Verifier {project.assignedVerifier.name} verified project. Verifier will now configure and issue the tradable Credit NFTs.
                        </span>
                      </>
                    ) : isCreditsMinted ? (
                      <>
                        <Sparkles className="h-4 w-4 text-emerald-400" />
                        <span className="text-slate-300">
                          <strong>Credit NFTs Minted to Your Wallet:</strong> {project.nfts.length} NFTs ({project.totalIssuedTonnage} tCO2e). Set your selling price to list on the Marketplace!
                        </span>
                      </>
                    ) : isListed ? (
                      <>
                        <Store className="h-4 w-4 text-emerald-400" />
                        <span className="text-slate-300">
                          <strong>Listed on Marketplace:</strong> {project.nfts.filter((n) => n.status === 'LISTED').length} NFTs live at {project.listingPricePerNftEth} ETH. (100% of purchase proceeds settle directly to you).
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-teal-400" />
                        <span className="text-slate-300">
                          <strong>Credits Acquired & Retired:</strong> Offsets permanently retired by corporate buyers with cryptographic certificates.
                        </span>
                      </>
                    )}
                  </div>

                  <div className="font-mono text-[11px] text-slate-500">
                    Top Merkle Root: {project.merkleRoot.slice(0, 14)}...
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Pricing & Marketplace Listing Modal */}
      {pricingProjectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-emerald-500/30 bg-[#0B0F17] p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">
                  Developer Pricing Studio
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">
                  List Credits on Marketplace
                </h3>
              </div>
              <button
                onClick={() => setPricingProjectId(null)}
                className="rounded-full border border-white/10 p-2 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Set your asking price per Carbon Credit NFT. Buyers will pay directly to your connected developer wallet address (<strong>0% protocol commission</strong>).
            </p>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Price per NFT Credit (ETH)
                <div className="relative mt-1.5">
                  <input
                    type="number"
                    min="0.001"
                    step="0.005"
                    value={pricingEth}
                    onChange={(e) => setPricingEth(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-emerald-500 pl-8"
                  />
                  <Coins className="h-4 w-4 text-emerald-400 absolute left-2.5 top-3" />
                </div>
              </label>

              {/* Pricing Economics Preview */}
              <div className="text-[11px] font-mono space-y-1 text-slate-400 border-t border-white/10 pt-2">
                <div className="flex justify-between">
                  <span>NFTs in Batch:</span>
                  <span className="text-white font-bold">
                    {projectFlowStore.getProjectById(pricingProjectId)?.nfts.length || 100} NFTs
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Project Revenue:</span>
                  <span className="text-emerald-400 font-bold">
                    {((projectFlowStore.getProjectById(pricingProjectId)?.nfts.length || 100) * pricingEth).toFixed(3)} ETH
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Protocol Intermediary Fee:</span>
                  <span className="text-teal-400 font-bold">0.00% (Direct Settlement)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPricingProjectId(null)}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleListOnMarketplace}
                disabled={isListingLoading || pricingEth <= 0}
                className="rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isListingLoading ? 'Publishing to Marketplace…' : 'Publish Listing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Project Full Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-emerald-500/25 bg-[#0B0F17] p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
                  {selectedProject.id} · {selectedProject.lifecycleState.replace(/_/g, ' ')}
                </div>
                <h2 className="mt-1 text-2xl font-black text-white">{selectedProject.name}</h2>
                <p className="mt-1 text-xs text-slate-400">
                  {selectedProject.projectType} · {selectedProject.location.region}, {selectedProject.location.country}
                </p>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="rounded-full border border-white/10 p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Grid Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase">Claimed Tonnage</div>
                <div className="font-mono font-bold text-white text-sm mt-1">{selectedProject.claimedAnnualTonnage.toLocaleString()} tCO2e</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase">AI Confidence</div>
                <div className="font-mono font-bold text-emerald-400 text-sm mt-1">{selectedProject.aiConfidenceScore}% ({selectedProject.riskLevel})</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase">Assigned Verifier</div>
                <div className="font-bold text-white text-xs mt-1 truncate">{selectedProject.assignedVerifier?.name}</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase">NFTs Minted</div>
                <div className="font-mono font-bold text-sky-400 text-sm mt-1">{selectedProject.nfts.length} Tokens</div>
              </div>
            </div>

            {/* Verifier PoS Audit Information */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/20 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" /> Independent Verifier Proof-of-Stake Audit
                </div>
                {selectedProject.verifierStakedEth && (
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {selectedProject.verifierStakedEth} ETH Staked
                  </span>
                )}
              </div>
              <p className="text-slate-300">
                {selectedProject.verifierAuditNotes || 'Verifier has not submitted formal audit notes yet.'}
              </p>
              {selectedProject.auditAttestationHash && (
                <div className="font-mono text-[10px] text-slate-400 truncate">
                  Audit Attestation Hash: <span className="text-emerald-300">{selectedProject.auditAttestationHash}</span>
                </div>
              )}
            </div>

            {/* Objections List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Baseline Objections ({selectedProject.objections.length})
              </h4>
              {selectedProject.objections.length === 0 ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> No objections raised against this project.
                </div>
              ) : (
                selectedProject.objections.map((obj) => (
                  <div key={obj.id} className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-amber-300">{obj.category}</span>
                      <span className="font-mono text-[10px] text-slate-400">{formatDate(obj.createdAt)}</span>
                    </div>
                    <p className="text-slate-300">{obj.reason}</p>
                  </div>
                ))
              )}
            </div>

            {/* Close */}
            <div className="flex justify-end pt-3 border-t border-white/10">
              <button
                onClick={() => setSelectedProject(null)}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 px-5 py-2 text-xs font-bold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
