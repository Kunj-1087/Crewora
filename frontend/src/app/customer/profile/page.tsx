'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, Phone, MapPin, LogOut, Trash2, 
  CheckCircle, ShieldAlert, ArrowLeft, Save 
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/api/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(15),
  address: z.string().max(200).optional(),
});

type FormData = z.infer<typeof schema>;

export default function CustomerProfilePage() {
  const { user, isInitialized, updateUser, logout } = useAuthStore();
  const { language, changeLanguage, t } = useLanguage();
  const router = useRouter();

  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Account Deactivation Modal
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateConfirm, setDeactivateConfirm] = useState('');
  const [deactivating, setDeactivating] = useState(false);

  const customerUser = user?.role === 'customer' ? user : null;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: customerUser?.name || '',
      phone: customerUser?.phone || '',
      address: customerUser?.address || '',
    }
  });

  useEffect(() => {
    if (isInitialized) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'customer') {
        router.push('/worker/profile');
      }
    }
  }, [user, isInitialized, router]);

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    setSuccessMsg(null);
    try {
      const { data: resData } = await apiClient.patch('/customers/me', data);
      updateUser(resData.data.customer);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Failed to update customer profile:', err);
      setApiError(err?.response?.data?.message || 'Could not update profile.');
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

  const handleDeactivate = async () => {
    if (deactivateConfirm !== 'DELETE MY ACCOUNT') return;
    setDeactivating(true);
    setApiError(null);
    try {
      await apiClient.delete('/customers/me', {
        data: { confirmation: 'DELETE MY ACCOUNT' }
      });
      setShowDeactivateModal(false);
      await logout();
      router.push('/login');
    } catch (err: any) {
      console.error('Failed to delete customer account:', err);
      setApiError(err?.response?.data?.message || 'Could not deactivate account.');
      setShowDeactivateModal(false);
    } finally {
      setDeactivating(false);
    }
  };

  if (!isInitialized || !user || user.role !== 'customer') {
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
        <span className="ml-auto mr-auto font-extrabold text-slate-900 text-sm">{t('profile.title')}</span>
        <div className="w-12"></div>
      </div>

      <div className="p-5 space-y-6 overflow-y-auto flex-1">
        {/* Profile Card Summary */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4 select-none">
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-600 text-white rounded-full flex items-center justify-center font-black text-xl shadow-md">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-left">
            <h2 className="font-extrabold text-slate-900 text-base">{user.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{user.phone}</p>
            <span className="inline-block mt-2 bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded text-[10px] uppercase border border-emerald-100">
              Customer Account
            </span>
          </div>
        </div>

        {/* Update Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest select-none pb-1 border-b border-slate-50">
            {t('profile.account_info')}
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

          <Input
            label={t('profile.full_name')}
            placeholder="John Doe"
            leftIcon={<User size={16} />}
            error={errors.name?.message}
            required
            {...register('name')}
          />

          <Input
            label={t('profile.phone_number')}
            placeholder="e.g. 9876543210"
            leftIcon={<Phone size={16} />}
            error={errors.phone?.message}
            required
            {...register('phone')}
          />

          <Input
            label={t('profile.default_address')}
            placeholder="Apartment, Street Address, City"
            leftIcon={<MapPin size={16} />}
            error={errors.address?.message}
            {...register('address')}
          />

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

        {/* Account Actions Box */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3 select-none">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest select-none pb-1 border-b border-slate-50">
            {t('profile.account_actions')}
          </h3>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3.5 rounded-xl text-left border border-slate-100 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all"
          >
            <LogOut size={18} className="text-slate-400" />
            <span>{t('profile.sign_out')}</span>
          </button>

          {/* Delete Button */}
          <button
            onClick={() => setShowDeactivateModal(true)}
            className="flex items-center gap-3 w-full p-3.5 rounded-xl text-left border border-red-50 hover:bg-red-50/50 text-error font-bold text-sm transition-all"
          >
            <Trash2 size={18} className="text-red-400" />
            <span>{t('profile.deactivate')}</span>
          </button>
        </div>
      </div>

      {/* Account Deactivation Modal Overlay */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center md:items-center p-0 md:p-6 animate-fadeIn">
          <div className="bg-white w-full md:max-w-sm rounded-t-3xl md:rounded-2xl p-6 space-y-4 border border-slate-100 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="w-12 h-12 rounded-full bg-red-50 text-error flex items-center justify-center mx-auto shadow-sm">
              <ShieldAlert size={24} />
            </div>

            <h3 className="text-base font-extrabold text-slate-900 text-center select-none">
              Deactivate Your Account?
            </h3>
            
            <p className="text-xs text-slate-400 text-center leading-relaxed select-none">
              This action is permanent. All active matches will be cancelled. To proceed, please type <strong>DELETE MY ACCOUNT</strong> below:
            </p>

            <input
              type="text"
              placeholder="Type DELETE MY ACCOUNT"
              value={deactivateConfirm}
              onChange={(e) => setDeactivateConfirm(e.target.value)}
              className="w-full text-center text-xs font-bold uppercase tracking-wider p-3 rounded-xl border border-red-100 bg-red-50/20 focus:bg-white outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all text-slate-800"
            />

            <div className="flex gap-3 select-none pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeactivateModal(false);
                  setDeactivateConfirm('');
                }}
                className="flex-1 py-3 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
              >
                Cancel
              </button>
              <Button
                variant="danger"
                onClick={handleDeactivate}
                isLoading={deactivating}
                disabled={deactivateConfirm !== 'DELETE MY ACCOUNT'}
                className="flex-1"
                size="sm"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
