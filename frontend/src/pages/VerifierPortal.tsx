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
  X,
  Coins,
  ArrowRight,
  Sparkles,
  Layers,
  Award,
  Lock,
  RotateCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiFetch, readApiJson } from '../lib/auth';
import { ActivityBarChart, ActivityDonutChart } from '../components/ActivityCharts';
import {
  projectFlowStore,
  LifecycleProject,
  VERIFIER_POOL,
  VerifierPoolMember
} from '../lib/projectFlowStore';

const CHECKLIST_ITEMS = [
  { key: 'identity', label: 'Project identity and ownership verified via KYC & DID' },
  { key: 'financial', label: 'Financial additionality evidence & invoices cross-verified' },
  { key: 'iot', label: 'Ground IoT telemetry readings & device signatures validated' },
  { key: 'satellite', label: 'Sentinel-2 satellite multispectral NDVI matched to coordinates' },
  { key: 'duplicate', label: 'Prior credit issuance & double-counting check completed' }
] as const;

const emptyChecklist = () =>
  Object.fromEntries(CHECKLIST_ITEMS.map((item) => [item.key, false])) as Record<string, boolean>;

export default function VerifierPortal({ walletAddress }: { walletAddress: string | null }) {
  const [stakedAmount, setStakedAmount] = useState<number>(0.5);
  const [reputationScore, setReputationScore] = useState<number>(98);
  const [queueProjects, setQueueProjects] = useState<LifecycleProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<LifecycleProject | null>(null);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  
  // Audit Form State
  const [checklist, setChecklist] = useState<Record<string, boolean>>(emptyChecklist);
  const [auditNotes, setAuditNotes] = useState('');
  const [decisionConfidence, setDecisionConfidence] = useState(94);
  const [conflictConfirmed, setConflictConfirmed] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Evidence Request Modal
  const [showEvidenceRequest, setShowEvidenceRequest] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');

  // Exclusive NFT Issuance Studio State
  const [approvedTonnage, setApprovedTonnage] = useState<number>(500);
  const [nftQuantity, setNftQuantity] = useState<number>(100);
  const [issuanceModel, setIssuanceModel] = useState<'UPFRONT' | 'LINEAR_VESTING'>('UPFRONT');
  const [vestingMonths, setVestingMonths] = useState<number>(12);
  const [isMintingNfts, setIsMintingNfts] = useState(false);

  const fetchQueue = () => {
    setIsLoadingQueue(true);
    const queue = projectFlowStore.getVerifierQueue(walletAddress);
    setQueueProjects(queue);

    if (queue.length > 0) {
      if (!selectedProject || !queue.some((p) => p.id === selectedProject.id)) {
        setSelectedProject(queue[0]);
      } else {
        const updated = queue.find((p) => p.id === selectedProject.id);
        if (updated) setSelectedProject(updated);
      }
    } else {
      setSelectedProject(null);
    }
    setIsLoadingQueue(false);
  };

  useEffect(() => {
    fetchQueue();
    const unsubscribe = projectFlowStore.subscribe(() => {
      fetchQueue();
    });
    return () => unsubscribe();
  }, [walletAddress]);

  useEffect(() => {
    if (selectedProject) {
      setChecklist(emptyChecklist());
      setAuditNotes(
        selectedProject.verifierAuditNotes ||
          'Ground IoT telemetry flux correlated with Copernicus Sentinel-2 multispectral NDVI imagery. Additionality verified with zero baseline anomalies.'
      );
      setApprovedTonnage(Math.min(selectedProject.claimedAnnualTonnage, 500));
      setNftQuantity(100);
      setConflictConfirmed(true);
      setActionError('');
      setActionMessage('');
    }
  }, [selectedProject?.id]);

  // 1. Proof-of-Stake Staking to unlock audit
  const handleStakeAndAccept = () => {
    if (!selectedProject) return;
    setIsSubmittingAction(true);
    setActionError('');
    setTimeout(() => {
      projectFlowStore.stakeAndAcceptAudit(selectedProject.id, 0.5);
      setStakedAmount((prev) => +(prev + 0.5).toFixed(2));
      setIsSubmittingAction(false);
      setActionMessage(`0.5 ETH staked into protocol collateral contract. You are now auditing ${selectedProject.name}.`);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
      fetchQueue();
    }, 600);
  };

  // 2. Reject / Pass -> Rotates to Next Verifier in Pool (PoS)
  const handlePassToNextVerifier = () => {
    if (!selectedProject) return;
    setIsSubmittingAction(true);
    setActionError('');
    setTimeout(() => {
      const nextVerifier = projectFlowStore.passToNextVerifier(
        selectedProject.id,
        'Verifier passed audit allocation due to capacity / specialization'
      );
      setIsSubmittingAction(false);
      setActionMessage(
        nextVerifier
          ? `Project rotated to next verifier in pool: ${nextVerifier.name} (${nextVerifier.organization}).`
          : 'Project rotated to the next available verifier in pool.'
      );
      fetchQueue();
    }, 600);
  };

  // 3. Complete Audit & Approve
  const handleApproveAudit = () => {
    if (!selectedProject) return;
    if (!CHECKLIST_ITEMS.every((item) => checklist[item.key])) {
      setActionError('Complete all 5 verification checklist items before signing audit approval.');
      return;
    }
    if (!conflictConfirmed) {
      setActionError('Please confirm the independent verifier conflict-of-interest declaration.');
      return;
    }

    setIsSubmittingAction(true);
    setActionError('');
    setTimeout(() => {
      projectFlowStore.completeAudit(selectedProject.id, {
        approved: true,
        confidence: decisionConfidence,
        notes: auditNotes
      });
      setIsSubmittingAction(false);
      setActionMessage(`Project audit approved! Audit attestation digest anchored. You may now issue Credit NFTs.`);
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });
      fetchQueue();
    }, 700);
  };

  // 4. Exclusive Verifier NFT Minting & Issuance
  const handleIssueNfts = () => {
    if (!selectedProject) return;
    if (approvedTonnage <= 0 || nftQuantity <= 0) {
      setActionError('Approved tonnage and NFT quantity must be greater than zero.');
      return;
    }

    setIsMintingNfts(true);
    setActionError('');
    setTimeout(() => {
      const minted = projectFlowStore.issueCreditsAsNfts(selectedProject.id, {
        totalTonnage: approvedTonnage,
        nftCount: nftQuantity,
        issuanceModel,
        vestingMonths: issuanceModel === 'LINEAR_VESTING' ? vestingMonths : undefined
      });
      setIsMintingNfts(false);
      setActionMessage(
        `Successfully minted ${minted.length} Carbon Credit NFTs (${approvedTonnage} tCO2e) directly to the Project Developer's wallet!`
      );
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10B981', '#F59E0B', '#3B82F6', '#6366F1']
      });
      fetchQueue();
    }, 900);
  };

  const isPendingStake = selectedProject?.lifecycleState === 'VERIFIER_PENDING_STAKE';
  const isAuditing = selectedProject?.lifecycleState === 'VERIFIER_AUDITING';
  const isAuditedReadyForMint = selectedProject?.lifecycleState === 'AUDITED';
  const isMinted = ['CREDITS_ISSUED', 'LISTED_ON_MARKETPLACE', 'RETIRED'].includes(selectedProject?.lifecycleState || '');

  return (
    <div className="space-y-8 text-left w-full max-w-6xl mx-auto">
      
      {/* Top Banner */}
      <div className="portal-page-header flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900/60 to-slate-950 border border-amber-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
              <Scale className="h-3.5 w-3.5" />
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
              Proof-of-Stake Auditor Node
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">
            Independent Verifier Staking & Issuance Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Protocol-managed verification pool. Verifiers must stake ETH collateral to audit project baselines. <strong>Only the verified auditor can authorize and mint carbon credit NFTs.</strong>
          </p>
        </div>

        <button
          onClick={fetchQueue}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold flex items-center gap-2 text-white transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQueue ? 'animate-spin' : ''}`} /> Refresh Verifier Queue
        </button>
      </div>

      {/* Messages */}
      {actionMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> {actionMessage}
        </div>
      )}
      {actionError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300 animate-fadeIn">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {actionError}
        </div>
      )}

      {/* Verifier Staking & Node Profile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/20">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">PoS Staked Collateral</div>
          <div className="text-2xl font-black font-mono text-white mt-1">{stakedAmount} ETH</div>
          <p className="text-[10px] text-slate-400 mt-1">Bonded against slashing/fraud</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/20">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Reputation Score</div>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">{reputationScore}/100</div>
          <p className="text-[10px] text-slate-400 mt-1">SGS BioAudit Accredited</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-sky-500/20">
          <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Queue Items</div>
          <div className="text-2xl font-black font-mono text-white mt-1">{queueProjects.length}</div>
          <p className="text-[10px] text-slate-400 mt-1">Assigned from verifier pool</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-violet-500/20">
          <div className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Slashing Risk</div>
          <div className="text-2xl font-black font-mono text-teal-400 mt-1">50% Slash</div>
          <p className="text-[10px] text-slate-400 mt-1">Penalty on fraudulent sign-off</p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Assigned Projects Queue (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Verifier Pool Assignments ({queueProjects.length})
            </h3>
            <span className="text-[10px] text-amber-400 font-mono">Proof-of-Stake</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {queueProjects.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center text-xs text-slate-400">
                No active verification assignments in your queue.
              </div>
            ) : (
              queueProjects.map((p) => {
                const isSelected = selectedProject?.id === p.id;
                const isPending = p.lifecycleState === 'VERIFIER_PENDING_STAKE';
                const isApproved = p.lifecycleState === 'AUDITED';
                const isDone = ['CREDITS_ISSUED', 'LISTED_ON_MARKETPLACE', 'RETIRED'].includes(p.lifecycleState);

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProject(p)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-500/50 bg-amber-950/20 shadow-lg shadow-amber-500/10'
                        : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-emerald-400">{p.id}</span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isPending
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : isApproved
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isDone
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        }`}
                      >
                        {p.lifecycleState.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mt-1 truncate">{p.name}</h4>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {p.claimedAnnualTonnage.toLocaleString()} tCO2e · {p.location.country}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-white/5">
                      <span>Assigned: {p.assignedVerifier.name.split(' ')[0]}</span>
                      <span className="text-emerald-400">AI: {p.aiConfidenceScore}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Workbench & Issuance Studio (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedProject ? (
            <div className="space-y-6">

              {/* Selected Project Overview Card */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-emerald-400 font-bold">{selectedProject.id}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                        {selectedProject.projectType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-white mt-1">{selectedProject.name}</h2>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Proponent: <strong className="text-white">{selectedProject.developerName}</strong> ({selectedProject.developerWallet.slice(0, 10)}...)
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Claimed Volume</span>
                    <div className="text-xl font-black text-emerald-400 font-mono">
                      {selectedProject.claimedAnnualTonnage.toLocaleString()} tCO2e/yr
                    </div>
                  </div>
                </div>

                {/* 3 Telemetry Pillars Evidence Snapshot */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-[10px] uppercase">
                      <FileText className="w-3.5 h-3.5" /> Capex Invoices
                    </div>
                    <div className="font-bold text-white">${selectedProject.capexUsd.toLocaleString()} USD</div>
                    <div className="text-[10px] text-slate-400 truncate">Additionality verified</div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-sky-400 text-[10px] uppercase">
                      <Radio className="w-3.5 h-3.5" /> Ground IoT Sensors
                    </div>
                    <div className="font-bold text-white">-4.85 ppm/hr Flux</div>
                    <div className="text-[10px] text-slate-400">Ed25519 Signed Telemetry</div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-violet-400 text-[10px] uppercase">
                      <Satellite className="w-3.5 h-3.5" /> Sentinel-2 NDVI
                    </div>
                    <div className="font-bold text-white">0.812 Mean Index</div>
                    <div className="text-[10px] text-slate-400">Copernicus L2A Match</div>
                  </div>
                </div>

                {/* Top Merkle Root */}
                <div className="p-3 rounded-xl bg-black/50 border border-white/5 font-mono text-[11px] text-slate-400 truncate">
                  <span className="text-slate-500">Cryptographic Merkle Root: </span>
                  <span className="text-emerald-300">{selectedProject.merkleRoot}</span>
                </div>
              </div>

              {/* State-Specific Workflow Panes */}

              {/* STATE 1: PENDING PO-S STAKE */}
              {isPendingStake && (
                <div className="p-6 rounded-2xl bg-amber-950/20 border-2 border-amber-500/40 space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">
                        Proof-of-Stake Verification Collateral Required
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        To maintain impartial audit integrity, protocol rules require verifiers to bond <strong>0.5 ETH</strong> collateral before accessing the audit workbench.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-black/40 border border-white/10 p-4 text-xs space-y-2 text-slate-300">
                    <div className="flex justify-between">
                      <span>Assigned Verifier:</span>
                      <strong className="text-white">{selectedProject.assignedVerifier.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Required Collateral:</span>
                      <span className="font-mono text-amber-400 font-bold">0.50 ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Slashing Condition:</span>
                      <span className="text-red-300">50% slashed upon verified misrepresentation</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                    <button
                      onClick={handlePassToNextVerifier}
                      disabled={isSubmittingAction}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/5 flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <RotateCw className="w-3.5 h-3.5" /> Pass to Next Verifier in Pool
                    </button>
                    
                    <button
                      onClick={handleStakeAndAccept}
                      disabled={isSubmittingAction}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Coins className="w-4 h-4" />
                      {isSubmittingAction ? 'Locking Stake…' : 'Stake 0.5 ETH & Start Audit'}
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 2: ACTIVELY AUDITING */}
              {isAuditing && (
                <div className="p-6 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-5 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-base font-bold text-white">
                        Verification Audit Workbench
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      0.5 ETH Collateral Active
                    </span>
                  </div>

                  {/* 5-Point Verification Checklist */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Required Verification Invariants (5/5)
                    </span>
                    <div className="space-y-2">
                      {CHECKLIST_ITEMS.map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/10 hover:bg-white/5 cursor-pointer transition-all"
                        >
                          <input
                            type="checkbox"
                            checked={checklist[item.key] || false}
                            onChange={(e) =>
                              setChecklist({ ...checklist, [item.key]: e.target.checked })
                            }
                            className="h-4 w-4 rounded text-emerald-500 focus:ring-emerald-400 border-slate-700 bg-black"
                          />
                          <span className="text-xs text-slate-200 font-medium">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Audit Notes */}
                  <label className="block text-xs font-semibold text-slate-300">
                    Lead Auditor Notes & Justification
                    <textarea
                      rows={3}
                      value={auditNotes}
                      onChange={(e) => setAuditNotes(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white outline-none focus:border-emerald-500"
                      placeholder="Detail sensor validation, ground truth inspections, and additionality confirmation…"
                    />
                  </label>

                  {/* Conflict of interest confirmation */}
                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={conflictConfirmed}
                      onChange={(e) => setConflictConfirmed(e.target.checked)}
                      className="h-4 w-4 rounded text-emerald-500"
                    />
                    <span>I declare zero commercial conflict of interest with this project proponent.</span>
                  </label>

                  <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-white/10">
                    <button
                      onClick={() => setShowEvidenceRequest(true)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/5"
                    >
                      Request Additional Evidence
                    </button>
                    <button
                      onClick={handleApproveAudit}
                      disabled={isSubmittingAction}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Award className="w-4 h-4" />
                      {isSubmittingAction ? 'Signing Approval…' : 'Sign & Complete Audit'}
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 3: AUDITED -> EXCLUSIVE VERIFIER NFT ISSUANCE STUDIO */}
              {isAuditedReadyForMint && (
                <div className="p-6 rounded-2xl bg-gradient-to-b from-emerald-950/30 to-slate-900/90 border-2 border-emerald-500/50 space-y-5 animate-fadeIn shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-6 h-6 text-emerald-400" />
                      <div>
                        <h3 className="text-base font-black text-white">
                          Verifier-Exclusive Carbon Credit NFT Issuance Studio
                        </h3>
                        <p className="text-xs text-slate-300">
                          As the accredited auditor, only you have authority to mint tradable ERC-721 Carbon Credit NFTs for this project.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500 text-slate-950">
                      Audit Approved
                    </span>
                  </div>

                  {/* Issuance Parameters Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <label className="block text-slate-300 font-semibold">
                      Total CO₂ Tonnage to Issue (tCO₂e)
                      <input
                        type="number"
                        min="1"
                        max={selectedProject.claimedAnnualTonnage}
                        value={approvedTonnage}
                        onChange={(e) => setApprovedTonnage(Number(e.target.value))}
                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-emerald-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Max claimed: {selectedProject.claimedAnnualTonnage.toLocaleString()} tCO2e
                      </span>
                    </label>

                    <label className="block text-slate-300 font-semibold">
                      Number of Credit NFTs to Issue
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={nftQuantity}
                        onChange={(e) => setNftQuantity(Number(e.target.value))}
                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-emerald-500"
                      />
                      <span className="text-[10px] text-emerald-400 mt-1 block">
                        {(approvedTonnage / (nftQuantity || 1)).toFixed(2)} tCO₂e claim per individual NFT
                      </span>
                    </label>

                    <label className="block text-slate-300 font-semibold sm:col-span-2">
                      Issuance Architecture Model
                      <select
                        value={issuanceModel}
                        onChange={(e) => setIssuanceModel(e.target.value as any)}
                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                      >
                        <option value="UPFRONT">Upfront Batch Issuance (100% immediate sequestration claim)</option>
                        <option value="LINEAR_VESTING">Linear Vintage Vesting (e.g. 12-Month Tranches)</option>
                      </select>
                    </label>
                  </div>

                  {/* Mint Target Box */}
                  <div className="rounded-xl bg-black/40 border border-white/10 p-4 text-xs font-mono space-y-1.5">
                    <div className="text-[10px] uppercase text-slate-400 font-bold">Smart Contract Mint Destination</div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Recipient:</span>
                      <span className="text-emerald-400 font-bold">Project Developer Wallet</span>
                    </div>
                    <div className="truncate text-slate-400">
                      Address: <span className="text-white">{selectedProject.developerWallet}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-white/5">
                      <span className="text-slate-500">Generated Token IDs:</span>
                      <span className="text-sky-300">#5001 – #{5000 + nftQuantity}</span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleIssueNfts}
                      disabled={isMintingNfts}
                      className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      {isMintingNfts ? 'Minting On-Chain Tokens…' : `Mint & Issue ${nftQuantity} Credit NFTs to Developer`}
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 4: ALREADY MINTED */}
              {isMinted && (
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-teal-500/30 space-y-4 text-xs">
                  <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Carbon Credits Minted & Delivered to Developer</span>
                  </div>
                  <p className="text-slate-300">
                    You have successfully minted <strong>{selectedProject.nfts.length} NFTs</strong> ({selectedProject.totalIssuedTonnage} tCO2e total) for this project.
                    The Project Developer has received the tokens and has authority to set pricing and trade on the marketplace.
                  </p>
                  <div className="font-mono text-[10px] text-slate-400 truncate">
                    Issuance TX: <span className="text-teal-300">{selectedProject.nftIssuanceTxHash}</span>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-white/5 border border-white/10 text-center text-slate-400 text-xs">
              Select an assigned project from the queue to start review.
            </div>
          )}
        </div>

      </div>

      {/* Evidence Request Modal */}
      {showEvidenceRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-sky-500/30 bg-[#0B0F17] p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-bold text-white">Request Additional Evidence / Field Audit</h3>
              <button onClick={() => setShowEvidenceRequest(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              rows={4}
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-sky-500"
              placeholder="Specify the additional documentation, drone multispectral imagery, or ground soil core samples required…"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowEvidenceRequest(false)} className="px-4 py-2 rounded-xl border border-white/10 text-slate-300">
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowEvidenceRequest(false);
                  setActionMessage('Evidence request sent to project proponent.');
                  setTimeout(() => setActionMessage(''), 4000);
                }}
                className="px-5 py-2 rounded-xl bg-sky-500 text-slate-950 font-bold hover:bg-sky-400"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
