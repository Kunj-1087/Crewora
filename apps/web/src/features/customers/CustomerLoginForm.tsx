'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Phone, Key } from 'lucide-react';
import { Input } from '@crewora/ui';
import { Button } from '@crewora/ui';
import { useAuthStore } from '@/store/authStore';

const schema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Invalid phone number'),
  otp: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function CustomerLoginForm() {
  const { sendOtp, loginCustomer, isLoading, error, clearError } = useAuthStore();
  const router = useRouter();
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const { register, handleSubmit, getValues, setError, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const handleSendOtp = async () => {
    clearError();
    const phone = getValues('phone');
    if (!phone || phone.length < 10) {
      setError('phone', { type: 'manual', message: 'Enter a valid 10-digit phone number first' });
      return;
    }
    try {
      const generatedOtp = await sendOtp(phone, 'customer');
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
      await loginCustomer(data.phone, data.otp);
      router.push('/customer/dashboard');
    } catch {
      // Error handled in store
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {error && (
        <div className="bg-error-light text-error text-sm px-4 py-3 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {devOtp && (
        <div className="bg-emerald-50 text-emerald-800 text-sm px-4 py-3 rounded-lg border border-emerald-200 animate-fadeIn">
          <strong>Demo Mode OTP:</strong> {devOtp} (use this code to log in)
        </div>
      )}

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
          {...register('otp')}
        />
      )}

      {!otpSent ? (
        <Button type="button" onClick={handleSendOtp} fullWidth isLoading={isLoading} size="lg" className="mt-4">
          Send OTP
        </Button>
      ) : (
        <div className="space-y-2 mt-4">
          <Button type="submit" fullWidth isLoading={isLoading} size="lg">
            Verify & Sign In
          </Button>
          <button
            type="button"
            onClick={() => {
              setOtpSent(false);
              setDevOtp(null);
            }}
            className="w-full text-center text-xs text-primary-500 hover:underline pt-2"
          >
            Change Phone Number
          </button>
        </div>
      )}

      <p className="text-center text-sm text-gray-body pt-4">
        Don&apos;t have an account?{' '}
        <Link href="/customer/register" className="text-primary-500 font-medium hover:underline">
          Sign Up
        </Link>
      </p>
      <p className="text-center text-sm text-gray-body">
        Are you a worker?{' '}
        <Link href="/worker/login" className="text-primary-500 font-medium hover:underline">
          Worker Login
        </Link>
      </p>
    </form>
  );
}
