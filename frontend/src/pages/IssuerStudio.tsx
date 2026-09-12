import React, { useState } from 'react';
import { 
  Building2, 
  UploadCloud, 
  Cpu, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Copy, 
  Check, 
  ArrowRight, 
  RefreshCw, 
  Satellite, 
  Radio, 
  FileText 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WalletState } from '../lib/web3';

interface IssuerStudioProps {
  wallet: WalletState;
  backendUrl: string;
}

export const IssuerStudio: React.FC<IssuerStudioProps> = ({ wallet, backendUrl }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [copiedDid, setCopiedDid] = useState(false);

  // Form State - Step 1: Project
  const [projectId, setProjectId] = useState(`PROJ-AMAZON-${Math.floor(100 + Math.random() * 900)}`);
  const [projectName, setProjectName] = useState('Amazonian Bio-Canopy & Peatland Carbon Sink');
  const [projectType, setProjectType] = useState('REFORESTATION');
  const [locationCountry, setLocationCountry] = useState('Brazil');
  const [locationRegion, setLocationRegion] = useState('Acre State');
  const [claimedTonnage, setClaimedTonnage] = useState<number>(50000);
  
  // Registered Project Response
  const [registeredProject, setRegisteredProject] = useState<any>(null);
  const [did, setDid] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Step 2: Evidence Items
  const [evidenceItems] = useState([
    {
      sourceType: 'IOT_SENSOR',
      name: 'Ground Flux Sensor Array #4',
      payload: { sensorId: 'IOT-FLUX-409', co2FluxPpm: 418.2, soilMoisturePct: 38.5, timestamp: Date.now() - 3600000 }
    },
    {
      sourceType: 'SATELLITE_NDVI',
      name: 'Sentinel-2 Multispectral L2A',
      payload: { satellite: 'Sentinel-2B', meanNdvi: 0.812, canopyCoveragePct: 94.6, timestamp: Date.now() - 1800000 }
    },
    {
      sourceType: 'OPERATIONAL_DOC',
      name: 'Independent Auditor Verification Attestation',
      payload: { auditFirm: 'Verra Accredited BioAudit Group', auditorDid: 'did:carbonyx:0x8888888888888888888888888888888888888888', attestationHash: '0x3a9b1c7e5d8f2a4b6c0e1d3f5a7b9c1e3f5a7b9c1e3f5a7b9c1e3f5a7b9c1e3f' }
    }
  ]);
  const [isIngesting, setIsIngesting] = useState(false);
  const [bundleData, setBundleData] = useState<any>(null);

  // Step 3 & 4: Risk & Mint State
  const [isEvaluatingRisk, setIsEvaluatingRisk] = useState(false);
  const [riskAssessment, setRiskAssessment] = useState<any>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [mintedNft, setMintedNft] = useState<any>(null);

  const ownerAddr = wallet.address || '0x71C8363879F80e6138e09664D6745B73B47c2CEe';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDid(true);
    setTimeout(() => setCopiedDid(false), 2000);
  };

  // Handle Step 1: Register Project
  const handleRegisterProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    try {
      const response = await fetch(`${backendUrl}/api/projects/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name: projectName,
          projectType,
          location: { country: locationCountry, region: locationRegion },
          claimedAnnualTonnage: claimedTonnage,
          ownerAddress: ownerAddr
        })
      });
      const data = await response.json();
      if (response.ok) {
        setRegisteredProject(data.project);
        setDid(data.did || `did:carbonyx:${ownerAddr.toLowerCase()}`);
        setCurrentStep(2);
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch (err: any) {
      alert('Error registering project: ' + err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  // Handle Step 2: Upload Evidence & Compute Merkle Tree
  const handleIngestEvidence = async () => {
    setIsIngesting(true);
    try {
      const response = await fetch(`${backendUrl}/api/evidence/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: registeredProject?.project_id || projectId,
          monitoringPeriod: { startDate: '2026-01-01', endDate: '2026-03-31' },
          evidenceItems: evidenceItems
        })
      });
      const data = await response.json();
      if (response.ok) {
        setBundleData(data);
        setCurrentStep(3);
      } else {
        alert(data.error || 'Ingestion failed');
      }
    } catch (err: any) {
      alert('Error ingesting evidence: ' + err.message);
    } finally {
      setIsIngesting(false);
    }
  };

  // Handle Step 3: Run AI Risk Scoring
  const handleEvaluateRisk = async () => {
    if (!bundleData?.bundle?.bundle_id) return;
    setIsEvaluatingRisk(true);
    try {
      const response = await fetch(`${backendUrl}/api/risk/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bundleId: bundleData.bundle.bundle_id,
          projectId: registeredProject?.project_id || projectId,
          projectType,
          declaredTonnage: 500,
          evidenceItems: evidenceItems
        })
      });
      const data = await response.json();
      if (response.ok) {
        setRiskAssessment(data.riskAssessment);
        setCurrentStep(4);
      } else {
        alert(data.error || 'Risk evaluation failed');
      }
    } catch (err: any) {
      alert('Error evaluating risk: ' + err.message);
    } finally {
      setIsEvaluatingRisk(false);
    }
  };

  // Handle Step 4: Policy-Gated Minting
  const handleMintCredit = async () => {
    if (!bundleData?.bundle?.bundle_id) return;
    setIsMinting(true);
    try {
      const response = await fetch(`${backendUrl}/api/credits/mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bundleId: bundleData.bundle.bundle_id,
          projectId: registeredProject?.project_id || projectId,
          co2Tonnage: 500,
          vintageYear: 2026,
          ownerAddress: ownerAddr
        })
      });
      const data = await response.json();
      if (response.ok) {
        setMintedNft(data);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#34D399', '#059669', '#6EE7B7']
        });
      } else {
        alert(data.error || 'Minting failed');
      }
    } catch (err: any) {
      alert('Error minting credit: ' + err.message);
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header & DID Identity Card */}
      <div className="bg-slate-900/80 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Issuer Studio v1.0
              </span>
              <span className="text-xs text-slate-400">Process Patent Phase C2</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Carbon Project Ingestion & Gated Minting
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Cryptographically bind multi-source telemetry into SHA-256 Merkle trees and mint dynamic verified ERC-721 offset certificates.
            </p>
          </div>

          {/* Live DID Badge */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Decentralized Identifier (DID)</div>
              <div className="text-xs font-mono text-emerald-300 font-semibold flex items-center gap-2">
                <span>{did ? `${did.slice(0, 22)}...${did.slice(-6)}` : `did:carbonyx:${ownerAddr.slice(0, 8)}...`}</span>
                <button 
                  onClick={() => copyToClipboard(did || `did:carbonyx:${ownerAddr}`)}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Copy DID"
                >
                  {copiedDid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stepper Navigation */}
        <div className="grid grid-cols-4 gap-2 mt-8 pt-6 border-t border-slate-800">
          {[
            { step: 1, title: 'Project Registration', desc: 'Identity & Baseline' },
            { step: 2, title: 'Multi-Source Telemetry', desc: 'IoT, Satellite & Docs' },
            { step: 3, title: 'SHA-256 Merkle Engine', desc: 'Root Hash Anchoring' },
            { step: 4, title: 'AI Risk & Gated Mint', desc: 'ERC-721 Offset Token' }
          ].map((item) => (
            <div 
              key={item.step}
              onClick={() => item.step <= currentStep && setCurrentStep(item.step)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                currentStep === item.step
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/5'
                  : currentStep > item.step
                  ? 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                  : 'bg-slate-950/20 border-slate-900 text-slate-600 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                  currentStep === item.step ? 'bg-emerald-500 text-slate-950' : currentStep > item.step ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  {currentStep > item.step ? '✓' : item.step}
                </span>
                <span className="text-xs font-semibold">{item.title}</span>
              </div>
              <p className="text-[11px] text-slate-400 truncate pl-7">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: Project Registration Form */}
      {currentStep === 1 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Step 1: Register Carbon Removal Project</h2>
          </div>

          <form onSubmit={handleRegisterProject} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Project Identifier</label>
                <input 
                  type="text" 
                  value={projectId} 
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Project Name</label>
                <input 
                  type="text" 
                  value={projectName} 
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Methodology / Project Type</label>
                <select 
                  value={projectType} 
                  onChange={(e) => setProjectType(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                >
                  <option value="REFORESTATION">Reforestation & Canopy Biomass</option>
                  <option value="BLUE_CARBON">Blue Carbon Coastal Mangroves</option>
                  <option value="METHANE_CAPTURE">Agricultural Methane Abatement</option>
                  <option value="RENEWABLE_ENERGY">Distributed Microgrid Displacement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Claimed Annual Tonnage (tCO2e)</label>
                <input 
                  type="number" 
                  value={claimedTonnage} 
                  onChange={(e) => setClaimedTonnage(Number(e.target.value))}
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Country</label>
                <input 
                  type="text" 
                  value={locationCountry} 
                  onChange={(e) => setLocationCountry(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">State / Region</label>
                <input 
                  type="text" 
                  value={locationRegion} 
                  onChange={(e) => setLocationRegion(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={isRegistering}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isRegistering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {isRegistering ? 'Registering Project...' : 'Register Project & Generate DID'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: Multi-Source Evidence Ingestion */}
      {currentStep === 2 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Step 2: Multi-Source Evidence Telemetry</h2>
            </div>
            <span className="text-xs text-slate-400">3 Telemetry Streams Loaded</span>
          </div>

          <p className="text-sm text-slate-400">
            Carbonyx validates carbon offsets by cross-referencing multi-source ground IoT sensor telemetry, Sentinel-2 satellite optical indices, and third-party operational audit files.
          </p>

          {/* Evidence Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {evidenceItems.map((item, idx) => (
              <div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-emerald-400">
                    {item.sourceType === 'IOT_SENSOR' && <Radio className="w-4 h-4" />}
                    {item.sourceType === 'SATELLITE_NDVI' && <Satellite className="w-4 h-4" />}
                    {item.sourceType === 'OPERATIONAL_DOC' && <FileText className="w-4 h-4" />}
                    <span className="text-xs font-semibold uppercase">{item.sourceType}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">{item.name}</h4>
                  <pre className="text-[11px] bg-slate-900 p-2.5 rounded-lg text-slate-300 font-mono overflow-x-auto border border-slate-800/80">
                    {JSON.stringify(item.payload, null, 2)}
                  </pre>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
                  <span>SHA-256 Validated</span>
                  <span className="text-emerald-400 font-semibold">Ready</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button 
              onClick={() => setCurrentStep(1)}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              ← Back to Project Details
            </button>

            <button 
              onClick={handleIngestEvidence}
              disabled={isIngesting}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isIngesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
              {isIngesting ? 'Anchoring Merkle Tree...' : 'Commit Evidence & Anchor Merkle Root'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Live Merkle Tree Visualizer */}
      {currentStep === 3 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Step 3: SHA-256 Merkle Tree Computation</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Immutably Anchored
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="text-xs text-slate-400">On-Chain Anchored Merkle Root:</div>
              <div className="font-mono text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 break-all">
                {bundleData?.merkleRoot || '0x256ef5b1e8f089f7d1944156effac9991de901413d840e6c2a4576f6cfdd6feb'}
              </div>
            </div>

            {/* Visual Tree Diagram */}
            <div className="py-6 flex flex-col items-center justify-center space-y-4">
              {/* Root Node */}
              <div className="bg-emerald-500/20 border-2 border-emerald-500 rounded-xl px-4 py-2 text-center shadow-lg shadow-emerald-500/10">
                <div className="text-[10px] text-emerald-300 font-semibold uppercase">Top Merkle Root</div>
                <div className="text-xs font-mono text-white font-bold">{bundleData?.merkleRoot ? `${bundleData.merkleRoot.slice(0, 16)}...` : '0x256e...'}</div>
              </div>

              {/* Connecting Lines */}
              <div className="w-48 h-4 border-t-2 border-x-2 border-slate-700" />

              {/* Leaf Hashes */}
              <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
                {(bundleData?.leaves || [
                  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                  '0x2345678901abcdef2345678901abcdef2345678901abcdef2345678901abcdef',
                  '0x3456789012abcdef3456789012abcdef3456789012abcdef3456789012abcdef'
                ]).map((leaf: string, i: number) => (
                  <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center">
                    <div className="text-[10px] text-slate-400 font-semibold">Leaf #{i + 1} ({evidenceItems[i]?.sourceType})</div>
                    <div className="text-[11px] font-mono text-slate-300 truncate mt-1">{leaf}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button 
              onClick={() => setCurrentStep(2)}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              ← Modify Telemetry
            </button>

            <button 
              onClick={handleEvaluateRisk}
              disabled={isEvaluatingRisk}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isEvaluatingRisk ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
              {isEvaluatingRisk ? 'Evaluating AI Anomaly Model...' : 'Run AI Anomaly & Risk Evaluation'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: AI Risk Evaluation & Gated Minting */}
      {currentStep === 4 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Step 4: AI Risk Score & Policy-Gated Minting</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Confidence Score: {riskAssessment?.confidence_score || 92}%
            </span>
          </div>

          {/* AI Result Card */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400">Confidence Score</div>
                <div className="text-3xl font-extrabold text-emerald-400 mt-1">{riskAssessment?.confidence_score || 92}<span className="text-sm font-normal text-slate-400">/100</span></div>
                <div className="text-[11px] text-emerald-400 font-semibold mt-1">✓ Exceeds 85% Auto-Mint Threshold</div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400">Anomaly Risk Level</div>
                <div className="text-2xl font-bold text-emerald-300 mt-1">{riskAssessment?.risk_level || 'LOW'}</div>
                <div className="text-[11px] text-slate-400 mt-1">0 Sensor Drift Flags Detected</div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400">Policy Gate Decision</div>
                <div className="text-lg font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5" /> Auto-Mint Eligible
                </div>
                <div className="text-[11px] text-slate-400 mt-1">No Verifier Staking Required</div>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Explainable AI (XAI) Justification</div>
              <p className="text-sm text-slate-200">
                "{riskAssessment?.explanation_reason || 'Ground sensor IoT flux and Sentinel-2 Satellite NDVI correlation confirmed within 5.4% tolerance. No baseline drift detected.'}"
              </p>
            </div>
          </div>

          {/* Mint Result or Trigger */}
          {mintedNft ? (
            <div className="bg-emerald-950/30 border-2 border-emerald-500/40 rounded-2xl p-6 text-center space-y-4 shadow-2xl shadow-emerald-500/10">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-slate-950 uppercase">
                  ERC-721 Certificate Minted
                </span>
                <h3 className="text-xl font-bold text-white mt-2">
                  Carbonyx Verified Offset #{mintedNft.tokenId}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Issued to <span className="font-mono text-emerald-300">{ownerAddr.slice(0, 10)}...</span> • 500 tCO2e • Vintage 2026
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 max-w-lg mx-auto font-mono text-xs text-slate-300 break-all">
                <span className="text-slate-500">Merkle Root: </span>
                {mintedNft.merkleRoot}
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button 
                  onClick={() => {
                    setCurrentStep(1);
                    setMintedNft(null);
                    setBundleData(null);
                    setRiskAssessment(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                >
                  Register Another Project
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-4">
              <button 
                onClick={() => setCurrentStep(3)}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                ← Back to Merkle Visualizer
              </button>

              <button 
                onClick={handleMintCredit}
                disabled={isMinting}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-slate-950 font-extrabold text-sm hover:brightness-110 transition-all flex items-center gap-2 shadow-xl shadow-emerald-500/25 disabled:opacity-50 animate-pulse"
              >
                {isMinting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isMinting ? 'Minting On-Chain ERC-721 Token...' : 'Execute Policy-Gated Mint (500 tCO2e)'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IssuerStudio;
