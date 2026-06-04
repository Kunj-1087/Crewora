'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Search, Star, CheckCircle, MapPin, Briefcase, ChevronRight, User, AlertCircle,
  Shield, Wrench, Clock, Zap, Hammer, Paintbrush, Flame, Layers, HelpCircle, ArrowRight
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLanguage } from '@/contexts/LanguageContext';
import apiClient from '@crewora/api-client';
import { Worker } from '@crewora/shared';

const TRADES = [
  { id: 'plumber', label: 'Plumber', icon: Wrench, value: 'plumber', color: 'text-blue-600 bg-blue-50' },
  { id: 'electrician', label: 'Electrician', icon: Zap, value: 'electrician', color: 'text-amber-600 bg-amber-50' },
  { id: 'carpenter', label: 'Carpenter', icon: Hammer, value: 'carpenter', color: 'text-orange-600 bg-orange-50' },
  { id: 'painter', label: 'Painter', icon: Paintbrush, value: 'painter', color: 'text-rose-600 bg-rose-50' },
  { id: 'welder', label: 'Welder', icon: Flame, value: 'welder', color: 'text-red-600 bg-red-50' },
  { id: 'other', label: 'Other Trades', icon: Layers, value: 'other', color: 'text-slate-600 bg-slate-50' },
];

export default function ExplorePage() {
  const { user } = useAuthStore();
  const { t } = useLanguage();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listingsRef = useRef<HTMLDivElement>(null);

  const fetchWorkers = async (category: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (category !== 'all') {
        params.tradeCategory = category;
      }
      
      const { data } = await apiClient.get('/workers', { params });
      setWorkers(data.data.workers || []);
    } catch (err: any) {
      console.error('Error fetching experts:', err);
      setError('Could not fetch experts. Showing offline list.');
      setWorkers([
        {
          id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          name: 'Sarah Jenkins',
          phone: '123-456-7890',
          tradeCategories: ['carpenter'] as any,
          bio: 'Certified Master Carpenter specialized in custom furniture, cabinetry, framing, and premium wood finishing.',
          experienceYears: 8,
          city: 'Seattle',
          serviceRadius: 20,
          availability: 'available',
          verificationStatus: 'approved',
          profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
          name: 'David Chen',
          phone: '123-456-7890',
          tradeCategories: ['electrician'] as any,
          bio: 'Master Electrician specialized in smart home installations and commercial wiring upgrades.',
          experienceYears: 10,
          city: 'Bellevue',
          serviceRadius: 15,
          availability: 'available',
          verificationStatus: 'approved',
          profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
          name: 'Elena Rodriguez',
          phone: '123-456-7890',
          tradeCategories: ['plumber'] as any,
          bio: 'Professional plumber with 6+ years experience in drainage, fixture replacements, and emergency leaks.',
          experienceYears: 6,
          city: 'Seattle',
          serviceRadius: 25,
          availability: 'available',
          verificationStatus: 'approved',
          profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers(selectedCategory);
  }, [selectedCategory]);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredWorkers = workers.filter(w => {
    const query = searchQuery.toLowerCase();
    return (
      w.name.toLowerCase().includes(query) || 
      (w.bio && w.bio.toLowerCase().includes(query)) ||
      w.tradeCategories.some(cat => cat.toLowerCase().includes(query)) ||
      w.city.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex-1 flex flex-col bg-white">
      
      {/* ─── Hero Section (Mockup 1) ────────────────────────────────────────── */}
      <section className="relative bg-white pt-10 pb-20 px-6 sm:px-12 lg:px-24 border-b border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0b1528] tracking-tight leading-tight">
              Reliable Pros for Every Job.
            </h1>
            <p className="text-base sm:text-lg text-slate-500 max-w-xl leading-relaxed">
              Connect with verified plumbers, electricians, and tradespeople in your area. Built for industrial precision and immediate trust.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button 
                onClick={() => scrollToSection(listingsRef)}
                className="bg-accent-600 hover:bg-accent-700 text-white font-extrabold text-sm px-6 py-4 rounded-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98 transition-all"
              >
                <span>Find a Pro</span>
                <ArrowRight size={16} />
              </button>
              <Link href="/for-workers" className="border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 font-extrabold text-sm px-6 py-4 rounded-lg flex items-center justify-center transition-all">
                Join as a Worker
              </Link>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-3 pt-4 select-none">
              <div className="flex -space-x-2">
                <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100" alt="Specialist" />
                <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" alt="Specialist" />
                <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100" alt="Specialist" />
              </div>
              <span className="text-xs text-slate-500 font-medium">
                <strong className="text-accent-600">5,000+</strong> Verified Specialists Online
              </span>
            </div>
          </div>

          {/* Right Image Column */}
          <div className="lg:col-span-6 relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-100 bg-slate-550">
              <img 
                src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800" 
                alt="Crewora Tools & Workspace" 
                className="w-full h-auto object-cover max-h-[420px]"
              />
            </div>
            
            {/* Identity Badge Overlay */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl border border-slate-100 p-4 flex items-center gap-3 animate-fadeIn">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Shield size={20} className="fill-blue-100" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-extrabold text-[#0b1528]">Verified Identity</h4>
                <p className="text-[10px] text-slate-400 font-medium">Background Checked Pros</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── Browse by Trade (Mockup 2 Style) ────────────────────────────────── */}
      <section className="bg-slate-50 py-16 px-6 sm:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex justify-between items-end border-b border-slate-200 pb-4">
            <div className="text-left">
              <h2 className="text-2xl font-extrabold text-[#0b1528] tracking-tight">Browse by Trade</h2>
              <p className="text-xs text-slate-500 mt-1">Get matched with specific professionals near you</p>
            </div>
            <button 
              onClick={() => { setSelectedCategory('all'); scrollToSection(listingsRef); }}
              className="text-xs font-bold text-accent-600 hover:text-accent-700 transition-colors"
            >
              View All Trades
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {TRADES.map((trade) => {
              const Icon = trade.icon;
              return (
                <button
                  key={trade.id}
                  onClick={() => { setSelectedCategory(trade.value); scrollToSection(listingsRef); }}
                  className="bg-white hover:bg-accent-50/20 rounded-xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md hover:border-accent-400 transition-all flex flex-col items-center justify-center text-center gap-3.5 group"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${trade.color}`}>
                    <Icon size={20} className="stroke-[2.5]" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 tracking-tight group-hover:text-accent-600 transition-colors">
                    {trade.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Why Crewora Section (Mockup 1) ──────────────────────────────────── */}
      <section className="py-20 px-6 sm:px-12 lg:px-24 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-left">
            <h2 className="text-3xl font-extrabold text-[#0b1528] tracking-tight">Why Crewora</h2>
            <p className="text-xs text-slate-500 mt-1">Industrial-grade trust for your home or business.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Card 1: Verified Pros Only */}
            <div className="lg:col-span-8 bg-slate-50/50 rounded-2xl border border-slate-100 p-8 flex flex-col justify-between text-left space-y-6">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Shield size={20} className="stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-extrabold text-[#0b1528]">Verified Pros Only</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
                  Every specialist undergoes a rigorous multi-step vetting process including identity verification, background checks, and license validation.
                </p>
              </div>
              <div>
                <Link href="#" className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-600 hover:text-accent-700 transition-colors group">
                  <span>Learn about our Trust & Safety</span>
                  <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            {/* Card 2: Simple Tooling (Premium Blue Highlight) */}
            <div className="lg:col-span-4 bg-accent-600 text-white rounded-2xl p-8 flex flex-col justify-between text-left shadow-lg hover:shadow-xl transition-shadow select-none space-y-6">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center">
                  <Wrench size={20} className="stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-extrabold">Simple Tooling</h3>
                <p className="text-sm text-blue-100/90 leading-relaxed">
                  Manage bookings, payments, and messages all in one sturdy dashboard.
                </p>
              </div>
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200">
                Professional Grade
              </div>
            </div>

            {/* Card 3: Reliable Records */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/60 p-8 flex flex-col justify-between text-left space-y-6 shadow-sm">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock size={20} className="stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-extrabold text-[#0b1528]">Reliable Records</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Full history of every walk, repair, and job with photo proof and timestamping.
                </p>
              </div>
            </div>

            {/* Card 4: Electrical Specialists NOW SERVING Banner */}
            <div className="lg:col-span-8 bg-slate-50/50 rounded-2xl border border-slate-100 p-6 flex flex-col sm:flex-row items-center gap-6 text-left shadow-sm">
              <div className="w-full sm:w-44 h-32 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                <img 
                  src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=300" 
                  alt="Certified Electrician" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-2">
                <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
                  Now Serving
                </span>
                <h3 className="text-base font-extrabold text-[#0b1528]">Electrical Specialists</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Find certified electricians for residential and commercial infrastructure needs.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── How it Works (Mockup 1) ────────────────────────────────────────── */}
      <section className="bg-slate-550 py-20 px-6 sm:px-12 lg:px-24 bg-[#E2E8F0]/30 border-b border-slate-100">
        <div className="max-w-7xl mx-auto space-y-12 text-center">
          
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-[#0b1528] tracking-tight">How it Works</h2>
            <p className="text-xs text-slate-500">Start your job in three simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="bg-white rounded-2xl border border-slate-100 p-8 flex flex-col items-center text-center space-y-4 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-slate-50 text-[#0b1528] font-bold text-base flex items-center justify-center shadow-inner border border-slate-200">
                1
              </div>
              <h3 className="font-extrabold text-base text-[#0b1528]">Post</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                Describe your project and set your budget. It takes less than 2 minutes.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl border border-slate-100 p-8 flex flex-col items-center text-center space-y-4 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-slate-50 text-[#0b1528] font-bold text-base flex items-center justify-center shadow-inner border border-slate-200">
                2
              </div>
              <h3 className="font-extrabold text-base text-[#0b1528]">Match</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                Review quotes from verified local pros. Compare ratings and past work.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl border border-slate-100 p-8 flex flex-col items-center text-center space-y-4 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-slate-50 text-[#0b1528] font-bold text-base flex items-center justify-center shadow-inner border border-slate-200">
                3
              </div>
              <h3 className="font-extrabold text-base text-[#0b1528]">Work</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                Hire with a tap. Pay securely through Crewora only when the job is done.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ─── Search & Workers Feed (Interactive Integration) ────────────────── */}
      <section ref={listingsRef} className="py-20 px-6 sm:px-12 lg:px-24 bg-white scroll-mt-16">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold text-[#0b1528]">Discover Verified Professionals</h2>
            <p className="text-xs text-slate-500">Search and filter active pros in your vicinity</p>
          </div>

          {/* Search Header Container */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            
            {/* Search Input */}
            <div className="relative flex items-center">
              <span className="absolute left-4 text-slate-400">
                <Search size={18} />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by name, trade or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm text-[#0b1528] placeholder-slate-400 pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all outline-none"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-full text-[11px] font-extrabold tracking-wider whitespace-nowrap transition-all border uppercase ${
                  selectedCategory === 'all'
                    ? 'bg-accent-600 text-white border-accent-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                All Experts
              </button>
              {TRADES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-4 py-2 rounded-full text-[11px] font-extrabold tracking-wider whitespace-nowrap transition-all border uppercase ${
                    selectedCategory === cat.value
                      ? 'bg-accent-600 text-white border-accent-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

          </div>

          {/* Expert Listings Cards */}
          <div className="space-y-4 pt-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((n) => (
                  <div key={n} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                        <div className="h-3 bg-slate-100 rounded w-1/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredWorkers.length === 0 ? (
              <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-2xl px-6">
                <Briefcase size={36} className="text-slate-350 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700">No Experts Found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Try resetting filters or searching for something else.</p>
              </div>
            ) : (
              filteredWorkers.map((worker) => (
                <div 
                  key={worker.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center gap-4 text-left group"
                >
                  <div className="w-14 h-14 rounded-full bg-slate-100 shrink-0 overflow-hidden relative border border-slate-150">
                    {worker.profilePhoto ? (
                      <img 
                        src={worker.profilePhoto} 
                        alt={worker.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-500 font-bold text-sm">
                        <User size={20} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-extrabold text-[#0b1528] text-sm flex items-center gap-1">
                        {worker.name}
                        {worker.verificationStatus === 'approved' && (
                          <CheckCircle size={14} className="text-[#10b981] fill-[#10b981] text-white" />
                        )}
                      </h3>
                      <span className="text-xs font-black text-[#0b1528] whitespace-nowrap bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                        $60 - $120/hr
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 capitalize">{worker.tradeCategories.join(' • ')}</p>
                    
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center gap-0.5">
                        <Star size={11} className="text-amber-500 fill-amber-500" />
                        <span className="font-bold text-slate-700">4.9</span>
                      </span>
                      <span>•</span>
                      <span>{worker.experienceYears || 5} yr exp</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <MapPin size={10} className="text-slate-400" />
                        <span>{worker.city}</span>
                      </span>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto flex justify-end shrink-0 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                    <Link href={`/workers/${worker.id}`} className="text-xs font-extrabold text-accent-600 hover:text-accent-700 transition-colors flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      <span>View Profile</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </section>

      {/* ─── Ready to get started? CTA Banner ────────────────────────────────── */}
      <section className="px-6 sm:px-12 lg:px-24 pb-20 select-none bg-white">
        <div className="max-w-6xl mx-auto bg-[#0b1528] text-white rounded-3xl p-10 md:p-14 text-center relative overflow-hidden shadow-xl border border-slate-800">
          <div className="absolute top-0 right-0 w-36 h-36 bg-accent-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-primary-400/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative space-y-6 max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
              Ready to get started?
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Join thousands of businesses and homeowners using Crewora.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
              <button 
                onClick={() => scrollToSection(listingsRef)}
                className="bg-accent-600 hover:bg-accent-700 text-white font-extrabold text-sm px-6 py-3.5 rounded-xl shadow-md transition-all active:scale-97 border-none outline-none"
              >
                Find a Specialist
              </button>
              <Link href="/worker/register" className="border border-slate-700 hover:border-slate-600 text-white font-extrabold text-sm px-6 py-3.5 rounded-xl flex items-center justify-center transition-all bg-slate-900/40">
                Worker Sign-Up
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
