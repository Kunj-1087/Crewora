'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Phone, MapPin, Key } from 'lucide-react';
import { Input } from '@crewora/ui';
import { Button } from '@crewora/ui';
import { useAuthStore } from '@/store/authStore';

const TRADE_OPTIONS = [
  { value: 'plumber', label: 'Plumber' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'carpenter', label: 'Carpenter' },
  { value: 'painter', label: 'Painter' },
  { value: 'welder', label: 'Welder' },
  { value: 'mason', label: 'Mason' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'tiler', label: 'Tiler' },
  { value: 'roofer', label: 'Roofer' },
  { value: 'other', label: 'Other' },
];

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  tradeCategories: z.array(z.string()).min(1, 'Select at least one trade'),
  city: z.string().min(2, 'City is required'),
  otp: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function WorkerRegisterForm() {
  const { registerWorker, sendOtp, isLoading, error, clearError } = useAuthStore();
  const router = useRouter();
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const { register, handleSubmit, setValue, getValues, setError, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tradeCategories: [] },
  });

  const toggleTrade = (value: string) => {
    if (otpSent) return; // Prevent changing trade categories after OTP is sent
    const updated = selectedTrades.includes(value)
      ? selectedTrades.filter((t) => t !== value)
      : [...selectedTrades, value];
    setSelectedTrades(updated);
    setValue('tradeCategories', updated, { shouldValidate: true });
  };

  const handleSendOtp = async () => {
    clearError();
    const isValid = await trigger(['name', 'phone', 'tradeCategories', 'city']);
    if (!isValid) return;

    const values = getValues();
    try {
      const generatedOtp = await sendOtp(values.phone, 'worker');
      setOtpSent(true);
      if (generatedOtp) {
        setDevOtp(generatedOtp);
      }
    } catch {
      // Error handled in store
    }
  };

  const onSubmit = async (data: FormData) => {
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
      await registerWorker({
        name: data.name,
        phone: data.phone,
        tradeCategories: data.tradeCategories,
        city: data.city,
        otp: data.otp,
      });
      router.push('/worker/dashboard');
    } catch {
      // Error handled in store
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {error && (
        <div className="bg-error-light text-error text-sm px-4 py-3 rounded-lg border border-red-200">{error}</div>
      )}

      {devOtp && (
        <div className="bg-emerald-50 text-emerald-800 text-sm px-4 py-3 rounded-lg border border-emerald-200 animate-fadeIn">
          <strong>Demo Mode OTP:</strong> {devOtp} (use this code to verify)
        </div>
      )}

      <Input label="Full Name" placeholder="Suresh Kumar" leftIcon={<User size={16} />} error={errors.name?.message} required disabled={otpSent} {...register('name')} />
      <Input label="Phone Number" type="tel" placeholder="9876543210" leftIcon={<Phone size={16} />} error={errors.phone?.message} required disabled={otpSent} {...register('phone')} />
      <Input label="City / Area" placeholder="Mumbai, Delhi..." leftIcon={<MapPin size={16} />} error={errors.city?.message} required disabled={otpSent} {...register('city')} />

      {/* Trade Categories Multi-Select */}
      <div>
        <label className="block text-sm font-medium text-navy mb-1.5">
          Trade Categories <span className="text-error">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TRADE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              disabled={otpSent}
              onClick={() => toggleTrade(value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                selectedTrades.includes(value)
                  ? 'border-primary-500 bg-primary-50 text-primary-600'
                  : 'border-gray-border bg-white text-gray-body hover:border-primary-300'
              } ${otpSent ? 'opacity-80 cursor-not-allowed' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
        {errors.tradeCategories && (
          <p className="text-sm text-error mt-1">{errors.tradeCategories.message}</p>
        )}
      </div>

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
          {...register('otp')}
        />
      )}

      {!otpSent ? (
        <Button type="button" onClick={handleSendOtp} fullWidth isLoading={isLoading} size="lg" className="mt-2">
          Send OTP
        </Button>
      ) : (
        <div className="space-y-2 mt-2">
          <Button type="submit" fullWidth isLoading={isLoading} size="lg">
            Verify & Create Account
          </Button>
          <button
            type="button"
            onClick={() => {
              setOtpSent(false);
              setDevOtp(null);
            }}
            className="w-full text-center text-xs text-primary-500 hover:underline pt-2"
          >
            Change Registration Details
          </button>
        </div>
      )}

      <p className="text-center text-xs text-gray-body pt-2">
        Your profile will be reviewed by our team within 24–48 hours.
      </p>

      <p className="text-center text-sm text-gray-body">
        Already registered?{' '}
        <Link href="/worker/login" className="text-primary-500 font-medium hover:underline">Sign In</Link>
      </p>
    </form>
  );
}
