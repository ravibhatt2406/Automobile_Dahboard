import { Announcement, AnnouncementCategory, AnnouncementPriority, AnnouncementStatus, AnnouncementAudience } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch, unwrapData } from './apiClient';

export interface AnnouncementFilterParams extends FilterParams {
  category?: AnnouncementCategory | 'ALL';
  priority?: AnnouncementPriority | 'ALL';
  status?: AnnouncementStatus | 'ALL';
  unreadOnly?: boolean;
}

export interface CreateAnnouncementDto {
  title: string;
  body: string;
  category?: AnnouncementCategory;
  priority?: AnnouncementPriority;
  audienceType: AnnouncementAudience;
  franchiseId?: string;
  branchId?: string;
  targetBranchIds?: string[];
  startDate?: string;
  expiryDate?: string;
  isDraft?: boolean;
}

export interface UpdateAnnouncementDto {
  title?: string;
  body?: string;
  category?: AnnouncementCategory;
  priority?: AnnouncementPriority;
  audienceType?: AnnouncementAudience;
  franchiseId?: string;
  branchId?: string;
  targetBranchIds?: string[];
  startDate?: string;
  expiryDate?: string;
  status?: AnnouncementStatus;
}

export const announcementsService = {
  async getAnnouncements(params?: AnnouncementFilterParams): Promise<PaginatedResponse<Announcement>> {
    const cleanParams: Record<string, string> = {};
    if (params?.category && params.category !== 'ALL') cleanParams.category = params.category;
    if (params?.priority && params.priority !== 'ALL') cleanParams.priority = params.priority;
    if (params?.status && params.status !== 'ALL') cleanParams.status = params.status;
    if (params?.unreadOnly) cleanParams.unreadOnly = 'true';
    if (params?.search) cleanParams.search = params.search;
    if (params?.page) cleanParams.page = String(params.page);
    if (params?.pageSize) cleanParams.limit = String(params.pageSize);

    const query = new URLSearchParams(cleanParams).toString();
    const res = await apiFetch<any>(`/announcements${query ? `?${query}` : ''}`);
    const unwrapped = unwrapData<any>(res);
    const items = Array.isArray(unwrapped)
      ? unwrapped
      : Array.isArray(unwrapped?.items)
      ? unwrapped.items
      : Array.isArray(unwrapped?.data)
      ? unwrapped.data
      : [];
    return {
      data: items,
      total: unwrapped?.total ?? items.length,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? (items.length || 20),
      totalPages: Math.ceil((unwrapped?.total ?? items.length) / (params?.pageSize || 20)) || 1,
    };
  },

  async getAnnouncementById(id: string): Promise<Announcement | null> {
    const res = await apiFetch<any>(`/announcements/${id}`);
    return unwrapData<Announcement>(res);
  },

  async getUnreadCount(): Promise<number> {
    const res = await apiFetch<any>('/announcements/unread-count');
    const data = unwrapData<any>(res);
    return typeof data?.unreadCount === 'number' ? data.unreadCount : 0;
  },

  async createAnnouncement(data: CreateAnnouncementDto): Promise<Announcement> {
    const res = await apiFetch<any>('/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrapData<Announcement>(res);
  },

  async updateAnnouncement(id: string, data: UpdateAnnouncementDto): Promise<Announcement> {
    const res = await apiFetch<any>(`/announcements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return unwrapData<Announcement>(res);
  },

  async publishAnnouncement(id: string): Promise<Announcement> {
    const res = await apiFetch<any>(`/announcements/${id}/publish`, {
      method: 'POST',
    });
    return unwrapData<Announcement>(res);
  },

  async unpublishAnnouncement(id: string): Promise<Announcement> {
    const res = await apiFetch<any>(`/announcements/${id}/unpublish`, {
      method: 'POST',
    });
    return unwrapData<Announcement>(res);
  },

  async archiveAnnouncement(id: string): Promise<Announcement> {
    const res = await apiFetch<any>(`/announcements/${id}/archive`, {
      method: 'POST',
    });
    return unwrapData<Announcement>(res);
  },

  async markAsRead(id: string): Promise<{ success: boolean; unreadCount: number }> {
    const res = await apiFetch<any>(`/announcements/${id}/read`, {
      method: 'POST',
    });
    return unwrapData<any>(res);
  },

  async deleteAnnouncement(id: string): Promise<void> {
    await apiFetch<any>(`/announcements/${id}`, {
      method: 'DELETE',
    });
  },
};
