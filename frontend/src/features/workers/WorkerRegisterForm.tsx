'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
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
  email: z.string().email('Invalid email address'),
  password: z.string().min(8).regex(/[A-Z]/, 'Must include an uppercase letter').regex(/[0-9]/, 'Must include a number'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  tradeCategories: z.array(z.string()).min(1, 'Select at least one trade'),
  city: z.string().min(2, 'City is required'),
});

type FormData = z.infer<typeof schema>;

export function WorkerRegisterForm() {
  const { registerWorker, isLoading, error, clearError } = useAuthStore();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tradeCategories: [] },
  });

  const toggleTrade = (value: string) => {
    const updated = selectedTrades.includes(value)
      ? selectedTrades.filter((t) => t !== value)
      : [...selectedTrades, value];
    setSelectedTrades(updated);
    setValue('tradeCategories', updated, { shouldValidate: true });
  };

  const onSubmit = async (data: FormData) => {
    clearError();
    try {
      await registerWorker(data as { name: string; email: string; password: string; phone: string; tradeCategories: string[]; city: string });
      router.push('/worker/dashboard');
    } catch { /* Error handled in store */ }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {error && (
        <div className="bg-error-light text-error text-sm px-4 py-3 rounded-lg border border-red-200">{error}</div>
      )}

      <Input label="Full Name" placeholder="Suresh Kumar" leftIcon={<User size={16} />} error={errors.name?.message} required {...register('name')} />
      <Input label="Email Address" type="email" placeholder="you@example.com" leftIcon={<Mail size={16} />} error={errors.email?.message} required {...register('email')} />
      <Input label="Phone Number" type="tel" placeholder="9876543210" leftIcon={<Phone size={16} />} error={errors.phone?.message} required {...register('phone')} />
      <Input label="City / Area" placeholder="Mumbai, Delhi..." leftIcon={<MapPin size={16} />} error={errors.city?.message} required {...register('city')} />

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
              onClick={() => toggleTrade(value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                selectedTrades.includes(value)
                  ? 'border-primary-500 bg-primary-50 text-primary-600'
                  : 'border-gray-border bg-white text-gray-body hover:border-primary-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {errors.tradeCategories && (
          <p className="text-sm text-error mt-1">{errors.tradeCategories.message}</p>
        )}
      </div>

      <Input
        label="Password"
        type={showPassword ? 'text' : 'password'}
        placeholder="At least 8 characters"
        leftIcon={<Lock size={16} />}
        rightIcon={
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-caption hover:text-navy">
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
        error={errors.password?.message}
        hint="Min. 8 characters, 1 uppercase, 1 number"
        required
        {...register('password')}
      />

      <Button type="submit" fullWidth isLoading={isLoading} size="lg" className="mt-2">
        Join as Crew Member
      </Button>

      <p className="text-center text-xs text-gray-body">
        Your profile will be reviewed by our team within 24–48 hours.
      </p>

      <p className="text-center text-sm text-gray-body">
        Already registered?{' '}
        <Link href="/worker/login" className="text-primary-500 font-medium hover:underline">Sign In</Link>
      </p>
    </form>
  );
}
