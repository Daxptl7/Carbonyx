import React from 'react';
import { 
  ShieldCheck, 
  Printer, 
  X, 
  ExternalLink, 
  QrCode, 
  FileCheck2, 
  Lock, 
  CheckCircle2, 
  Building2, 
  Scale, 
  Award,
  Globe2
} from 'lucide-react';
import { LegalComplianceCertificate } from '../lib/projectFlowStore';

interface LegalComplianceCertificateModalProps {
  certificate: LegalComplianceCertificate;
  onClose: () => void;
}

export const LegalComplianceCertificateModal: React.FC<LegalComplianceCertificateModalProps> = ({
  certificate,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-2 sm:p-4 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static print:z-auto">
      {/* Container */}
      <div className="relative w-full max-w-4xl rounded-3xl border border-emerald-500/30 bg-[#070B13] p-6 sm:p-10 text-slate-200 shadow-2xl space-y-8 my-auto print:border-none print:shadow-none print:bg-white print:text-black print:p-8 print:max-w-none print:rounded-none">
        
        {/* Action Header - Hidden during print */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 print:hidden">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            OFFICIAL REGULATORY COMPLIANCE DOSSIER
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all"
            >
              <Printer className="h-4 w-4" /> Print / Save as Official PDF
            </button>
            <button
              onClick={onClose}
              className="rounded-full border border-white/10 p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-all"
              aria-label="Close Certificate"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Certificate Paper Document Body */}
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-b from-slate-900/90 via-[#070E1A] to-slate-950 p-6 sm:p-8 space-y-6 relative overflow-hidden print:border-2 print:border-slate-800 print:bg-white print:text-slate-900">
          
          {/* Subtle Background Watermark Stamp */}
          <div className="absolute right-[-40px] bottom-[-40px] opacity-[0.03] print:opacity-[0.06] pointer-events-none select-none">
            <ShieldCheck className="w-96 h-96 text-emerald-400 print:text-slate-900" />
          </div>

          {/* Document Top Authority Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-5 print:border-slate-300">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 print:border-slate-400 print:text-slate-900">
                <ShieldCheck className="h-7 w-7 stroke-[2]" />
              </div>
              <div>
                <div className="text-[11px] font-mono font-black tracking-widest text-emerald-400 uppercase print:text-emerald-800">
                  Carbonyx Global Registry & MRV Protocol
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase print:text-slate-950 font-serif">
                  Certificate of Carbon Offset Retirement
                </h1>
                <div className="text-[10px] text-slate-400 print:text-slate-600">
                  Statutory Greenhouse Gas Mitigation Assertion & Permanent On-Chain Retirement
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right font-mono space-y-0.5">
              <div className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600">Certificate UUID</div>
              <div className="text-xs font-black text-emerald-300 print:text-slate-900">{certificate.certificateId}</div>
              <div className="text-[10px] text-slate-500 print:text-slate-600">Serial: {certificate.serialNumber}</div>
            </div>
          </div>

          {/* Primary Offset Callout Banner */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left print:bg-emerald-50 print:border-emerald-300">
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 print:text-emerald-900">
                Total Certified Sequestration Permanently Burned
              </div>
              <div className="mt-1 text-3xl sm:text-4xl font-black text-white print:text-slate-950 flex items-baseline justify-center sm:justify-start gap-2">
                <span>{certificate.carbonAccounting.metricTonsCo2e.toFixed(2)}</span>
                <span className="text-lg font-bold text-emerald-400 print:text-emerald-800">Metric Tonnes CO₂e</span>
              </div>
              <div className="mt-1 text-xs text-slate-300 print:text-slate-700">
                Vintage Year: <strong className="text-white print:text-slate-900">{certificate.carbonAccounting.vintageYear}</strong> · Token #{certificate.carbonAccounting.serializedNftId}
              </div>
            </div>

            <div className="flex flex-col items-center sm:items-end font-mono text-[11px] text-slate-400 print:text-slate-600">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 print:bg-emerald-100 print:text-emerald-900 print:border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" /> Permanently Retired On-Chain
              </span>
              <span className="mt-1.5 text-[10px]">Retirement Date: {formatDate(certificate.issuanceDate)}</span>
            </div>
          </div>

          {/* Two Columns: Beneficiary & Project Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            {/* Beneficiary Entity */}
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-2.5 print:border-slate-300 print:bg-slate-50">
              <div className="flex items-center gap-2 font-bold text-slate-300 print:text-slate-900">
                <Building2 className="w-4 h-4 text-emerald-400 print:text-emerald-700" />
                <span>DESIGNATED BENEFICIARY ENTITY</span>
              </div>
              <div className="space-y-1 pl-6">
                <div>
                  <span className="text-slate-500 print:text-slate-600">Corporate Legal Name: </span>
                  <span className="font-bold text-white print:text-slate-950">{certificate.beneficiary.legalName}</span>
                </div>
                <div>
                  <span className="text-slate-500 print:text-slate-600">Legal Entity Identifier (LEI): </span>
                  <span className="font-mono text-slate-300 print:text-slate-800">{certificate.beneficiary.organizationId}</span>
                </div>
                <div>
                  <span className="text-slate-500 print:text-slate-600">Jurisdiction of Filing: </span>
                  <span className="text-slate-300 print:text-slate-800">{certificate.beneficiary.jurisdiction}</span>
                </div>
                <div className="truncate">
                  <span className="text-slate-500 print:text-slate-600">Settling Wallet: </span>
                  <span className="font-mono text-[10px] text-emerald-300 print:text-emerald-800">{certificate.beneficiary.walletAddress}</span>
                </div>
              </div>
            </div>

            {/* Project Origin */}
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-2.5 print:border-slate-300 print:bg-slate-50">
              <div className="flex items-center gap-2 font-bold text-slate-300 print:text-slate-900">
                <Globe2 className="w-4 h-4 text-sky-400 print:text-sky-700" />
                <span>CARBON REMOVAL PROJECT ORIGIN</span>
              </div>
              <div className="space-y-1 pl-6">
                <div>
                  <span className="text-slate-500 print:text-slate-600">Project Name: </span>
                  <span className="font-bold text-white print:text-slate-950">{certificate.projectDetails.projectName}</span>
                </div>
                <div>
                  <span className="text-slate-500 print:text-slate-600">Project Identifier: </span>
                  <span className="font-mono font-semibold text-sky-300 print:text-sky-900">{certificate.projectDetails.projectId}</span>
                </div>
                <div>
                  <span className="text-slate-500 print:text-slate-600">Methodology: </span>
                  <span className="text-slate-300 print:text-slate-800">{certificate.projectDetails.methodology}</span>
                </div>
                <div>
                  <span className="text-slate-500 print:text-slate-600">Location: </span>
                  <span className="text-slate-300 print:text-slate-800">{certificate.projectDetails.location}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Verifier Proof of Stake Attestation Box */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs space-y-2 print:border-amber-300 print:bg-amber-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-amber-300 print:text-amber-900">
                <Scale className="w-4 h-4 text-amber-400 print:text-amber-700" />
                <span>INDEPENDENT VERIFIER AUDIT & PROOF-OF-STAKE (PoS) ATTESTATION</span>
              </div>
              <span className="font-mono text-[10px] font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 print:bg-amber-100 print:text-amber-900">
                COLLATERAL BONDED: {certificate.verificationAttestation.posStakeEth} ETH
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 print:text-slate-800 pl-6">
              <div>
                <span className="text-slate-500 print:text-slate-600">Lead Auditor: </span>
                <strong className="text-white print:text-slate-950">{certificate.verificationAttestation.verifierName}</strong> ({certificate.verificationAttestation.verifierOrg})
              </div>
              <div className="truncate">
                <span className="text-slate-500 print:text-slate-600">Verifier DID: </span>
                <span className="font-mono text-[10px] text-amber-200 print:text-amber-900">{certificate.verificationAttestation.verifierDid}</span>
              </div>
              <div className="truncate">
                <span className="text-slate-500 print:text-slate-600">Audit Attestation Digest: </span>
                <span className="font-mono text-[10px] text-slate-300 print:text-slate-800">{certificate.verificationAttestation.auditReportDigest}</span>
              </div>
              <div className="truncate">
                <span className="text-slate-500 print:text-slate-600">Stake Escrow Tx: </span>
                <span className="font-mono text-[10px] text-slate-300 print:text-slate-800">{certificate.verificationAttestation.posStakeTxHash}</span>
              </div>
            </div>
          </div>

          {/* Cryptographic Ledger Commitments */}
          <div className="rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-[11px] space-y-1.5 print:border-slate-300 print:bg-slate-100 print:text-slate-900">
            <div className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 tracking-wider">
              Cryptographic Audit Trail & State Proofs
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 truncate">
              <span className="text-slate-500 print:text-slate-600">Merkle Root Commitment:</span>
              <span className="text-emerald-300 print:text-slate-900 truncate max-w-md">{certificate.carbonAccounting.merkleRootCommitment}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 truncate">
              <span className="text-slate-500 print:text-slate-600">Permanent Burn Transaction:</span>
              <span className="text-teal-300 print:text-slate-900 truncate max-w-md">{certificate.carbonAccounting.onChainBurnTx}</span>
            </div>
          </div>

          {/* Statutory Legal Declarations */}
          <div className="space-y-2 text-[10px] text-slate-400 print:text-slate-700 leading-relaxed border-t border-white/10 pt-4 print:border-slate-300">
            <p>
              <strong className="text-slate-200 print:text-slate-900">Non-Duplication & Permanent Retirement: </strong>
              {certificate.legalClauses.nonDuplicationClause}
            </p>
            <p>
              <strong className="text-slate-200 print:text-slate-900">Direct Settlement (0% Commission): </strong>
              {certificate.legalClauses.directSettlementDeclaration}
            </p>
            <p>
              <strong className="text-slate-200 print:text-slate-900">Regulatory Admissibility: </strong>
              {certificate.legalClauses.statutoryComplianceNotice}
            </p>
          </div>

          {/* Regulatory Compliance Frameworks Badges */}
          <div className="border-t border-white/10 pt-3 flex flex-wrap items-center gap-1.5 print:border-slate-300">
            <span className="text-[9px] font-bold uppercase text-slate-500 mr-2 print:text-slate-700">Standards Verified:</span>
            {certificate.complianceStandards.map((std, idx) => (
              <span
                key={idx}
                className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 print:bg-slate-200 print:text-slate-800 print:border-slate-300"
              >
                {std}
              </span>
            ))}
          </div>

          {/* Footer Official Seal & Signature */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t-2 border-emerald-500/20 pt-4 print:border-slate-400">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white text-slate-950 border border-slate-300">
                <QrCode className="w-10 h-10" />
              </div>
              <div className="text-[10px] text-slate-400 print:text-slate-600 leading-tight">
                <div>Scan QR to independently verify cryptographic</div>
                <div>validity on Sepolia Ethereum blockchain.</div>
                <div className="font-mono text-[9px] text-emerald-400 print:text-emerald-800 mt-0.5">https://carbonyx.org/verify/{certificate.certificateId}</div>
              </div>
            </div>

            <div className="text-center sm:text-right space-y-1">
              <div className="font-serif italic text-sm text-emerald-300 print:text-slate-950 border-b border-emerald-500/30 pb-0.5 print:border-slate-400">
                Carbonyx Protocol Autonomous Governance & Registry Engine
              </div>
              <div className="text-[9px] uppercase tracking-widest text-slate-500 print:text-slate-600">
                Cryptographically Sealed on Smart Contract #0x9F42...88A1
              </div>
            </div>
          </div>
        </div>

        {/* Print Stylesheet Hook */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print\\:block, [class*="max-w-4xl"], [class*="max-w-4xl"] * {
              visibility: visible;
            }
            [class*="max-w-4xl"] {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 10px;
            }
          }
        `}</style>

      </div>
    </div>
  );
};
