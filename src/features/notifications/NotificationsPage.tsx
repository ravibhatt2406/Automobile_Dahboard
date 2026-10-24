import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Inbox, CheckCircle2, ArrowRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, AppNotification } from '@/services/notification.service';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';

export const NotificationsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('unread');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const { data: notifications = [], isLoading } = useQuery<AppNotification[]>({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
    enabled: isAuthenticated,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
    },
  });

  const unreadCount = notifications.filter((n) => n.status !== 'READ').length;
  const readCount = notifications.filter((n) => n.status === 'READ').length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return n.status !== 'READ';
    if (filter === 'read') return n.status === 'READ';
    return true;
  });

  const handleOpenAction = (notif: AppNotification) => {
    if (notif.status !== 'READ') {
      markReadMutation.mutate(notif.id);
    }

    if (notif.metadata?.type === 'EMPLOYEE_APPROVAL' || notif.metadata?.approvalRequestId) {
      navigate('/organization/approvals');
    }
  };

  return (
    <div>
      <PageHeader
        title="Notification Center"
        subtitle="System alerts, employee approval requests, and operational notifications"
        breadcrumbItems={[{ label: 'Notifications' }]}
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-zinc-200 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'all'
              ? 'bg-[#111111] text-white font-semibold shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-[#111111] text-white font-semibold shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'read'
              ? 'bg-[#111111] text-white font-semibold shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          Read History ({readCount})
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-zinc-500">Loading notifications...</div>
      ) : filteredNotifications.length === 0 ? (
        <div className="cockpit-card p-8 rounded-xl border border-[#E5E5E5] bg-white">
          <EmptyState
            title={`No ${filter} notifications`}
            description="Your alert feed is clean. Operational alerts and approval requests will appear here."
            icon={Inbox}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white ${
                notif.status !== 'READ'
                  ? 'border-amber-300 bg-amber-50/20 shadow-xs'
                  : 'border-[#E5E5E5] opacity-90'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {notif.status !== 'READ' && (
                    <span className="w-2 h-2 rounded-full bg-[#F5A800]" />
                  )}
                  <h4 className="text-sm font-semibold text-zinc-900">{notif.title}</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 uppercase border border-zinc-200">
                    {notif.channel}
                  </span>
                </div>
                <p className="text-xs text-zinc-600">{notif.body}</p>
                <p className="text-[10px] text-zinc-400 font-mono">
                  {new Date(notif.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                {(notif.metadata?.type === 'EMPLOYEE_APPROVAL' || notif.metadata?.approvalRequestId) && (
                  <button
                    onClick={() => handleOpenAction(notif)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] hover:bg-black text-[#F5A800] rounded-lg text-xs font-semibold transition-colors shadow-xs"
                  >
                    View Approval Request <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {notif.status !== 'READ' && (
                  <button
                    onClick={() => markReadMutation.mutate(notif.id)}
                    disabled={markReadMutation.isPending}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-zinc-300 text-zinc-700 hover:bg-zinc-100 rounded-lg text-xs font-medium transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" /> Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
