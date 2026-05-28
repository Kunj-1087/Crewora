import React from 'react';
import Link from 'next/link';
import { CustomerRegisterForm } from '@/features/customers/CustomerRegisterForm';

export const metadata = {
  title: 'Create Customer Account — Crewora',
  description: 'Sign up to post jobs and find trusted workers near you.',
};

export default function CustomerRegisterPage() {
  return (
    <div className="min-h-screen bg-gray-light flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-2xl font-bold text-navy">Crewora</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-gray-border p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-navy">Create your account</h1>
            <p className="text-gray-body text-sm mt-1">Post jobs and find trusted workers near you</p>
          </div>

          <CustomerRegisterForm />
        </div>
      </div>
    </div>
  );
}
