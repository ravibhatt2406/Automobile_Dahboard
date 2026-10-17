import React, { useState, useEffect } from 'react';
import { vehicleService, BrowseVehicleItem, EquivalentBranchItem } from '@/services/vehicle.service';
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
  MapPin,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { salesService } from '@/services/sales.service';
import { useAuth } from '@/app/providers/AuthContext';
import { Branch } from '@/types/domain';

export const BrowseTrucksPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Inventory & Filter Data
  const [vehicles, setVehicles] = useState<BrowseVehicleItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Pagination & Counts
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(12);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Filter States
  const [search, setSearch] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('ALL');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('ALL');

  // Modal States
  const [detailModalItem, setDetailModalItem] = useState<BrowseVehicleItem | null>(null);
  const [quotationModalItem, setQuotationModalItem] = useState<BrowseVehicleItem | null>(null);
  const [bookingModalItem, setBookingModalItem] = useState<BrowseVehicleItem | null>(null);

  // Equivalent Branches Drawer / Modal
  const [equivalentModalItem, setEquivalentModalItem] = useState<BrowseVehicleItem | null>(null);
  const [equivalentBranches, setEquivalentBranches] = useState<EquivalentBranchItem[]>([]);
  const [loadingEquivalents, setLoadingEquivalents] = useState<boolean>(false);

  // Quotation / Booking Form States
  const [modalBranchId, setModalBranchId] = useState<string>('');
  const [modalVehicleId, setModalVehicleId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load Active Branches to populate dropdowns
  useEffect(() => {
    async function loadActiveBranches() {
      try {
        const activeBranches = await branchService.getPublicActiveBranches();
        setBranches(activeBranches);

        // Derive unique cities
        const uniqueCities = Array.from(
          new Set(activeBranches.map((b) => b.city).filter(Boolean))
        ).sort();
        setCities(uniqueCities);
      } catch (err) {
        console.error('Failed to load branches:', err);
      }
    }
    loadActiveBranches();
  }, []);

  // Fetch Inventory from real backend endpoint
  const loadInventory = async () => {
    setLoading(true);
    setPageError(null);

    // Calculate price bounds
    let minPrice: number | undefined;
    let maxPrice: number | undefined;

    if (selectedPriceRange === 'UNDER_20L') {
      maxPrice = 2000000;
    } else if (selectedPriceRange === '20L_35L') {
      minPrice = 2000000;
      maxPrice = 3500000;
    } else if (selectedPriceRange === '35L_50L') {
      minPrice = 3500000;
      maxPrice = 5000000;
    } else if (selectedPriceRange === 'ABOVE_50L') {
      minPrice = 5000000;
    }

    try {
      const res = await vehicleService.browseVehicles({
        search: search.trim() || undefined,
        city: selectedCity !== 'ALL' ? selectedCity : undefined,
        branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        status: selectedAvailability !== 'ALL' ? selectedAvailability : undefined,
        minPrice,
        maxPrice,
        page,
        pageSize,
      });

      setVehicles(res.items);
      setTotalItems(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      setPageError(err.message || 'Failed to load real-time branch inventory.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch on filter or page change
  useEffect(() => {
    loadInventory();
  }, [
    page,
    selectedCity,
    selectedBranchId,
    selectedCategory,
    selectedAvailability,
    selectedPriceRange,
  ]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadInventory();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle City change: if city changes, filter branch choices or reset branch if mismatch
  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSelectedBranchId('ALL');
    setPage(1);
  };

  // Reset all filters
  const handleClearFilters = () => {
    setSearch('');
    setSelectedCity('ALL');
    setSelectedBranchId('ALL');
    setSelectedCategory('ALL');
    setSelectedAvailability('ALL');
    setSelectedPriceRange('ALL');
    setPage(1);
  };

  const isFilterActive =
    search.trim() !== '' ||
    selectedCity !== 'ALL' ||
    selectedBranchId !== 'ALL' ||
    selectedCategory !== 'ALL' ||
    selectedAvailability !== 'ALL' ||
    selectedPriceRange !== 'ALL';

  // Branches filtered by selected city
  const filteredBranches = selectedCity === 'ALL'
    ? branches
    : branches.filter((b) => b.city?.toLowerCase() === selectedCity.toLowerCase());

  // Check equivalent branches for a variant
  const handleOpenEquivalents = async (item: BrowseVehicleItem) => {
    setEquivalentModalItem(item);
    setLoadingEquivalents(true);
    try {
      const eq = await vehicleService.getEquivalentBranches(item.variantId);
      setEquivalentBranches(eq);
    } catch (err) {
      console.error('Failed to load equivalent branch inventory:', err);
      setEquivalentBranches([]);
    } finally {
      setLoadingEquivalents(false);
    }
  };

  // Open Quotation modal with preselected item
  const handleOpenQuotation = (item: BrowseVehicleItem) => {
    setQuotationModalItem(item);
    setModalBranchId(item.branchId);
    setModalVehicleId(item.id);
    setQuantity(1);
    setActionErrorMessage(null);
  };

  // Open Booking modal with preselected item
  const handleOpenBooking = (item: BrowseVehicleItem) => {
    if (!item.isAvailable) {
      setActionErrorMessage(`Vehicle is currently ${item.availabilityLabel}. Only available units can be booked.`);
      return;
    }
    setBookingModalItem(item);
    setModalBranchId(item.branchId);
    setModalVehicleId(item.id);
    setActionErrorMessage(null);
  };

  // Submit Quotation Request
  const handleRequestQuotationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotationModalItem) return;

    if (!isAuthenticated) {
      navigate('/login/customer');
      return;
    }

    const branchToUse = modalBranchId || quotationModalItem.branchId;
    if (!branchToUse) {
      setActionErrorMessage('Please select a valid dealership branch for your quotation.');
      return;
    }

    setIsSubmitting(true);
    setActionErrorMessage(null);
    setActionSuccessMessage(null);

    try {
      const created = await salesService.createQuotation({
        variantId: quotationModalItem.variantId,
        vehicleId: modalVehicleId || quotationModalItem.id,
        branchId: branchToUse,
        quantity,
        accessoriesAmount: 0,
        insuranceAmount: 0,
        discountAmount: 0,
      });

      setActionSuccessMessage(
        `Quotation requested successfully for ${quotationModalItem.name}! Quotation Ref #${created.quotationNumber} assigned to ${quotationModalItem.branchName}.`
      );
      setQuotationModalItem(null);
    } catch (err: any) {
      setActionErrorMessage(err.message || 'Failed to submit quotation request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Vehicle Booking
  const handleBookTruckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingModalItem) return;

    if (!isAuthenticated) {
      navigate('/login/customer');
      return;
    }

    const branchToUse = modalBranchId || bookingModalItem.branchId;
    const vehicleToUse = modalVehicleId || bookingModalItem.id;

    if (!branchToUse) {
      setActionErrorMessage('Please select a valid dealership branch for your reservation.');
      return;
    }

    setIsSubmitting(true);
    setActionErrorMessage(null);
    setActionSuccessMessage(null);

    try {
      // Create quote then create booking tied to the real vehicle and branch
      const quote = await salesService.createQuotation({
        variantId: bookingModalItem.variantId,
        vehicleId: vehicleToUse,
        branchId: branchToUse,
        quantity: 1,
      });

      const depositAmount = Math.max(
        10000,
        Math.round(Number(quote.totalAmount || bookingModalItem.price) * 0.05)
      );

      const booking = await salesService.createBooking({
        quotationId: quote.id,
        vehicleId: vehicleToUse,
        branchId: branchToUse,
        bookingAmount: depositAmount,
      });

      setActionSuccessMessage(
        `Booking reserved successfully for ${bookingModalItem.name}! Booking Ref #${booking.bookingNumber} at ${bookingModalItem.branchName}.`
      );
      setBookingModalItem(null);

      // Refresh inventory so reserved status reflects immediately
      loadInventory();
    } catch (err: any) {
      setActionErrorMessage(err.message || 'Failed to reserve vehicle booking.');
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
            <Truck className="w-4 h-4 text-[#F5A800]" /> Commercial Fleet Inventory
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mt-1">
            Browse Dealership Trucks
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Live physical vehicle stock across authorized Titan Auto franchised dealership branches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/customer/chat"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-lg transition-colors border border-zinc-200"
          >
            <MessageSquare className="w-4 h-4 text-[#F5A800]" /> Dealership Chat Desk
          </Link>
        </div>
      </div>

      {/* Success Notification Alert */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Notification Alert */}
      {actionErrorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{actionErrorMessage}</span>
          </div>
          <button
            onClick={() => setActionErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Real Filter & Search Toolbar */}
      <div className="cockpit-card p-4 rounded-xl border border-[#E5E5E5] bg-white space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-800">
            <Filter className="w-3.5 h-3.5 text-[#F5A800]" />
            <span>Branch Inventory Filters</span>
          </div>
          {isFilterActive && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Search Query */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search model, variant, specs..."
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#F5A800] focus:ring-1 focus:ring-[#F5A800]"
            />
          </div>

          {/* City Filter */}
          <div>
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#F5A800]"
            >
              <option value="ALL">All Cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <select
              value={selectedBranchId}
              onChange={(e) => {
                setSelectedBranchId(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#F5A800]"
            >
              <option value="ALL">All Branches</option>
              {filteredBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.city || 'Hub'})
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div>
            <select
              value={selectedAvailability}
              onChange={(e) => {
                setSelectedAvailability(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#F5A800]"
            >
              <option value="ALL">All Stock Statuses</option>
              <option value="IN_STOCK">Available (In Stock)</option>
              <option value="RESERVED">Reserved Units</option>
              <option value="SOLD">Sold Units</option>
            </select>
          </div>

          {/* Price Range Filter */}
          <div>
            <select
              value={selectedPriceRange}
              onChange={(e) => {
                setSelectedPriceRange(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#F5A800]"
            >
              <option value="ALL">All Price Ranges</option>
              <option value="UNDER_20L">Under ₹20 Lakh</option>
              <option value="20L_35L">₹20 Lakh – ₹35 Lakh</option>
              <option value="35L_50L">₹35 Lakh – ₹50 Lakh</option>
              <option value="ABOVE_50L">Above ₹50 Lakh</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Results Count */}
      <div className="flex items-center justify-between text-xs text-zinc-500 px-1 font-mono">
        <span>
          Showing <strong>{vehicles.length}</strong> of <strong>{totalItems}</strong> matching commercial trucks
        </span>
        {selectedBranchId !== 'ALL' && (
          <span className="text-[#F5A800] font-semibold flex items-center gap-1 font-sans">
            <Building className="w-3.5 h-3.5" /> Filtered by specific branch
          </span>
        )}
      </div>

      {/* Main Grid Content */}
      {loading ? (
        <LoadingState label="Querying physical branch inventory..." />
      ) : pageError ? (
        <ErrorState
          title="Failed to Load Inventory"
          message={pageError}
          onRetry={loadInventory}
        />
      ) : vehicles.length === 0 ? (
        <EmptyState
          title="No commercial trucks matched your criteria"
          description="Try broadening your city or branch filter, or select All Branches to see inventory nationwide."
          actionLabel="Clear Filters"
          onAction={handleClearFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {vehicles.map((item) => {
            const priceFormatted = new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 0,
            }).format(Number(item.price));

            const isAvailable = item.isAvailable;
            const isReserved = item.availability === 'RESERVED';

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
                  {/* Manufacturer Badge */}
                  <div className="absolute top-3 left-3 bg-[#111111]/90 backdrop-blur-xs px-2.5 py-1 rounded text-[10px] font-mono font-bold text-[#F5A800] tracking-wider uppercase border border-zinc-700">
                    {item.manufacturerName || 'Ashok Leyland'}
                  </div>

                  {/* Availability Badge */}
                  <div className="absolute top-3 right-3">
                    {isAvailable ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500 text-white shadow-xs">
                        ● Available
                      </span>
                    ) : isReserved ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-white shadow-xs">
                        ● Reserved
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-zinc-700 text-zinc-200 shadow-xs">
                        ● {item.availabilityLabel}
                      </span>
                    )}
                  </div>

                  {/* Branch Pill Tag */}
                  <div className="absolute bottom-3 left-3 bg-black/85 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] font-medium text-white flex items-center gap-1 border border-zinc-700">
                    <MapPin className="w-3 h-3 text-[#F5A800]" />
                    <span>
                      {item.branchName} ({item.branchCity})
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono mb-1">
                      <span>{item.modelCategory}</span>
                      <span>Mfg {item.manufacturingYear}</span>
                    </div>
                    <h3 className="font-bold text-base text-[#111111] group-hover:text-[#F5A800] transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                      {item.description ||
                        'Heavy commercial haulage vehicle engineered for extreme payload efficiency and minimum maintenance downtime.'}
                    </p>
                  </div>

                  {/* Spec Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                    <div>
                      <span className="text-zinc-400 block">Payload:</span>
                      <span className="font-semibold text-zinc-800">
                        {item.payload ? `${(item.payload / 1000).toFixed(1)} Tonnes` : 'Heavy Duty'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Power:</span>
                      <span className="font-semibold text-zinc-800">
                        {item.horsepower ? `${item.horsepower} HP` : 'Commercial BS6'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Fuel:</span>
                      <span className="font-semibold text-zinc-800 uppercase">
                        {item.fuelType || 'Diesel'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Transmission:</span>
                      <span className="font-semibold text-zinc-800 capitalize">
                        {item.transmission || 'Manual'}
                      </span>
                    </div>
                  </div>

                  {/* Equivalent Branches Prompt */}
                  <button
                    type="button"
                    onClick={() => handleOpenEquivalents(item)}
                    className="w-full py-1.5 px-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors border border-zinc-200"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#F5A800]" /> Check Equivalent Branch Stock
                  </button>

                  {/* Price Row */}
                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                        Ex-Showroom Price
                      </span>
                      <span className="text-lg font-bold text-[#111111]">{priceFormatted}</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">+28% GST</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    <button
                      onClick={() => setDetailModalItem(item)}
                      className="px-2 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors"
                      title="Technical Specifications"
                    >
                      <Info className="w-3.5 h-3.5" /> Specs
                    </button>

                    <Link
                      to={`/customer/chat?branchId=${item.branchId}&subject=${encodeURIComponent(
                        `Inquiry regarding ${item.name} at ${item.branchName}`
                      )}`}
                      className="px-2 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors"
                      title="Chat with Branch Advisor"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#F5A800]" /> Chat
                    </Link>

                    <button
                      onClick={() => handleOpenQuotation(item)}
                      className="px-2 py-2 bg-zinc-900 hover:bg-black text-[#F5A800] text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors shadow-xs"
                    >
                      Quote
                    </button>

                    <button
                      onClick={() => handleOpenBooking(item)}
                      disabled={!isAvailable}
                      className={`px-2 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors shadow-xs ${
                        isAvailable
                          ? 'bg-[#F5A800] hover:bg-[#e09800] text-[#111111]'
                          : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                      }`}
                      title={isAvailable ? 'Reserve Vehicle' : 'Vehicle currently unavailable'}
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 pt-4 text-xs font-mono">
          <span className="text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 flex items-center gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: Detail Technical Specs Modal */}
      {detailModalItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 border border-zinc-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-zinc-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-[#F5A800] uppercase">
                  {detailModalItem.manufacturerName} • {detailModalItem.modelCategory}
                </span>
                <h3 className="text-xl font-bold text-[#111111]">{detailModalItem.name}</h3>
                <span className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" /> Stock Location: {detailModalItem.branchName} ({detailModalItem.branchCity})
                </span>
              </div>
              <button
                onClick={() => setDetailModalItem(null)}
                className="p-1 rounded bg-zinc-100 text-zinc-600 hover:text-zinc-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-2">
                <h4 className="font-bold text-zinc-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#F5A800]" /> Heavy Duty Powertrain & Chassis
                </h4>
                <p className="text-zinc-600 font-mono">
                  Engine: {detailModalItem.horsepower || 250} HP Turbocharged Intercooled • Transmission: {detailModalItem.transmission || 'Synchromesh'} • Fuel: {detailModalItem.fuelType}
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
                  handleOpenQuotation(detailModalItem);
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

      {/* MODAL 2: Equivalent Branch Inventory Selection */}
      {equivalentModalItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 border border-zinc-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-zinc-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-[#F5A800] uppercase">
                  Multi-Branch Availability
                </span>
                <h3 className="text-lg font-bold text-[#111111]">{equivalentModalItem.name}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Branches currently holding live in-stock inventory for this exact model.
                </p>
              </div>
              <button
                onClick={() => setEquivalentModalItem(null)}
                className="p-1 rounded bg-zinc-100 text-zinc-600 hover:text-zinc-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingEquivalents ? (
              <LoadingState label="Checking equivalent branch inventory..." />
            ) : equivalentBranches.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 bg-zinc-50 rounded-xl border border-zinc-200">
                <Truck className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <p className="font-semibold text-zinc-700">No other branches have this model in stock right now.</p>
                <p className="mt-1">
                  Currently available primarily at <strong>{equivalentModalItem.branchName}</strong> ({equivalentModalItem.branchCity}).
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {equivalentBranches.map((eq) => (
                  <div
                    key={eq.branch.id}
                    className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs hover:border-[#F5A800] transition-colors"
                  >
                    <div>
                      <span className="font-bold text-zinc-900 block text-sm">
                        {eq.branch.name}
                      </span>
                      <span className="text-zinc-500 flex items-center gap-1 font-mono text-[11px] mt-0.5">
                        <MapPin className="w-3 h-3 text-[#F5A800]" /> {eq.branch.city}, {eq.branch.state}
                      </span>
                      <span className="text-emerald-700 font-semibold font-mono text-[11px] mt-1 block">
                        ● {eq.availableCount} {eq.availableCount === 1 ? 'unit' : 'units'} ready for delivery
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="font-bold text-zinc-900 font-mono text-sm">
                        ₹{eq.minPrice.toLocaleString('en-IN')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/customer/chat?branchId=${eq.branch.id}&subject=${encodeURIComponent(
                            `Inquiry about ${equivalentModalItem.name} at ${eq.branch.name}`
                          )}`}
                          className="px-2.5 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-semibold rounded-lg flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3 text-[#F5A800]" /> Chat
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setQuotationModalItem({
                              ...equivalentModalItem,
                              branchId: eq.branch.id,
                              branchName: eq.branch.name,
                              branchCity: eq.branch.city,
                              id: eq.sampleVehicleId,
                            });
                            setModalBranchId(eq.branch.id);
                            setModalVehicleId(eq.sampleVehicleId);
                            setEquivalentModalItem(null);
                          }}
                          className="px-2.5 py-1.5 bg-[#111111] hover:bg-black text-[#F5A800] font-semibold rounded-lg flex items-center gap-1"
                        >
                          Select <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setEquivalentModalItem(null)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-lg text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Request Formal Quotation Form */}
      {quotationModalItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 border border-zinc-200 shadow-2xl">
            <div className="flex items-start justify-between border-b border-zinc-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-[#F5A800] uppercase">
                  Official Dealership Quotation Request
                </span>
                <h3 className="text-lg font-bold text-[#111111]">{quotationModalItem.name}</h3>
                <span className="text-xs text-zinc-500 font-mono">
                  Fulfilling Branch: {quotationModalItem.branchName} ({quotationModalItem.branchCity})
                </span>
              </div>
              <button
                onClick={() => setQuotationModalItem(null)}
                className="p-1 rounded bg-zinc-100 text-zinc-600 hover:text-zinc-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequestQuotationSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Assigned Dealership Branch
                </label>
                <select
                  value={modalBranchId}
                  onChange={(e) => setModalBranchId(e.target.value)}
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
                  max="20"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-lg border border-zinc-300 text-xs text-zinc-900 bg-zinc-50"
                />
              </div>

              {/* Price Calculation Summary */}
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-2 font-mono">
                <div className="flex justify-between text-zinc-600">
                  <span>Unit Base Price:</span>
                  <span>₹{Number(quotationModalItem.price).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>GST @ 28%:</span>
                  <span>₹{(Number(quotationModalItem.price) * 0.28).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[#111111] font-bold border-t border-zinc-200 pt-2 text-sm font-sans">
                  <span>Estimated Total per Unit:</span>
                  <span>₹{(Number(quotationModalItem.price) * 1.28).toLocaleString('en-IN')}</span>
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

      {/* MODAL 4: Direct Truck Booking Form */}
      {bookingModalItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 border border-zinc-200 shadow-2xl">
            <div className="flex items-start justify-between border-b border-zinc-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-amber-600 uppercase">
                  Reserve Vehicle Order
                </span>
                <h3 className="text-lg font-bold text-[#111111]">{bookingModalItem.name}</h3>
                <span className="text-xs text-zinc-500 font-mono">
                  Holding Branch: {bookingModalItem.branchName} ({bookingModalItem.branchCity})
                </span>
              </div>
              <button
                onClick={() => setBookingModalItem(null)}
                className="p-1 rounded bg-zinc-100 text-zinc-600 hover:text-zinc-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBookTruckSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Delivery Branch</label>
                <select
                  value={modalBranchId}
                  onChange={(e) => setModalBranchId(e.target.value)}
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
                <span className="text-xs font-bold text-amber-900 block font-mono">
                  Estimated Booking Advance
                </span>
                <p className="text-2xl font-bold text-[#111111]">
                  ₹
                  {Math.max(
                    10000,
                    Math.round(Number(bookingModalItem.price) * 0.05)
                  ).toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-amber-800">
                  Reserves this specific unit at {bookingModalItem.branchName}. Official quotation and
                  booking agreement are generated immediately with branch confirmation.
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
