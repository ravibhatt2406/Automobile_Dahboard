import { DeliveryRecord } from '@/types/domain';
import { FilterParams, PaginatedResponse } from '@/types/common';
import { apiFetch, unwrapData } from './apiClient';

export function normalizeDelivery(raw: any): DeliveryRecord {
  const modelName = raw.vehicle?.variant?.model?.name
    ? `${raw.vehicle.variant.model.name} ${raw.vehicle.variant?.name ? `(${raw.vehicle.variant.name})` : ''}`.trim()
    : raw.vehicle?.variant?.name || 'Commercial Vehicle Asset';

  const customerName = raw.customer?.name || raw.customer?.companyName || 'Corporate Fleet Owner';
  const vehicleVin = raw.vehicle?.vin || raw.vehicleVin || 'N/A';
  const destination = raw.deliveryLocation || raw.destinationAddress || 'Dealership Yard';

  let mappedStatus: DeliveryRecord['status'] = 'scheduled';
  const rawStatus = (raw.status || '').toUpperCase();
  if (rawStatus === 'COMPLETED' || rawStatus === 'DELIVERED') {
    mappedStatus = 'delivered';
  } else if (rawStatus === 'IN_TRANSIT') {
    mappedStatus = 'in_transit';
  } else if (rawStatus === 'PDI_PENDING') {
    mappedStatus = 'pdi_pending';
  } else if (rawStatus === 'DELAYED') {
    mappedStatus = 'delayed';
  } else {
    mappedStatus = 'scheduled';
  }

  const deliveryDate = raw.deliveryDate
    ? new Date(raw.deliveryDate).toISOString().split('T')[0]
    : raw.createdAt
    ? new Date(raw.createdAt).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  return {
    id: raw.id,
    deliveryNumber: raw.deliveryNumber,
    bookingId: raw.bookingId,
    customerName,
    vehicleVin,
    vehicleModel: modelName,
    driverName: raw.deliveryEmployee?.employeeProfile?.firstName
      ? `${raw.deliveryEmployee.employeeProfile.firstName} ${raw.deliveryEmployee.employeeProfile.lastName || ''}`.trim()
      : undefined,
    destinationAddress: destination,
    odometerReading: Number(raw.odometerReading) || 0,
    documentsVerified: Boolean(raw.customerAcknowledgement),
    status: mappedStatus,
    deliveryDate,
    rawDelivery: raw,
  } as DeliveryRecord;
}

export const deliveryService = {
  async getDeliveries(params?: FilterParams & { franchiseId?: string }): Promise<PaginatedResponse<DeliveryRecord>> {
    const cleanParams: Record<string, string> = {};
    if (params?.branchId && params.branchId !== 'ALL') cleanParams.branchId = params.branchId;
    if (params?.franchiseId && params.franchiseId !== 'ALL') cleanParams.franchiseId = params.franchiseId;
    if (params?.status && params.status !== 'ALL') cleanParams.status = params.status;
    if (params?.search) cleanParams.search = params.search;
    if (params?.page) cleanParams.offset = String(((params.page - 1) * (params.pageSize || 50)));
    if (params?.pageSize) cleanParams.limit = String(params.pageSize);

    const query = new URLSearchParams(cleanParams).toString();
    const res = await apiFetch<any>(`/delivery${query ? `?${query}` : ''}`);
    const unwrapped = unwrapData<any>(res);

    const rawItems = Array.isArray(unwrapped)
      ? unwrapped
      : Array.isArray(unwrapped?.items)
      ? unwrapped.items
      : Array.isArray(unwrapped?.data)
      ? unwrapped.data
      : [];

    const total = unwrapped?.total ?? rawItems.length;
    const items = rawItems.map(normalizeDelivery);

    return {
      data: items,
      total,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? (items.length || 50),
      totalPages: Math.ceil(total / (params?.pageSize || 50)) || 1,
    };
  },

  async getDeliveryById(id: string): Promise<any | null> {
    const res = await apiFetch<any>(`/delivery/${id}`);
    const unwrapped = unwrapData<any>(res);
    if (!unwrapped) return null;
    return {
      ...normalizeDelivery(unwrapped),
      raw: unwrapped,
    };
  },
};
