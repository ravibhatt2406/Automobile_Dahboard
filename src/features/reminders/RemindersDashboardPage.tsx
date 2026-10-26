import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Copy,
  Check,
  Calendar,
  AlertCircle,
  Clock,
  ShieldCheck,
  Wrench,
  CreditCard,
  FileCheck,
  Building,
  RefreshCw,
  ExternalLink,
  Loader2,
  CheckCircle2,
  PhoneCall,
  Info,
} from 'lucide-react';
import { PageHeader } from '@/components/data-display/PageHeader';
import {
  CustomerReminderRecord,
  EligibleReminderItem,
  reminderService,
} from '@/services/reminder.service';

export const RemindersDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'eligible' | 'history'>('eligible');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [eligibleItems, setEligibleItems] = useState<EligibleReminderItem[]>([]);
  const [historyItems, setHistoryItems] = useState<CustomerReminderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [initiatingId, setInitiatingId] = useState<string | null>(null);

  const fetchEligible = async () => {
    setLoading(true);
    try {
      const items = await reminderService.getEligibleReminders({
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
      });
      setEligibleItems(items);
    } catch {
      setEligibleItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await reminderService.getRemindersHistory({
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
      });
      setHistoryItems(res.items);
    } catch {
      setHistoryItems([]);
    }
  };

  useEffect(() => {
    if (activeTab === 'eligible') {
      fetchEligible();
    } else {
      fetchHistory();
    }
  }, [activeTab, selectedCategory]);

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendWhatsApp = async (item: EligibleReminderItem, index: number) => {
    const key = `${item.category}-${index}`;
    setInitiatingId(key);
    try {
      // 1. Save prepared reminder in database
      const reminder = await reminderService.createReminder({
        customerId: item.customerId,
        vehicleId: item.vehicleId,
        branchId: item.branchId,
        category: item.category,
        recipientName: item.recipientName,
        recipientPhone: item.recipientPhone,
        referenceType: item.referenceType,
        referenceId: item.referenceId,
        dueDate: item.dueDate,
        draftMessage: item.draftMessage,
      });

      // 2. Mark as user initiated
      await reminderService.markInitiated(reminder.id);

      // 3. Open WhatsApp link in new browser tab
      if (item.whatsappUrl) {
        window.open(item.whatsappUrl, '_blank', 'noopener,noreferrer');
      }

      // 4. Refresh lists
      fetchEligible();
      fetchHistory();
    } catch (err: any) {
      alert(err?.message || 'Failed to initiate WhatsApp reminder');
    } finally {
      setInitiatingId(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'SERVICE_DUE':
        return <Wrench className="w-4 h-4 text-blue-600" />;
      case 'INSURANCE_EXPIRY':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'COMPLIANCE_EXPIRY':
        return <FileCheck className="w-4 h-4 text-amber-600" />;
      case 'EMI_DUE':
        return <CreditCard className="w-4 h-4 text-purple-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-zinc-500" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'SERVICE_DUE':
        return 'Periodic Service Due';
      case 'INSURANCE_EXPIRY':
        return 'Insurance Policy Expiry';
      case 'COMPLIANCE_EXPIRY':
        return 'PUC / Fitness Compliance';
      case 'EMI_DUE':
        return 'Financier Loan EMI Due';
      default:
        return category;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'USER_INITIATED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PREPARED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'SENT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'FAILED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'CANCELLED':
      default:
        return 'bg-zinc-100 text-zinc-600 border-zinc-200';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <PageHeader
        title="Customer WhatsApp Reminders"
        subtitle="Staff reminder interface for upcoming service maintenance, insurance renewals, fitness/PUC compliance, and financier EMI payments."
        breadcrumbItems={[{ label: 'Operations' }, { label: 'WhatsApp Reminders' }]}
      />

      {/* Provider Notice Box */}
      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <p className="font-bold text-zinc-900">
            Supported Integration: Verified Manual Click-to-Send (wa.me)
          </p>
          <p className="text-zinc-700 leading-relaxed">
            Staff can review pre-drafted context, copy the text, or trigger instant WhatsApp Web / App delivery. Actions are recorded in the database as <span className="bg-amber-100 text-zinc-900 font-mono px-1 py-0.5 rounded border border-amber-200 text-[11px] font-semibold">USER_INITIATED</span>. In accordance with system safety rules, automatic delivery is not simulated without approved WhatsApp Business API credentials (Meta Cloud API).
          </p>
        </div>
      </div>

      {/* Categories / Navigation Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-zinc-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('eligible')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'eligible'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Actionable Due Items ({eligibleItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Reminder History & Audit ({historyItems.length})</span>
          </button>
        </div>

        {/* Category filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Categories' },
            { id: 'SERVICE_DUE', label: 'Service Due' },
            { id: 'INSURANCE_EXPIRY', label: 'Insurance' },
            { id: 'COMPLIANCE_EXPIRY', label: 'Compliance/PUC' },
            { id: 'EMI_DUE', label: 'EMI Due' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-zinc-950 border-amber-500 font-bold shadow-2xs'
                  : 'bg-white text-zinc-700 hover:bg-zinc-50 border-zinc-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: Actionable Eligible Reminders */}
      {activeTab === 'eligible' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
          ) : eligibleItems.length === 0 ? (
            <div className="cockpit-card p-12 text-center rounded-xl border border-zinc-200 bg-white space-y-3 shadow-xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-zinc-900">All Due Items Are Clean</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                No upcoming service jobs, expiring insurance, or overdue loan EMIs require reminder preparation in this view.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eligibleItems.map((item, idx) => {
                const uniqueKey = `${item.category}-${idx}`;
                const isInitiating = initiatingId === uniqueKey;
                const isCopied = copiedId === uniqueKey;

                return (
                  <div
                    key={uniqueKey}
                    className="cockpit-card p-5 rounded-xl border border-zinc-200 bg-white shadow-xs space-y-4 hover:border-zinc-300 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top Meta info */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
                          {getCategoryIcon(item.category)}
                          <span>{getCategoryLabel(item.category)}</span>
                        </div>
                        {item.dueDate && (
                          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1 font-mono font-semibold">
                            <Calendar className="w-3.5 h-3.5" />
                            Due: {new Date(item.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Recipient Context */}
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div>
                          <span className="text-zinc-500 block text-[11px]">Customer:</span>
                          <span className="font-bold text-zinc-900 text-sm block truncate">{item.recipientName}</span>
                          <span className="font-mono text-zinc-600">{item.recipientPhone}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-zinc-500 block text-[11px]">Vehicle / Reference:</span>
                          <span className="font-semibold text-zinc-900 block truncate">{item.vehicleInfo || '--'}</span>
                          <span className="text-[11px] text-zinc-500 truncate block">{item.branchName || 'Titan Auto'}</span>
                        </div>
                      </div>

                      {/* Message preview bubble */}
                      <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-800 leading-relaxed relative group">
                        <div className="font-mono text-[10px] text-zinc-500 uppercase font-semibold mb-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span>Pre-Drafted Message Preview:</span>
                        </div>
                        <p className="font-sans text-zinc-800">{item.draftMessage}</p>
                      </div>

                      {/* Phone validation alert if invalid */}
                      {!item.isPhoneValid && (
                        <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Invalid phone number for automated WhatsApp link</span>
                        </div>
                      )}

                      {/* Duplicate reminder alert */}
                      {item.alreadyInitiatedRecently && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Reminder was already initiated within the last 3 days</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleCopyMessage(item.draftMessage, uniqueKey)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold rounded-lg transition-colors border border-zinc-300 shadow-2xs"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copied!' : 'Copy Text'}</span>
                      </button>

                      <button
                        onClick={() => handleSendWhatsApp(item, idx)}
                        disabled={!item.isPhoneValid || isInitiating}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-xs shadow-emerald-600/20 disabled:opacity-50"
                      >
                        {isInitiating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>Click-to-Send WhatsApp</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: History & Audit */}
      {activeTab === 'history' && (
        <div className="cockpit-card rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-[11px] uppercase font-mono font-semibold text-zinc-600 border-b border-zinc-200">
                <tr>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Customer / Phone</th>
                  <th className="px-4 py-3">Vehicle / Context</th>
                  <th className="px-4 py-3">Message Snippet</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Initiated At</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 font-sans">
                {historyItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-zinc-500 text-xs">
                      No reminder history records logged yet.
                    </td>
                  </tr>
                ) : (
                  historyItems.map((rem) => (
                    <tr key={rem.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          {getCategoryIcon(rem.category)}
                          <span className="text-zinc-900">{rem.category}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-zinc-900">{rem.recipientName}</div>
                        <div className="text-[11px] font-mono text-zinc-500">{rem.recipientPhone}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-700">
                        {rem.vehicle?.registrationNumber || rem.vehicle?.vin || rem.referenceType || '--'}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600 max-w-xs truncate">
                        {rem.draftMessage}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(rem.status)}`}>
                          {rem.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500 font-mono">
                        {rem.initiatedAt ? new Date(rem.initiatedAt).toLocaleString() : '--'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {rem.whatsappUrl && (
                          <a
                            href={rem.whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-xs font-semibold border border-emerald-200 transition-colors"
                          >
                            <span>Open WhatsApp</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

