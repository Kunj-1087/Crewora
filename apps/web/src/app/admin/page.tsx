'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { adminLoginSchema } from '@crewora/shared';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ShieldAlert } from 'lucide-react';
import { Input, Button } from '@crewora/ui';
import { useAuthStore } from '@/store/authStore';
import { z } from 'zod';

type FormData = z.infer<typeof adminLoginSchema>;

export default function AdminLoginPage() {
  const { loginAdmin, isLoading, error, clearError, user, isInitialized } = useAuthStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (isInitialized && user && user.role === 'admin') {
      router.replace('/admin/dashboard');
    }
  }, [user, isInitialized, router]);

  const onSubmit = async (data: FormData) => {
    clearError();
    try {
      await loginAdmin(data.email, data.password);
      router.push('/admin/dashboard');
    } catch (err) {
      // Handled inside authStore
    }
  };

  if (isInitialized && user && user.role === 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-900 relative overflow-hidden select-none">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-8 animate-fadeIn">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center tracking-tight text-3xl font-sans mb-3">
            <span className="font-black text-white">crew</span>
            <span className="font-black text-blue-500">ora</span>
          </Link>
          <span className="block text-[10px] text-blue-400 font-black uppercase tracking-widest bg-blue-950/40 px-3 py-1 rounded-full w-fit mx-auto border border-blue-900/40">
            Marketplace Console
          </span>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl p-8 md:p-10 border border-slate-700/50 shadow-2xl space-y-6">
          <div className="text-left">
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              System Admin Sign In
            </h1>
            <p className="text-xs text-slate-400 mt-1">Authorized personnel only. Access is monitored.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left" noValidate>
            {error && (
              <div className="bg-red-950/40 text-red-400 text-xs px-4 py-3 rounded-xl border border-red-900/50 flex items-start gap-2.5">
                <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="admin@crewora.com"
              leftIcon={<Mail size={16} className="text-slate-500" />}
              error={errors.email?.message}
              required
              {...register('email')}
              className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-blue-500"
            />

            <Input
              label="Security Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock size={16} className="text-slate-500" />}
              error={errors.password?.message}
              required
              {...register('password')}
              className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-blue-500"
            />

            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              size="lg"
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/10 border-none transition-all active:scale-98"
            >
              Authenticate & Enter
            </Button>
          </form>
        </div>

        <div className="text-center">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-350 transition-colors font-medium">
            &larr; Back to Marketplace Home
          </Link>
        </div>
      </div>
    </div>
  );
}
