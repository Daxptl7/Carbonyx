import React, { useEffect, useId } from 'react';
import {
  ShieldCheck,
  Printer,
  X,
  QrCode,
  CheckCircle2,
  Building2,
  Scale,
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
  const titleId = useId();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handlePrint = () => {
    const previousTitle = document.title;
    document.title = `${certificate.certificateId} - Carbonyx retirement certificate`;
    window.print();
    window.setTimeout(() => {
      document.title = previousTitle;
    }, 250);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (Number.isNaN(date.getTime())) return isoString;
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
    <div
      className="compliance-modal fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-2 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {/* Container */}
      <div
        className="compliance-shell relative my-auto w-full max-w-4xl space-y-5 rounded-3xl border border-slate-200 bg-white p-4 text-slate-800 shadow-2xl sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        
        {/* Action Header - Hidden during print */}
        <div className="compliance-actions flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-wider text-emerald-700 sm:text-xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            OFFICIAL REGULATORY COMPLIANCE DOSSIER
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#15ed48] px-4 py-2 text-xs font-extrabold text-slate-950 shadow-sm transition hover:bg-[#12d23f] sm:flex-none"
            >
              <Printer className="h-4 w-4" /> Print / Save as Official PDF
            </button>
            <button
              onClick={onClose}
              className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
              aria-label="Close Certificate"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Certificate Paper Document Body */}
        <div className="compliance-document relative space-y-5 overflow-hidden rounded-2xl border-2 border-slate-900 bg-white p-4 text-slate-900 sm:p-8">
          
          {/* Subtle Background Watermark Stamp */}
          <div className="pointer-events-none absolute bottom-[-40px] right-[-40px] select-none opacity-[0.035]">
            <ShieldCheck className="h-72 w-72 text-emerald-900 sm:h-96 sm:w-96" />
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
                <h1 id={titleId} className="font-serif text-xl font-black uppercase tracking-tight text-slate-950 sm:text-2xl">
                  Certificate of Carbon Offset Retirement
                </h1>
                <div className="text-[10px] text-slate-400 print:text-slate-600">
                  Statutory Greenhouse Gas Mitigation Assertion & Permanent On-Chain Retirement
                </div>
              </div>
            </div>

            <div className="shrink-0 space-y-0.5 text-left font-mono sm:w-44 sm:text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600">Certificate UUID</div>
              <div className="break-words text-xs font-black text-emerald-800">{certificate.certificateId}</div>
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
                Vintage Year: <strong className="text-white print:text-slate-900">{certificate.carbonAccounting.vintageYear}</strong> · Token {certificate.carbonAccounting.serializedNftId}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Retirement purpose: <strong className="text-slate-800">{certificate.carbonAccounting.retirementPurpose}</strong>
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
                  <span className="text-slate-500 print:text-slate-600">Registry Entity ID: </span>
                  <span className="font-mono text-slate-300 print:text-slate-800">{certificate.beneficiary.organizationId}</span>
                </div>
                <div>
                  <span className="text-slate-500 print:text-slate-600">Jurisdiction of Filing: </span>
                  <span className="text-slate-300 print:text-slate-800">{certificate.beneficiary.jurisdiction}</span>
                </div>
                <div className="min-w-0">
                  <span className="text-slate-500 print:text-slate-600">Settling Wallet: </span>
                  <span className="mt-0.5 block break-all font-mono text-[10px] text-emerald-800">{certificate.beneficiary.walletAddress}</span>
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
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
              <div className="min-w-0">
                <span className="text-slate-500 print:text-slate-600">Verifier DID: </span>
                <span className="break-all font-mono text-[10px] text-amber-900">{certificate.verificationAttestation.verifierDid}</span>
              </div>
              <div className="min-w-0">
                <span className="text-slate-500 print:text-slate-600">Audit Attestation Digest: </span>
                <span className="break-all font-mono text-[10px] text-slate-800">{certificate.verificationAttestation.auditReportDigest}</span>
              </div>
              <div className="min-w-0">
                <span className="text-slate-500 print:text-slate-600">Stake Escrow Tx: </span>
                <span className="break-all font-mono text-[10px] text-slate-800">{certificate.verificationAttestation.posStakeTxHash}</span>
              </div>
            </div>
          </div>

          {/* Cryptographic Ledger Commitments */}
          <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 font-mono text-[11px] space-y-2 text-slate-900">
            <div className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 tracking-wider">
              Cryptographic Audit Trail & State Proofs
            </div>
            <div className="grid min-w-0 gap-1 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-4">
              <span className="text-slate-500 print:text-slate-600">Merkle Root Commitment:</span>
              <span className="break-all text-left text-emerald-800 sm:text-right">{certificate.carbonAccounting.merkleRootCommitment}</span>
            </div>
            <div className="grid min-w-0 gap-1 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-4">
              <span className="text-slate-500 print:text-slate-600">Permanent Burn Transaction:</span>
              <span className="break-all text-left text-teal-800 sm:text-right">{certificate.carbonAccounting.onChainBurnTx}</span>
            </div>
          </div>

          {/* Statutory Legal Declarations */}
          <div className="compliance-continuation">
            <span>{certificate.certificateId} - Compliance and statutory declarations - Page 2 of 2</span>
          </div>
          <div className="space-y-2 text-[10px] text-slate-400 print:text-slate-700 leading-relaxed border-t border-white/10 pt-4 print:border-slate-300">
            <p>
              <strong className="text-slate-200 print:text-slate-900">Non-Duplication & Permanent Retirement: </strong>
              {certificate.legalClauses.nonDuplicationClause}
            </p>
            <p>
              <strong className="text-slate-200 print:text-slate-900">Additionality & Evidence Basis: </strong>
              {certificate.legalClauses.additionalityClause}
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
                <div>Use this reference to independently verify cryptographic</div>
                <div>validity on the Sepolia Ethereum blockchain.</div>
                <div className="mt-0.5 break-all font-mono text-[9px] text-emerald-800">https://carbonyx.org/verify/{certificate.certificateId}</div>
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

      </div>
    </div>
  );
};
