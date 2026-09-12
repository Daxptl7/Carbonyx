import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Flame, 
  Lock, 
  ExternalLink, 
  Download, 
  CheckCircle2, 
  Layers, 
  Leaf, 
  ShieldCheck, 
  Sparkles,
  QrCode,
  Calendar,
  Building2
} from 'lucide-react';

interface BuyerPortfolioProps {
  walletAddress: string | null;
  backendUrl?: string;
}

export const BuyerPortfolio: React.FC<BuyerPortfolioProps> = ({
  walletAddress,
  backendUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000'
}) => {
  const [activeTab, setActiveTab] = useState<'holdings' | 'escrows' | 'certificates'>('holdings');
  const [retiringId, setRetiringId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Demo buyer assets
  const [holdings, setHoldings] = useState<any[]>([
    {
      tokenId: 101,
      projectId: 'PROJ-AMAZON-004',
      projectName: 'Amazon Rainforest Sector 4 Preservation',
      tonnage: 1200,
      vintage: 2026,
      status: 'ISSUED',
      merkleRoot: '0x9a8f3b204918ef08d981d9f823a4b9104f89d31b67e8c2018a7df42a4918e90a',
      acquiredAt: '2026-09-12'
    },
    {
      tokenId: 102,
      projectId: 'PROJ-BORNEO-002',
      projectName: 'Borneo Peatland Carbon Restoration',
      tonnage: 850,
      vintage: 2026,
      status: 'ISSUED',
      merkleRoot: '0x4f89d31b67e8c2018a7df42a4918e90a98bce1b49089ef08b981d9f823a4b910',
      acquiredAt: '2026-09-11'
    }
  ]);

  const [certificates, setCertificates] = useState<any[]>([
    {
      certificateId: '0xcert_acme_q3_98124',
      tokenId: 88,
      projectId: 'PROJ-KENYA-MANGROVE-001',
      projectName: 'Kenya Coastal Blue Carbon Restoration',
      tonnage: 500,
      beneficiary: 'Acme CleanTech ESG Holdings',
      vintage: 2026,
      retiredAt: '2026-09-10T14:32:00Z',
      burnTx: '0x8f9a2b104918e90a98bce1b49089ef08b981d9f823a4b9104f89d31b67e8c201',
      merkleRoot: '0x1b49089ef08b981d9f823a4b9104f89d31b67e8c2018a7df42a4918e90a98bce'
    }
  ]);

  const handleRetireCredit = (tokenId: number) => {
    setRetiringId(tokenId);
    setTimeout(() => {
      const item = holdings.find(h => h.tokenId === tokenId);
      if (item) {
        setHoldings(prev => prev.filter(h => h.tokenId !== tokenId));
        const newCert = {
          certificateId: `0xcert_${walletAddress ? walletAddress.slice(2, 8) : 'acme'}_${Date.now()}`,
          tokenId: item.tokenId,
          projectId: item.projectId,
          projectName: item.projectName,
          tonnage: item.tonnage,
          beneficiary: 'Acme CleanTech ESG Corp',
          vintage: item.vintage,
          retiredAt: new Date().toISOString(),
          burnTx: `0xburn_${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`,
          merkleRoot: item.merkleRoot
        };
        setCertificates(prev => [newCert, ...prev]);
        setNotice(`Successfully burned and permanently retired Offset #${tokenId} (${item.tonnage} tCO2e)! Certificate generated.`);
        setActiveTab('certificates');
      }
      setRetiringId(null);
    }, 1200);
  };

  const totalActiveTons = holdings.reduce((sum, h) => sum + h.tonnage, 0);
  const totalRetiredTons = certificates.reduce((sum, c) => sum + c.tonnage, 0);

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-sky-500/30 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-mono font-semibold border border-sky-500/30">
              <Building2 className="w-3.5 h-3.5" />
              Corporate ESG & Institutional Portfolio
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Carbon Offset Asset Portfolio & Certificates
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Manage your company's verified carbon credits, inspect active custodial escrows, and download immutable cryptographic retirement certificates.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex flex-col text-right">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Beneficiary Wallet</span>
              <span className="text-xs font-mono text-sky-400 font-bold">
                {walletAddress ? `${walletAddress.slice(0, 10)}...` : '0x3C44...Acme'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div className="bg-emerald-950/70 border-2 border-emerald-500/50 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-300 text-sm shadow-xl shadow-emerald-950/50">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <span className="font-semibold">{notice}</span>
          </div>
          <button 
            onClick={() => setNotice(null)}
            className="text-xs text-emerald-400 hover:text-white px-2 py-1 rounded bg-emerald-900/50"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-xs font-mono text-slate-400 uppercase">Active Holdings</span>
          <div className="text-2xl font-black text-white flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-400" />
            {totalActiveTons.toLocaleString()} <span className="text-xs font-normal text-slate-400">tCO2e</span>
          </div>
          <p className="text-[10px] text-slate-500">{holdings.length} Active ERC-721 NFT Assets</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-xs font-mono text-slate-400 uppercase">Permanently Retired</span>
          <div className="text-2xl font-black text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-400" />
            {totalRetiredTons.toLocaleString()} <span className="text-xs font-normal text-slate-400">tCO2e</span>
          </div>
          <p className="text-[10px] text-slate-500">Burned On-Chain with Certificates</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-xs font-mono text-slate-400 uppercase">Escrow In Transit</span>
          <div className="text-2xl font-black text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-400" />
            0.00 <span className="text-xs font-normal text-slate-400">ETH</span>
          </div>
          <p className="text-[10px] text-slate-500">0 Active Settlement Locks</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-xs font-mono text-slate-400 uppercase">Audit Rating</span>
          <div className="text-2xl font-black text-emerald-400 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            AAA Pristine
          </div>
          <p className="text-[10px] text-slate-500">100% Cryptographically Audited</p>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('holdings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'holdings'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          🌱 Active Carbon Holdings ({holdings.length})
        </button>
        <button
          onClick={() => setActiveTab('certificates')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'certificates'
              ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          🏆 Retirement Certificates ({certificates.length})
        </button>
      </div>

      {/* Tab: Holdings */}
      {activeTab === 'holdings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {holdings.map((offset) => (
            <div 
              key={offset.tokenId}
              className="bg-slate-900/50 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-6 space-y-5 transition-all shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    #{offset.tokenId}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{offset.projectName}</h3>
                    <span className="text-[10px] font-mono text-emerald-400">{offset.projectId}</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {offset.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] block">Volume</span>
                  <span className="text-white font-bold">{offset.tonnage.toLocaleString()} tCO2e</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Vintage</span>
                  <span className="text-white font-bold">{offset.vintage}</span>
                </div>
              </div>

              <div className="text-[11px] font-mono text-slate-400 bg-slate-950/50 p-3 rounded-xl border border-slate-850 break-all">
                <span className="text-slate-500">Merkle Root: </span>{offset.merkleRoot}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleRetireCredit(offset.tokenId)}
                  disabled={retiringId === offset.tokenId}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-xs hover:brightness-110 flex items-center gap-2 shadow-lg shadow-rose-500/20 transition-all disabled:opacity-50"
                >
                  <Flame className="w-3.5 h-3.5" />
                  {retiringId === offset.tokenId ? 'Retiring & Burning...' : 'Burn & Permanently Retire Offset'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Certificates */}
      {activeTab === 'certificates' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <div 
              key={cert.certificateId}
              className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-2 border-sky-500/40 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-sky-500/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold text-sky-400 tracking-wider">
                      Immutable Carbon Offset Certificate
                    </span>
                    <h3 className="text-base font-extrabold text-white">{cert.certificateId}</h3>
                  </div>
                </div>

                <QrCode className="w-8 h-8 text-sky-400/80" />
              </div>

              <div className="space-y-2">
                <div className="text-2xl font-black text-white flex items-baseline gap-2">
                  {cert.tonnage.toLocaleString()} <span className="text-sm font-semibold text-sky-300">tCO2e Retired</span>
                </div>
                <p className="text-xs text-slate-300">
                  Beneficiary: <span className="font-bold text-white">{cert.beneficiary}</span>
                </p>
                <p className="text-xs text-slate-400">
                  Project: <span className="text-emerald-400 font-semibold">{cert.projectName}</span> ({cert.projectId})
                </p>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-[10px] font-mono space-y-1.5 text-slate-400">
                <div className="flex justify-between">
                  <span>Vintage Year:</span>
                  <span className="text-white font-bold">{cert.vintage}</span>
                </div>
                <div className="flex justify-between">
                  <span>Burn Timestamp:</span>
                  <span className="text-slate-300">{new Date(cert.retiredAt).toUTCString()}</span>
                </div>
                <div className="truncate">
                  <span>On-Chain Burn Tx: </span>
                  <span className="text-sky-300 font-semibold">{cert.burnTx}</span>
                </div>
                <div className="truncate">
                  <span>Merkle Provenance: </span>
                  <span className="text-indigo-300">{cert.merkleRoot}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Permanently Retired (Supply Burned)
                </span>
                <button 
                  onClick={() => alert(`Certificate ${cert.certificateId} JSON exported to clipboard!`)}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Proof
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BuyerPortfolio;
