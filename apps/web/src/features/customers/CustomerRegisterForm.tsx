'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Phone, Key } from 'lucide-react';
import { Input } from '@crewora/ui';
import { Button } from '@crewora/ui';
import { useAuthStore } from '@/store/authStore';

const OTP_RESEND_SECONDS = 30;

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  otp: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function CustomerRegisterForm() {
  const { sendOtp, registerCustomer, isLoading, error, clearError } = useAuthStore();
  const router = useRouter();
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [showDevPopup, setShowDevPopup] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [resendCooldown > 0]);

  // Auto-focus OTP input when it appears
  useEffect(() => {
    if (otpSent) {
      const el = document.querySelector<HTMLInputElement>('[name="otp"]');
      setTimeout(() => el?.focus(), 50);
    }
  }, [otpSent]);



  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    setError,
    trigger,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const handleSendOtp = useCallback(async () => {
    clearError();
    const isValid = await trigger(['name', 'phone']);
    if (!isValid) return;

    const values = getValues();
    try {
      const generatedOtp = await sendOtp(values.phone, 'customer');
      setOtpSent(true);
      setResendCooldown(OTP_RESEND_SECONDS);
      if (generatedOtp) {
        setDevOtp(generatedOtp);
        setShowDevPopup(true);
      }
      setTimeout(() => document.querySelector<HTMLInputElement>('[name="otp"]')?.focus(), 100);
    } catch {
      // Error handled in store
    }
  }, [sendOtp, getValues, clearError, setError, trigger]);

  const onSubmit = useCallback(async (data: FormData) => {
    clearError();
    if (!otpSent) {
      await handleSendOtp();
      return;
    }
    if (!data.otp || data.otp.length !== 6) {
      setError('otp', { type: 'manual', message: 'Enter 6-digit OTP code' });
      return;
    }
    try {
      await registerCustomer({
        name: data.name,
        phone: data.phone,
        otp: data.otp,
      });
      router.push('/customer/dashboard');
    } catch {
      // Error handled in store
    }
  }, [otpSent, handleSendOtp, registerCustomer, clearError, setError, router]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {error && (
        <div className="bg-error-light text-error text-sm px-4 py-3 rounded-lg border border-red-200">
          {error}
        </div>
      )}


      <Input
        label="Full Name"
        placeholder="Rajesh Kumar"
        leftIcon={<User size={16} />}
        error={errors.name?.message}
        required
        disabled={otpSent}
        {...register('name')}
      />

      <Input
        label="Phone Number"
        type="tel"
        placeholder="9876543210"
        leftIcon={<Phone size={16} />}
        error={errors.phone?.message}
        required
        disabled={otpSent}
        {...register('phone')}
      />

      {otpSent && (
        <Input
          label="Verification Code (OTP)"
          type="text"
          maxLength={6}
          placeholder="Enter 6-digit OTP"
          leftIcon={<Key size={16} />}
          error={errors.otp?.message}
          required
          autoFocus
          {...register('otp', {
            onChange: (e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setValue('otp', val, { shouldValidate: true });
              if (val.length === 6) {
                const values = getValues();
                values.otp = val;
                onSubmit(values);
              }
            },
          })}
        />
      )}

      {!otpSent ? (
        <Button type="button" onClick={handleSendOtp} fullWidth isLoading={isLoading} size="lg" className="mt-6">
          Send OTP
        </Button>
      ) : (
        <div className="space-y-2 mt-6">
          <Button type="submit" fullWidth isLoading={isLoading} size="lg">
            Verify & Create Account
          </Button>
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setDevOtp(null);
              }}
              className="text-xs text-primary-500 hover:underline"
            >
              Change Details
            </button>
            <button
              type="button"
              disabled={resendCooldown > 0}
              onClick={handleSendOtp}
              className="text-xs text-primary-500 enabled:hover:underline disabled:text-gray-caption"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
            </button>
          </div>
        </div>
      )}

      <p className="text-center text-sm text-gray-body pt-4">
        Already have an account?{' '}
        <Link href="/customer/login" className="text-primary-500 font-medium hover:underline">
          Sign In
        </Link>
      </p>

      <p className="text-center text-sm text-gray-body">
        Are you a worker?{' '}
        <Link href="/worker/register" className="text-primary-500 font-medium hover:underline">
          Join as Crew
        </Link>
      </p>
      {showDevPopup && devOtp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            onClick={() => setShowDevPopup(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
          />
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-slate-100 overflow-hidden relative z-10 p-6 animate-scaleIn select-none space-y-4">
            <div className="text-center">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Demo Verification Code</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                An OTP verification code was generated for this phone number in developer mode.
              </p>
            </div>
            <div className="flex flex-col items-center justify-center bg-slate-50 py-4 rounded-xl border border-dashed border-slate-200">
              <span className="text-3xl font-black tracking-widest text-primary-500 font-mono">
                {devOtp}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                Valid for 5 minutes
              </span>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDevPopup(false)}
                className="flex-1 text-xs py-2.5 h-10 border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Dismiss
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setValue('otp', devOtp);
                  setShowDevPopup(false);
                  onSubmit(getValues());
                }}
                className="flex-1 bg-accent-600 hover:bg-accent-700 active:bg-accent-800 text-white font-extrabold text-xs py-2.5 rounded-xl border-none h-10"
              >
                Autofill & Verify
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
