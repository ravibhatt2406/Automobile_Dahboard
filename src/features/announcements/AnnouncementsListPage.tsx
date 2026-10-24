import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementsService } from '@/services/announcements.service';
import { useAuth } from '@/app/providers/AuthContext';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  User,
  Globe,
  Building,
  Store,
  Share2,
  Check,
  ChevronRight,
  AlertCircle,
  Tag,
} from 'lucide-react';
import {
  Announcement,
  AnnouncementCategory,
  AnnouncementPriority,
  AnnouncementStatus,
} from '@/types/domain';
import { AnnouncementFormModal } from './AnnouncementFormModal';

type FilterTab = 'ALL' | 'UNREAD' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

const CATEGORIES: Array<{ key: AnnouncementCategory | 'ALL'; label: string }> = [
  { key: 'ALL', label: 'All Categories' },
  { key: 'GENERAL', label: 'General' },
  { key: 'OPERATIONS', label: 'Operations' },
  { key: 'SALES', label: 'Sales' },
  { key: 'SERVICE', label: 'Service' },
  { key: 'FINANCE', label: 'Finance' },
  { key: 'HR', label: 'HR' },
  { key: 'URGENT', label: 'Urgent' },
];

export const AnnouncementsListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, activeRole } = useAuth();

  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<AnnouncementCategory | 'ALL'>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<AnnouncementPriority | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canCreate =
    activeRole === 'SUPER_ADMIN' ||
    activeRole === 'FRANCHISE_OWNER' ||
    activeRole === 'FRANCHISE_MANAGER' ||
    activeRole === 'BRANCH_OWNER' ||
    activeRole === 'BRANCH_MANAGER';

  // 1. Fetch announcements
  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      'announcements',
      activeTab,
      selectedCategory,
      selectedPriority,
      search,
    ],
    queryFn: () =>
      announcementsService.getAnnouncements({
        status:
          activeTab === 'PUBLISHED'
            ? 'PUBLISHED'
            : activeTab === 'DRAFT'
            ? 'DRAFT'
            : activeTab === 'ARCHIVED'
            ? 'ARCHIVED'
            : undefined,
        unreadOnly: activeTab === 'UNREAD',
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        priority: selectedPriority !== 'ALL' ? selectedPriority : undefined,
        search: search || undefined,
      }),
  });

  const announcements = data?.data || [];

  // Quick mark-as-read mutation
  const markReadMutation = useMutation({
    mutationFn: (id: string) => announcementsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements-unread-count'] });
    },
  });

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

  const getAudienceLabel = (a: Announcement) => {
    switch (a.audienceType) {
      case 'PLATFORM_WIDE':
        return { label: 'Platform-wide', icon: Globe };
      case 'FRANCHISE':
        return { label: a.franchise?.name || 'Franchise Scope', icon: Building };
      case 'BRANCH':
        return { label: a.branch?.name || 'Local Branch', icon: Store };
      case 'SELECTED_BRANCHES':
        return { label: `${a.targetBranchIds?.length || 0} Branches`, icon: Share2 };
      default:
        return { label: 'Internal', icon: Globe };
    }
  };

  return (
    <div className="space-y-6 text-xs">
      <PageHeader
        title="Central Announcements"
        subtitle="Broadcast notices, policy updates, and operational notices across branches"
        breadcrumbItems={[{ label: 'Announcements' }]}
        actions={
          canCreate ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-bold rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" /> Create Announcement
            </button>
          ) : undefined
        }
      />

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-2 overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5">
          {(
            [
              { id: 'ALL', label: 'All Notices' },
              { id: 'UNREAD', label: 'Unread' },
              { id: 'PUBLISHED', label: 'Published' },
              ...(canCreate ? [{ id: 'DRAFT', label: 'Drafts' }] : []),
              { id: 'ARCHIVED', label: 'Archived' },
            ] as Array<{ id: FilterTab; label: string }>
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  isActive
                    ? 'bg-[#111111] text-[#F5A800] shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <span className="text-[11px] font-mono text-zinc-500">
          Showing {announcements.length} announcement{announcements.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements by title or content..."
            className="w-full pl-9 pr-3 py-1.5 border border-zinc-300 rounded-lg text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
          />
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500 font-semibold">Priority:</span>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as any)}
            className="px-2.5 py-1.5 border border-zinc-300 rounded-lg text-zinc-800 bg-white text-xs"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                isSelected
                  ? 'bg-zinc-900 text-white font-semibold'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Announcements List */}
      {isLoading ? (
        <div className="p-12 text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
          <Megaphone className="w-6 h-6 animate-pulse text-[#F5A800]" />
          <span>Loading announcements...</span>
        </div>
      ) : announcements.length > 0 ? (
        <div className="space-y-3">
          {announcements.map((item) => {
            const isUnread = !item.isRead;
            const aud = getAudienceLabel(item);
            const AudIcon = aud.icon;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all ${
                  isUnread
                    ? 'bg-amber-50/40 border-amber-300 shadow-xs'
                    : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-xs'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1.5 flex-1 min-w-[280px]">
                    <div className="flex flex-wrap items-center gap-2">
                      {isUnread && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#F5A800] text-black">
                          NEW
                        </span>
                      )}

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getPriorityBadgeClass(
                          item.priority
                        )}`}
                      >
                        {item.priority}
                      </span>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700">
                        {item.category}
                      </span>

                      {item.status !== 'PUBLISHED' && (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            item.status === 'DRAFT'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {item.status}
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 font-medium">
                        <AudIcon className="w-3 h-3 text-zinc-400" />
                        <span>{aud.label}</span>
                      </span>
                    </div>

                    <h3
                      onClick={() => navigate(`/announcements/${item.id}`)}
                      className="text-sm font-bold text-zinc-900 hover:text-amber-600 cursor-pointer transition-colors"
                    >
                      {item.title}
                    </h3>

                    <p className="text-zinc-600 line-clamp-2 leading-relaxed">
                      {item.body}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-400 font-mono pt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>
                          {item.author?.employeeProfile
                            ? `${item.author.employeeProfile.firstName} ${item.author.employeeProfile.lastName}`
                            : item.author?.email || 'Dealership Executive'}
                        </span>
                      </span>

                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {item.publishedAt
                            ? new Date(item.publishedAt).toLocaleDateString()
                            : new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </span>

                      {item.expiryDate && (
                        <span className="flex items-center gap-1 text-amber-700">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>Expires {new Date(item.expiryDate).toLocaleDateString()}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isUnread && (
                      <button
                        onClick={() => markReadMutation.mutate(item.id)}
                        disabled={markReadMutation.isPending}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold border border-zinc-200 transition-colors"
                        title="Mark as Read"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Mark Read</span>
                      </button>
                    )}

                    <button
                      onClick={() => navigate(`/announcements/${item.id}`)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-bold transition-colors shadow-xs"
                    >
                      <span>Read Notice</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 bg-white rounded-2xl border border-dashed border-zinc-200 text-center space-y-2">
          <Megaphone className="w-8 h-8 text-zinc-300 mx-auto" />
          <h4 className="font-bold text-zinc-800 text-sm">No announcements found</h4>
          <p className="text-zinc-500 text-xs max-w-md mx-auto">
            There are no announcements matching your selected status, category or search query.
          </p>
          {canCreate && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#111111] text-[#F5A800] rounded-lg font-bold mt-2"
            >
              <Plus className="w-3.5 h-3.5" /> Create Announcement
            </button>
          )}
        </div>
      )}

      <AnnouncementFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
