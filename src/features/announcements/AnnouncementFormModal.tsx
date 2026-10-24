import React, { useState, useEffect } from 'react';
import { X, Megaphone, Save, AlertCircle, Loader2, Send, Building, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { announcementsService, CreateAnnouncementDto, UpdateAnnouncementDto } from '@/services/announcements.service';
import { branchService } from '@/services/branch.service';
import { franchiseService } from '@/services/franchise.service';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthContext';
import {
  Announcement,
  AnnouncementCategory,
  AnnouncementPriority,
  AnnouncementAudience,
} from '@/types/domain';

interface AnnouncementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Announcement | null;
}

export const AnnouncementFormModal: React.FC<AnnouncementFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const { activeRole, user } = useAuth();
  const isEditing = Boolean(initialData);

  const isSuperAdmin = activeRole === 'SUPER_ADMIN';
  const isFranchiseRole = activeRole === 'FRANCHISE_OWNER' || activeRole === 'FRANCHISE_MANAGER';
  const isBranchRole = activeRole === 'BRANCH_OWNER' || activeRole === 'BRANCH_MANAGER';

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<AnnouncementCategory>('GENERAL');
  const [priority, setPriority] = useState<AnnouncementPriority>('NORMAL');
  const [audienceType, setAudienceType] = useState<AnnouncementAudience>('BRANCH');
  const [franchiseId, setFranchiseId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [targetBranchIds, setTargetBranchIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isDraft, setIsDraft] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Queries for branches and franchises
  const { data: franchisesData } = useQuery({
    queryKey: ['franchises-announcement-select'],
    queryFn: () => franchiseService.getFranchises(),
    enabled: isOpen && (isSuperAdmin || isFranchiseRole),
  });
  const franchises = Array.isArray(franchisesData) ? franchisesData : (franchisesData?.data || []);

  const { data: branchesData } = useQuery({
    queryKey: ['branches-announcement-select'],
    queryFn: () => branchService.getBranches(),
    enabled: isOpen,
  });
  const branches = branchesData?.data || [];

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setBody(initialData.body || '');
      setCategory(initialData.category || 'GENERAL');
      setPriority(initialData.priority || 'NORMAL');
      setAudienceType(initialData.audienceType || 'BRANCH');
      setFranchiseId(initialData.franchiseId || '');
      setBranchId(initialData.branchId || '');
      setTargetBranchIds(initialData.targetBranchIds || []);
      setStartDate(initialData.startDate ? initialData.startDate.slice(0, 16) : '');
      setExpiryDate(initialData.expiryDate ? initialData.expiryDate.slice(0, 16) : '');
      setIsDraft(initialData.status === 'DRAFT');
    } else {
      setTitle('');
      setBody('');
      setCategory('GENERAL');
      setPriority('NORMAL');
      if (isSuperAdmin) {
        setAudienceType('PLATFORM_WIDE');
      } else if (isFranchiseRole) {
        setAudienceType('FRANCHISE');
      } else {
        setAudienceType('BRANCH');
      }
      setFranchiseId('');
      setBranchId('');
      setTargetBranchIds([]);
      setStartDate('');
      setExpiryDate('');
      setIsDraft(false);
    }
  }, [initialData, isOpen, isSuperAdmin, isFranchiseRole]);

  if (!isOpen) return null;

  const handleBranchToggle = (bId: string) => {
    setTargetBranchIds((prev) =>
      prev.includes(bId) ? prev.filter((id) => id !== bId) : [...prev, bId]
    );
  };

  const handleSubmit = async (publishImmediately: boolean) => {
    setError(null);
    if (!title.trim()) {
      setError('Announcement title is required.');
      return;
    }
    if (!body.trim()) {
      setError('Announcement message content is required.');
      return;
    }

    if (audienceType === 'FRANCHISE' && !franchiseId && isSuperAdmin) {
      setError('Please select the target franchise.');
      return;
    }

    if (audienceType === 'BRANCH' && !branchId && isSuperAdmin) {
      setError('Please select the target branch.');
      return;
    }

    if (audienceType === 'SELECTED_BRANCHES' && targetBranchIds.length === 0) {
      setError('Please select at least one target branch.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing && initialData?.id) {
        await announcementsService.updateAnnouncement(initialData.id, {
          title: title.trim(),
          body: body.trim(),
          category,
          priority,
          audienceType,
          franchiseId: franchiseId || undefined,
          branchId: branchId || undefined,
          targetBranchIds: audienceType === 'SELECTED_BRANCHES' ? targetBranchIds : undefined,
          startDate: startDate ? new Date(startDate).toISOString() : undefined,
          expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
          status: publishImmediately ? 'PUBLISHED' : 'DRAFT',
        });
      } else {
        await announcementsService.createAnnouncement({
          title: title.trim(),
          body: body.trim(),
          category,
          priority,
          audienceType,
          franchiseId: franchiseId || undefined,
          branchId: branchId || undefined,
          targetBranchIds: audienceType === 'SELECTED_BRANCHES' ? targetBranchIds : undefined,
          startDate: startDate ? new Date(startDate).toISOString() : undefined,
          expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
          isDraft: !publishImmediately,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save announcement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 border border-zinc-200 shadow-2xl my-8 text-xs"
        >
          {/* Header */}
          <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/10 rounded-lg text-black">
                <Megaphone className="w-5 h-5 text-[#F5A800]" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-sm">
                  {isEditing ? 'Edit Dealership Announcement' : 'Publish Central Dealership Announcement'}
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Broadcast notices, operational updates, and policies across franchises and branches.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">Announcement Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q4 Commercial Fleet Incentives & Service Guidelines"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Category & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="GENERAL">General Notice</option>
                  <option value="OPERATIONS">Operations & Logistics</option>
                  <option value="SALES">Sales & Incentives</option>
                  <option value="SERVICE">Service & Workshop</option>
                  <option value="FINANCE">Finance & Invoicing</option>
                  <option value="HR">HR & Personnel</option>
                  <option value="URGENT">Urgent Action Required</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="LOW">Low (Informational)</option>
                  <option value="NORMAL">Normal (Standard)</option>
                  <option value="HIGH">High (Important)</option>
                  <option value="URGENT">Urgent (Immediate Attention)</option>
                </select>
              </div>
            </div>

            {/* Audience Targeting */}
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
              <span className="font-bold text-zinc-900 block">Target Audience & Broadcast Boundary</span>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Audience Scope</label>
                <select
                  value={audienceType}
                  onChange={(e) => setAudienceType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {isSuperAdmin && <option value="PLATFORM_WIDE">Entire Platform (All Franchises & Branches)</option>}
                  {(isSuperAdmin || isFranchiseRole) && <option value="FRANCHISE">Specific Franchise Scope</option>}
                  <option value="BRANCH">Single Dealership Branch</option>
                  <option value="SELECTED_BRANCHES">Selected Multiple Branches</option>
                </select>
              </div>

              {/* Scope Pickers */}
              {audienceType === 'FRANCHISE' && isSuperAdmin && (
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Target Franchise</label>
                  <select
                    value={franchiseId}
                    onChange={(e) => setFranchiseId(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white"
                  >
                    <option value="">-- Choose Franchise --</option>
                    {franchises.map((f: any) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {audienceType === 'BRANCH' && isSuperAdmin && (
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Target Branch</label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white"
                  >
                    <option value="">-- Choose Branch --</option>
                    {branches.map((b: any) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code}) - {b.city}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {audienceType === 'SELECTED_BRANCHES' && (
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Select Target Branches ({targetBranchIds.length} selected)
                  </label>
                  <div className="max-h-36 overflow-y-auto border border-zinc-300 rounded-lg p-2 bg-white space-y-1">
                    {branches.map((b: any) => (
                      <label key={b.id} className="flex items-center gap-2 p-1 hover:bg-zinc-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={targetBranchIds.includes(b.id)}
                          onChange={() => handleBranchToggle(b.id)}
                          className="rounded text-amber-500 focus:ring-amber-400"
                        />
                        <span className="text-zinc-800 font-medium">
                          {b.name} ({b.code}) - {b.city}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Expiry & Start Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Start Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Expiry Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white"
                />
              </div>
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">Announcement Body *</label>
              <textarea
                rows={5}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Compose the full message, guidelines, or notice content for staff..."
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed font-sans"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-zinc-300 text-zinc-700 hover:bg-zinc-100 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmit(false)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 text-zinc-500" />
                Save as Draft
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmit(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#111111] hover:bg-black text-[#F5A800] rounded-lg font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Publish Announcement
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
