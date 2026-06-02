'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Wrench, Zap, Paintbrush, Flame, Wind, LayoutGrid, Home, HelpCircle, 
  MapPin, Clock, ArrowLeft, Send, CheckCircle2 
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@crewora/api-client';
import { Input } from '@crewora/ui';
import { Button } from '@crewora/ui';

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
  { id: 'plumber', label: 'Plumbing', icon: Wrench, color: 'text-blue-500 bg-blue-50 border-blue-100' },
  { id: 'electrician', label: 'Electrical', icon: Zap, color: 'text-amber-500 bg-amber-50 border-amber-100' },
  { id: 'carpenter', label: 'Carpentry', icon: Home, color: 'text-orange-500 bg-orange-50 border-orange-100' },
  { id: 'painter', label: 'Painting', icon: Paintbrush, color: 'text-rose-500 bg-rose-50 border-rose-100' },
  { id: 'welder', label: 'Welding', icon: Flame, color: 'text-red-500 bg-red-50 border-red-100' },
  { id: 'mason', label: 'Masonry', icon: Wrench, color: 'text-indigo-500 bg-indigo-50 border-indigo-100' },
  { id: 'hvac', label: 'HVAC', icon: Wind, color: 'text-cyan-500 bg-cyan-50 border-cyan-100' },
  { id: 'tiler', label: 'Tiling', icon: LayoutGrid, color: 'text-emerald-500 bg-emerald-50 border-emerald-100' },
  { id: 'roofer', label: 'Roofing', icon: Home, color: 'text-purple-500 bg-purple-50 border-purple-100' },
  { id: 'other', label: 'Other Task', icon: HelpCircle, color: 'text-slate-500 bg-slate-50 border-slate-100' },
];

export default function CreateJobPage() {
  const { user, isInitialized } = useAuthStore();
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

  const selectedCategory = watch('tradeCategory');
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

      await apiClient.post('/jobs', payload);
      setSuccess(true);
      setTimeout(() => {
        router.push('/customer/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error('Failed to post job:', err);
      setApiError(err?.response?.data?.message || 'Could not post the job. Please verify parameters.');
    }
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
      <div className="flex-1 flex flex-col justify-center items-center p-6 text-center bg-white select-none animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4 text-emerald-600 animate-bounce">
          <CheckCircle2 size={36} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Job Posted Successfully!</h2>
        <p className="text-slate-400 text-xs mt-2">Matching with active workers near your location...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 animate-fadeIn">
      {/* Mini top bar */}
      <div className="px-4 h-12 flex items-center bg-white border-b border-slate-100 select-none shrink-0">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <span className="ml-auto mr-auto font-extrabold text-slate-900 text-sm">Post a Job</span>
        <div className="w-12"></div> {/* Spacer for alignment */}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5 overflow-y-auto flex-1 pb-10">
        {apiError && (
          <div className="bg-error-light text-error text-xs px-4 py-3 rounded-lg border border-red-200 select-none">
            {apiError}
          </div>
        )}

        {/* 1. Category Selector */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-900 block select-none">
            What trade skill do you need?
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setValue('tradeCategory', cat.id as any)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    isSelected 
                      ? 'border-primary-500 bg-primary-50/50 shadow-sm' 
                      : 'border-slate-100 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cat.color}`}>
                    <Icon size={16} />
                  </div>
                  <span className={`text-[13px] font-bold ${isSelected ? 'text-primary-700' : 'text-slate-700'}`}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Job Title */}
        <Input
          label="Job Title"
          placeholder="e.g., Leaky kitchen sink pipe repair"
          error={errors.title?.message}
          required
          {...register('title')}
        />

        {/* 3. Job Description */}
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-sm font-medium text-navy block">
            Describe the Issue <span className="text-error ml-0.5">*</span>
          </label>
          <textarea
            placeholder="Provide clear details of what needs to be fixed. Mention any specific tools needed or conditions workers should know about."
            rows={4}
            className={`w-full rounded-lg border bg-white px-4 py-3 text-[16px] text-navy placeholder:text-gray-caption outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all ${
              errors.description ? 'border-error' : 'border-gray-border'
            }`}
            {...register('description')}
          />
          {errors.description && (
            <p className="text-sm text-error mt-0.5" role="alert">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* 4. Address & Location */}
        <div className="space-y-3">
          <Input
            label="Service Address"
            placeholder="Street address, City, Landmark"
            leftIcon={<MapPin size={16} />}
            error={errors.address?.message}
            required
            {...register('address')}
          />
          
          <div className="flex items-center justify-between text-xs px-2 select-none">
            <span className="text-slate-400 font-medium">
              GPS coordinates: {coords[1].toFixed(4)}, {coords[0].toFixed(4)}
            </span>
            <button
              type="button"
              onClick={requestLocation}
              disabled={detectingLoc}
              className="text-primary-600 font-bold hover:underline disabled:text-slate-400"
            >
              {detectingLoc ? 'Detecting...' : 'Re-detect GPS'}
            </button>
          </div>
        </div>

        {/* 5. Urgency Selection */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-900 block select-none">
            Urgency / Timeline
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue('urgency', 'asap')}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                selectedUrgency === 'asap'
                  ? 'border-primary-500 bg-primary-50/50 text-primary-700 shadow-sm'
                  : 'border-slate-100 bg-white hover:border-slate-300 text-slate-600'
              }`}
            >
              <Clock size={18} className="stroke-[2.5]" />
              <span className="text-xs font-bold uppercase tracking-wider">ASAP Match</span>
            </button>

            <button
              type="button"
              onClick={() => setValue('urgency', 'scheduled')}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                selectedUrgency === 'scheduled'
                  ? 'border-primary-500 bg-primary-50/50 text-primary-700 shadow-sm'
                  : 'border-slate-100 bg-white hover:border-slate-300 text-slate-600'
              }`}
            >
              <Clock size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Schedule Later</span>
            </button>
          </div>
        </div>

        {/* 6. Date Selection (If Scheduled) */}
        {selectedUrgency === 'scheduled' && (
          <div className="animate-fadeIn">
            <Input
              label="Schedule Date & Time"
              type="datetime-local"
              error={errors.scheduledAt?.message}
              required
              {...register('scheduledAt')}
            />
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          isLoading={isSubmitting}
          leftIcon={<Send size={16} />}
          size="lg"
          className="mt-6"
        >
          Post & Match Workers
        </Button>
      </form>
    </div>
  );
}
