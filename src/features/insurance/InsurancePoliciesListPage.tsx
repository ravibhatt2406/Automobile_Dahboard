import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { ShieldCheck, FileCheck, AlertTriangle, Calendar, ExternalLink, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthContext';

export interface PucRecord {
  id: string;
  certificateNumber: string;
  vehicleVin: string;
  vehicleModel: string;
  registrationNumber: string;
  issueDate: string;
  expiryDate: string;
  status: 'valid' | 'expiring_soon' | 'expired' | 'not_available';
  issuingAuthority: string;
  testCenterId: string;
}

export const InsurancePoliciesListPage: React.FC = () => {
  const { activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'insurance' | 'puc'>('insurance');
  const [selectedDocumentModal, setSelectedDocumentModal] = useState<{ title: string; ref: string } | null>(null);

  // Commercial Vehicle Insurance Data
  const insurancePolicies = [
    {
      id: 'pol-al-9842',
      policyNumber: 'POL-AL-9842-2026',
      provider: 'ICICI Lombard General Insurance',
      type: 'commercial_carrier',
      typeName: 'Commercial Heavy Carrier Liability',
      vehicleVin: 'MAT482500K982401',
      vehicleModel: 'Ashok Leyland 4825 10x4 Tipper',
      registrationNumber: 'RJ-14-EA-4825',
      premiumAmount: 145000,
      startDate: '2025-10-15',
      expiryDate: '2026-10-16', // Expiring soon in 12 days
      status: 'expiring_soon',
      documentUrl: '#',
    },
    {
      id: 'pol-tm-7710',
      policyNumber: 'POL-TM-7710-2026',
      provider: 'HDFC ERGO Commercial Insurance',
      type: 'comprehensive',
      typeName: 'Comprehensive Commercial Fleet Insurance',
      vehicleVin: 'MAT553000K110482',
      vehicleModel: 'Tata Prima 5530.S Trailer',
      registrationNumber: 'RJ-14-GA-5530',
      premiumAmount: 180000,
      startDate: '2026-03-01',
      expiryDate: '2027-03-01',
      status: 'active',
      documentUrl: '#',
    },
  ];

  // Commercial Vehicle PUC Certificate Data
  const pucRecords: PucRecord[] = [
    {
      id: 'puc-01',
      certificateNumber: 'PUC-RJ14-2026-8819',
      vehicleVin: 'MAT482500K982401',
      vehicleModel: 'Ashok Leyland 4825 10x4 Tipper',
      registrationNumber: 'RJ-14-EA-4825',
      issueDate: '2026-04-16',
      expiryDate: '2026-10-16',
      status: 'expiring_soon',
      issuingAuthority: 'Transport Department Govt of Rajasthan',
      testCenterId: 'TC-JPR-104',
    },
    {
      id: 'puc-02',
      certificateNumber: 'PUC-RJ14-2026-9931',
      vehicleVin: 'MAT553000K110482',
      vehicleModel: 'Tata Prima 5530.S Trailer',
      registrationNumber: 'RJ-14-GA-5530',
      issueDate: '2026-05-10',
      expiryDate: '2026-11-10',
      status: 'valid',
      issuingAuthority: 'Transport Department Govt of Rajasthan',
      testCenterId: 'TC-JPR-108',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insurance & PUC Compliance"
        subtitle="Commercial fleet insurance policies, coverage status, and Pollution Under Control (PUC) certificates"
        breadcrumbItems={[{ label: 'Compliance & Insurance' }]}
      />

      {/* Tabs Bar */}
      <div className="flex border-b border-[#E5E5E5] gap-4 font-mono text-xs">
        <button
          onClick={() => setActiveTab('insurance')}
          className={`pb-3 px-1 font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'insurance'
              ? 'border-[#F5A800] text-[#111111]'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-[#F5A800]" /> Commercial Insurance Policies ({insurancePolicies.length})
        </button>

        <button
          onClick={() => setActiveTab('puc')}
          className={`pb-3 px-1 font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'puc'
              ? 'border-[#F5A800] text-[#111111]'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <FileCheck className="w-4 h-4 text-emerald-600" /> PUC Certificates ({pucRecords.length})
        </button>
      </div>

      {/* TAB 1: Insurance Policies */}
      {activeTab === 'insurance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insurancePolicies.map((pol) => (
              <div
                key={pol.id}
                className="cockpit-card p-5 rounded-xl border border-[#E5E5E5] bg-white space-y-4 shadow-xs"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#F5A800] uppercase tracking-wider">
                      {pol.provider}
                    </span>
                    <h3 className="text-base font-bold text-[#111111] mt-0.5">{pol.policyNumber}</h3>
                    <p className="text-xs text-zinc-500">{pol.typeName}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase ${
                      pol.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : pol.status === 'expiring_soon'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {pol.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-xs font-mono">
                  <div>
                    <span className="text-[10px] uppercase text-zinc-400 block font-sans">Vehicle</span>
                    <span className="font-semibold text-zinc-900 truncate block">{pol.vehicleModel}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-zinc-400 block font-sans">Registration</span>
                    <span className="font-semibold text-zinc-900 block">{pol.registrationNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-zinc-400 block font-sans">Start Date</span>
                    <span className="font-semibold text-zinc-800 block">{pol.startDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-zinc-400 block font-sans">Expiry Date</span>
                    <span
                      className={`font-semibold block ${
                        pol.status === 'expiring_soon' ? 'text-amber-700 font-bold' : 'text-zinc-800'
                      }`}
                    >
                      {pol.expiryDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
                  <div>
                    <span className="text-[10px] uppercase text-zinc-400 block font-mono">Annual Premium</span>
                    <span className="text-sm font-bold text-zinc-900">
                      ₹{pol.premiumAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      setSelectedDocumentModal({
                        title: `Insurance Policy Certificate — ${pol.policyNumber}`,
                        ref: pol.policyNumber,
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View Policy Document
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PUC Certificates */}
      {activeTab === 'puc' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pucRecords.map((puc) => (
              <div
                key={puc.id}
                className="cockpit-card p-5 rounded-xl border border-[#E5E5E5] bg-white space-y-4 shadow-xs"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-wider">
                      {puc.issuingAuthority}
                    </span>
                    <h3 className="text-base font-bold text-[#111111] mt-0.5">{puc.certificateNumber}</h3>
                    <p className="text-xs text-zinc-500">Test Center: {puc.testCenterId}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase ${
                      puc.status === 'valid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : puc.status === 'expiring_soon'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {puc.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-xs font-mono">
                  <div>
                    <span className="text-[10px] uppercase text-zinc-400 block font-sans">Vehicle</span>
                    <span className="font-semibold text-zinc-900 truncate block">{puc.vehicleModel}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-zinc-400 block font-sans">Registration</span>
                    <span className="font-semibold text-zinc-900 block">{puc.registrationNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-zinc-400 block font-sans">Issue Date</span>
                    <span className="font-semibold text-zinc-800 block">{puc.issueDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-zinc-400 block font-sans">Expiry Date</span>
                    <span
                      className={`font-semibold block ${
                        puc.status === 'expiring_soon' ? 'text-amber-700 font-bold' : 'text-zinc-800'
                      }`}
                    >
                      {puc.expiryDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
                  <span className="text-xs text-zinc-500 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Emission Limits Compliant
                  </span>

                  <button
                    onClick={() =>
                      setSelectedDocumentModal({
                        title: `PUC Pollution Certificate — ${puc.certificateNumber}`,
                        ref: puc.certificateNumber,
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View Certificate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document View Modal */}
      {selectedDocumentModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-zinc-200 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-zinc-900 text-sm">{selectedDocumentModal.title}</h3>
              <button
                onClick={() => setSelectedDocumentModal(null)}
                className="text-zinc-400 hover:text-zinc-600 text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>
            <div className="p-6 bg-zinc-900 rounded-xl text-center text-white space-y-3 font-mono">
              <ShieldCheck className="w-12 h-12 text-[#F5A800] mx-auto" />
              <p className="text-xs font-semibold text-zinc-300">
                Official Digitally Signed Document Ref: {selectedDocumentModal.ref}
              </p>
              <p className="text-[11px] text-zinc-400">
                This document is verified and stored securely in Titan Auto Customer Document Registry.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedDocumentModal(null)}
                className="px-4 py-2 bg-[#111111] text-[#F5A800] text-xs font-semibold rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
