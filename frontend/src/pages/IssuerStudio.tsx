import React, { useState } from 'react';
import { Shield, Sparkles, Database, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, FileText, Cpu, ExternalLink, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';

export default function IssuerStudio({ walletAddress }: { walletAddress: string | null }) {
  const [projectId, setProjectId] = useState('PRJ-AMZ-2026');
  const [projectName, setProjectName] = useState('Amazonian Bio-Canopy Reforestation');
  const [projectType, setProjectType] = useState('REFORESTATION');
  const [declaredTonnage, setDeclaredTonnage] = useState(500);
  const [activeScenario, setActiveScenario] = useState<'A' | 'B'>('A');

  const [did, setDid] = useState<string | null>(null);
  const [registeredTx, setRegisteredTx] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const [merkleRoot, setMerkleRoot] = useState<string | null>(null);
  const [bundleId, setBundleId] = useState<string | null>(null);
  const [leafHashes, setLeafHashes] = useState<string[]>([]);
  const [isIngesting, setIsIngesting] = useState(false);

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [scoreResult, setScoreResult] = useState<any>(null);

  // Pre-configured evidence items for Scenarios
  const scenarioAItems = [
    {
      sourceType: 'IOT_SENSOR',
      metric: 'co2_flux_ppm',
      value: 412.5,
      calculatedTonnage: 510.0,
      timestamp: 1726000000
    },
    {
      sourceType: 'SATELLITE_NDVI',
      metric: 'canopy_cover_delta',
      value: 0.18,
      calculatedTonnage: 495.0,
      timestamp: 1726000000
    },
    {
      sourceType: 'OPERATIONAL_DOC',
      metric: 'planted_saplings',
      value: 25000,
      calculatedTonnage: 505.0,
      timestamp: 1726000000
    }
  ];

  const scenarioBItems = [
    {
      sourceType: 'IOT_SENSOR',
      metric: 'co2_flux_ppm',
      value: 412.0,
      calculatedTonnage: 1050.0,
      timestamp: 1726000000
    },
    {
      sourceType: 'SATELLITE_NDVI',
      metric: 'canopy_cover_delta',
      value: -0.35,
      calculatedTonnage: 150.0,
      timestamp: 1726000000
    }
  ];

  const currentEvidenceItems = activeScenario === 'A' ? scenarioAItems : scenarioBItems;

  const handleRegisterProject = async () => {
    setIsRegistering(true);
    try {
      const res = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          ownerAddress: walletAddress || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          name: projectName,
          projectType,
          claimedAnnualTonnage: declaredTonnage
        })
      });
      const data = await res.json();
      if (data.success) {
        setDid(data.did);
        setRegisteredTx(data.onChainTxHash);
      }
    } catch (err: any) {
      alert(`Registration failed: ${err.message}`);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleIngestEvidence = async () => {
    setIsIngesting(true);
    const newBundleId = `bnd-${activeScenario.toLowerCase()}-${Date.now().toString().slice(-6)}`;
    setBundleId(newBundleId);
    try {
      const res = await fetch(`${API_URL}/api/evidence/bundle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bundleId: newBundleId,
          projectId,
          evidenceItems: currentEvidenceItems
        })
      });
      const data = await res.json();
      if (data.success) {
        setMerkleRoot(data.merkleRoot);
        setLeafHashes(data.leafHashes || []);
      }
    } catch (err: any) {
      alert(`Ingestion failed: ${err.message}`);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleRunAIEvaluation = async () => {
    if (!bundleId) {
      alert('Please compute the Merkle Root bundle first');
      return;
    }
    setIsEvaluating(true);
    setScoreResult(null);
    try {
      const res = await fetch(`${API_URL}/api/risk/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bundleId,
          projectId,
          projectType,
          declaredTonnage: activeScenario === 'A' ? 500 : 1000,
          evidenceItems: currentEvidenceItems
        })
      });
      const data = await res.json();
      if (data.success) {
        setScoreResult(data);
        if (data.assessment?.autoMintEligible) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }
    } catch (err: any) {
      alert(`AI evaluation failed: ${err.message}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-8 text-left w-full max-w-6xl mx-auto">
      {/* Top Banner & Scenario Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-glass">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#10B981]" />
            Issuer Ingestion & Minting Studio
          </h2>
          <p className="text-sm text-slate-400">
            Submit multi-source MRV telemetry, compute SHA-256 Merkle root, and pass AI anomaly gating.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10">
          <button
            onClick={() => { setActiveScenario('A'); setScoreResult(null); setMerkleRoot(null); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeScenario === 'A'
                ? 'bg-[#10B981] text-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Scenario A (Clean Pass)
          </button>
          <button
            onClick={() => { setActiveScenario('B'); setScoreResult(null); setMerkleRoot(null); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeScenario === 'B'
                ? 'bg-[#EF4444] text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Scenario B (Fraud Anomaly)
          </button>
        </div>
      </div>

      {/* Step 1: Project DID Registration */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-glass space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#10B981]/20 text-[#10B981] text-xs flex items-center justify-center font-mono">1</span>
            Project Registration & DID Issuance
          </h3>
          {did && (
            <span className="px-3 py-1 rounded-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 text-xs font-mono font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              DID Anchored On-Chain
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-400 font-medium">Project Identifier</label>
            <input
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#10B981]"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium">Project Name</label>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#10B981]"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium">Methodology Type</label>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#10B981]"
            >
              <option value="REFORESTATION">Reforestation (AFOLU)</option>
              <option value="BLUE_CARBON">Blue Carbon (Mangrove)</option>
              <option value="METHANE_CAPTURE">Methane Capture</option>
              <option value="RENEWABLE_ENERGY">Renewable Energy</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {did ? (
            <div className="text-xs font-mono text-slate-300 bg-black/30 p-2 rounded-lg border border-white/5 flex-1 mr-4 truncate">
              DID: <span className="text-[#06B6D4] font-bold">{did}</span>
              {registeredTx && (
                <span className="ml-3 text-slate-500">Tx: {registeredTx.slice(0, 14)}...</span>
              )}
            </div>
          ) : <div />}

          <button
            onClick={handleRegisterProject}
            disabled={isRegistering || !!did}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#06B6D4] text-black font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-2"
          >
            {isRegistering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            {did ? 'Project Registered' : 'Generate Project DID'}
          </button>
        </div>
      </div>

      {/* Step 2: Multi-Source Evidence Ingestion & Merkle Tree */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-glass space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#06B6D4]/20 text-[#06B6D4] text-xs flex items-center justify-center font-mono">2</span>
            Multi-Source Evidence Bundle & Merkle Engine
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {currentEvidenceItems.length} MRV Telemetry Stream(s) Loaded
          </span>
        </div>

        {/* Telemetry Stream Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {currentEvidenceItems.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#06B6D4]">{item.sourceType}</span>
                <span className="text-[10px] text-slate-500 font-mono">Leaf #{idx}</span>
              </div>
              <div className="text-sm font-semibold text-white">{item.metric}: <span className="font-mono text-slate-300">{item.value}</span></div>
              <div className="text-xs text-slate-400">Calculated: <span className="font-mono text-white font-bold">{item.calculatedTonnage} tCO2e</span></div>
            </div>
          ))}
        </div>

        {merkleRoot && (
          <div className="p-4 rounded-xl bg-[#10B981]/5 border border-[#10B981]/20 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">SHA-256 Merkle Root:</span>
              <span className="text-[#10B981] font-bold truncate max-w-md">{merkleRoot}</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 truncate">
              Bundle ID: {bundleId} • {leafHashes.length} cryptographically hashed leaves anchored
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={handleIngestEvidence}
            disabled={isIngesting}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm transition-all flex items-center gap-2"
          >
            {isIngesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4 text-[#06B6D4]" />}
            {merkleRoot ? 'Recompute Merkle Tree' : 'Hash Leaves & Compute Merkle Root'}
          </button>
        </div>
      </div>

      {/* Step 3: AI Anomaly Scoring & Policy-Gated Minting */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-glass space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] text-xs flex items-center justify-center font-mono">3</span>
            AI Anomaly Engine & Smart Contract Policy Gate
          </h3>
          <button
            onClick={handleRunAIEvaluation}
            disabled={isEvaluating || !merkleRoot}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#06B6D4] text-black font-extrabold text-sm hover:opacity-90 disabled:opacity-30 transition-all flex items-center gap-2 shadow-lg shadow-[#10B981]/20"
          >
            {isEvaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Run AI Anomaly Scoring (/score)
          </button>
        </div>

        {scoreResult && (
          <div className="space-y-4 pt-2">
            {/* Confidence & Risk Classification Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                <span className="text-xs text-slate-400">Confidence Score</span>
                <div className="text-2xl font-black font-mono text-white mt-1">
                  {scoreResult.assessment?.confidenceScore}%
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full ${
                      scoreResult.assessment?.confidenceScore >= 85 ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                    }`}
                    style={{ width: `${scoreResult.assessment?.confidenceScore}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                <span className="text-xs text-slate-400">Risk Classification</span>
                <div className="mt-1">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                    scoreResult.assessment?.riskLevel === 'LOW'
                      ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                      : 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30'
                  }`}>
                    {scoreResult.assessment?.riskLevel} RISK
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  {scoreResult.assessment?.riskLevel === 'LOW' ? 'Auto-Mint Eligible' : 'Human Audit Mandatory'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                <span className="text-xs text-slate-400">Policy Gate Status</span>
                <div className="text-sm font-bold mt-1 text-white flex items-center gap-1.5">
                  {scoreResult.assessment?.autoMintEligible ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                      <span>PASSED & ISSUED</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                      <span>ESCALATED TO VERIFIER</span>
                    </>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-2">
                  Latency: {scoreResult.assessment?.executionTimeMs}ms
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                <span className="text-xs text-slate-400">On-Chain Risk Anchor</span>
                <div className="text-xs font-mono text-[#06B6D4] truncate mt-1">
                  {scoreResult.onChainRiskTxHash ? `${scoreResult.onChainRiskTxHash.slice(0, 14)}...` : 'Anchoring...'}
                </div>
                <div className="text-[11px] text-slate-500 mt-2">
                  Recorded in CarbonRegistry
                </div>
              </div>
            </div>

            {/* XAI Narrative Reason */}
            <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#06B6D4] uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5" />
                Explainable AI (XAI) Verifier Narrative:
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {scoreResult.assessment?.explanationReason}
              </p>
            </div>

            {/* Minted NFT Card if Auto-Minted */}
            {scoreResult.mintResult && (
              <div className="p-5 rounded-xl bg-gradient-to-r from-[#10B981]/15 to-[#06B6D4]/15 border border-[#10B981]/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#10B981]/20 flex items-center justify-center text-[#10B981]">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base flex items-center gap-2">
                      Carbon Credit NFT #{scoreResult.mintResult.tokenId} Minted!
                      <span className="px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] text-xs font-mono">
                        ERC-721
                      </span>
                    </h4>
                    <p className="text-xs text-slate-300 font-mono mt-0.5">
                      Tonnage: 500 tCO2e • Tx: {scoreResult.mintResult.txHash.slice(0, 18)}...
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-black/40 border border-white/10 text-xs text-[#10B981] font-mono">
                    Token ID: {scoreResult.mintResult.tokenId}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
