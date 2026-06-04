'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, HardHat, ChevronRight, User } from 'lucide-react';

export default function UnifiedLoginPage() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-[#F8FAFC] select-none animate-fadeIn min-h-[80vh]">
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl border border-slate-200/80 p-8 md:p-10 shadow-xl space-y-8 text-left">
        
        {/* Title Section */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center tracking-tight text-3xl font-sans">
            <span className="font-black text-[#0b1528]">crew</span>
            <span className="font-black text-accent-600">ora</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#0b1528] tracking-tight">Welcome to Crewora</h2>
          <p className="text-xs text-slate-400 font-medium">Choose your portal to continue to your dashboard</p>
        </div>

        {/* Roles Selector Stack */}
        <div className="space-y-4 pt-2">
          
          {/* Option 1: Customer */}
          <Link
            href="/customer/login"
            className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-accent-400 hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <User size={22} className="stroke-[2.5]" />
              </div>
              <div className="text-left">
                <h3 className="font-extrabold text-[#0b1528] text-sm">I am a Customer</h3>
                <p className="text-[11px] text-slate-450 mt-0.5">Need a plumber, electrician, or other pro</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300 group-hover:text-accent-600 group-hover:translate-x-0.5 transition-all" />
          </Link>

          {/* Option 2: Worker */}
          <Link
            href="/worker/login"
            className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-accent-400 hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <HardHat size={22} className="stroke-[2.5]" />
              </div>
              <div className="text-left">
                <h3 className="font-extrabold text-[#0b1528] text-sm">I am a Worker / Crew</h3>
                <p className="text-[11px] text-slate-450 mt-0.5">Looking for local service job leads</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300 group-hover:text-accent-600 group-hover:translate-x-0.5 transition-all" />
          </Link>

        </div>

        {/* Footer info link */}
        <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-100 font-semibold space-y-2">
          <p>
            {"Don't have an account?"}
          </p>
          <div className="flex justify-center gap-4 text-[11px]">
            <Link href="/customer/register" className="text-accent-600 font-extrabold hover:underline">
              Register Customer
            </Link>
            <span className="text-slate-200">|</span>
            <Link href="/worker/register" className="text-accent-600 font-extrabold hover:underline">
              Join as Worker
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
