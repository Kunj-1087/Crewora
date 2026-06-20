'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Wrench,
  Zap,
  Hammer,
  Paintbrush,
  Flame,
  Layers,
  Wind,
  Grid3x3,
  Home,
  HelpCircle,
  MapPin,
  LocateFixed,
  ArrowLeft,
  Send,
  CheckCircle2,
  Info,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@crewora/api-client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { useOnline } from '@/hooks/useOnline';
import { normalizeError } from '@/lib/api/errors';
import { logError } from '@/lib/log';
import { cn } from '@/theme';

// Schema matches backend expectations
const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(150),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000),
  tradeCategory: z.enum([
    'plumber',
    'electrician',
    'carpenter',
    'painter',
    'welder',
    'mason',
    'hvac',
    'tiler',
    'roofer',
    'other',
  ]),
  address: z.string().min(5, 'Detailed location address is required'),
  urgency: z.enum(['asap', 'scheduled']),
  scheduledAt: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const CATEGORIES: { id: FormData['tradeCategory']; label: string; Icon: LucideIcon }[] = [
  { id: 'plumber', label: 'Plumber', Icon: Wrench },
  { id: 'electrician', label: 'Electrical', Icon: Zap },
  { id: 'carpenter', label: 'Carpenter', Icon: Hammer },
  { id: 'painter', label: 'Painter', Icon: Paintbrush },
  { id: 'welder', label: 'Welder', Icon: Flame },
  { id: 'mason', label: 'Mason', Icon: Layers },
  { id: 'hvac', label: 'HVAC', Icon: Wind },
  { id: 'tiler', label: 'Tiler', Icon: Grid3x3 },
  { id: 'roofer', label: 'Roofer', Icon: Home },
  { id: 'other', label: 'Other', Icon: HelpCircle },
];

export default function CreateJobPage() {
  const { user, isInitialized } = useAuthStore();
  const router = useRouter();
  const { showToast } = useToast();
  const online = useOnline();

  const [coords, setCoords] = useState<[number, number]>([72.8777, 19.076]); // Default Mumbai
  const [detectingLoc, setDetectingLoc] = useState(false);
  const [located, setLocated] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tradeCategory: 'plumber', urgency: 'asap' },
  });

  const selectedUrgency = watch('urgency');
  const selectedCategory = watch('tradeCategory');

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
        setLocated(true);
        setDetectingLoc(false);
      },
      (error) => {
        logError(error, 'geolocation');
        setDetectingLoc(false);
      },
      { timeout: 8000 }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        title: data.title,
        description: data.description,
        tradeCategory: data.tradeCategory,
        urgency: data.urgency,
        location: { address: data.address, coordinates: coords },
        scheduledAt:
          data.urgency === 'scheduled' && data.scheduledAt
            ? new Date(data.scheduledAt).toISOString()
            : undefined,
      };

      await apiClient.post('/jobs', payload);
      setSuccess(true);
      showToast('Problem posted successfully', 'success');
      setTimeout(() => router.push('/customer/dashboard'), 1500);
    } catch (err) {
      logError(err, 'createJob');
      showToast(normalizeError(err).message, 'error');
    }
  };

  if (!isInitialized || !user || user.role !== 'customer') {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-100 border-t-accent-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-1 animate-fadeIn flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-light text-success">
          <CheckCircle2 size={36} />
        </div>
        <h2 className="text-xl font-bold text-navy">Job Posted Successfully!</h2>
        <p className="mt-2 text-sm text-gray-body">
          Matching with active workers near your location…
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="-ml-1 rounded-full p-1.5 text-slate-600 transition-colors hover:bg-slate-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-bold text-navy">Post a Problem</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 space-y-6 p-4 pb-24">
        {/* Category chips — horizontal scroll */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-navy">
            Service category
          </label>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
            {CATEGORIES.map(({ id, label, Icon }) => {
              const active = selectedCategory === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setValue('tradeCategory', id, { shouldValidate: true })}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3.5 py-2 text-sm font-semibold transition-all',
                    'active:scale-95 motion-reduce:active:scale-100',
                    active
                      ? 'border-accent-600 bg-accent-600 text-white'
                      : 'border-gray-border bg-white text-gray-body hover:border-accent-300'
                  )}
                >
                  <Icon size={15} aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </div>
          {errors.tradeCategory && (
            <p className="text-[13px] text-error" role="alert">
              {errors.tradeCategory.message}
            </p>
          )}
        </div>

        <Input
          label="Job title"
          error={errors.title?.message}
          required
          {...register('title')}
        />

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="description" className="block text-sm font-semibold text-navy">
            Description
          </label>
          <textarea
            id="description"
            rows={5}
            placeholder="Describe what needs to be done…"
            aria-invalid={!!errors.description}
            className={cn(
              'min-h-[120px] w-full resize-y rounded-xl border bg-white px-4 py-3 text-[16px] text-navy outline-none transition-[border-color,box-shadow]',
              'placeholder:text-gray-caption focus:ring-2',
              errors.description
                ? 'border-error focus:border-error focus:ring-red-100'
                : 'border-gray-border focus:border-accent-600 focus:ring-accent-100'
            )}
            {...register('description')}
          />
          {errors.description && (
            <p className="text-[13px] text-error" role="alert">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Input
            label="Location"
            leftIcon={<MapPin size={18} />}
            error={errors.address?.message}
            required
            {...register('address')}
          />
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-2.5 py-1 text-[11px] font-semibold text-accent-700">
              <MapPin size={12} />
              {located ? 'Location detected' : 'Default location'} ·{' '}
              {coords[1].toFixed(3)}, {coords[0].toFixed(3)}
            </span>
            <button
              type="button"
              onClick={requestLocation}
              disabled={detectingLoc}
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent-700 hover:underline disabled:text-gray-caption"
            >
              <LocateFixed size={13} />
              {detectingLoc ? 'Detecting…' : 'Detect my location'}
            </button>
          </div>
        </div>

        {/* Urgency */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-navy">Urgency</label>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            {(['asap', 'scheduled'] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={selectedUrgency === value}
                onClick={() => setValue('urgency', value)}
                className={cn(
                  'rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-all',
                  selectedUrgency === value
                    ? 'bg-white text-navy shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {value === 'asap' ? 'ASAP' : 'Scheduled'}
              </button>
            ))}
          </div>
        </div>

        {/* Preferred date (only relevant when scheduled) */}
        {selectedUrgency === 'scheduled' && (
          <div className="space-y-1.5">
            <label htmlFor="scheduledAt" className="block text-sm font-semibold text-navy">
              Preferred date
            </label>
            <input
              id="scheduledAt"
              type="date"
              className="w-full rounded-xl border border-gray-border bg-white px-4 py-3 text-[16px] text-navy outline-none transition-[border-color,box-shadow] focus:border-accent-600 focus:ring-2 focus:ring-accent-100"
              {...register('scheduledAt')}
            />
          </div>
        )}

        <div className="flex items-start gap-2 rounded-xl bg-accent-50 p-3">
          <Info size={16} className="mt-0.5 shrink-0 text-accent-600" aria-hidden="true" />
          <p className="text-xs text-gray-body">
            Once posted, we&apos;ll match you with verified workers in your area.
          </p>
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isSubmitting}
          disabled={!online}
          leftIcon={<Send size={18} />}
        >
          {online ? 'Post Job' : 'No internet connection'}
        </Button>
      </form>
    </div>
  );
}
