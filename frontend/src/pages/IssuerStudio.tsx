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
  FileText,
  AlertTriangle,
  AlertOctagon,
  Sliders,
  Activity,
  ShieldAlert,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WalletState } from '../lib/web3';

interface IssuerStudioProps {
  wallet: WalletState;
  backendUrl: string;
  onNavigateTab?: (tab: 'overview' | 'issuer' | 'verifier' | 'marketplace' | 'explorer') => void;
}

interface SatelliteNdviResult {
  source: 'copernicus' | 'mock';
  configured: boolean;
  meanNdvi: number;
  ndviDelta: number;
  cloudCoveragePct: number;
  captureDate: string;
  calculatedSatelliteTonnage: number;
  warning?: string;
  baseline: {
    meanNdvi: number;
    cloudCoveragePct: number;
    captureDate: string;
    from: string;
    to: string;
  };
  current: {
    meanNdvi: number;
    cloudCoveragePct: number;
    captureDate: string;
    from: string;
    to: string;
  };
}

const buildSatelliteDateWindows = () => {
  const currentTo = new Date();
  currentTo.setUTCHours(23, 59, 59, 0);

  const currentFrom = new Date(currentTo);
  currentFrom.setUTCDate(currentFrom.getUTCDate() - 30);
  currentFrom.setUTCHours(0, 0, 0, 0);

  const baselineTo = new Date(currentTo);
  baselineTo.setUTCMonth(baselineTo.getUTCMonth() - 3);

  const baselineFrom = new Date(baselineTo);
  baselineFrom.setUTCDate(baselineFrom.getUTCDate() - 30);
  baselineFrom.setUTCHours(0, 0, 0, 0);

  return {
    baseline: {
      from: baselineFrom.toISOString(),
      to: baselineTo.toISOString()
    },
    current: {
      from: currentFrom.toISOString(),
      to: currentTo.toISOString()
    }
  };
};

export const IssuerStudio: React.FC<IssuerStudioProps> = ({ wallet, backendUrl, onNavigateTab }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [copiedDid, setCopiedDid] = useState(false);

  // Form State - Step 1: Project
  const [projectId, setProjectId] = useState(`PROJ-AMAZON-${Math.floor(100 + Math.random() * 900)}`);
  const [projectName, setProjectName] = useState('Amazonian Bio-Canopy & Peatland Carbon Sink');
  const [projectType, setProjectType] = useState('REFORESTATION');
  const [locationCountry, setLocationCountry] = useState('Brazil');
  const [locationRegion, setLocationRegion] = useState('Acre State');
  const [projectLatitude, setProjectLatitude] = useState<number>(-9.0);
  const [projectLongitude, setProjectLongitude] = useState<number>(-70.8);
  const [claimedTonnage, setClaimedTonnage] = useState<number>(50000);
  
  // Registered Project Response
  const [registeredProject, setRegisteredProject] = useState<any>(null);
  const [did, setDid] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Step 2: Evidence Items & Telemetry Scenarios
  type ScenarioType = 'clean' | 'moderate' | 'anomalous' | 'live';
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('clean');
  const [iotFluxPpm, setIotFluxPpm] = useState<number>(412.5);
  const [ndviDelta, setNdviDelta] = useState<number>(0.18);
  const [calculatedIotTonnage, setCalculatedIotTonnage] = useState<number>(510);
  const [calculatedSatelliteTonnage, setCalculatedSatelliteTonnage] = useState<number>(495);
  const [operationalSaplings, setOperationalSaplings] = useState<number>(25000);
  const [showAdvancedTuner, setShowAdvancedTuner] = useState(false);
  const [isFetchingSatellite, setIsFetchingSatellite] = useState(false);
  const [satelliteData, setSatelliteData] = useState<SatelliteNdviResult | null>(null);
  const [satelliteError, setSatelliteError] = useState<string>('');

  const applyScenario = (preset: ScenarioType) => {
    setSelectedScenario(preset);
    setSatelliteData(null);
    setSatelliteError('');
    if (preset === 'clean') {
      setIotFluxPpm(412.5);
      setNdviDelta(0.18);
      setCalculatedIotTonnage(510);
      setCalculatedSatelliteTonnage(495);
      setOperationalSaplings(25000);
    } else if (preset === 'moderate') {
      setIotFluxPpm(455.0);
      setNdviDelta(0.08);
      setCalculatedIotTonnage(560);
      setCalculatedSatelliteTonnage(460);
      setOperationalSaplings(21000);
    } else if (preset === 'anomalous') {
      setIotFluxPpm(850.0);
      setNdviDelta(-0.25);
      setCalculatedIotTonnage(1500);
      setCalculatedSatelliteTonnage(50);
      setOperationalSaplings(6000);
    }
  };

  const evidenceItems = [
    {
      sourceType: 'IOT_SENSOR',
      name: 'Ground Flux Sensor Array #4',
      metric: 'co2_flux_ppm',
      value: iotFluxPpm,
      calculatedTonnage: calculatedIotTonnage,
      payload: {
        sensorId: 'IOT-FLUX-409',
        co2FluxPpm: iotFluxPpm,
        calculatedTonnage: calculatedIotTonnage,
        soilMoisturePct: 38.5,
        timestamp: Date.now() - 3600000
      }
    },
    {
      sourceType: 'SATELLITE_NDVI',
      name: 'Sentinel-2 Multispectral L2A',
      metric: 'canopy_cover_delta',
      value: ndviDelta,
      calculatedTonnage: calculatedSatelliteTonnage,
      payload: {
        satellite: 'Sentinel-2 L2A',
        dataSource: satelliteData?.source || 'scenario_preset',
        meanNdvi: satelliteData?.meanNdvi ?? Number((0.65 + ndviDelta).toFixed(3)),
        baselineMeanNdvi: satelliteData?.baseline?.meanNdvi,
        canopyCoverDelta: ndviDelta,
        calculatedTonnage: calculatedSatelliteTonnage,
        canopyCoveragePct: satelliteData?.meanNdvi
          ? Number(Math.min(100, Math.max(0, satelliteData.meanNdvi * 100)).toFixed(1))
          : ndviDelta > 0 ? 94.6 : 61.2,
        cloudCoveragePct: satelliteData?.cloudCoveragePct,
        captureDate: satelliteData?.captureDate,
        baselineCaptureDate: satelliteData?.baseline?.captureDate,
        timestamp: satelliteData?.captureDate ? new Date(satelliteData.captureDate).getTime() : Date.now() - 1800000
      }
    },
    {
      sourceType: 'OPERATIONAL_DOC',
      name: 'Independent Auditor Verification Attestation',
      metric: 'planted_saplings',
      value: operationalSaplings,
      calculatedTonnage: 500,
      payload: {
        auditFirm: 'Verra Accredited BioAudit Group',
        plantedSaplings: operationalSaplings,
        auditorDid: 'did:carbonyx:0x8888888888888888888888888888888888888888',
        attestationHash: selectedScenario === 'anomalous'
          ? '0xdeadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678'
          : '0x3a9b1c7e5d8f2a4b6c0e1d3f5a7b9c1e3f5a7b9c1e3f5a7b9c1e3f5a7b9c1e3f'
      }
    }
  ];

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
          location: {
            country: locationCountry,
            region: locationRegion,
            coordinates: {
              latitude: projectLatitude,
              longitude: projectLongitude
            }
          },
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

  const handleFetchSatelliteData = async () => {
    setIsFetchingSatellite(true);
    setSatelliteError('');

    try {
      const dateWindows = buildSatelliteDateWindows();
      const response = await fetch(`${backendUrl}/api/satellite/ndvi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: projectLatitude,
          longitude: projectLongitude,
          radiusKm: 5,
          declaredTonnage: 500,
          ...dateWindows
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Satellite NDVI request failed');
      }

      setSatelliteData(data);
      setNdviDelta(Number(data.ndviDelta));
      setCalculatedSatelliteTonnage(Number(data.calculatedSatelliteTonnage));
      setSelectedScenario('live');

      if (data.warning) {
        setSatelliteError(data.warning);
      }
    } catch (err: any) {
      setSatelliteData(null);
      setSatelliteError(`Live satellite fetch unavailable. Keeping current demo telemetry values. ${err.message}`);
    } finally {
      setIsFetchingSatellite(false);
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

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={projectLatitude}
                  onChange={(e) => setProjectLatitude(Number(e.target.value))}
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={projectLongitude}
                  onChange={(e) => setProjectLongitude(Number(e.target.value))}
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Step 2: Multi-Source Evidence Telemetry</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">3 Telemetry Streams Active</span>
          </div>

          <p className="text-sm text-slate-400 leading-relaxed">
            Carbonyx cross-references multi-source ground IoT sensor flux, Sentinel-2 satellite optical canopy indices, and third-party operational audit attestations to feed our real-time Isolation Forest ML engine.
          </p>

          <div className="bg-slate-950/80 border border-cyan-500/20 rounded-xl p-4 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                  <Satellite className="w-4 h-4" />
                  Live Sentinel-2 NDVI
                </div>
                <div className="mt-1 text-[11px] text-slate-400 font-mono">
                  {projectLatitude.toFixed(4)}, {projectLongitude.toFixed(4)} | 5 km area | 30-day baseline delta
                </div>
              </div>

              <button
                type="button"
                onClick={handleFetchSatelliteData}
                disabled={isFetchingSatellite}
                className="px-4 py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-200 text-xs font-bold hover:bg-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isFetchingSatellite ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Satellite className="w-4 h-4" />}
                {isFetchingSatellite ? 'Fetching Sentinel Hub Stats...' : 'Fetch Live Satellite Data'}
              </button>
            </div>

            {satelliteData && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Source</div>
                  <div className={`text-sm font-bold mt-1 ${satelliteData.source === 'copernicus' ? 'text-cyan-300' : 'text-amber-300'}`}>
                    {satelliteData.source === 'copernicus' ? 'Copernicus API' : 'Demo Fallback'}
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Mean NDVI</div>
                  <div className="text-sm font-bold text-emerald-300 mt-1 font-mono">
                    {satelliteData.current.meanNdvi.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Baseline {satelliteData.baseline.meanNdvi.toFixed(3)}
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">NDVI Delta</div>
                  <div className={`text-sm font-bold mt-1 font-mono ${satelliteData.ndviDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {satelliteData.ndviDelta >= 0 ? '+' : ''}{satelliteData.ndviDelta.toFixed(3)}
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${satelliteData.ndviDelta >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}
                      style={{ width: `${Math.min(100, Math.max(8, Math.abs(satelliteData.ndviDelta) * 250))}%` }}
                    />
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Cloud / Capture</div>
                  <div className="text-sm font-bold text-slate-200 mt-1 font-mono">
                    {satelliteData.cloudCoveragePct.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {satelliteData.captureDate}
                  </div>
                </div>
              </div>
            )}

            {satelliteError && (
              <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 flex gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{satelliteError}</span>
              </div>
            )}
          </div>

          {/* Scenario Presets Selector */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Select Telemetry Test Scenario:
              </span>
              <button
                type="button"
                onClick={() => setShowAdvancedTuner(!showAdvancedTuner)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
              >
                <Sliders className="w-3.5 h-3.5" />
                {showAdvancedTuner ? 'Hide Parameter Tuner' : 'Fine-Tune Parameters'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => applyScenario('clean')}
                className={`p-3.5 rounded-xl text-left border transition-all ${
                  selectedScenario === 'clean'
                    ? 'bg-emerald-500/15 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-400">🟢 High Integrity Pass</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">~95-100% Score</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  IoT sensor (412.5 ppm) & satellite (+0.18 NDVI) corroborate within 2.9% tolerance.
                </p>
                <div className="mt-2 text-[10px] font-mono text-emerald-400/90 font-semibold">
                  Policy: Auto-Mint Approved
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyScenario('moderate')}
                className={`p-3.5 rounded-xl text-left border transition-all ${
                  selectedScenario === 'moderate'
                    ? 'bg-amber-500/15 border-amber-500/50 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-amber-400">🟡 Moderate Sensor Drift</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">~70-80% Score</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  IoT baseline drift (455.0 ppm) & slight canopy variance (560 vs 460 tCO2e).
                </p>
                <div className="mt-2 text-[10px] font-mono text-amber-400/90 font-semibold">
                  Policy: Verifier Recommended
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyScenario('anomalous')}
                className={`p-3.5 rounded-xl text-left border transition-all ${
                  selectedScenario === 'anomalous'
                    ? 'bg-rose-500/15 border-rose-500/50 shadow-lg shadow-rose-500/10'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-rose-400">🔴 Critical Anomaly / Fraud</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono">&lt; 50% Score</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Massive IoT flux spike (850 ppm) while satellite indicates negative canopy degradation (-0.25).
                </p>
                <div className="mt-2 text-[10px] font-mono text-rose-400/90 font-semibold">
                  Policy: Mandatory Escalation
                </div>
              </button>
            </div>

            {/* Optional Parameter Fine-Tuner */}
            {showAdvancedTuner && (
              <div className="pt-3 mt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">IoT CO2 Flux (ppm)</label>
                  <input
                    type="number"
                    value={iotFluxPpm}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setIotFluxPpm(v);
                      setCalculatedIotTonnage(Math.round(500 * (v / 412.5)));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                  <span className="text-[10px] text-slate-500">Ecological max: 600 ppm</span>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Satellite NDVI Delta</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ndviDelta}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setNdviDelta(v);
                      setCalculatedSatelliteTonnage(v >= 0 ? 500 : 50);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                  <span className="text-[10px] text-slate-500">Normal range: 0.10 to 0.40</span>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Calculated IoT Tonnage</label>
                  <input
                    type="number"
                    value={calculatedIotTonnage}
                    onChange={(e) => setCalculatedIotTonnage(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                  <span className="text-[10px] text-slate-500">Declared: 500 tCO2e</span>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Satellite Tonnage</label>
                  <input
                    type="number"
                    value={calculatedSatelliteTonnage}
                    onChange={(e) => setCalculatedSatelliteTonnage(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                  <span className="text-[10px] text-slate-500">15% delta threshold</span>
                </div>
              </div>
            )}
          </div>

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
                  <span>SHA-256 Digest Ready</span>
                  <span className="text-emerald-400 font-semibold font-mono">Calculated: {item.calculatedTonnage} t</span>
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
      {currentStep === 4 && (() => {
        const score = riskAssessment?.confidence_score ?? 0;
        const isAutoMint = riskAssessment?.auto_mint_eligible ?? (score >= 85);
        const riskLevel = riskAssessment?.risk_level || (score >= 85 ? 'LOW' : score >= 60 ? 'MEDIUM' : 'HIGH');
        const anomalyFlags: string[] = riskAssessment?.anomaly_flags || [];
        const execTime = riskAssessment?.execution_time_ms || riskAssessment?.executionTimeMs || 24;

        const scoreColorClass = score >= 85 
          ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' 
          : score >= 60 
            ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' 
            : 'text-rose-400 border-rose-500/30 bg-rose-500/10';

        const riskBadgeClass = riskLevel === 'LOW'
          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
          : riskLevel === 'MEDIUM'
            ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
            : 'text-rose-400 bg-rose-500/10 border-rose-500/20';

        return (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white">Step 4: AI Risk Score & Policy-Gated Minting</h2>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold font-mono border ${scoreColorClass}`}>
                AI Confidence Score: {score}%
              </span>
            </div>

            {/* AI Result Card */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Confidence Score</div>
                  <div className={`text-3xl font-extrabold mt-1 font-mono ${score >= 85 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {score}<span className="text-sm font-normal text-slate-400">/100</span>
                  </div>
                  <div className="text-[11px] font-semibold mt-1">
                    {score >= 85 && <span className="text-emerald-400">✓ Exceeds 85% Auto-Mint Threshold</span>}
                    {score >= 60 && score < 85 && <span className="text-amber-400">⚠️ 60-84% Review Floor: Verifier Required</span>}
                    {score < 60 && <span className="text-rose-400">⛔ Critical &lt; 60%: High Risk Outlier</span>}
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Anomaly Risk Classification</div>
                  <div className="mt-1">
                    <span className={`inline-block px-2.5 py-0.5 rounded-lg text-sm font-bold border ${riskBadgeClass}`}>
                      {riskLevel} RISK
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2">
                    {anomalyFlags.length} Anomaly Flag(s) Raised • {execTime}ms Inference
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Protocol Policy Gate</div>
                  <div className="text-base font-bold mt-1 flex items-center gap-1.5">
                    {isAutoMint ? (
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-5 h-5" /> Auto-Mint Eligible
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-5 h-5" /> Escalated to Verifier
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2">
                    {isAutoMint ? 'No Human Staking Required' : '50% Economic Collateral Audit Triggered'}
                  </div>
                </div>
              </div>

              {/* Anomaly Flags Box */}
              {anomalyFlags.length > 0 ? (
                <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4" />
                    Isolation Forest Anomaly & Correlation Flags Detected:
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {anomalyFlags.map((flag, fIdx) => (
                      <div key={fIdx} className="text-xs text-rose-300/90 font-mono bg-rose-950/40 px-3 py-1.5 rounded-lg border border-rose-900/40">
                        • {flag}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Isolation Forest multivariate analysis confirmed zero sensor drift or thermodynamic boundary violations.</span>
                </div>
              )}

              {/* XAI Justification */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  Explainable AI (XAI) Model Justification
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans mt-1">
                  "{riskAssessment?.explanation_reason || 'Cross-source evidence corroborated within acceptable thresholds.'}"
                </p>
              </div>
            </div>

            {/* Mint Result or Policy-Gated Action */}
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
            ) : isAutoMint ? (
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
            ) : (
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
                  <AlertOctagon className="w-6 h-6 flex-shrink-0 text-rose-400" />
                  <span>
                    <strong>Policy Gate Enforcement (Patent Module 110):</strong> AI confidence score ({score}%) is below the 85% automated issuance threshold. Direct credit minting is locked. This bundle has been automatically queued for staked manual verification.
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setCurrentStep(2)}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    ← Back to Adjust Telemetry
                  </button>

                  <button 
                    onClick={() => onNavigateTab ? onNavigateTab('verifier') : alert('Please switch to the Verifier Portal tab to inspect this escalated bundle.')}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                  >
                    <span>View in Verifier Staking Portal</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export default IssuerStudio;
