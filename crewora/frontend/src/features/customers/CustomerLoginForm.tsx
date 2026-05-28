'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export function CustomerLoginForm() {
  const { loginCustomer, isLoading, error, clearError } = useAuthStore();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    clearError();
    try {
      await loginCustomer(data.email, data.password);
      router.push('/customer/dashboard');
    } catch { /* Error handled in store */ }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {error && (
        <div className="bg-error-light text-error text-sm px-4 py-3 rounded-lg border border-red-200">{error}</div>
      )}

      <Input
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        leftIcon={<Mail size={16} />}
        error={errors.email?.message}
        required
        {...register('email')}
      />

      <Input
        label="Password"
        type={showPassword ? 'text' : 'password'}
        placeholder="Your password"
        leftIcon={<Lock size={16} />}
        rightIcon={
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-caption hover:text-navy">
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
        error={errors.password?.message}
        required
        {...register('password')}
      />

      <div className="text-right">
        <Link href="/forgot-password" className="text-sm text-primary-500 hover:underline">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" fullWidth isLoading={isLoading} size="lg">Sign In</Button>

      <p className="text-center text-sm text-gray-body">
        Don&apos;t have an account?{' '}
        <Link href="/customer/register" className="text-primary-500 font-medium hover:underline">Sign Up</Link>
      </p>
      <p className="text-center text-sm text-gray-body">
        Are you a worker?{' '}
        <Link href="/worker/login" className="text-primary-500 font-medium hover:underline">Worker Login</Link>
      </p>
    </form>
  );
}
