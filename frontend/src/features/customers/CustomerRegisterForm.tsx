'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[0-9]/, 'Must include a number'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
});

type FormData = z.infer<typeof schema>;

export function CustomerRegisterForm() {
  const { registerCustomer, isLoading, error, clearError } = useAuthStore();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    clearError();
    try {
      await registerCustomer(data);
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

      <Input
        label="Full Name"
        placeholder="Rajesh Kumar"
        leftIcon={<User size={16} />}
        error={errors.name?.message}
        required
        {...register('name')}
      />

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
        label="Phone Number"
        type="tel"
        placeholder="9876543210"
        leftIcon={<Phone size={16} />}
        error={errors.phone?.message}
        required
        {...register('phone')}
      />

      <Input
        label="Password"
        type={showPassword ? 'text' : 'password'}
        placeholder="At least 8 characters"
        leftIcon={<Lock size={16} />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="p-0 text-gray-caption hover:text-navy"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
        error={errors.password?.message}
        hint="Min. 8 characters, 1 uppercase, 1 number"
        required
        {...register('password')}
      />

      <Button type="submit" fullWidth isLoading={isLoading} size="lg" className="mt-6">
        Create Account
      </Button>

      <p className="text-center text-sm text-gray-body">
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
    </form>
  );
}
