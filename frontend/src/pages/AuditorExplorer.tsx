import React from 'react';
import { Database, Shield, Sparkles, CheckCircle2, Award, Cpu, ArrowRight, ExternalLink } from 'lucide-react';
import contractsConfig from '../lib/contracts.json';

export default function AuditorExplorer() {
  const contractList = [
    {
      name: 'CarbonRegistry',
      address: contractsConfig.contracts.CarbonRegistry.address,
      purpose: 'Central protocol orchestrator & policy gate'
    },
    {
      name: 'CarbonCreditNFT',
      address: contractsConfig.contracts.CarbonCreditNFT.address,
      purpose: 'ERC-721 Dynamic Carbon Credit tokens'
    },
    {
      name: 'VerifierStakingLedger',
      address: contractsConfig.contracts.VerifierStakingLedger.address,
      purpose: 'Auditor staking, reputation & 50% slashing'
    },
    {
      name: 'EscrowSettlement',
      address: contractsConfig.contracts.EscrowSettlement.address,
      purpose: 'Safe buyer escrow & dispute settlements'
    }
  ];

  return (
    <div className="space-y-8 text-left w-full max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-glass">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Database className="w-5 h-5 text-[#06B6D4]" />
          End-to-End Cryptographic Provenance Explorer
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Inspect the immutable tamper-proof pipeline from physical IoT sensor readings to on-chain ERC-721 issuance.
        </p>
      </div>

      {/* 5-Step Provenance Stepper */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-glass space-y-6">
        <h3 className="font-bold text-base text-white">Cryptographic Verification Lifecycle</h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#10B981]/20 text-[#10B981] flex items-center justify-center font-mono font-bold text-xs">
              01
            </div>
            <div className="font-bold text-sm text-white">Project DID</div>
            <p className="text-[11px] text-slate-400">
              W3C-compliant identifier anchored in CarbonRegistry on-chain.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/20 text-[#06B6D4] flex items-center justify-center font-mono font-bold text-xs">
              02
            </div>
            <div className="font-bold text-sm text-white">Merkle Tree</div>
            <p className="text-[11px] text-slate-400">
              SHA-256 tree over IoT, satellite NDVI, and operational telemetry.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center font-mono font-bold text-xs">
              03
            </div>
            <div className="font-bold text-sm text-white">AI / ML Engine</div>
            <p className="text-[11px] text-slate-400">
              Isolation Forest & Cross-source correlation check (≤15% delta).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center font-mono font-bold text-xs">
              04
            </div>
            <div className="font-bold text-sm text-white">Policy Gates</div>
            <p className="text-[11px] text-slate-400">
              Confidence ≥ 85% auto-mints; &lt; 85% requires staked verifier audit.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#EC4899]/20 text-[#EC4899] flex items-center justify-center font-mono font-bold text-xs">
              05
            </div>
            <div className="font-bold text-sm text-white">Dynamic NFT</div>
            <p className="text-[11px] text-slate-400">
              ERC-721 token issued with immutable Merkle root provenance.
            </p>
          </div>
        </div>
      </div>

      {/* Deployed Smart Contract Suite */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-glass space-y-4">
        <h3 className="font-bold text-base text-white">Deployed Smart Contracts (Anvil Chain 31337)</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contractList.map((contract) => (
            <div key={contract.name} className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">{contract.name}</span>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] text-slate-300 font-mono">
                  Verified
                </span>
              </div>
              <div className="text-xs font-mono text-[#06B6D4] truncate">
                {contract.address}
              </div>
              <p className="text-[11px] text-slate-400">
                {contract.purpose}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
