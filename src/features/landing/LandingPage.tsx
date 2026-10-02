import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AccountSelectionModal } from '@/features/auth/AccountSelectionModal';
import {
  Truck,
  Building,
  Wrench,
  DollarSign,
  Users,
  Shield,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Layers,
  Sparkles,
  UserCheck,
  Target,
  ShoppingBag,
  FileText,
  CreditCard,
  Package,
} from 'lucide-react';
import heroAsset from '@/assets/hero.png';
import heroEcosystemImage from '@/assets/landing/automotive-ecosystem.png';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#111111] font-sans selection:bg-[#F5A800]/30">
      {/* Account Selection Modal */}
      <AccountSelectionModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />

      {/* Sticky Header Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#111111] flex items-center justify-center font-black text-[#F5A800] text-xl tracking-wider border border-zinc-800 shadow-sm group-hover:bg-black transition-colors">
              T
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-[#111111] uppercase">
                TITAN <span className="text-[#F5A800]">AUTO</span>
              </span>
              <span className="block text-[10px] text-zinc-500 font-mono tracking-wider uppercase">
                Automotive Platform
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-600">
            <button
              onClick={() => handleScrollTo('platform')}
              className="hover:text-[#111111] transition-colors"
            >
              Platform
            </button>
            <button
              onClick={() => handleScrollTo('features')}
              className="hover:text-[#111111] transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => handleScrollTo('how-it-works')}
              className="hover:text-[#111111] transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => handleScrollTo('roles')}
              className="hover:text-[#111111] transition-colors"
            >
              Roles
            </button>
            <button
              onClick={() => handleScrollTo('about')}
              className="hover:text-[#111111] transition-colors"
            >
              About
            </button>
          </nav>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAccountModalOpen(true)}
              className="px-4 py-2 text-xs font-bold text-zinc-800 hover:text-[#111111] transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => setIsAccountModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-[#F5A800] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>Explore Platform</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden bg-gradient-to-b from-[#FFFFFF] via-[#F7F7F5] to-[#FFFFFF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#F5A800] text-xs font-bold uppercase tracking-widest font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                AUTOMOTIVE OPERATIONS PLATFORM
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#111111] leading-[1.1]">
                Run your automotive business from one{' '}
                <span className="text-[#F5A800]">connected platform</span>.
              </h1>

              <p className="text-base sm:text-lg text-zinc-600 leading-relaxed max-w-xl">
                Manage franchises, branches, vehicles, customers, sales and service operations through one unified automotive platform.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  onClick={() => setIsAccountModalOpen(true)}
                  className="px-6 py-3.5 rounded-xl bg-[#111111] hover:bg-black text-[#F5A800] font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <span>Explore Platform</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsAccountModalOpen(true)}
                  className="px-6 py-3.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 border border-[#E5E5E5] font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <span>Sign In</span>
                </button>
              </div>
            </div>

            {/* Right Visual Frame */}
            <motion.div 
              className="lg:col-span-6 relative w-full flex justify-center items-center"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <img
                src={heroEcosystemImage}
                alt="Automotive Ecosystem Operations Platform"
                className="w-full h-auto rounded-2xl shadow-2xl object-contain"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust / Product Statement */}
      <section className="py-16 border-y border-[#E5E5E5] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs font-bold text-[#F5A800] uppercase tracking-widest font-mono">
            ONE CONNECTED AUTOMOTIVE WORKSPACE
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#111111] max-w-3xl mx-auto leading-tight">
            Bring dealership operations together across franchises, branches, vehicles, customers and service.
          </h2>
        </div>
      </section>

      {/* Platform Features Section */}
      <section id="features" className="py-20 bg-[#F7F7F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs font-bold text-[#F5A800] uppercase tracking-widest font-mono">
              PLATFORM CAPABILITIES
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#111111]">
              Everything your automotive operation needs.
            </h2>
            <p className="text-sm sm:text-base text-zinc-500 max-w-2xl mx-auto">
              A connected workspace designed for sales, inventory, service, customers and multi-branch operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="cockpit-card cockpit-card-hover p-8 rounded-2xl bg-white border border-[#E5E5E5] space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[#F5A800]">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#111111]">Vehicle Operations</h3>
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                Manage vehicle inventory, status, identification, location tracking, and complete lifecycle history across all hubs.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="cockpit-card cockpit-card-hover p-8 rounded-2xl bg-white border border-[#E5E5E5] space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[#F5A800]">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#111111]">Sales & CRM</h3>
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                Manage customer relationships, sales leads, follow-ups, custom quotations, and vehicle bookings seamlessly.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="cockpit-card cockpit-card-hover p-8 rounded-2xl bg-white border border-[#E5E5E5] space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[#F5A800]">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#111111]">Service Operations</h3>
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                Manage service appointments, technician job cards, mechanic bay assignments, spare parts requisitions, and service history.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="cockpit-card cockpit-card-hover p-8 rounded-2xl bg-white border border-[#E5E5E5] space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[#F5A800]">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#111111]">Finance & Billing</h3>
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                Streamline payments, vehicle financing applications, insurance policies, and GST tax invoice generation.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="cockpit-card cockpit-card-hover p-8 rounded-2xl bg-white border border-[#E5E5E5] space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[#F5A800]">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#111111]">Branch Management</h3>
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                Supervise franchises, regional branches, employee teams, custom roles, and fine-grained access permissions.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="cockpit-card cockpit-card-hover p-8 rounded-2xl bg-white border border-[#E5E5E5] space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[#F5A800]">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#111111]">Customer Experience</h3>
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                Give vehicle owners direct access to their vehicle records, bookings, payment receipts, and maintenance history.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section (Inspired by reference layout) */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-[#F5A800] uppercase tracking-widest font-mono">
              HOW IT WORKS
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#111111]">
              One connected flow from enquiry to service.
            </h2>
            <p className="text-sm sm:text-base text-zinc-500 max-w-xl mx-auto">
              Onboard vehicles, manage customer journeys, and maintain operational visibility in five streamlined steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {/* Step 1 */}
            <div className="cockpit-card p-6 rounded-2xl border border-[#E5E5E5] bg-white relative space-y-4">
              <span className="text-4xl font-black text-zinc-200 font-mono absolute top-4 right-4">01</span>
              <span className="text-[11px] font-bold text-[#F5A800] uppercase tracking-wider block font-mono">
                STEP 01
              </span>
              <h4 className="text-base font-bold text-[#111111]">Customer Enquiry</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Customer discovers a vehicle model and submits an enquiry through sales channels.
              </p>
            </div>

            {/* Step 2 */}
            <div className="cockpit-card p-6 rounded-2xl border border-[#E5E5E5] bg-white relative space-y-4">
              <span className="text-4xl font-black text-zinc-200 font-mono absolute top-4 right-4">02</span>
              <span className="text-[11px] font-bold text-[#F5A800] uppercase tracking-wider block font-mono">
                STEP 02
              </span>
              <h4 className="text-base font-bold text-[#111111]">Sales & Quotation</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                The sales team manages specifications and prepares customized price quotations.
              </p>
            </div>

            {/* Step 3 */}
            <div className="cockpit-card p-6 rounded-2xl border border-[#E5E5E5] bg-white relative space-y-4">
              <span className="text-4xl font-black text-zinc-200 font-mono absolute top-4 right-4">03</span>
              <span className="text-[11px] font-bold text-[#F5A800] uppercase tracking-wider block font-mono">
                STEP 03
              </span>
              <h4 className="text-base font-bold text-[#111111]">Booking & Delivery</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Booking, payment, finance approval, insurance, PDI and logistics are coordinated.
              </p>
            </div>

            {/* Step 4 */}
            <div className="cockpit-card p-6 rounded-2xl border border-[#E5E5E5] bg-white relative space-y-4">
              <span className="text-4xl font-black text-zinc-200 font-mono absolute top-4 right-4">04</span>
              <span className="text-[11px] font-bold text-[#F5A800] uppercase tracking-wider block font-mono">
                STEP 04
              </span>
              <h4 className="text-base font-bold text-[#111111]">Vehicle Ownership</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                The customer takes delivery and their vehicle profile links directly to their account.
              </p>
            </div>

            {/* Step 5 */}
            <div className="cockpit-card p-6 rounded-2xl border border-[#E5E5E5] bg-white relative space-y-4">
              <span className="text-4xl font-black text-zinc-200 font-mono absolute top-4 right-4">05</span>
              <span className="text-[11px] font-bold text-[#F5A800] uppercase tracking-wider block font-mono">
                STEP 05
              </span>
              <h4 className="text-base font-bold text-[#111111]">Service & Lifecycle</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Service appointments, job cards, spare parts, and maintenance history stay connected.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Operations Section */}
      <section id="platform" className="py-20 bg-[#F7F7F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Visual */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-[#E5E5E5] bg-white p-3 shadow-xl overflow-hidden">
                <img
                  src={heroAsset}
                  alt="Branch Operations Platform"
                  className="w-full h-auto rounded-xl object-cover"
                />
              </div>
            </div>

            {/* Right Operations List */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold text-[#F5A800] uppercase tracking-widest font-mono">
                OPERATIONS CONTROL
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#111111]">
                From branch management to vehicle service.
              </h2>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Consolidate your automotive ecosystem with granular control over inventory, staff, and customer touchpoints.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {[
                  'Multi-branch operations',
                  'Vehicle inventory pool',
                  'Customer 360 lifecycle',
                  'Sales & lead pipeline',
                  'Workshop management',
                  'Spare parts inventory',
                  'Billing & tax invoices',
                  'Reports & analytics',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs font-bold text-zinc-800">
                    <CheckCircle2 className="w-4 h-4 text-[#F5A800] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Access Section */}
      <section id="roles" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-[#F5A800] uppercase tracking-widest font-mono">
              ROLE-BASED WORKSPACES
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#111111]">
              One platform. Different workspaces.
            </h2>
            <p className="text-sm text-zinc-500 max-w-xl mx-auto">
              Every employee, manager, owner, and customer receives tools tailored specifically to their operational responsibilities.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { role: 'Super Admin', desc: 'Global platform control & network auditing.' },
              { role: 'Franchise Owner', desc: 'Franchise revenue, branches & executive metrics.' },
              { role: 'Franchise Manager', desc: 'Regional operations & branch performance.' },
              { role: 'Branch Owner', desc: 'Dealership hub financial & lot inventory management.' },
              { role: 'Branch Manager', desc: 'Daily shift targets, lead conversion & bay loads.' },
              { role: 'Sales Team', desc: 'Customer pipeline, quotations & booking closings.' },
              { role: 'Service / Mechanics', desc: 'Workshop job cards, repair orders & spare parts.' },
              { role: 'Customer', desc: 'Vehicle ownership history, service bookings & receipts.' },
            ].map((item, idx) => (
              <div key={idx} className="cockpit-card p-6 rounded-xl border border-[#E5E5E5] bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#111111]">{item.role}</h4>
                  <span className="w-2 h-2 rounded-full bg-[#F5A800]" />
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Experience Section */}
      <section className="py-20 bg-[#F7F7F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs font-bold text-[#F5A800] uppercase tracking-widest font-mono">
              CUSTOMER PORTAL
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#111111]">
              Your customers stay connected after delivery.
            </h2>
            <p className="text-sm text-zinc-500 max-w-xl mx-auto">
              Provide a digital post-purchase experience that builds customer loyalty and streamlines maintenance appointments.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { icon: Truck, title: 'Vehicle Info' },
              { icon: ShoppingBag, title: 'Bookings' },
              { icon: CreditCard, title: 'Payments' },
              { icon: Wrench, title: 'Service Appointments' },
              { icon: FileText, title: 'Service History' },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="cockpit-card p-6 rounded-xl bg-white border border-[#E5E5E5] text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[#F5A800] mx-auto">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-[#111111]">{item.title}</h4>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final Dark CTA Section */}
      <section className="py-20 bg-[#111111] text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <span className="text-xs font-bold text-[#F5A800] uppercase tracking-widest font-mono">
            AUTOMOTIVE OPERATIONS
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight max-w-3xl mx-auto leading-tight">
            Bring your branches, vehicles and teams together.
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            A single platform for managing the automotive customer and vehicle lifecycle.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#F5A800] hover:bg-amber-500 text-[#111111] font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <span>Sign In to Platform</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="py-12 bg-white border-t border-[#E5E5E5] text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#111111] flex items-center justify-center text-[#F5A800] font-black text-xs">
              T
            </div>
            <span className="font-bold text-[#111111]">TITAN AUTO PLATFORM</span>
          </div>
          <p className="font-mono">© {new Date().getFullYear()} Titan Automotive Operations Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
