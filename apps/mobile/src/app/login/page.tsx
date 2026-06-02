'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, HardHat, ChevronRight } from 'lucide-react';

export default function UnifiedLoginPage() {
  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-8 bg-slate-50 select-none animate-fadeIn">
      <div className="w-full max-w-sm mx-auto space-y-6">
        
        {/* Title Section */}
        <div className="text-center">
          <div className="flex items-center justify-center tracking-tight text-[32px] font-sans mb-4">
            <span className="font-black text-slate-900">crew</span>
            <span className="font-black text-blue-600">ora</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome to Crewora</h2>
          <p className="text-sm text-slate-500 mt-2">Choose your portal to continue</p>
        </div>

        {/* Roles Selector Stack */}
        <div className="space-y-4 pt-4">
          
          {/* Option 1: Customer */}
          <Link
            href="/customer/login"
            className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-primary-200 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                <ShieldCheck size={24} className="stroke-[2]" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-slate-900 text-sm">I am a Customer</h3>
                <p className="text-xs text-slate-400 mt-0.5">Need a plumber, electrician, etc.</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
          </Link>

          {/* Option 2: Worker */}
          <Link
            href="/worker/login"
            className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-primary-200 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 group-hover:scale-105 transition-transform">
                <HardHat size={24} className="stroke-[2]" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-slate-900 text-sm">I am a Worker / Crew</h3>
                <p className="text-xs text-slate-400 mt-0.5">Looking for local service jobs</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
          </Link>

        </div>

        {/* Footer info link */}
        <div className="text-center text-xs text-slate-400 pt-6">
          Don&apos;t have an account?{' '}
          <Link href="/customer/register" className="text-primary-600 font-bold hover:underline">
            Register as Customer
          </Link>
          {' '}or{' '}
          <Link href="/worker/register" className="text-primary-600 font-bold hover:underline">
            Join as Worker
          </Link>
        </div>

      </div>
    </div>
  );
}
