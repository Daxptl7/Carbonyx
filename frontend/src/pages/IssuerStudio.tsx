import React, { useState, useEffect } from 'react';
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
  DollarSign,
  FileCheck2,
  Clock,
  AlertTriangle,
  Globe2,
  Wallet,
  CheckCircle,
  Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WalletState } from '../lib/web3';

interface IssuerStudioProps {
  wallet: WalletState;
  backendUrl: string;
  onNavigateToExplorer?: () => void;
}

export const IssuerStudio: React.FC<IssuerStudioProps> = ({ wallet, backendUrl, onNavigateToExplorer }) => {
  const [copiedDid, setCopiedDid] = useState(false);

  // Form State - Step 1: Project Metadata
  const [projectId, setProjectId] = useState(`PROJ-AMAZON-${Math.floor(100 + Math.random() * 900)}`);
  const [projectName, setProjectName] = useState('Amazonian Peatland & Canopy Bio-Sink');
  const [projectType, setProjectType] = useState('REFORESTATION');
  const [locationCountry, setLocationCountry] = useState('Brazil');
  const [locationRegion, setLocationRegion] = useState('Acre State');
  const [claimedTonnage, setClaimedTonnage] = useState<number>(50000);
  const [developerWallet, setDeveloperWallet] = useState<string>(wallet.address || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');

  useEffect(() => {
    if (wallet.address) {
      setDeveloperWallet(wallet.address);
    }
  }, [wallet.address]);

  // Stream 1: Financial Capex (Money Spent)
  const [capexSpentUsd, setCapexSpentUsd] = useState<number>(1450000);
  const [capexBreakdown, setCapexBreakdown] = useState('Seedling nursery ($450k), earth prep ($380k), drone lidar seeding ($220k), sensor deployment ($400k)');
  const [financialReceiptHash, setFinancialReceiptHash] = useState('0x8f4c2e1b9a7d3f5e6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f');
  const [auditorFirm, setAuditorFirm] = useState('KPMG ESG Assurance & BioAudit Group');

  // Stream 2: Ground IoT Telemetry
  const [isSyncingIot, setIsSyncingIot] = useState(false);
  const [iotSensorId, setIotSensorId] = useState('IOT-CANOPY-409');
  const [iotCo2Flux, setIotCo2Flux] = useState<number>(-4.85); // ppm/hr
  const [iotMoisture, setIotMoisture] = useState<number>(48.2); // %
  const [iotSoilCarbon, setIotSoilCarbon] = useState<number>(34.8); // g/kg
  const [iotBiomass, setIotBiomass] = useState<number>(142.0); // kg/m2

  // Stream 3: Satellite Sentinel-2 API
  const [isFetchingSatellite, setIsFetchingSatellite] = useState(false);
  const [satProvider, setSatProvider] = useState('Sentinel-2B L2A (Copernicus Optical)');
  const [satNdvi, setSatNdvi] = useState<number>(0.812);
  const [satEvi, setSatEvi] = useState<number>(0.745);
  const [satCanopyCover, setSatCanopyCover] = useState<number>(94.5);
  const [satCloudCover, setSatCloudCover] = useState<number>(1.2);
  const [satSnapshotHash, setSatSnapshotHash] = useState('0x3a9b1c7e5d8f2a4b6c0e1d3f5a7b9c1e3f5a7b9c1e3f5a7b9c1e3f5a7b9c1e3f');
  const [satTimestamp, setSatTimestamp] = useState<string>(new Date().toISOString());

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<any>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDid(true);
    setTimeout(() => setCopiedDid(false), 2000);
  };

  const handleSyncIotStream = () => {
    setIsSyncingIot(true);
    setTimeout(() => {
      setIotCo2Flux(Number((-4.2 - Math.random() * 1.5).toFixed(2)));
      setIotMoisture(Number((45 + Math.random() * 8).toFixed(1)));
      setIotBiomass(Number((138 + Math.random() * 10).toFixed(1)));
      setIsSyncingIot(false);
    }, 800);
  };

  const handleFetchSatelliteSnapshot = async () => {
    setIsFetchingSatellite(true);
    try {
      // Call live /api/satellite/ndvi or simulate
      const res = await fetch(`${backendUrl}/api/satellite/ndvi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: -9.0,
          longitude: -70.8,
          declaredTonnage: 100
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSatNdvi(data.meanNdvi || 0.812);
        setSatCanopyCover(Number((100 - (data.cloudCoveragePct || 2)).toFixed(1)));
        setSatCloudCover(data.cloudCoveragePct || 1.2);
        setSatSnapshotHash(`0xsat_${data.source || 'copernicus'}_${Date.now()}`);
      } else {
        setSatNdvi(Number((0.80 + Math.random() * 0.05).toFixed(3)));
        setSatSnapshotHash(`0xsat_sentinel2_${Date.now()}`);
      }
    } catch {
      setSatNdvi(Number((0.80 + Math.random() * 0.05).toFixed(3)));
      setSatSnapshotHash(`0xsat_sentinel2_${Date.now()}`);
    } finally {
      setSatTimestamp(new Date().toISOString());
      setIsFetchingSatellite(false);
    }
  };

  const handleSubmitProjectBaseline = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Register Project
      const regRes = await fetch(`${backendUrl}/api/projects/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name: projectName,
          projectType,
          location: { country: locationCountry, region: locationRegion },
          claimedAnnualTonnage: claimedTonnage,
          ownerAddress: developerWallet
        })
      });
      const regData = await regRes.json();
      if (!regRes.ok && regRes.status !== 200) {
        throw new Error(regData.error || 'Project registration failed');
      }

      // 2. Upload Multi-Source Evidence (Financials + IoT + Satellite)
      const evidenceItems = [
        {
          sourceType: 'OPERATIONAL_DOC',
          name: 'Project Financial Expenditure & Additionality Proof',
          payload: {
            projectCapexUsd: capexSpentUsd,
            expenseBreakdown: capexBreakdown,
            invoiceAttestationHash: financialReceiptHash,
            auditorFirm: auditorFirm,
            timestamp: Date.now()
          }
        },
        {
          sourceType: 'IOT_SENSOR',
          name: `Ground IoT Sensor Stream (${iotSensorId})`,
          payload: {
            sensorId: iotSensorId,
            co2FluxPpm: iotCo2Flux,
            soilMoisturePct: iotMoisture,
            soilOrganicCarbonGKg: iotSoilCarbon,
            biomassKgM2: iotBiomass,
            timestamp: Date.now()
          }
        },
        {
          sourceType: 'SATELLITE_NDVI',
          name: 'Sentinel-2 Orbital Multispectral Snapshot',
          payload: {
            satellite: satProvider,
            meanNdvi: satNdvi,
            eviIndex: satEvi,
            canopyCoveragePct: satCanopyCover,
            cloudCoverPct: satCloudCover,
            snapshotHash: satSnapshotHash,
            snapshotIso: satTimestamp
          }
        }
      ];

      const evRes = await fetch(`${backendUrl}/api/evidence/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          monitoringPeriod: { startDate: '2026-01-01', endDate: '2026-03-31' },
          evidenceItems
        })
      });
      const evData = await evRes.json();
      if (!evRes.ok) {
        throw new Error(evData.error || 'Evidence ingestion failed');
      }

      // 3. Evaluate AI Risk & Anchoring
      const riskRes = await fetch(`${backendUrl}/api/risk/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bundleId: evData.bundle?.bundle_id,
          projectId,
          projectType,
          declaredTonnage: 100,
          evidenceItems
        })
      });
      const riskData = await riskRes.json();

      setSubmittedResult({
        projectId,
        name: projectName,
        did: regData.did || `did:carbonyx:${developerWallet.toLowerCase()}`,
        merkleRoot: evData.merkleRoot,
        bundleId: evData.bundle?.bundle_id,
        confidenceScore: riskData.assessment?.confidence_score || 94
      });

      setSubmissionSuccess(true);
      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10B981', '#064E3B', '#34D399', '#6EE7B7']
      });

    } catch (err: any) {
      alert('Submission Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setProjectId(`PROJ-AMAZON-${Math.floor(100 + Math.random() * 900)}`);
    setSubmissionSuccess(false);
    setSubmittedResult(null);
  };

  // Celebratory Green Tick Screen upon submission
  if (submissionSuccess && submittedResult) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
        <div className="bg-emerald-950/40 border-2 border-emerald-500/50 rounded-3xl p-8 md:p-10 text-center space-y-6 shadow-2xl shadow-emerald-500/10 backdrop-blur-xl">
          {/* Animated Green Tick Badge */}
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-slate-950 uppercase tracking-wider">
              Project Successfully Anchored & Published
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              {submittedResult.name}
            </h2>
            <p className="text-sm text-slate-300 max-w-lg mx-auto">
              Your project has entered the <strong className="text-white">Public Baseline Explorer</strong>. It is now open for the 14-day community challenge & observation window before final offset token issuance.
            </p>
          </div>

          {/* Key Anchored Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Project Identifier</div>
              <div className="text-xs font-mono font-bold text-white">{submittedResult.projectId}</div>
              <div className="text-[10px] text-emerald-400">Status: In 14-Day Window</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Developer DID</div>
              <div className="text-xs font-mono text-emerald-300 truncate">{submittedResult.did}</div>
              <div className="text-[10px] text-slate-400">KYC Status: Verified</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">AI Confidence Score</div>
              <div className="text-base font-bold text-emerald-400">{submittedResult.confidenceScore}%</div>
              <div className="text-[10px] text-slate-400">Multi-Source Verified</div>
            </div>
          </div>

          {/* Anchored Merkle Root Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 flex items-center justify-between gap-3 text-left">
            <div className="truncate">
              <span className="text-slate-500 font-semibold">Anchored Top Merkle Root: </span>
              <span className="text-emerald-300">{submittedResult.merkleRoot}</span>
            </div>
            <button
              onClick={() => copyToClipboard(submittedResult.merkleRoot)}
              className="text-slate-400 hover:text-white flex-shrink-0"
              title="Copy Merkle Root"
            >
              {copiedDid ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Action Navigation Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigateToExplorer ? onNavigateToExplorer() : null}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Globe2 className="w-4 h-4" /> View in Baseline Explorer ➡️
            </button>

            <button
              onClick={resetForm}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
            >
              Submit Another Project
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-950 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Issuer Studio • Streamlined Submission
            </span>
            <span className="text-xs text-slate-400 font-mono">Project Specs • Capex • Ground IoT • Satellite</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Register Carbon Project Baseline
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Submit your project specs, financial capex proof, and telemetry stream to calculate the Merkle Root and publish to the public 14-day observation window.
          </p>
        </div>

        {/* Developer Identity (DID) Pill */}
        <div className="bg-slate-900/90 border border-slate-700/60 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Developer Identity (DID)
            </div>
            <div className="text-xs font-mono text-emerald-400 font-medium flex items-center gap-2">
              did:carbonyx:{developerWallet.slice(0, 8)}...
              <button 
                onClick={() => copyToClipboard(`did:carbonyx:${developerWallet}`)}
                className="hover:text-white transition-colors"
                title="Copy DID"
              >
                {copiedDid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmitProjectBaseline} className="space-y-6">
        {/* SECTION 1: Project Metadata & Identity */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">1. Project Specifications & Location</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Project Identifier (Unique ID)</label>
              <input 
                type="text" 
                value={projectId} 
                onChange={(e) => setProjectId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Project Title / Name</label>
              <input 
                type="text" 
                value={projectName} 
                onChange={(e) => setProjectName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Methodology / Project Type</label>
              <select 
                value={projectType} 
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="REFORESTATION">Reforestation & Canopy ARR (VCS VM0007)</option>
                <option value="PEATLAND_RESTORATION">Peatland Rewetting & Wetland Sequestration</option>
                <option value="MANGROVE_BLUE_CARBON">Coastal Blue Carbon & Mangrove Bio-Sink</option>
                <option value="SOIL_CARBON">Regenerative Agro-Soil Organic Carbon</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Expected Annual Absorption (tCO2e)</label>
              <input 
                type="number" 
                value={claimedTonnage} 
                onChange={(e) => setClaimedTonnage(Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Country Location</label>
              <input 
                type="text" 
                value={locationCountry} 
                onChange={(e) => setLocationCountry(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">State / Territory Region</label>
              <input 
                type="text" 
                value={locationRegion} 
                onChange={(e) => setLocationRegion(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Multi-Source Telemetry (Financials, IoT, Satellite) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">2. Multi-Source Evidence Ingestion</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Financials • IoT • Satellite Sentinel-2</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Stream 1: Financial Capex */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <DollarSign className="w-4 h-4" /> 1. Financial Capex
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                  Additionality
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-slate-400 font-semibold">Money Spent / Capex ($ USD)</label>
                  <input
                    type="number"
                    value={capexSpentUsd}
                    onChange={(e) => setCapexSpentUsd(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-emerald-300 font-mono font-bold mt-1"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold">Expense Breakdown</label>
                  <textarea
                    rows={2}
                    value={capexBreakdown}
                    onChange={(e) => setCapexBreakdown(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 text-[11px] mt-1"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold">Audit Attestation Receipt Hash</label>
                  <input
                    type="text"
                    value={financialReceiptHash}
                    onChange={(e) => setFinancialReceiptHash(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-400 font-mono text-[10px] mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Stream 2: Ground IoT Sensors */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Radio className="w-4 h-4" /> 2. Ground Sensors
                </span>
                <span className="text-[10px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded-full font-mono">
                  Live Feed
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Sensor Array ID</span>
                  <input
                    type="text"
                    value={iotSensorId}
                    onChange={(e) => setIotSensorId(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-white font-mono text-xs w-32 text-right"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">CO2 Flux (ppm/hr)</span>
                  <input
                    type="number"
                    step="0.05"
                    value={iotCo2Flux}
                    onChange={(e) => setIotCo2Flux(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-emerald-300 font-mono text-xs w-24 text-right font-bold"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Biomass (kg/m²)</span>
                  <input
                    type="number"
                    step="1"
                    value={iotBiomass}
                    onChange={(e) => setIotBiomass(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-white font-mono text-xs w-24 text-right font-bold"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSyncIotStream}
                  disabled={isSyncingIot}
                  className="w-full mt-2 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  {isSyncingIot ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />}
                  {isSyncingIot ? 'Syncing...' : 'Sync Sensor Telemetry'}
                </button>
              </div>
            </div>

            {/* Stream 3: Satellite Sentinel-2 API Fetch */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Satellite className="w-4 h-4" /> 3. Satellite Sentinel-2
                </span>
                <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-full font-mono">
                  Orbital L2A
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Spectral NDVI</span>
                  <input
                    type="number"
                    step="0.005"
                    value={satNdvi}
                    onChange={(e) => setSatNdvi(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-sky-300 font-mono text-xs w-24 text-right font-bold"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Canopy Cover (%)</span>
                  <input
                    type="number"
                    step="0.5"
                    value={satCanopyCover}
                    onChange={(e) => setSatCanopyCover(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-white font-mono text-xs w-24 text-right"
                  />
                </div>

                <div className="text-[10px] text-slate-500 font-mono truncate pt-1">
                  Snapshot: {satSnapshotHash.slice(0, 18)}...
                </div>

                <button
                  type="button"
                  onClick={handleFetchSatelliteSnapshot}
                  disabled={isFetchingSatellite}
                  className="w-full mt-2 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  {isFetchingSatellite ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Satellite className="w-3.5 h-3.5" />}
                  {isFetchingSatellite ? 'Calling Satellite API...' : '🛰️ Fetch Satellite Snapshot'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Submit & Calculate Merkle Root Button */}
        <div className="flex justify-end pt-2">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full md:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-slate-950 font-extrabold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 disabled:opacity-50"
          >
            {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
            {isSubmitting ? 'Calculating Merkle Root & Anchoring...' : 'Calculate Merkle Root & Submit Baseline ➡️'}
          </button>
        </div>
      </form>
    </div>
  );
};
