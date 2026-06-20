'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Phone } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { OTPInput } from '@/components/ui/OTPInput';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useAuthStore } from '@/store/authStore';
import { useOnline } from '@/hooks/useOnline';
import { useCountdown } from '@/hooks/useCountdown';
import { OTP_RESEND_SECONDS } from '@/theme';
import { maskPhone } from '@/lib/format';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  otp: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function CustomerRegisterForm() {
  const { sendOtp, registerCustomer, isLoading, error, clearError } = useAuthStore();
  const router = useRouter();
  const online = useOnline();
  const resend = useCountdown(OTP_RESEND_SECONDS);

  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [showDevPopup, setShowDevPopup] = useState(false);
  const [wrongOtp, setWrongOtp] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    setError,
    trigger,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const otp = watch('otp') || '';

  const handleSendOtp = async () => {
    clearError();
    const isValid = await trigger(['name', 'phone']);
    if (!isValid) return;

    try {
      const generatedOtp = await sendOtp(getValues('phone'), 'customer');
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
      await registerCustomer({
        name: getValues('name'),
        phone: getValues('phone'),
        otp: value,
      });
      router.push('/customer/dashboard');
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

      <div className="space-y-1.5 pt-2 text-center text-sm text-gray-body">
        <p>
          Already have an account?{' '}
          <Link
            href="/customer/login"
            className="font-semibold text-accent-700 hover:underline"
          >
            Sign In
          </Link>
        </p>
        <p>
          Are you a worker?{' '}
          <Link
            href="/worker/register"
            className="font-semibold text-accent-700 hover:underline"
          >
            Join as Crew
          </Link>
        </p>
      </div>

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
