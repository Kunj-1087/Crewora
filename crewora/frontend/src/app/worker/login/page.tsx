import React from 'react';
import Link from 'next/link';
import { WorkerLoginForm } from '@/features/workers/WorkerLoginForm';

export const metadata = { title: 'Worker Sign In — Crewora' };

export default function WorkerLoginPage() {
  return (
    <div className="min-h-screen bg-gray-light flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center tracking-tight text-[28px] font-sans">
            <span className="font-black text-slate-900">crew</span>
            <span className="font-black text-blue-600">ora</span>
          </Link>
        </div>
        <div className="bg-white rounded-2xl shadow-md border border-gray-border p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-navy">Worker Sign In</h1>
            <p className="text-gray-body text-sm mt-1">Access your job feed and profile</p>
          </div>

          <WorkerLoginForm />
        </div>
      </div>
    </div>
  );
}

