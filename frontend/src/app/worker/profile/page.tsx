'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  HardHat, MapPin, BookOpen, Briefcase, 
  LogOut, CheckCircle, ArrowLeft, Save, Sparkles, Star,
  Camera, Loader2
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/api/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

// Validation schema matches backend worker.service.ts
const schema = z.object({
  city: z.string().min(2, 'City name is required'),
  experienceYears: z.number().min(0, 'Experience cannot be negative').max(60, 'Experience is invalid'),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
});

type FormData = z.infer<typeof schema>;

const TRADE_CATEGORIES = [
  { id: 'plumber', label: 'Plumber' },
  { id: 'electrician', label: 'Electrician' },
  { id: 'carpenter', label: 'Carpenter' },
  { id: 'painter', label: 'Painter' },
  { id: 'welder', label: 'Welder' },
  { id: 'mason', label: 'Mason' },
  { id: 'hvac', label: 'HVAC Tech' },
  { id: 'tiler', label: 'Tiler' },
  { id: 'roofer', label: 'Roofer' },
  { id: 'other', label: 'Other' },
];

export default function WorkerProfilePage() {
  const { user, isInitialized, updateUser, logout } = useAuthStore();
  const router = useRouter();

  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const workerUser = user?.role === 'worker' ? user : null;

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      city: workerUser?.city || '',
      experienceYears: workerUser?.experienceYears || 0,
      bio: workerUser?.bio || '',
    }
  });

  useEffect(() => {
    if (isInitialized) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'worker') {
        router.push('/customer/profile');
      } else {
        setSelectedTrades(workerUser?.tradeCategories || []);
      }
    }
  }, [user, isInitialized, router, workerUser]);

  const toggleTradeCategory = (tradeId: string) => {
    setSelectedTrades(prev => {
      if (prev.includes(tradeId)) {
        // Prevent clearing all trades
        if (prev.length <= 1) return prev;
        return prev.filter(t => t !== tradeId);
      } else {
        return [...prev, tradeId];
      }
    });
  };

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    setSuccessMsg(null);
    try {
      const payload = {
        ...data,
        tradeCategories: selectedTrades,
      };

      const { data: resData } = await apiClient.patch('/workers/me', payload);
      // Sync local state
      updateUser(resData.data.worker);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Failed to update worker profile:', err);
      setApiError(err?.response?.data?.message || 'Could not update profile.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setApiError('Profile photo must be less than 2MB.');
      return;
    }

    setUploading(true);
    setApiError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const { data: resData } = await apiClient.post('/workers/me/profile-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser(resData.data.worker);
      setSuccessMsg('Profile photo updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Failed to upload profile photo:', err);
      setApiError(err?.response?.data?.message || 'Could not upload profile photo.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (!isInitialized || !user || user.role !== 'worker') {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 animate-fadeIn relative pb-20">
      {/* Mini top bar */}
      <div className="px-4 h-12 flex items-center bg-white border-b border-slate-100 shrink-0 select-none">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <span className="ml-auto mr-auto font-extrabold text-slate-900 text-sm">Worker Profile</span>
        <div className="w-12"></div>
      </div>

      <div className="p-5 space-y-6 overflow-y-auto flex-1">
        {/* Profile header card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4 select-none">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <div 
            onClick={() => !uploading && fileInputRef.current?.click()}
            className="w-16 h-16 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative cursor-pointer group hover:border-blue-500 transition-colors"
          >
            {user.profilePhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
            ) : (
              <HardHat size={28} className="text-slate-400 group-hover:opacity-50 transition-opacity" />
            )}

            {/* Upload Overlay */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <Loader2 size={16} className="text-white animate-spin" />
              ) : (
                <Camera size={16} className="text-white" />
              )}
            </div>
          </div>
          <div className="text-left">
            <h2 className="font-extrabold text-slate-900 text-base">{user.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{user.phone}</p>
            <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-500 font-bold bg-amber-50 pl-1 pr-2 py-0.5 rounded-full select-none w-max">
              <Star size={10} className="fill-amber-500" />
              <span>4.9 (42 reviews)</span>
            </div>
          </div>
        </div>

        {/* Update Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-5">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest select-none pb-1 border-b border-slate-50">
            Professional Profile
          </h3>

          {apiError && (
            <div className="bg-error-light text-error text-xs px-4 py-3 rounded-lg border border-red-200 select-none">
              {apiError}
            </div>
          )}

          {successMsg && (
            <div className="bg-success-light text-success text-xs px-4 py-3 rounded-lg border border-green-200 flex items-center gap-1.5 select-none animate-fadeIn">
              <CheckCircle size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. Trade Skill Toggles */}
          <div className="space-y-2 select-none">
            <label className="text-sm font-bold text-slate-900 block">
              Trade Skills
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TRADE_CATEGORIES.map((trade) => {
                const isSelected = selectedTrades.includes(trade.id);
                return (
                  <button
                    key={trade.id}
                    type="button"
                    onClick={() => toggleTradeCategory(trade.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                        : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {trade.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. City Location */}
          <Input
            label="Service City"
            placeholder="e.g. Mumbai"
            leftIcon={<MapPin size={16} />}
            error={errors.city?.message}
            required
            {...register('city')}
          />

          {/* 3. Experience Years */}
          <Input
            label="Years of Experience"
            type="number"
            placeholder="e.g. 5"
            leftIcon={<Briefcase size={16} />}
            error={errors.experienceYears?.message}
            required
            {...register('experienceYears', { valueAsNumber: true })}
          />

          {/* 4. Bio Area */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-navy block">
              Professional Biography
            </label>
            <textarea
              placeholder="Tell clients about your work quality, standard tools you carry, and general availability times..."
              rows={3}
              className={`w-full rounded-lg border bg-white px-4 py-3 text-[16px] text-navy placeholder:text-gray-caption outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all ${
                errors.bio ? 'border-error' : 'border-gray-border'
              }`}
              {...register('bio')}
            />
            {errors.bio && (
              <p className="text-sm text-error mt-0.5" role="alert">
                {errors.bio.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            fullWidth
            isLoading={isSubmitting}
            leftIcon={<Save size={16} />}
            className="mt-6"
          >
            Save Profile Changes
          </Button>
        </form>

        {/* Action Actions Box */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm select-none">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest select-none pb-1 border-b border-slate-50 mb-3">
            Account Actions
          </h3>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3.5 rounded-xl text-left border border-slate-100 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all"
          >
            <LogOut size={18} className="text-slate-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
