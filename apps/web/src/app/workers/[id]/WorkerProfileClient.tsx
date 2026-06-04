'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Star, MapPin, CheckCircle, Briefcase, Award, ThumbsUp, ShieldCheck, 
  MessageSquare, Calendar, ChevronLeft, Image as ImageIcon, ExternalLink 
} from 'lucide-react';
import apiClient from '@crewora/api-client';
import { useAuthStore } from '@/store/authStore';

// Static mock details mapped by worker ID for rich visual displays (portfolio, reviews, stats)
const WORKERS_PORTFOLIOS: Record<string, {
  rate: string;
  satisfaction: string;
  completedJobs: number;
  awards: string[];
  portfolio: { title: string; image: string }[];
  reviews: { author: string; rating: number; date: string; comment: string }[];
}> = {
  // Sarah Jenkins (Master Carpenter)
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d': {
    rate: '$85/hr',
    satisfaction: '99%',
    completedJobs: 142,
    awards: ['Certified Master Carpenter 2023', 'Excellence in Custom Woodworking'],
    portfolio: [
      { title: 'Custom Mahogany Kitchen Cabinets', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=250' },
      { title: 'Solid Oak Dining Table Crafting', image: 'https://images.unsplash.com/photo-1530018607912-eff2df114f11?auto=format&fit=crop&q=80&w=250' },
      { title: 'Hardwood Floor Installation', image: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&q=80&w=250' }
    ],
    reviews: [
      { author: 'Jane Doe (Homeowner)', rating: 5, date: 'Oct 14, 2023', comment: 'Sarah is an absolute professional. She completely built our kitchen cabinets and reshaped our dining area. Highly recommended!' },
      { author: 'Markus Sterling', rating: 5, date: 'Sep 28, 2023', comment: 'Excellent wood craftsman, works fast and coordinates seamlessly with construction teams.' }
    ]
  },
  // David Chen (Electrician)
  'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e': {
    rate: '$65/hr',
    satisfaction: '98%',
    completedJobs: 310,
    awards: ['Certified Smart-Grid Installer', 'Local Safety Excellence Badge'],
    portfolio: [
      { title: 'Complete Smart Panel Retrofit', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=250' },
      { title: 'EV Charger Installation', image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=250' },
      { title: 'Commercial Office Lighting Grid', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=250' }
    ],
    reviews: [
      { author: 'Robert Dow', rating: 5, date: 'Oct 10, 2023', comment: 'David installed our smart home electric panel. Extremely tidy, safe, and professional job.' },
      { author: 'Lila Henderson', rating: 4.8, date: 'Sep 12, 2023', comment: 'Sorted out a massive short circuit issue in our home lighting grid in no time. Great service.' }
    ]
  },
  // Elena Rodriguez (Tiler & Mason)
  'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f': {
    rate: '$120/hr',
    satisfaction: '100%',
    completedJobs: 89,
    awards: ['Certified Tile & Stone Installer', 'Excellence in Mosaic Masonry'],
    portfolio: [
      { title: 'Modern Bathroom Wall Tiling', image: 'https://images.unsplash.com/photo-1502005229762-fc1b2b812ca5?auto=format&fit=crop&q=80&w=250' },
      { title: 'Granite Kitchen Backsplash', image: 'https://images.unsplash.com/photo-1556909212-d5b604dadb57?auto=format&fit=crop&q=80&w=250' },
      { title: 'Outdoor Stone Patio Masonry', image: 'https://images.unsplash.com/photo-1590073844006-33379778ae09?auto=format&fit=crop&q=80&w=250' }
    ],
    reviews: [
      { author: 'Alex Rivera', rating: 5, date: 'Oct 19, 2023', comment: 'Elena did the tiling in our master bathroom. Absolute wizard, perfect alignment and grout work.' },
      { author: 'Samantha Woods', rating: 5, date: 'Oct 02, 2023', comment: 'Clean work site, excellent tile choice advice, fast deliveries. Best mason we have worked with.' }
    ]
  },
  // Marcus Thorne (Plumber)
  'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a': {
    rate: '$90/hr',
    satisfaction: '97%',
    completedJobs: 245,
    awards: ['Master Plumber Association Seal', 'Top Emergency Responder'],
    portfolio: [
      { title: 'Commercial Boiler Overhaul', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=250' },
      { title: 'Residential PEX Repiping Flow', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=250' },
      { title: 'Sewer Line Diagnostic & Hydrojetting', image: 'https://images.unsplash.com/photo-1542013936693-8848e574047e?auto=format&fit=crop&q=80&w=250' }
    ],
    reviews: [
      { author: 'Clara Oswald', rating: 5, date: 'Oct 21, 2023', comment: 'Marcus fixed a massive water leak in our basement at 11 PM. Life-saver. Highly recommend.' },
      { author: 'Garry Vance', rating: 4.6, date: 'Sep 30, 2023', comment: 'Professional, punctual, and highly skilled plumbing technician.' }
    ]
  },
  // Marcus Sterling (Roofing Contractor)
  'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b': {
    rate: '$125/hr',
    satisfaction: '99%',
    completedJobs: 118,
    awards: ['Licensed Roofing Contractor', 'National Roofing Safety Seal'],
    portfolio: [
      { title: 'Asphalt Shingle Roof Replacement', image: 'https://images.unsplash.com/photo-1632759162444-1107ffa59790?auto=format&fit=crop&q=80&w=250' },
      { title: 'Metal Standing Seam Roof', image: 'https://images.unsplash.com/photo-1628744500406-48be7dadc566?auto=format&fit=crop&q=80&w=250' },
      { title: 'Flat Roof Waterproofing', image: 'https://images.unsplash.com/photo-1605117882932-f9e32b17fea2?auto=format&fit=crop&q=80&w=250' }
    ],
    reviews: [
      { author: 'David Chen', rating: 5, date: 'Oct 11, 2023', comment: 'Marcus guided our roofing crew during a very critical product launch. Outstanding safety focus.' },
      { author: 'Theresa May', rating: 4.9, date: 'Sep 25, 2023', comment: 'Outstanding contractor. Helped us replace our storm-damaged roof in no time.' }
    ]
  }
};

export default function WorkerProfileClient() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuthStore();
  const [worker, setWorker] = useState<any>(null);
  const [reviewsData, setReviewsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await apiClient.get(`/workers/${id}`);
        setWorker(data.data.worker);

        try {
          const reviewsRes = await apiClient.get(`/workers/${id}/reviews`);
          if (reviewsRes.data && reviewsRes.data.data) {
            setReviewsData(reviewsRes.data.data);
          }
        } catch (revErr) {
          console.error('Failed to load worker reviews:', revErr);
        }
      } catch (err: any) {
        console.error('Failed to load worker profile:', err);
        setError('Expert not found or connection error');
        
        // Fallback local lookup if DB is offline or dynamic lookup fails
        const fallbackNames: Record<string, string> = {
          'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d': 'Sarah Jenkins',
          'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e': 'David Chen',
          'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f': 'Elena Rodriguez',
          'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a': 'Marcus Thorne',
          'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b': 'Marcus Sterling'
        };

        const fallbackPhotos: Record<string, string> = {
          'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
          'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
          'c3d4e5f6-a7b8-9c0d-1e2f-3a4b-5c6d7e8f9a0b': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
          'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
          'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=300'
        };

        const name = fallbackNames[id] || 'Expert Professional';
        const photo = fallbackPhotos[id] || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300';
        
        setWorker({
          id,
          name,
          profilePhoto: photo,
          tradeCategories: id === 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' ? ['carpenter'] : id === 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b-5c6d7e8f9a0b' ? ['mason', 'tiler'] : ['roofer'],
          city: 'San Francisco',
          experienceYears: 8,
          bio: 'Verified Professional Partner. Highly rated specialist with years of commercial service experience.',
          availability: 'available'
        });
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F8FAFC] min-h-screen">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-6 bg-[#F8FAFC]">
        <h2 className="text-base font-extrabold text-slate-800">Expert Not Found</h2>
        <button onClick={() => router.push('/')} className="mt-4 bg-[#0b1528] text-white px-4 py-2 rounded-xl text-xs font-bold">
          Go Back
        </button>
      </div>
    );
  }

  // Get rich metadata or fallback default
  const mockRate = WORKERS_PORTFOLIOS[worker.id]?.rate || '$75/hr';
  const displayRate = worker.hourlyRate ? `$${worker.hourlyRate}/hr` : mockRate;

  const displayCompletedJobs = worker.completedJobsCount !== undefined ? worker.completedJobsCount : (WORKERS_PORTFOLIOS[worker.id]?.completedJobs || 0);

  const displaySatisfaction = worker.satisfactionRate || (WORKERS_PORTFOLIOS[worker.id]?.satisfaction || '100%');

  const mockAwards = WORKERS_PORTFOLIOS[worker.id]?.awards || ['Certified Expert Pro', 'Top Platform Partner'];
  const displayAwards = worker.certifications && worker.certifications.length > 0 ? worker.certifications : mockAwards;

  const mockPortfolio = WORKERS_PORTFOLIOS[worker.id]?.portfolio || [
    { title: 'Emergency Repair Work', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=250' },
    { title: 'Residential Installation', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=250' }
  ];
  const displayPortfolio = worker.portfolioItems && worker.portfolioItems.length > 0 ? worker.portfolioItems.map((p: any) => ({ title: p.title, image: p.image })) : mockPortfolio;

  const displayReviews = reviewsData && reviewsData.reviews && reviewsData.reviews.length > 0
    ? reviewsData.reviews.map((r: any) => ({
        author: r.customerName || 'Customer',
        rating: r.rating,
        date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        comment: r.comment || ''
      }))
    : (WORKERS_PORTFOLIOS[worker.id]?.reviews || []);

  const displayAverageRating = reviewsData?.stats?.averageRating ?? worker.averageRating ?? null;
  const displayTotalReviews = reviewsData?.stats?.totalReviews ?? worker.totalReviews ?? null;


  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] relative animate-fadeIn select-none pb-28">
      
      {/* ─── Back Button & Header ────────────────────────────────────────────── */}
      <div className="sticky top-0 bg-white border-b border-slate-200/80 h-14 px-4 flex items-center gap-3 z-30 shadow-sm shrink-0">
        <button onClick={() => router.back()} className="text-slate-800 hover:text-navy p-1 transition-colors">
          <ChevronLeft size={20} className="stroke-[2.5]" />
        </button>
        <span className="text-sm font-extrabold text-[#0b1528] tracking-tight">Expert Profile</span>
      </div>

      {/* ─── Hero Banner & Identity ────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-150 px-5 py-6 space-y-4">
        
        {/* Verified Pro Badge banner */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#065f46] text-[10px] font-extrabold uppercase tracking-wider">
          <ShieldCheck size={12} className="text-[#10b981] fill-[#10b981] text-white" />
          <span>Verified Pro Platform Partner</span>
        </div>

        <div className="flex gap-4 items-center">
          {/* Profile Picture */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={worker.profilePhoto || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300'} 
            alt={worker.name} 
            className="w-20 h-20 rounded-full object-cover border border-slate-200"
          />

          <div className="space-y-1">
            <h1 className="text-lg font-black text-[#0b1528] flex items-center gap-1.5">
              {worker.name}
              <CheckCircle size={16} className="text-[#10b981] fill-[#10b981] text-white" />
            </h1>
            
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              <span className="capitalize">{worker.tradeCategories.join(' • ')}</span>
            </div>

            {displayAverageRating !== null && displayAverageRating > 0 && (
              <div className="flex items-center gap-1 text-xs font-bold text-amber-500 mt-0.5">
                <Star size={13} className="fill-amber-500 text-amber-500" />
                <span>{displayAverageRating}</span>
                <span className="text-slate-400 font-normal">({displayTotalReviews} {displayTotalReviews === 1 ? 'review' : 'reviews'})</span>
              </div>
            )}

            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-0.5">
                <MapPin size={12} className="text-slate-400" />
                <span>{worker.city}</span>
              </span>
              <span>•</span>
              <span className="font-extrabold text-[#0b1528]">{displayRate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Profile Details Stack ────────────────────────────────────────── */}
      <div className="px-5 py-5 space-y-5">

        {/* ─── Statistics Panel (Deep Navy) ─────────────────────────────────── */}
        <div className="bg-[#0b1528] rounded-2xl p-4 text-white shadow-sm grid grid-cols-3 divide-x divide-white/10 text-center">
          <div>
            <span className="block text-base font-black text-white">{displayCompletedJobs}</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Jobs Completed</span>
          </div>
          <div>
            <span className="block text-base font-black text-white">
              {displayAverageRating !== null && displayAverageRating > 0 ? `${displayAverageRating} ★` : displaySatisfaction}
            </span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              {displayAverageRating !== null && displayAverageRating > 0 ? 'Avg Rating' : 'Satisfaction'}
            </span>
          </div>

          <div>
            <span className="block text-base font-black text-white">{worker.experienceYears || 5} Years</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Experience</span>
          </div>
        </div>

        {/* About Me Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-2.5 text-left">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">About Me</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {worker.bio}
          </p>
          
          {displayAwards && displayAwards.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Certifications & Awards</span>
              <div className="flex flex-col gap-1.5">
                {displayAwards.map((award: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#065f46] font-bold bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100">
                    <Award size={13} className="text-[#10b981] shrink-0" />
                    <span>{award}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Portfolio Media Grid */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3 text-left">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <ImageIcon size={13} />
            Portfolio Projects
          </h3>
          
          <div className="grid grid-cols-3 gap-2">
            {displayPortfolio.map((port: any, idx: number) => (
              <div key={idx} className="space-y-1 cursor-pointer group">
                <div className="h-20 w-full rounded-xl bg-slate-100 overflow-hidden relative border border-slate-200/80">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={port.image} 
                    alt={port.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <span className="block text-[9px] font-bold text-slate-700 truncate">{port.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Verified Reviews Feed */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3.5 text-left">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <ThumbsUp size={13} />
            Verified Customer Reviews
          </h3>

          <div className="divide-y divide-slate-100">
            {displayReviews.map((rev: any, idx: number) => (
              <div key={idx} className={`space-y-2 ${idx > 0 ? 'pt-3.5 mt-3.5' : ''}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="block text-[11px] font-black text-[#0b1528]">{rev.author}</span>
                    <span className="block text-[9px] text-slate-400 mt-0.5">{rev.date}</span>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, starIdx) => (
                      <Star 
                        key={starIdx} 
                        size={11} 
                        className={starIdx < Math.floor(rev.rating) ? "text-emerald-500 fill-emerald-500" : "text-slate-200 fill-slate-200"}
                      />
                    ))}
                  </div>
                </div>
                {rev.comment && (
                  <p className="text-xs text-slate-500 leading-relaxed italic">&ldquo;{rev.comment}&rdquo;</p>
                )}
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* ─── Bottom Floating Action Buttons Panel ────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 md:absolute md:bottom-0 bg-white border-t border-slate-200/80 p-4 z-40 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] select-none shrink-0 flex gap-3">
        <button 
          onClick={() => router.push(`/inbox?chat=${worker.id}`)}
          className="flex-1 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-[#0b1528] font-extrabold text-xs py-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
        >
          <MessageSquare size={14} />
          MESSAGE
        </button>
        <button 
          onClick={() => router.push(`/workers/${worker.id}/book`)}
          className="flex-1 bg-accent hover:bg-accent-600 text-white font-extrabold text-xs py-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
        >
          <Calendar size={14} />
          BOOK NOW
        </button>
      </div>

    </div>
  );
}
