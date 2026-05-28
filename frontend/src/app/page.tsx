'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Search, Star, CheckCircle, MapPin, Briefcase, ChevronRight, User, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/api/client';
import { Worker } from '@/types';

const CATEGORIES = [
  { id: 'all', label: 'ALL EXPERTS', apiValue: '' },
  { id: 'plumbing', label: 'PLUMBING', apiValue: 'plumber' },
  { id: 'electrician', label: 'ELECTRICIAN', apiValue: 'electrician' },
  { id: 'carpentry', label: 'CARPENTRY', apiValue: 'carpenter' },
  { id: 'painting', label: 'PAINTING', apiValue: 'painter' },
  { id: 'masonry', label: 'MASONRY', apiValue: 'mason' },
  { id: 'hvac', label: 'HVAC', apiValue: 'hvac' },
  { id: 'roofing', label: 'ROOFING', apiValue: 'roofer' },
];

export default function ExplorePage() {
  const { user } = useAuthStore();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('focusSearch') === 'true' && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  }, []);

  const fetchWorkers = async (category: string) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch from public discover workers API
      const apiCat = CATEGORIES.find(c => c.id === category)?.apiValue || '';
      const params: Record<string, string> = {};
      if (apiCat) {
        params.tradeCategory = apiCat;
      }
      
      const { data } = await apiClient.get('/workers', { params });
      // The API returns { success: true, data: { workers: [...], pagination: {...} } }
      setWorkers(data.data.workers || []);
    } catch (err: any) {
      console.error('Error fetching experts:', err);
      setError('Could not fetch experts. Showing offline list.');
      // Fallback local list of experts in case of connection issues
      setWorkers([
        {
          id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          name: 'Sarah Jenkins',
          phone: '123-456-7890',
          tradeCategories: ['carpenter'] as any,
          bio: 'Certified Master Carpenter specialized in custom furniture, cabinetry, framing, and premium wood finishing.',
          experienceYears: 8,
          city: 'San Francisco',
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
          tradeCategories: ['electrician', 'hvac'] as any,
          bio: 'Master Electrician specialized in smart home installations and commercial wiring upgrades.',
          experienceYears: 10,
          city: 'Boston',
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
          tradeCategories: ['mason', 'tiler'] as any,
          bio: 'Professional Mason and Tiler with 6+ years experience in bathroom tiling, kitchen backsplashes, and stone patio masonry.',
          experienceYears: 6,
          city: 'Miami',
          serviceRadius: 25,
          availability: 'available',
          verificationStatus: 'approved',
          profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a',
          name: 'Marcus Thorne',
          phone: '123-456-7890',
          tradeCategories: ['plumber'] as any,
          bio: 'Licensed Plumbing Expert available for emergency diagnostics, pipe replacements, and leak fixes.',
          experienceYears: 12,
          city: 'Chicago',
          serviceRadius: 30,
          availability: 'available',
          verificationStatus: 'approved',
          profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
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

  // Client-side search filtering
  const filteredWorkers = workers.filter(w => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      w.name.toLowerCase().includes(query) || 
      (w.bio && w.bio.toLowerCase().includes(query)) ||
      w.tradeCategories.some(cat => cat.toLowerCase().includes(query)) ||
      w.city.toLowerCase().includes(query);
    return matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] animate-fadeIn select-none pb-20">
      
      {/* Search Header Container */}
      <div className="px-5 pt-6 pb-2 bg-white border-b border-slate-100 shrink-0">
        <h1 className="text-xl font-extrabold text-[#0b1528] tracking-tight">Explore Experts</h1>
        <p className="text-xs text-slate-500 mt-1 mb-4">Find verified professional talent instantly</p>
        
        {/* Search Bar Input Container */}
        <div className="relative flex items-center mb-4">
          <span className="absolute left-4 text-slate-400">
            <Search size={18} />
          </span>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search for professional services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-sm text-[#0b1528] placeholder-slate-400 pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all outline-none"
          />
        </div>

        {/* Horizontal scrollable category filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-[11px] font-extrabold tracking-wider whitespace-nowrap transition-all duration-150 border uppercase ${
                selectedCategory === cat.id
                  ? 'bg-accent-600 text-white border-accent-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Experts Feed */}
      <div className="px-5 pt-5 space-y-4 flex-1">
        {loading ? (
          <div className="space-y-4">
            {/* Loading skeletons */}
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/4"></div>
                  </div>
                </div>
                <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                <div className="h-3 bg-slate-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 px-6">
            <Briefcase size={40} className="text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No experts found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Try resetting filters or adjusting your search term.</p>
          </div>
        ) : (
          filteredWorkers.map((worker) => {
            const isSarah = worker.name === 'Sarah Jenkins';

            if (isSarah) {
              // Special Layout for Sarah Jenkins: Half-top photo, brand tags
              return (
                <div 
                  key={worker.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                >
                  {/* Half-top Photo */}
                  <div className="h-44 relative bg-slate-100 w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={worker.profilePhoto || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300'} 
                      alt={worker.name} 
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute top-3 right-3 bg-[#0b1528] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Verified Pro
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-[#0b1528] text-base flex items-center gap-1.5">
                          {worker.name}
                          <CheckCircle size={15} className="text-[#10b981] fill-[#10b981] text-white" />
                        </h3>
                        <span className="text-sm font-black text-[#0b1528]">$85/hr</span>
                      </div>
                      
                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                        <Star size={13} className="text-amber-500 fill-amber-500" />
                        <span className="font-bold text-slate-800">4.9</span>
                        <span>•</span>
                        <span>{worker.experienceYears} Years Exp.</span>
                        <span>•</span>
                        <MapPin size={11} className="text-slate-400" />
                        <span>{worker.city}</span>
                      </div>

                      <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                        {worker.bio}
                      </p>

                      {/* Brand tags */}
                      <div className="flex flex-wrap gap-1.5 mt-3.5">
                        {worker.tradeCategories.map((cat) => (
                          <span 
                            key={cat}
                            className="bg-emerald-50 text-[#065f46] text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 mt-4 pt-4 flex justify-end">
                      <Link href={`/workers/${worker.id}`} className="inline-flex items-center gap-1 text-xs font-black text-[#0b1528] hover:text-accent-600 transition-colors">
                        View Profile
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            } else {
              // Standard Layout for other cards: Rounded avatar, row format
              return (
                <div 
                  key={worker.id}
                  className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4"
                >
                  {/* Left: Rounded Avatar */}
                  <div className="w-14 h-14 rounded-full bg-slate-100 shrink-0 overflow-hidden relative border border-slate-100">
                    {worker.profilePhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
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

                  {/* Right: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <h3 className="font-extrabold text-[#0b1528] text-sm flex items-center gap-1">
                          {worker.name}
                          {worker.verificationStatus === 'approved' && (
                            <CheckCircle size={13} className="text-[#10b981] fill-[#10b981] text-white" />
                          )}
                        </h3>
                        <p className="text-[11px] text-slate-400 capitalize">{worker.tradeCategories.join(' • ')}</p>
                      </div>
                      <span className="text-xs font-black text-[#0b1528] whitespace-nowrap">
                        {worker.name.includes('Chen') ? '$65/hr' : worker.name.includes('Rodriguez') ? '$120/hr' : worker.name.includes('Thorne') ? '$90/hr' : worker.name.includes('Sterling') ? '$125/hr' : '$50/hr'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                      <span className="flex items-center gap-0.5">
                        <Star size={11} className="text-amber-500 fill-amber-500" />
                        <span className="font-bold text-slate-700">4.8</span>
                      </span>
                      <span>•</span>
                      <span>{worker.experienceYears || 5} yr exp</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <MapPin size={10} className="text-slate-400" />
                        <span>{worker.city}</span>
                      </span>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <Link href={`/workers/${worker.id}`} className="text-[11px] font-extrabold text-[#0b1528] hover:text-accent-600 transition-colors flex items-center gap-0.5">
                        View Profile
                        <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            }
          })
        )}

        {/* ─── Grow Your Team Banner Card (Deep Navy, Mint Green Button) ────────── */}
        <div className="bg-[#0b1528] rounded-2xl p-6 text-white text-left relative overflow-hidden shadow-md select-none mt-6">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-500/10 rounded-full blur-2xl"></div>
          <div className="relative space-y-3 max-w-[80%]">
            <span className="bg-accent-500/20 text-accent-300 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Recruitment
            </span>
            <h3 className="text-base font-black leading-snug">Grow Your Team</h3>
            <p className="text-[11px] text-slate-300 leading-normal">
              Need custom professional support for specialized engineering or design work? Post a job on our dashboard.
            </p>
            <div className="pt-2">
              <Link href={user ? '/customer/jobs/create' : '/login'}>
                <button className="bg-accent-600 hover:bg-accent-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95 border-none outline-none">
                  Post a Job
                </button>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
