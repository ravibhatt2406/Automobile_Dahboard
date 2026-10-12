import React, { useState, useEffect } from 'react';
import { catalogueService, CatalogVariantItem } from '@/services/catalogue.service';
import { branchService } from '@/services/branch.service';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import {
  Truck,
  Search,
  CheckCircle2,
  X,
  Info,
  Building,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { salesService } from '@/services/sales.service';
import { useAuth } from '@/app/providers/AuthContext';
import { Branch, Manufacturer, TruckModel } from '@/types/domain';

export const BrowseTrucksPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [variants, setVariants] = useState<CatalogVariantItem[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState<string>('');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('ALL');
  const [selectedFuel, setSelectedFuel] = useState<string>('ALL');
  const [selectedTransmission, setSelectedTransmission] = useState<string>('ALL');

  // Modal States
  const [detailModalItem, setDetailModalItem] = useState<CatalogVariantItem | null>(null);
  const [quotationModalItem, setQuotationModalItem] = useState<CatalogVariantItem | null>(null);
  const [bookingModalItem, setBookingModalItem] = useState<CatalogVariantItem | null>(null);

  // Form State for Quotation / Booking
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadVariants();
  }, [search]);

  const loadInitialData = async () => {
    try {
      const [mfgRes, branchRes] = await Promise.allSettled([
        catalogueService.getManufacturers(),
        branchService.getBranches(),
      ]);

      if (mfgRes.status === 'fulfilled') setManufacturers(mfgRes.value);
      if (branchRes.status === 'fulfilled' && Array.isArray(branchRes.value?.data)) {
        setBranches(branchRes.value.data);
        if (branchRes.value.data.length > 0) {
          setSelectedBranchId(branchRes.value.data[0].id);
        }
      }
    } catch {
      // Non-blocking initialization
    }
  };

  const loadVariants = async () => {
    setLoading(true);
    setPageError(null);
    try {
      const data = await catalogueService.getVariants(search);
      setVariants(data);
    } catch (err: any) {
      setPageError(err.message || 'Failed to load commercial truck catalog.');
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredVariants = variants.filter((item) => {
    if (
      selectedManufacturer !== 'ALL' &&
      item.manufacturerName?.toLowerCase() !== selectedManufacturer.toLowerCase()
    ) {
      return false;
    }
    if (selectedFuel !== 'ALL' && item.fuelType?.toLowerCase() !== selectedFuel.toLowerCase()) {
      return false;
    }
    if (
      selectedTransmission !== 'ALL' &&
      item.transmission?.toLowerCase() !== selectedTransmission.toLowerCase()
    ) {
      return false;
    }
    return true;
  });

  const handleRequestQuotationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotationModalItem) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const branchToUse = selectedBranchId;
    if (!branchToUse) {
      setActionErrorMessage('Please select a dealership branch for your quotation.');
      return;
    }

    setIsSubmitting(true);
    setActionErrorMessage(null);
    setActionSuccessMessage(null);

    try {
      const created = await salesService.createQuotation({
        variantId: quotationModalItem.id,
        branchId: branchToUse,
        quantity,
        accessoriesAmount: 0,
        insuranceAmount: 0,
        discountAmount: 0,
      });

      setActionSuccessMessage(
        `Quotation requested successfully for ${quotationModalItem.name}! Quotation Ref #${created.quotationNumber}`
      );
      setQuotationModalItem(null);
    } catch (err: any) {
      setActionErrorMessage(err.message || 'Failed to create quotation request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookTruckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingModalItem) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const branchToUse = selectedBranchId;
    if (!branchToUse) {
      setActionErrorMessage('Please select a dealership branch for your reservation.');
      return;
    }

    setIsSubmitting(true);
    setActionErrorMessage(null);
    setActionSuccessMessage(null);

    try {
      // Real lightweight flow: Create Quotation -> Create Booking
      const quote = await salesService.createQuotation({
        variantId: bookingModalItem.id,
        branchId: branchToUse,
        quantity: 1,
      });

      const depositAmount = Math.max(10000, Math.round(Number(quote.totalAmount || bookingModalItem.basePrice) * 0.05));

      const booking = await salesService.createBooking({
        quotationId: quote.id,
        branchId: branchToUse,
        bookingAmount: depositAmount,
      });

      setActionSuccessMessage(
        `Booking reserved successfully for ${bookingModalItem.name}! Booking Ref #${booking.bookingNumber}`
      );
      setBookingModalItem(null);
    } catch (err: any) {
      setActionErrorMessage(err.message || 'Failed to reserve commercial truck booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-[#E5E5E5] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-[#F5A800] uppercase tracking-widest flex items-center gap-1.5 font-mono">
            <Truck className="w-4 h-4 text-[#F5A800]" /> Commercial Fleet Catalog
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mt-1">Browse Available Commercial Trucks</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Discover commercial haulage, tippers, and tractors currently available across official franchised dealership branches.
          </p>
        </div>
      </div>

      {/* Success Notification Alert */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Notification Alert */}
      {actionErrorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{actionErrorMessage}</span>
          </div>
          <button onClick={() => setActionErrorMessage(null)} className="text-rose-700 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Controls Toolbar */}
      <div className="cockpit-card p-4 rounded-xl border border-[#E5E5E5] bg-white space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by model, specs, engine..."
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#F5A800] focus:ring-1 focus:ring-[#F5A800]"
            />
          </div>

          {/* Manufacturer Filter */}
          <div>
            <select
              value={selectedManufacturer}
              onChange={(e) => setSelectedManufacturer(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#F5A800]"
            >
              <option value="ALL">All Manufacturers</option>
              {manufacturers.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Fuel Filter */}
          <div>
            <select
              value={selectedFuel}
              onChange={(e) => setSelectedFuel(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#F5A800]"
            >
              <option value="ALL">All Fuel Types</option>
              <option value="diesel">Diesel</option>
              <option value="cng">CNG</option>
              <option value="electric">Electric</option>
            </select>
          </div>

          {/* Transmission Filter */}
          <div>
            <select
              value={selectedTransmission}
              onChange={(e) => setSelectedTransmission(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#F5A800]"
            >
              <option value="ALL">All Transmissions</option>
              <option value="manual">Manual</option>
              <option value="automatic">Automatic</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      {loading ? (
        <LoadingState label="Loading commercial vehicle catalogue..." />
      ) : pageError ? (
        <ErrorState title="Failed to Load Catalogue" message={pageError} onRetry={loadVariants} />
      ) : filteredVariants.length === 0 ? (
        <EmptyState
          title="No commercial trucks matched your search criteria"
          description="Try clearing your manufacturer or fuel filters to discover available vehicles."
          actionLabel="Reset Filters"
          onAction={() => {
            setSearch('');
            setSelectedManufacturer('ALL');
            setSelectedFuel('ALL');
            setSelectedTransmission('ALL');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVariants.map((item) => {
            const basePriceFormatted = new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 0,
            }).format(Number(item.basePrice));

            return (
              <div
                key={item.id}
                className="cockpit-card rounded-xl border border-[#E5E5E5] bg-white overflow-hidden flex flex-col hover:border-zinc-300 transition-all shadow-xs group"
              >
                {/* Truck Image Header */}
                <div className="h-48 bg-zinc-900 relative overflow-hidden flex items-center justify-center">
                  <img
                    src={
                      item.images?.[0] ||
                      'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80'
                    }
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute top-3 left-3 bg-[#111111]/90 backdrop-blur-xs px-2.5 py-1 rounded text-[10px] font-mono font-bold text-[#F5A800] tracking-wider uppercase border border-zinc-700">
                    {item.manufacturerName || 'Ashok Leyland'}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-300">
                    BS6 Phase 2
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-[#111111] group-hover:text-[#F5A800] transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                      {item.description || 'Heavy commercial haulage vehicle engineered for extreme payload efficiency.'}
                    </p>
                  </div>

                  {/* Spec Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                    <div>
                      <span className="text-zinc-400 block">Payload:</span>
                      <span className="font-semibold text-zinc-800">
                        {item.payload ? `${(item.payload / 1000).toFixed(1)} Tonnes` : 'Commercial'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Power:</span>
                      <span className="font-semibold text-zinc-800">
                        {item.horsepower ? `${item.horsepower} HP` : 'Heavy Duty'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Fuel:</span>
                      <span className="font-semibold text-zinc-800 uppercase">{item.fuelType || 'Diesel'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Transmission:</span>
                      <span className="font-semibold text-zinc-800 capitalize">{item.transmission || 'Manual'}</span>
                    </div>
                  </div>

                  {/* Price Row */}
                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                        Base Price
                      </span>
                      <span className="text-lg font-bold text-[#111111]">{basePriceFormatted}</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">+28% GST</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      onClick={() => setDetailModalItem(item)}
                      className="px-2.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors"
                    >
                      <Info className="w-3.5 h-3.5" /> Specs
                    </button>
                    <button
                      onClick={() => setQuotationModalItem(item)}
                      className="px-2.5 py-2 bg-zinc-900 hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors shadow-xs"
                    >
                      Quote
                    </button>
                    <button
                      onClick={() => setBookingModalItem(item)}
                      className="px-2.5 py-2 bg-[#F5A800] hover:bg-[#e09800] text-[#111111] text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors shadow-xs"
                    >
                      Book
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Detail Specs Modal */}
      {detailModalItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 border border-zinc-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-zinc-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-[#F5A800] uppercase">
                  {detailModalItem.manufacturerName}
                </span>
                <h3 className="text-xl font-bold text-[#111111]">{detailModalItem.name}</h3>
              </div>
              <button onClick={() => setDetailModalItem(null)} className="p-1 rounded bg-zinc-100 text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-2">
                <h4 className="font-bold text-zinc-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#F5A800]" /> Engine & Powertrain
                </h4>
                <p className="text-zinc-600 font-mono">
                  {detailModalItem.engineDetails || 'BS6 Phase 2 Heavy Commercial Powertrain'}
                </p>
              </div>

              {detailModalItem.specifications && (
                <div className="space-y-2">
                  <h4 className="font-bold text-zinc-900">Technical Specifications</h4>
                  <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-3 rounded-lg border border-zinc-200 font-mono text-[11px]">
                    {Object.entries(detailModalItem.specifications).map(([key, val]) => (
                      <div key={key}>
                        <span className="text-zinc-400 capitalize">{key}:</span>
                        <span className="font-semibold text-zinc-800 ml-1">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-100 flex justify-end gap-2">
              <button
                onClick={() => setDetailModalItem(null)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setQuotationModalItem(detailModalItem);
                  setDetailModalItem(null);
                }}
                className="px-4 py-2 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg"
              >
                Request Quotation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Request Formal Quotation Form */}
      {quotationModalItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 border border-zinc-200 shadow-2xl">
            <div className="flex items-start justify-between border-b border-zinc-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-[#F5A800] uppercase">Official Quotation Request</span>
                <h3 className="text-lg font-bold text-[#111111]">{quotationModalItem.name}</h3>
              </div>
              <button onClick={() => setQuotationModalItem(null)} className="p-1 rounded bg-zinc-100 text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequestQuotationSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Fulfilling Dealership Branch</label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-zinc-300 text-xs text-zinc-900 bg-zinc-50"
                  required
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city || 'Dealership Hub'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Required Fleet Units</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-lg border border-zinc-300 text-xs text-zinc-900 bg-zinc-50"
                />
              </div>

              {/* Price Calculation Summary */}
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-2 font-mono">
                <div className="flex justify-between text-zinc-600">
                  <span>Unit Base Price:</span>
                  <span>₹{Number(quotationModalItem.basePrice).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>GST @ 28%:</span>
                  <span>₹{(Number(quotationModalItem.basePrice) * 0.28).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[#111111] font-bold border-t border-zinc-200 pt-2 text-sm font-sans">
                  <span>Estimated Total per Unit:</span>
                  <span>₹{(Number(quotationModalItem.basePrice) * 1.28).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuotationModalItem(null)}
                  className="px-4 py-2 bg-zinc-100 text-zinc-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#111111] hover:bg-black text-[#F5A800] font-semibold rounded-lg flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Quotation Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Direct Truck Booking Form */}
      {bookingModalItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 border border-zinc-200 shadow-2xl">
            <div className="flex items-start justify-between border-b border-zinc-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-amber-600 uppercase">Reserve Vehicle Order</span>
                <h3 className="text-lg font-bold text-[#111111]">{bookingModalItem.name}</h3>
              </div>
              <button onClick={() => setBookingModalItem(null)} className="p-1 rounded bg-zinc-100 text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBookTruckSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Select Delivery Branch</label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-zinc-300 text-xs text-zinc-900 bg-zinc-50"
                  required
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city || 'Dealership Hub'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-2">
                <span className="text-xs font-bold text-amber-900 block font-mono">Estimated Booking Advance</span>
                <p className="text-2xl font-bold text-[#111111]">
                  ₹{Math.max(10000, Math.round(Number(bookingModalItem.basePrice) * 0.05)).toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-amber-800">
                  Reserves 1 unit with backend transaction. Official quotation and booking agreement generated immediately.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBookingModalItem(null)}
                  className="px-4 py-2 bg-zinc-100 text-zinc-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#111111] hover:bg-black text-[#F5A800] font-semibold rounded-lg flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Reserving...' : 'Proceed to Reserve Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
