'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Search, Star, CheckCircle, MapPin, Briefcase, ChevronRight, User,
  Wrench, Zap, Hammer, Paintbrush, Flame, Layers
} from 'lucide-react';
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

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [error, setError] = useState<string | null>(null);

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
    <div className="flex-1 bg-slate-50 py-12 px-6 sm:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Page Title & Subtitle */}
        <div className="text-left space-y-2">
          <h1 className="text-3xl font-extrabold text-[#0b1528] tracking-tight">Find Trusted Professionals</h1>
          <p className="text-sm text-slate-500">Discover and book verified local trade specialists near you</p>
        </div>

        {/* Search Header Container */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          
          {/* Search Input */}
          <div className="relative flex items-center">
            <span className="absolute left-4 text-slate-400">
              <Search size={18} />
            </span>
            <input
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

        {/* Listings Section */}
        <div className="space-y-4">
          {error && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl border border-slate-200/80 p-5 animate-pulse space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-250 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredWorkers.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl px-6 shadow-sm">
              <Briefcase size={40} className="text-slate-350 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Experts Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Try search query adjustments or select a different filter.</p>
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
    </div>
  );
}
