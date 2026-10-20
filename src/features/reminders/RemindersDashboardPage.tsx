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
        return <Wrench className="w-4 h-4 text-blue-400" />;
      case 'INSURANCE_EXPIRY':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'COMPLIANCE_EXPIRY':
        return <FileCheck className="w-4 h-4 text-amber-400" />;
      case 'EMI_DUE':
        return <CreditCard className="w-4 h-4 text-purple-400" />;
      default:
        return <MessageSquare className="w-4 h-4 text-slate-400" />;
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
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'PREPARED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'SENT':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'FAILED':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'CANCELLED':
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
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
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <p className="font-semibold text-white">
            Supported Integration: Verified Manual Click-to-Send (wa.me)
          </p>
          <p className="text-slate-400 leading-relaxed">
            Staff can review pre-drafted context, copy the text, or trigger instant WhatsApp Web / App delivery. Actions are recorded in the database as <span className="text-blue-400 font-mono">USER_INITIATED</span>. In accordance with system safety rules, automatic delivery is not simulated without approved WhatsApp Business API credentials (Meta Cloud API).
          </p>
        </div>
      </div>

      {/* Categories / Navigation Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('eligible')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'eligible'
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Actionable Due Items ({eligibleItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'history'
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
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
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : eligibleItems.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-white">All Due Items Are Clean</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
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
                    className="p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-sm space-y-4 hover:border-slate-700 transition-colors flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top Meta info */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-950 border border-slate-800">
                          {getCategoryIcon(item.category)}
                          <span className="text-slate-200">{getCategoryLabel(item.category)}</span>
                        </div>
                        {item.dueDate && (
                          <span className="text-xs text-amber-400 flex items-center gap-1 font-mono">
                            <Calendar className="w-3.5 h-3.5" />
                            Due: {new Date(item.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Recipient Context */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500 block">Customer:</span>
                          <span className="font-bold text-white text-sm block truncate">{item.recipientName}</span>
                          <span className="font-mono text-slate-400">{item.recipientPhone}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 block">Vehicle / Reference:</span>
                          <span className="font-medium text-slate-200 block truncate">{item.vehicleInfo || '--'}</span>
                          <span className="text-[11px] text-slate-500 truncate block">{item.branchName || 'Titan Auto'}</span>
                        </div>
                      </div>

                      {/* Message preview bubble */}
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 leading-relaxed relative group">
                        <div className="font-mono text-[10px] text-emerald-400 uppercase font-semibold mb-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>Pre-Drafted Message Preview:</span>
                        </div>
                        <p>{item.draftMessage}</p>
                      </div>

                      {/* Phone validation alert if invalid */}
                      {!item.isPhoneValid && (
                        <div className="flex items-center gap-1.5 text-xs text-red-400">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Invalid phone number for automated WhatsApp link</span>
                        </div>
                      )}

                      {/* Duplicate reminder alert */}
                      {item.alreadyInitiatedRecently && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-400">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Reminder was already initiated within the last 3 days</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleCopyMessage(item.draftMessage, uniqueKey)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copied!' : 'Copy Text'}</span>
                      </button>

                      <button
                        onClick={() => handleSendWhatsApp(item, idx)}
                        disabled={!item.isPhoneValid || isInitiating}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-md shadow-emerald-600/20 disabled:opacity-50"
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
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
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
              <tbody className="divide-y divide-slate-800">
                {historyItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      No reminder history records logged yet.
                    </td>
                  </tr>
                ) : (
                  historyItems.map((rem) => (
                    <tr key={rem.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          {getCategoryIcon(rem.category)}
                          <span className="text-white">{rem.category}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{rem.recipientName}</div>
                        <div className="text-xs font-mono text-slate-400">{rem.recipientPhone}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-300">
                        {rem.vehicle?.registrationNumber || rem.vehicle?.vin || rem.referenceType || '--'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 max-w-xs truncate">
                        {rem.draftMessage}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(rem.status)}`}>
                          {rem.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {rem.initiatedAt ? new Date(rem.initiatedAt).toLocaleString() : '--'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {rem.whatsappUrl && (
                          <a
                            href={rem.whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-xs font-medium border border-slate-700 transition-colors"
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
