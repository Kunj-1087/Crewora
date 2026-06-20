'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Phone, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { OTPInput } from '@/components/ui/OTPInput';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useAuthStore } from '@/store/authStore';
import { useOnline } from '@/hooks/useOnline';
import { useCountdown } from '@/hooks/useCountdown';
import { OTP_RESEND_SECONDS, cn } from '@/theme';
import { maskPhone } from '@/lib/format';

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
  const online = useOnline();
  const resend = useCountdown(OTP_RESEND_SECONDS);

  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [showDevPopup, setShowDevPopup] = useState(false);
  const [wrongOtp, setWrongOtp] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    setError,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tradeCategories: [] },
  });

  const otp = watch('otp') || '';

  const toggleTrade = (value: string) => {
    if (otpSent) return; // trades are locked once OTP is sent
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

    try {
      const generatedOtp = await sendOtp(getValues('phone'), 'worker');
      setOtpSent(true);
      resend.start();
      if (generatedOtp) {
        setDevOtp(generatedOtp);
        setShowDevPopup(true);
      }
    } catch {
      // Error handled in store
    }
  };

  const verify = async (value: string) => {
    clearError();
    setWrongOtp(false);
    if (!value || value.length !== 6) {
      setError('otp', { type: 'manual', message: 'Enter 6-digit OTP code' });
      return;
    }
    try {
      const data = getValues();
      await registerWorker({
        name: data.name,
        phone: data.phone,
        tradeCategories: data.tradeCategories,
        city: data.city,
        otp: value,
      });
      router.push('/worker/dashboard');
    } catch {
      setWrongOtp(true);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!otpSent) {
      await handleSendOtp();
      return;
    }
    await verify(data.otp || '');
  };

  const resetDetails = () => {
    setOtpSent(false);
    setDevOtp(null);
    setWrongOtp(false);
    setValue('otp', '');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-error-light px-4 py-3 text-sm text-error"
        >
          {error}
        </div>
      )}

      {!otpSent ? (
        <>
          <Input
            label="Full Name"
            leftIcon={<User size={18} />}
            error={errors.name?.message}
            required
            {...register('name')}
          />
          <Input
            label="Phone Number"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            leftIcon={<Phone size={18} />}
            error={errors.phone?.message}
            required
            {...register('phone')}
          />
          <Input
            label="City / Area"
            leftIcon={<MapPin size={18} />}
            error={errors.city?.message}
            required
            {...register('city')}
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-navy">
              Trade Categories <span className="text-error">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TRADE_OPTIONS.map(({ value, label }) => {
                const active = selectedTrades.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleTrade(value)}
                    className={cn(
                      'rounded-full border-2 px-3.5 py-2 text-sm font-semibold transition-all',
                      'active:scale-95 motion-reduce:active:scale-100',
                      active
                        ? 'border-accent-600 bg-accent-600 text-white'
                        : 'border-gray-border bg-white text-gray-body hover:border-accent-300'
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {errors.tradeCategories && (
              <p className="mt-1.5 text-[13px] text-error" role="alert">
                {errors.tradeCategories.message}
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-body">
            Enter the 6-digit code sent to{' '}
            <span className="font-semibold text-navy">
              {maskPhone(getValues('phone'))}
            </span>
          </p>
          <OTPInput
            value={otp}
            error={wrongOtp}
            onChange={(v) => {
              setValue('otp', v);
              if (wrongOtp) setWrongOtp(false);
            }}
            onComplete={(v) => verify(v)}
          />
          {errors.otp?.message && (
            <p className="text-[13px] text-error" role="alert">
              {errors.otp.message}
            </p>
          )}

          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              type="button"
              onClick={resetDetails}
              className="font-semibold text-accent-700 hover:underline"
            >
              Change details
            </button>
            <button
              type="button"
              disabled={resend.active || isLoading || !online}
              onClick={handleSendOtp}
              className="font-semibold text-accent-700 enabled:hover:underline disabled:text-gray-caption"
            >
              {resend.active ? `Resend in ${resend.seconds}s` : 'Resend OTP'}
            </button>
          </div>
        </div>
      )}

      {!otpSent ? (
        <Button
          type="button"
          onClick={handleSendOtp}
          fullWidth
          size="lg"
          isLoading={isLoading}
          disabled={!online}
        >
          {online ? 'Send OTP' : 'No internet connection'}
        </Button>
      ) : (
        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isLoading}
          disabled={otp.length !== 6 || !online}
        >
          Verify & Create Account
        </Button>
      )}

      <p className="text-center text-xs text-gray-body">
        Your profile will be reviewed by our team within 24–48 hours.
      </p>
      <p className="text-center text-sm text-gray-body">
        Already registered?{' '}
        <Link
          href="/worker/login"
          className="font-semibold text-accent-700 hover:underline"
        >
          Sign In
        </Link>
      </p>

      <ConfirmationModal
        open={showDevPopup && !!devOtp}
        onOpenChange={setShowDevPopup}
        title="Demo Verification Code"
        description="An OTP was generated for this number in developer mode."
        confirmLabel="Autofill & Verify"
        cancelLabel="Dismiss"
        onConfirm={() => {
          if (!devOtp) return;
          setValue('otp', devOtp);
          setShowDevPopup(false);
          verify(devOtp);
        }}
      >
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-border bg-gray-light py-4">
          <span className="font-mono text-3xl font-black tracking-widest text-accent-700">
            {devOtp}
          </span>
          <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-caption">
            Valid for 5 minutes
          </span>
        </div>
      </ConfirmationModal>
    </form>
  );
}
