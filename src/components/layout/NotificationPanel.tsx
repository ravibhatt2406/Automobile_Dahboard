import React, { useState } from 'react';
import { Bell, Check, Inbox, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, AppNotification } from '@/services/notification.service';
import { useNavigate } from 'react-router-dom';

export const NotificationPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery<AppNotification[]>({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
    refetchInterval: 10000,
  });

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['unreadNotificationCount'],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 10000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
    },
  });

  const handleNotificationClick = (notif: AppNotification) => {
    if (notif.status !== 'READ') {
      markReadMutation.mutate(notif.id);
    }
    setIsOpen(false);

    if (notif.metadata?.type === 'EMPLOYEE_APPROVAL' || notif.metadata?.approvalRequestId) {
      navigate('/organization/approvals');
    } else {
      navigate('/notifications');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 transition-colors relative"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#F5A800] ring-2 ring-white animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute right-0 mt-2 w-88 cockpit-card rounded-xl border border-[#E5E5E5] shadow-xl z-50 overflow-hidden bg-white"
            >
              <div className="p-3 bg-zinc-50 border-b border-[#E5E5E5] flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                  Notifications
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-mono font-medium">
                  {unreadCount} Unread
                </span>
              </div>

              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 mx-auto mb-2">
                    <Inbox className="w-5 h-5 text-zinc-400" />
                  </div>
                  <p className="text-xs font-medium text-zinc-800">No new notifications</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    You're all caught up with your operation alerts.
                  </p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100">
                  {notifications.slice(0, 10).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3 text-left hover:bg-zinc-50 cursor-pointer transition-colors flex items-start justify-between gap-2 ${
                        notif.status !== 'READ' ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center gap-1.5">
                          {notif.status !== 'READ' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F5A800]" />
                          )}
                          <p className="text-xs font-semibold text-zinc-900 line-clamp-1">
                            {notif.title}
                          </p>
                        </div>
                        <p className="text-[11px] text-zinc-600 line-clamp-2">{notif.body}</p>
                        <p className="text-[10px] text-zinc-400 font-mono">
                          {new Date(notif.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0 self-center" />
                    </div>
                  ))}
                </div>
              )}

              <div className="p-2 bg-zinc-50 border-t border-[#E5E5E5] text-center">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/notifications');
                  }}
                  className="text-[11px] font-semibold text-[#111111] hover:text-[#F5A800] transition-colors"
                >
                  View All Notifications
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
