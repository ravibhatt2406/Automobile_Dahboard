import React, { useState, useEffect } from 'react';
import { catalogueService, CatalogVariantItem } from '@/services/catalogue.service';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import {
  Truck,
  Filter,
  Search,
  Store,
  FileText,
  ShoppingBag,
  CheckCircle2,
  X,
  Info,
  Building,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { salesService } from '@/services/sales.service';

export const BrowseTrucksPage: React.FC = () => {
  const navigate = useNavigate();
  const [variants, setVariants] = useState<CatalogVariantItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter States
  const [search, setSearch] = useState<string>('');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('ALL');
  const [selectedFuel, setSelectedFuel] = useState<string>('ALL');
  const [selectedTransmission, setSelectedTransmission] = useState<string>('ALL');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');

  // Modal States
  const [detailModalItem, setDetailModalItem] = useState<CatalogVariantItem | null>(null);
  const [quotationModalItem, setQuotationModalItem] = useState<CatalogVariantItem | null>(null);
  const [bookingModalItem, setBookingModalItem] = useState<CatalogVariantItem | null>(null);

  // Form State for Quotation / Booking
  const [selectedBranchForAction, setSelectedBranchForAction] = useState<string>('br-jaipur');
  const [quantity, setQuantity] = useState<number>(1);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadCatalogue();
  }, [search]);

  const loadCatalogue = async () => {
    setLoading(true);
    try {
      const data = await catalogueService.getVariants(search);
      setVariants(data);
    } catch {
      // Handled gracefully
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
    if (selectedBranch !== 'ALL') {
      const hasBranch = item.availableBranches?.some(
        (b) => b.branchId === selectedBranch || b.branchName.includes(selectedBranch)
      );
      if (!hasBranch) return false;
    }
    return true;
  });

  const handleRequestQuotationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotationModalItem) return;
    setIsSubmitting(true);
    try {
      // Simulate quotation submission
      await new Promise((res) => setTimeout(res, 800));
      setActionSuccessMessage(
        `Quotation requested successfully for ${quotationModalItem.name}! Reference #QT-${Math.floor(
          1000 + Math.random() * 9000
        )}`
      );
      setTimeout(() => {
        setActionSuccessMessage(null);
        setQuotationModalItem(null);
        navigate('/sales/bookings');
      }, 1500);
    } catch {
      // error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookTruckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingModalItem) return;
    setIsSubmitting(true);
    try {
      await new Promise((res) => setTimeout(res, 800));
      setActionSuccessMessage(
        `Booking reserved successfully for ${bookingModalItem.name}! Booking Ref #BK-${Math.floor(
          1000 + Math.random() * 9000
        )}`
      );
      setTimeout(() => {
        setActionSuccessMessage(null);
        setBookingModalItem(null);
        navigate('/sales/bookings');
      }, 1500);
    } catch {
      // error
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
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Search & Filter Controls Toolbar */}
      <div className="cockpit-card p-4 rounded-xl border border-[#E5E5E5] bg-white space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-2 relative">
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
              <option value="Ashok Leyland">Ashok Leyland</option>
              <option value="Tata Motors">Tata Motors</option>
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

          {/* Branch Availability Filter */}
          <div>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#F5A800]"
            >
              <option value="ALL">All Dealership Branches</option>
              <option value="br-jaipur">Jaipur Branch</option>
              <option value="br-jodhpur">Jodhpur Branch</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      {loading ? (
        <LoadingState label="Loading commercial vehicle inventory..." />
      ) : filteredVariants.length === 0 ? (
        <EmptyState
          title="No commercial trucks matched your search criteria"
          description="Try clearing your manufacturer or branch filters to discover available vehicles."
          actionLabel="Reset Filters"
          onAction={() => {
            setSearch('');
            setSelectedManufacturer('ALL');
            setSelectedFuel('ALL');
            setSelectedBranch('ALL');
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
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80';
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-xs text-[#F5A800] text-[10px] font-mono font-bold px-2.5 py-1 rounded uppercase tracking-wider border border-amber-500/30">
                    {item.manufacturerName || 'Ashok Leyland'}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-emerald-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-xs">
                    In Stock
                  </div>
                </div>

                {/* Truck Body Information */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-[#111111] leading-snug group-hover:text-[#F5A800] transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{item.description}</p>
                  </div>

                  {/* Specifications Pills */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                    <div>
                      <span className="text-[10px] uppercase text-zinc-400 block font-sans">Engine</span>
                      <span className="font-semibold text-zinc-800 truncate block">{item.engineDetails || 'BS6 Diesel'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-zinc-400 block font-sans">Power</span>
                      <span className="font-semibold text-zinc-800 block">{item.horsepower ? `${item.horsepower} HP` : '250 HP'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-zinc-400 block font-sans">Payload</span>
                      <span className="font-semibold text-zinc-800 block">{item.payload ? `${(item.payload / 1000).toFixed(1)} Tons` : '34 Tons'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-zinc-400 block font-sans">Transmission</span>
                      <span className="font-semibold text-zinc-800 capitalize block">{item.transmission || 'Manual'}</span>
                    </div>
                  </div>

                  {/* Branch Availability */}
                  <div className="border-t border-dashed border-zinc-200 pt-3">
                    <div className="text-[11px] font-semibold text-zinc-500 flex items-center gap-1.5 mb-1.5 font-mono uppercase tracking-wider">
                      <Store className="w-3.5 h-3.5 text-[#F5A800]" /> Branch Stock Location
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.availableBranches?.map((branch) => (
                        <span
                          key={branch.branchId}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-[11px] text-zinc-800 font-medium"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {branch.branchName}: <strong className="text-zinc-900">{branch.count} available</strong>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Price & Action Buttons */}
                  <div className="pt-2 border-t border-[#E5E5E5] flex flex-col gap-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-mono">
                        Ex-Showroom Starting Price
                      </span>
                      <span className="text-xl font-bold text-[#111111]">{basePriceFormatted}</span>
                      <span className="text-[10px] text-zinc-400 block">+ GST @ {item.gstRate || 28}% applicable</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setQuotationModalItem(item)}
                        className="w-full py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-zinc-200"
                      >
                        <FileText className="w-3.5 h-3.5 text-zinc-700" /> Request Quote
                      </button>
                      <button
                        onClick={() => setBookingModalItem(item)}
                        className="w-full py-2 px-3 bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" /> Book Truck
                      </button>
                    </div>

                    <button
                      onClick={() => setDetailModalItem(item)}
                      className="w-full text-center text-xs text-zinc-500 hover:text-zinc-900 font-medium py-1"
                    >
                      View Full Specifications & Details →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Truck Detail Specification View */}
      {detailModalItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto border border-zinc-200 shadow-2xl">
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-[#F5A800] uppercase tracking-wider">
                  {detailModalItem.manufacturerName} • {detailModalItem.modelName}
                </span>
                <h2 className="text-xl font-bold text-[#111111] mt-0.5">{detailModalItem.name}</h2>
              </div>
              <button
                onClick={() => setDetailModalItem(null)}
                className="p-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-zinc-700">
              <img
                src={detailModalItem.images?.[0]}
                alt={detailModalItem.name}
                className="w-full h-56 object-cover rounded-xl border border-zinc-200"
              />
              <p className="text-sm text-zinc-600 leading-relaxed">{detailModalItem.description}</p>

              <h4 className="font-bold text-zinc-900 text-sm uppercase tracking-wider font-mono border-b pb-1">
                Technical Specifications
              </h4>
              <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-4 rounded-xl border border-zinc-200 font-mono">
                <div>
                  <span className="text-zinc-400 block text-[10px]">Engine Specs</span>
                  <span className="font-semibold text-zinc-900">{detailModalItem.engineDetails}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px]">Horsepower</span>
                  <span className="font-semibold text-zinc-900">{detailModalItem.horsepower} HP</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px]">Payload Capacity</span>
                  <span className="font-semibold text-zinc-900">{(Number(detailModalItem.payload) / 1000).toFixed(1)} Tons</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px]">Fuel & Transmission</span>
                  <span className="font-semibold text-zinc-900 capitalize">
                    {detailModalItem.fuelType} • {detailModalItem.transmission}
                  </span>
                </div>
              </div>

              <h4 className="font-bold text-zinc-900 text-sm uppercase tracking-wider font-mono border-b pb-1 pt-2">
                Available Franchised Dealerships
              </h4>
              <div className="space-y-2">
                {detailModalItem.availableBranches?.map((b) => (
                  <div key={b.branchId} className="flex justify-between items-center p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <span className="font-semibold text-zinc-900 flex items-center gap-2">
                      <Store className="w-4 h-4 text-[#F5A800]" /> {b.branchName}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      {b.count} Units In Stock
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3">
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
                  value={selectedBranchForAction}
                  onChange={(e) => setSelectedBranchForAction(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-zinc-300 text-xs text-zinc-900 bg-zinc-50"
                >
                  <option value="br-jaipur">Jaipur Branch (3 units available)</option>
                  <option value="br-jodhpur">Jodhpur Branch (1 unit available)</option>
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
                  <span>Unit Ex-Showroom Base:</span>
                  <span>₹{Number(quotationModalItem.basePrice).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>GST @ 28%:</span>
                  <span>₹{(Number(quotationModalItem.basePrice) * 0.28).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Insurance & Registration (Est.):</span>
                  <span>₹1,50,000</span>
                </div>
                <div className="flex justify-between text-[#111111] font-bold border-t border-zinc-200 pt-2 text-sm font-sans">
                  <span>Estimated Total per Unit:</span>
                  <span>₹{(Number(quotationModalItem.basePrice) * 1.28 + 150000).toLocaleString('en-IN')}</span>
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
                  {isSubmitting ? 'Generating...' : 'Submit Quotation Request'}
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
                <span className="text-xs font-mono font-bold text-amber-600 uppercase">Reserve Vehicle</span>
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
                  value={selectedBranchForAction}
                  onChange={(e) => setSelectedBranchForAction(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-zinc-300 text-xs text-zinc-900 bg-zinc-50"
                >
                  <option value="br-jaipur">Jaipur Branch</option>
                  <option value="br-jodhpur">Jodhpur Branch</option>
                </select>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-2">
                <span className="text-xs font-bold text-amber-900 block font-mono">Booking Advance Amount</span>
                <p className="text-2xl font-bold text-[#111111]">₹1,00,000</p>
                <p className="text-[11px] text-amber-800">
                  Reserves 1 unit for 14 calendar days. Full quotation & invoice will be generated upon confirmation.
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
