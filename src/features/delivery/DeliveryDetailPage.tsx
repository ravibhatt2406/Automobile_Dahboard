import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { PackageCheck, Truck, User, FileText, ArrowLeft, CheckCircle2, MapPin, Gauge } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { deliveryService } from '@/services/delivery.service';
import { SkeletonTable } from '@/components/feedback/LoadingState';

export const DeliveryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['delivery-detail', id],
    queryFn: () => (id ? deliveryService.getDeliveryById(id) : null),
    enabled: Boolean(id),
  });

  const raw = data?.raw;

  return (
    <div className="space-y-6">
      <PageHeader
        title={data ? `Delivery Dispatch: ${data.deliveryNumber}` : `Delivery #${id}`}
        subtitle="Commercial fleet dispatch telemetry, carrier transport, and customer handover"
        breadcrumbItems={[
          { label: 'Delivery', href: '/delivery' },
          { label: data?.deliveryNumber || id || 'Detail' },
        ]}
        actions={
          <button
            onClick={() => navigate('/delivery')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Deliveries
          </button>
        }
      />

      {isLoading ? (
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs">
          <SkeletonTable rows={4} />
        </div>
      ) : !data ? (
        <div className="bg-white p-8 rounded-2xl border border-zinc-200 text-center py-16 space-y-3">
          <PackageCheck className="w-10 h-10 text-zinc-400 mx-auto" />
          <h3 className="text-base font-semibold text-zinc-900">Delivery Shipment #{id}</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            No delivery dispatch telemetry record found in database for this ID.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status & Telemetry Card */}
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#F5A800]">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-zinc-900 font-mono">
                      {data.deliveryNumber}
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Dispatched on {data.deliveryDate}
                    </p>
                  </div>
                </div>
                <StatusBadge status={data.status} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                  <div className="text-[11px] font-semibold text-zinc-400 uppercase flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" /> Delivery Handover Location
                  </div>
                  <div className="font-semibold text-zinc-800 text-sm">
                    {data.destinationAddress}
                  </div>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                  <div className="text-[11px] font-semibold text-zinc-400 uppercase flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-zinc-500" /> Odometer at Handover
                  </div>
                  <div className="font-semibold text-zinc-800 text-sm">
                    {data.odometerReading} km
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Customer Handover Verified:</strong> Formal delivery receipt signed & acknowledged.
                </span>
              </div>
            </div>

            {/* Vehicle Asset Card */}
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
                <Truck className="w-4 h-4 text-zinc-600" /> Dispatched Vehicle Asset
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[11px] text-zinc-400 block">Vehicle Spec / Model</span>
                  <span className="font-semibold text-zinc-800">{data.vehicleModel}</span>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-400 block">VIN / Chassis</span>
                  <span className="font-mono text-blue-600 font-semibold">{data.vehicleVin}</span>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-400 block">Origin Branch</span>
                  <span className="font-semibold text-zinc-800">{raw?.vehicle?.branch?.name || 'Authorized Dealership'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Linked Transactions */}
          <div className="space-y-6">
            {/* Customer Details */}
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
                <User className="w-4 h-4 text-zinc-600" /> Fleet Owner / Customer
              </h3>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[11px] text-zinc-400 block">Customer Name</span>
                  <span className="font-semibold text-zinc-900">{data.customerName}</span>
                </div>
                {raw?.customer?.phone && (
                  <div>
                    <span className="text-[11px] text-zinc-400 block">Phone</span>
                    <span className="text-zinc-700">{raw.customer.phone}</span>
                  </div>
                )}
                {raw?.customer?.email && (
                  <div>
                    <span className="text-[11px] text-zinc-400 block">Email</span>
                    <span className="text-zinc-700">{raw.customer.email}</span>
                  </div>
                )}
                {raw?.customer?.address && (
                  <div>
                    <span className="text-[11px] text-zinc-400 block">Registered Address</span>
                    <span className="text-zinc-700">{raw.customer.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Linked Documents */}
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
                <FileText className="w-4 h-4 text-zinc-600" /> Commercial Documents
              </h3>
              <div className="space-y-3 text-xs">
                {raw?.booking && (
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-zinc-800 font-mono">
                        {raw.booking.bookingNumber}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        Total: ₹{Number(raw.booking.totalAmount || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/sales/bookings/${raw.booking.id}`)}
                      className="text-amber-600 hover:text-amber-700 font-bold text-xs"
                    >
                      View
                    </button>
                  </div>
                )}
                {raw?.invoice && (
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-zinc-800 font-mono">
                        {raw.invoice.invoiceNumber}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        Invoice Total: ₹{Number(raw.invoice.totalAmount || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/billing/invoices/${raw.invoice.id}`)}
                      className="text-amber-600 hover:text-amber-700 font-bold text-xs"
                    >
                      View
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
