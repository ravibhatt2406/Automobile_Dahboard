import React, { useState } from 'react';
import { PageHeader } from '@/components/data-display/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Bell, Inbox } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('unread');
  const notifications: Array<{ id: string; title: string; read: boolean }> = [];

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Notification Center"
        subtitle="System alerts, booking confirmations, and service job status updates"
        breadcrumbItems={[{ label: 'Notifications' }]}
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          All Notifications (0)
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-blue-600 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Unread (0)
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'read'
              ? 'bg-blue-600 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Read History (0)
        </button>
      </div>

      <div className="cockpit-card p-8 rounded-xl border border-slate-800">
        <EmptyState
          title={`No ${filter} notifications`}
          description="Your alert feed is clean. Important inventory or service updates will notify you here."
          icon={Inbox}
        />
      </div>
    </div>
  );
};
