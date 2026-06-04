'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Wrench, Zap, Paintbrush, Flame, Wind, LayoutGrid, Home, HelpCircle, 
  MapPin, Clock, ArrowLeft, Send, CheckCircle2, Info, Bell, Settings, ChevronDown, User, Calendar
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@crewora/api-client';
import { Input, Button } from '@crewora/ui';

// Schema matches backend expectations
const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(150),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  tradeCategory: z.enum([
    'plumber', 'electrician', 'carpenter', 'painter',
    'welder', 'mason', 'hvac', 'tiler', 'roofer', 'other'
  ]),
  address: z.string().min(5, 'Detailed location address is required'),
  urgency: z.enum(['asap', 'scheduled']),
  scheduledAt: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const CATEGORIES = [
  { id: 'plumber', label: 'Plumber' },
  { id: 'electrician', label: 'Electrician' },
  { id: 'carpenter', label: 'Carpenter' },
  { id: 'painter', label: 'Painter' },
  { id: 'welder', label: 'Welder' },
  { id: 'mason', label: 'Masonry' },
  { id: 'hvac', label: 'HVAC' },
  { id: 'tiler', label: 'Tiler' },
  { id: 'roofer', label: 'Roofer' },
  { id: 'other', label: 'Other Trades' },
];

export default function CreateJobPage() {
  const { user, isInitialized, logout } = useAuthStore();
  const router = useRouter();
  const [coords, setCoords] = useState<[number, number]>([72.8777, 19.0760]); // Default Mumbai
  const [detectingLoc, setDetectingLoc] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { 
    register, 
    handleSubmit, 
    setValue, 
    watch, 
    formState: { errors, isSubmitting } 
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tradeCategory: 'plumber',
      urgency: 'asap',
    }
  });

  const selectedUrgency = watch('urgency');

  useEffect(() => {
    if (isInitialized) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'customer') {
        router.push('/worker/dashboard');
      }
    }
  }, [user, isInitialized, router]);

  // Request HTML5 Geolocation
  const requestLocation = () => {
    if (!navigator.geolocation) return;
    setDetectingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords([position.coords.longitude, position.coords.latitude]);
        setDetectingLoc(false);
      },
      (error) => {
        console.warn('Geolocation denied or failed, using defaults.', error);
        setDetectingLoc(false);
      },
      { timeout: 8000 }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      const payload = {
        title: data.title,
        description: data.description,
        tradeCategory: data.tradeCategory,
        urgency: data.urgency,
        location: {
          address: data.address,
          coordinates: coords,
        },
        scheduledAt: data.urgency === 'scheduled' && data.scheduledAt 
          ? new Date(data.scheduledAt).toISOString() 
          : undefined,
      };

      const { data: resData } = await apiClient.post('/jobs', payload);
      const jobId = resData.data.job.id;
      setSuccess(true);
      setTimeout(() => {
        router.push(`/customer/dashboard`);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to post job:', err);
      setApiError(err?.response?.data?.message || 'Could not post the job. Please verify parameters.');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!isInitialized || !user || user.role !== 'customer') {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center min-h-screen p-6 text-center bg-white select-none animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4 text-emerald-600 animate-bounce">
          <CheckCircle2 size={36} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Job Posted Successfully!</h2>
        <p className="text-slate-400 text-xs mt-2">Matching with active workers near your location...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      
      {/* ─── Dashboard-Style Top Nav Bar ────────────────────────────────────── */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 relative z-10 select-none">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-accent-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-lg font-bold text-slate-900 group-hover:text-accent-600 transition-colors">
              Crewora
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-4 text-xs font-bold text-slate-400">
            <Link href="/customer/dashboard" className="hover:text-slate-800 transition-colors">Dashboard</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800">Jobs</span>
            <span className="text-slate-300">/</span>
            <Link href="#" className="hover:text-slate-800 transition-colors">Messages</Link>
            <span className="text-slate-300">/</span>
            <Link href="#" className="hover:text-slate-800 transition-colors">Talent</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/customer/jobs/create')}
            className="bg-accent-600 hover:bg-accent-700 text-white font-extrabold text-[11px] px-3.5 py-2 rounded-lg"
          >
            Post a Job
          </button>
          <button className="p-2 text-slate-450 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border-none outline-none">
            <Bell size={16} />
          </button>
          <button className="p-2 text-slate-450 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border-none outline-none">
            <Settings size={16} />
          </button>
          
          <div className="h-6 w-px bg-slate-200 mx-1"></div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent-100 border border-accent-200 flex items-center justify-center text-accent-700 font-black text-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* ─── Breadcrumbs and Headers ─────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto w-full px-6 pt-8 text-left space-y-1 select-none">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
          <Link href="/customer/dashboard" className="hover:text-slate-650">Dashboard</Link>
          <span>&gt;</span>
          <span className="text-slate-800">Post a Job</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#0b1528] tracking-tight">Post a New Job</h1>
        <p className="text-xs text-slate-400">Provide some details to find the best professional for your project.</p>
      </div>

      {/* ─── Main Form Card Panel ───────────────────────────────────────────── */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-6 pb-20">
        
        <form 
          onSubmit={handleSubmit(onSubmit)} 
          className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm text-left space-y-6"
        >
          {apiError && (
            <div className="bg-rose-50 text-rose-700 text-xs px-4 py-3 rounded-lg border border-rose-100 select-none">
              {apiError}
            </div>
          )}

          {/* Job Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Job Title</label>
            <input 
              type="text" 
              placeholder="e.g. Fix leaking kitchen pipe"
              className="w-full bg-white border border-slate-200 focus:border-accent-500 text-xs px-4 py-3.5 rounded-lg outline-none transition-all text-slate-800"
              {...register('title')}
            />
            {errors.title && <p className="text-[10px] font-bold text-rose-600 mt-0.5">{errors.title.message}</p>}
          </div>

          {/* Trade Category Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Trade Category</label>
            <div className="relative">
              <select 
                className="w-full bg-white border border-slate-200 focus:border-accent-500 text-xs px-4 py-3.5 rounded-lg outline-none transition-all text-slate-800 appearance-none cursor-pointer"
                {...register('tradeCategory')}
              >
                <option value="" disabled>Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown size={16} />
              </div>
            </div>
            {errors.tradeCategory && <p className="text-[10px] font-bold text-rose-600 mt-0.5">{errors.tradeCategory.message}</p>}
          </div>

          {/* Job Description Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Job Description</label>
            <textarea 
              rows={5}
              placeholder="Describe what needs to be done..."
              className="w-full bg-white border border-slate-200 focus:border-accent-500 text-xs px-4 py-3.5 rounded-lg outline-none transition-all text-slate-800 resize-y"
              {...register('description')}
            />
            {errors.description && <p className="text-[10px] font-bold text-rose-600 mt-0.5">{errors.description.message}</p>}
          </div>

          {/* Location input */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Location</label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-slate-450">
                <MapPin size={16} />
              </span>
              <input 
                type="text" 
                placeholder="Enter job location"
                className="w-full bg-white border border-slate-200 focus:border-accent-500 text-xs pl-11 pr-4 py-3.5 rounded-lg outline-none transition-all text-slate-800"
                {...register('address')}
              />
            </div>
            {errors.address && <p className="text-[10px] font-bold text-rose-600 mt-0.5">{errors.address.message}</p>}
            
            <div className="flex items-center justify-between text-[10px] px-1 font-bold">
              <span className="text-slate-400">Coordinates: {coords[1].toFixed(4)}, {coords[0].toFixed(4)}</span>
              <button 
                type="button" 
                onClick={requestLocation}
                disabled={detectingLoc}
                className="text-accent-600 hover:text-accent-700 flex items-center gap-0.5 hover:underline disabled:text-slate-350"
              >
                <span>Use my current location</span>
              </button>
            </div>
          </div>

          {/* Preferred Date & Urgency Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Preferred Date */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Preferred Date</label>
              <div className="relative">
                <input 
                  type="date"
                  className="w-full bg-white border border-slate-200 focus:border-accent-500 text-xs px-4 py-3.5 rounded-lg outline-none transition-all text-slate-800"
                  {...register('scheduledAt')}
                />
              </div>
            </div>

            {/* Urgency */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Urgency</label>
              <div className="bg-slate-100 rounded-xl p-1 grid grid-cols-2 gap-1 select-none">
                <button
                  type="button"
                  onClick={() => { setValue('urgency', 'asap'); }}
                  className={`py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all text-center ${
                    selectedUrgency === 'asap'
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  ASAP
                </button>
                <button
                  type="button"
                  onClick={() => { setValue('urgency', 'scheduled'); }}
                  className={`py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all text-center ${
                    selectedUrgency === 'scheduled'
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Scheduled
                </button>
              </div>
            </div>

          </div>

          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Match Notice info */}
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Info size={12} className="stroke-[2.5]" />
              </div>
              <p className="text-[10px] text-slate-400 font-semibold max-w-sm">
                {"Once posted, we'll match you with verified workers in your area."}
              </p>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-accent-600 hover:bg-accent-700 disabled:bg-accent-400 text-white font-extrabold text-xs px-8 py-3.5 rounded-lg shadow-md hover:shadow transition-all shrink-0 border-none outline-none"
            >
              {isSubmitting ? 'Posting...' : 'Post Job'}
            </button>
          </div>

        </form>

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 mt-auto py-6 px-8 select-none text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-semibold">
          <p>© 2026 Crewora Marketplace. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-slate-400">Terms of Service</Link>
            <Link href="#" className="hover:text-slate-400">Privacy Policy</Link>
            <Link href="#" className="hover:text-slate-400">Contact Support</Link>
            <Link href="#" className="hover:text-slate-400">About Us</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
