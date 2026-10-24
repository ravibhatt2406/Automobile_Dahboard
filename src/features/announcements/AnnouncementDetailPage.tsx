import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementsService } from '@/services/announcements.service';
import {
  Megaphone,
  Calendar,
  Clock,
  User,
  Building,
  Store,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Edit,
  Trash2,
  Archive,
  Send,
  Eye,
  RefreshCw,
  Globe,
  Share2,
} from 'lucide-react';
import { useAuth } from '@/app/providers/AuthContext';
import { AnnouncementFormModal } from './AnnouncementFormModal';

export const AnnouncementDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, activeRole } = useAuth();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // 1. Fetch Announcement
  const { data: announcement, isLoading, error, refetch } = useQuery({
    queryKey: ['announcement-detail', id],
    queryFn: () => (id ? announcementsService.getAnnouncementById(id) : null),
  });

  // Automatically mark as read when page loads
  useEffect(() => {
    if (id && announcement && !announcement.isRead) {
      announcementsService.markAsRead(id).then(() => {
        queryClient.invalidateQueries({ queryKey: ['announcements-unread-count'] });
        queryClient.invalidateQueries({ queryKey: ['announcements'] });
      }).catch(() => {});
    }
  }, [id, announcement?.isRead]);

  // Publish Mutation
  const publishMutation = useMutation({
    mutationFn: () => announcementsService.publishAnnouncement(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcement-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements-unread-count'] });
      setActionSuccess('Announcement published successfully.');
    },
    onError: (err: any) => setActionError(err.message || 'Failed to publish announcement.'),
  });

  // Unpublish Mutation
  const unpublishMutation = useMutation({
    mutationFn: () => announcementsService.unpublishAnnouncement(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcement-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setActionSuccess('Announcement reverted to draft.');
    },
    onError: (err: any) => setActionError(err.message || 'Failed to unpublish announcement.'),
  });

  // Archive Mutation
  const archiveMutation = useMutation({
    mutationFn: () => announcementsService.archiveAnnouncement(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcement-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setActionSuccess('Announcement archived.');
    },
    onError: (err: any) => setActionError(err.message || 'Failed to archive announcement.'),
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: () => announcementsService.deleteAnnouncement(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements-unread-count'] });
      navigate('/announcements');
    },
    onError: (err: any) => setActionError(err.message || 'Failed to delete announcement.'),
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-[#F5A800]" />
        <span className="text-xs">Loading announcement notice...</span>
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs space-y-2">
        <p className="font-bold flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          Announcement Not Found or Access Restricted
        </p>
        <p>{(error as any)?.message || 'The specified notice does not exist or is not targeted to your branch.'}</p>
        <Link to="/announcements" className="text-blue-600 underline font-semibold block pt-2">
          ← Return to Announcements List
        </Link>
      </div>
    );
  }

  const isAuthor = announcement.authorId === user?.id;
  const canManage =
    isAuthor ||
    activeRole === 'SUPER_ADMIN' ||
    activeRole === 'FRANCHISE_OWNER' ||
    activeRole === 'FRANCHISE_MANAGER' ||
    activeRole === 'BRANCH_MANAGER';

  const getPriorityBadgeClass = (p: string) => {
    switch (p) {
      case 'URGENT':
        return 'bg-rose-500 text-white';
      case 'HIGH':
        return 'bg-amber-500 text-black font-bold';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-zinc-100 text-zinc-700';
    }
  };

  const getAudienceDisplay = () => {
    switch (announcement.audienceType) {
      case 'PLATFORM_WIDE':
        return { label: 'Platform-wide (All Franchises & Branches)', icon: Globe };
      case 'FRANCHISE':
        return {
          label: `Franchise: ${announcement.franchise?.name || 'Assigned Franchise'}`,
          icon: Building,
        };
      case 'BRANCH':
        return {
          label: `Branch: ${announcement.branch?.name || 'Local Branch'}`,
          icon: Store,
        };
      case 'SELECTED_BRANCHES':
        return {
          label: `Selected Branches (${announcement.targetBranchIds?.length || 0})`,
          icon: Share2,
        };
      default:
        return { label: 'Target Audience', icon: Globe };
    }
  };

  const audience = getAudienceDisplay();
  const AudienceIcon = audience.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-xs">
      {/* Back button and Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/announcements"
          className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Announcements</span>
        </Link>

        {canManage && (
          <div className="flex items-center gap-2">
            {announcement.status === 'DRAFT' && (
              <button
                disabled={publishMutation.isPending}
                onClick={() => publishMutation.mutate()}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#111111] hover:bg-black text-[#F5A800] rounded-lg font-bold shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Publish
              </button>
            )}

            {announcement.status === 'PUBLISHED' && (
              <button
                disabled={unpublishMutation.isPending}
                onClick={() => unpublishMutation.mutate()}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg font-semibold border border-zinc-200 transition-colors"
              >
                Revert to Draft
              </button>
            )}

            {announcement.status !== 'ARCHIVED' && (
              <button
                disabled={archiveMutation.isPending}
                onClick={() => archiveMutation.mutate()}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg font-semibold border border-zinc-200 transition-colors"
              >
                <Archive className="w-3.5 h-3.5 text-zinc-500" />
                Archive
              </button>
            )}

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg font-semibold border border-zinc-200 transition-colors"
            >
              <Edit className="w-3.5 h-3.5 text-blue-600" />
              Edit
            </button>

            <button
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this announcement?')) {
                  deleteMutation.mutate();
                }
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold border border-rose-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-zinc-400 hover:text-zinc-700">
            &times;
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-zinc-400 hover:text-zinc-700">
            &times;
          </button>
        </div>
      )}

      {/* Main Announcement Card */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        {/* Banner Top Strip */}
        <div className="p-6 bg-zinc-50 border-b border-zinc-200 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${getPriorityBadgeClass(
                announcement.priority
              )}`}
            >
              {announcement.priority} PRIORITY
            </span>

            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-200 text-zinc-800">
              {announcement.category}
            </span>

            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                announcement.status === 'PUBLISHED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : announcement.status === 'DRAFT'
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-zinc-200 text-zinc-700'
              }`}
            >
              {announcement.status}
            </span>

            <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 font-medium text-[11px] border border-blue-200">
              <AudienceIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>{audience.label}</span>
            </span>
          </div>

          <h1 className="text-xl font-bold text-zinc-900 leading-snug">{announcement.title}</h1>

          {/* Author and Metadata Bar */}
          <div className="flex flex-wrap items-center gap-4 text-zinc-500 pt-1 text-[11px] font-mono">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-zinc-400" />
              <span>
                {announcement.author?.employeeProfile
                  ? `${announcement.author.employeeProfile.firstName} ${announcement.author.employeeProfile.lastName} (${announcement.author.employeeProfile.designation || 'Staff'})`
                  : announcement.author?.email || 'Dealership Executive'}
              </span>
            </span>

            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>
                {announcement.publishedAt
                  ? `Published ${new Date(announcement.publishedAt).toLocaleDateString()}`
                  : `Created ${new Date(announcement.createdAt).toLocaleDateString()}`}
              </span>
            </span>

            {announcement.expiryDate && (
              <span className="flex items-center gap-1.5 text-amber-700">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Expires {new Date(announcement.expiryDate).toLocaleDateString()}</span>
              </span>
            )}

            {typeof announcement.readsCount === 'number' && canManage && (
              <span className="flex items-center gap-1.5 ml-auto text-emerald-700 font-semibold">
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>{announcement.readsCount} staff read</span>
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 text-zinc-800 text-sm leading-relaxed whitespace-pre-wrap font-sans">
          {announcement.body}
        </div>
      </div>

      <AnnouncementFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={announcement}
        onSuccess={() => {
          refetch();
          setActionSuccess('Announcement updated successfully.');
        }}
      />
    </div>
  );
};
