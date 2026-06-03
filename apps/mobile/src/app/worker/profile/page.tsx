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
import apiClient from '@crewora/api-client';
import { Input } from '@crewora/ui';
import { Button } from '@crewora/ui';
import { useLanguage } from '@/contexts/LanguageContext';

// Validation schema matches backend worker.service.ts
const schema = z.object({
  city: z.string().min(2, 'City name is required'),
  experienceYears: z.number().min(0, 'Experience cannot be negative').max(60, 'Experience is invalid'),
  hourlyRate: z.number().min(0, 'Hourly rate cannot be negative').max(100000, 'Rate is invalid').optional(),
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
  const { language, changeLanguage, t } = useLanguage();
  const router = useRouter();

  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const workerUser = user?.role === 'worker' ? user : null;

  // Certifications and Portfolio states
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newCert, setNewCert] = useState('');
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [newPortfolioTitle, setNewPortfolioTitle] = useState('');
  const [portfolioUploading, setPortfolioUploading] = useState(false);
  const portfolioFileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      city: workerUser?.city || '',
      experienceYears: workerUser?.experienceYears || 0,
      hourlyRate: (workerUser as any)?.hourlyRate || 0,
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
        setCertifications((workerUser as any)?.certifications || []);
        setPortfolioItems((workerUser as any)?.portfolioItems || []);
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
        certifications,
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

  const handleAddCertification = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCert.trim().length === 0) return;
    if (certifications.includes(newCert.trim())) return;
    setCertifications(prev => [...prev, newCert.trim()]);
    setNewCert('');
  };

  const handleRemoveCertification = (indexToRemove: number) => {
    setCertifications(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddPortfolioItem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!newPortfolioTitle.trim()) {
      setApiError('Please enter a project title first.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setApiError('Portfolio photo must be less than 5MB.');
      return;
    }

    setPortfolioUploading(true);
    setApiError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('title', newPortfolioTitle.trim());

    try {
      const { data: resData } = await apiClient.post('/workers/me/portfolio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPortfolioItems(prev => [resData.data.portfolioItem, ...prev]);
      setNewPortfolioTitle('');
      setSuccessMsg('Portfolio project added successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Failed to upload portfolio item:', err);
      setApiError(err?.response?.data?.message || 'Could not upload portfolio project.');
    } finally {
      setPortfolioUploading(false);
      if (portfolioFileInputRef.current) portfolioFileInputRef.current.value = '';
    }
  };

  const handleRemovePortfolioItem = async (itemId: string) => {
    setApiError(null);
    setSuccessMsg(null);
    try {
      await apiClient.delete(`/workers/me/portfolio/${itemId}`);
      setPortfolioItems(prev => prev.filter(item => item.id !== itemId));
      setSuccessMsg('Portfolio project removed successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Failed to remove portfolio item:', err);
      setApiError(err?.response?.data?.message || 'Could not delete portfolio project.');
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
          <span>{t('profile.back')}</span>
        </button>
        <span className="ml-auto mr-auto font-extrabold text-slate-900 text-sm">{t('profile.worker_title')}</span>
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
            {((user as any).averageRating !== undefined && (user as any).averageRating > 0) ? (
              <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-500 font-bold bg-amber-50 pl-1 pr-2 py-0.5 rounded-full select-none w-max">
                <Star size={10} className="fill-amber-500" />
                <span>{(user as any).averageRating} ({(user as any).totalReviews} {(user as any).totalReviews === 1 ? 'review' : 'reviews'})</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-500 font-bold bg-slate-100 pl-1 pr-2 py-0.5 rounded-full select-none w-max">
                <Star size={10} className="fill-slate-300" />
                <span>No reviews yet</span>
              </div>
            )}
          </div>
        </div>

        {/* Update Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-5">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest select-none pb-1 border-b border-slate-50">
            {t('profile.professional_profile')}
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
              {t('profile.trade_skills')}
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
            label={t('profile.service_city')}
            placeholder="e.g. Mumbai"
            leftIcon={<MapPin size={16} />}
            error={errors.city?.message}
            required
            {...register('city')}
          />

          {/* 3. Experience Years */}
          <Input
            label={t('profile.exp_years')}
            type="number"
            placeholder="e.g. 5"
            leftIcon={<Briefcase size={16} />}
            error={errors.experienceYears?.message}
            required
            {...register('experienceYears', { valueAsNumber: true })}
          />

          {/* Hourly charges */}
          <Input
            label="Hourly Charges ($/hr)"
            type="number"
            placeholder="e.g. 50"
            leftIcon={<Briefcase size={16} />}
            error={errors.hourlyRate?.message}
            required
            {...register('hourlyRate', { valueAsNumber: true })}
          />

          {/* 4. Bio Area */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-navy block">
              {t('profile.bio')}
            </label>
            <textarea
              placeholder={t('profile.bio_placeholder')}
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

          {/* Certifications Manager */}
          <div className="space-y-3 pt-3 border-t border-slate-100 text-left">
            <label className="text-sm font-bold text-slate-900 block">
              Certifications & Awards
            </label>
            {certifications.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {certifications.map((cert, index) => (
                  <div key={index} className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-700">
                    <span>{cert}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCertification(index)}
                      className="text-slate-400 hover:text-red-500 font-extrabold px-1 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No certifications added yet.</p>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Certified Electrician 2024"
                value={newCert}
                onChange={(e) => setNewCert(e.target.value)}
                className="flex-1 rounded-lg border border-gray-border bg-white px-3.5 py-2 text-xs text-navy placeholder:text-gray-caption outline-none focus:border-primary-500 transition-all"
              />
              <button
                type="button"
                onClick={handleAddCertification}
                className="bg-[#0b1528] text-white hover:bg-slate-800 text-xs font-extrabold px-4 py-2 rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            isLoading={isSubmitting}
            leftIcon={<Save size={16} />}
            className="mt-6"
          >
            {t('profile.save_changes')}
          </Button>
        </form>

        {/* Portfolio Manager Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4 text-left select-none">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-50 flex items-center gap-1.5">
            Portfolio Projects
          </h3>

          {portfolioItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-3.5">
              {portfolioItems.map((item) => (
                <div key={item.id} className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50 relative group">
                  <div className="h-28 w-full relative bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleRemovePortfolioItem(item.id)}
                        className="bg-red-500 text-white font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="p-2 truncate text-[11px] font-black text-slate-800 bg-white">
                    {item.title}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No portfolio projects uploaded yet.</p>
          )}

          <div className="pt-3 border-t border-slate-50 space-y-3">
            <span className="text-[11px] font-bold text-slate-900 block">Add New Project</span>
            <input
              type="text"
              placeholder="Project Title (e.g. Kitchen Cabinets)"
              value={newPortfolioTitle}
              onChange={(e) => setNewPortfolioTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-border bg-white px-3.5 py-2 text-xs text-navy placeholder:text-gray-caption outline-none focus:border-primary-500 transition-all"
            />
            
            <input
              type="file"
              ref={portfolioFileInputRef}
              onChange={handleAddPortfolioItem}
              accept="image/*"
              className="hidden"
            />
            
            <Button
              type="button"
              fullWidth
              size="sm"
              disabled={portfolioUploading || !newPortfolioTitle.trim()}
              isLoading={portfolioUploading}
              onClick={() => portfolioFileInputRef.current?.click()}
              className="mt-1"
            >
              Upload Project Photo & Save
            </Button>
          </div>
        </div>

        {/* Language Selection Box */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest select-none pb-1 border-b border-slate-50">
            {t('profile.lang_pref')}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => changeLanguage('en')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold border transition-all ${
                language === 'en'
                  ? 'bg-accent-600 text-white border-accent-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              English
            </button>
            <button
              onClick={() => changeLanguage('gu')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold border transition-all ${
                language === 'gu'
                  ? 'bg-accent-600 text-white border-accent-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              ગુજરાતી (Gujarati)
            </button>
          </div>
        </div>

        {/* Action Actions Box */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm select-none">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest select-none pb-1 border-b border-slate-50 mb-3">
            {t('profile.account_actions')}
          </h3>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3.5 rounded-xl text-left border border-slate-100 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all"
          >
            <LogOut size={18} className="text-slate-400" />
            <span>{t('profile.sign_out')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
