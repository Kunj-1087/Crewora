'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle, DollarSign, Smartphone, MapPin, Briefcase, UserCheck, ShieldCheck, ArrowRight } from 'lucide-react';

const BENEFITS = [
  { 
    id: 'jobs',
    title: 'Regular Job Opportunities', 
    description: 'Jobs near your area, matched to your trade. We bring the work to you.',
    icon: Briefcase,
    color: 'text-blue-600 bg-blue-50'
  },
  { 
    id: 'middlemen',
    title: 'No Middlemen', 
    description: 'Connect directly with clients, no commission cuts. Keep what you earn.',
    icon: DollarSign,
    color: 'text-emerald-600 bg-emerald-50'
  },
  { 
    id: 'setup',
    title: 'Simple Setup', 
    description: 'Easy to join, no technical knowledge needed. Start within minutes.',
    icon: UserCheck,
    color: 'text-indigo-600 bg-indigo-50'
  },
];

const STEPS = [
  { step: 1, title: 'Sign up with your trade', description: 'Tell us what you do and where you work.' },
  { step: 2, title: 'Complete your profile', description: 'Add your experience and verify your identity.' },
  { step: 3, title: 'Start receiving requests', description: 'Get notified of local jobs that fit your skills.' },
];

export default function ForWorkersPage() {
  return (
    <div className="flex-1 flex flex-col bg-white">
      
      {/* ─── Hero Section (Mockup 3 Style) ────────────────────────────────────── */}
      <section className="bg-white py-16 px-6 sm:px-12 lg:px-24 border-b border-slate-100 text-center lg:text-left">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-6 space-y-6">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0b1528] tracking-tight leading-tight">
              {"Looking for Work? Join Crewora's Crew Network"}
            </h1>
            <p className="text-base sm:text-lg text-slate-500 max-w-xl leading-relaxed">
              Get connected to real, local jobs — regularly. No complex apps, no upfront cost. Just reliable work opportunities.
            </p>
            
            <div className="pt-2">
              <Link href="/worker/register">
                <button className="px-8 py-4 bg-accent-600 hover:bg-accent-700 text-white font-extrabold text-sm rounded-lg shadow-md hover:shadow-lg transition-all active:scale-98 inline-flex items-center justify-center">
                  Join as Crew
                </button>
              </Link>
            </div>
          </div>

          {/* Right Image */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-150 bg-slate-500">
              <img 
                src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800" 
                alt="Construction professional on site" 
                className="w-full h-auto object-cover max-h-[420px]"
              />
            </div>
          </div>

        </div>
      </section>

      {/* ─── Benefits Section (Mockup 3 Style) ────────────────────────────────── */}
      <section className="bg-slate-50/50 py-20 px-6 sm:px-12 lg:px-24 border-b border-slate-100">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div 
                  key={b.id} 
                  className="bg-white rounded-2xl border border-slate-200/60 p-8 flex flex-col justify-between text-left space-y-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="space-y-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${b.color}`}>
                      <Icon size={20} className="stroke-[2.5]" />
                    </div>
                    <h3 className="text-base font-extrabold text-[#0b1528]">{b.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {b.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ─── Getting Started Steps (Mockup 3 Style) ────────────────────────────── */}
      <section className="bg-white py-20 px-6 sm:px-12 lg:px-24 border-b border-slate-100">
        <div className="max-w-7xl mx-auto space-y-16 text-center">
          
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-[#0b1528] tracking-tight">Getting started is easy</h2>
            <p className="text-xs text-slate-500">Three steps to your next job lead</p>
          </div>

          <div className="relative">
            {/* Center connector line for desktop */}
            <div className="hidden md:block absolute top-6 left-16 right-16 h-0.5 bg-slate-200 -z-10"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
              {STEPS.map((step) => (
                <div key={step.step} className="flex flex-col items-center space-y-4 max-w-xs mx-auto">
                  <div className="w-12 h-12 rounded-full bg-accent-600 text-white font-extrabold text-base flex items-center justify-center shadow-md">
                    {step.step}
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-extrabold text-[#0b1528]">{step.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ─── Ready to find your next lead? CTA Banner ─────────────────────────── */}
      <section className="px-6 sm:px-12 lg:px-24 py-20 bg-slate-50/30 select-none">
        <div className="max-w-6xl mx-auto bg-accent-600 text-white rounded-3xl p-10 md:p-14 text-center relative overflow-hidden shadow-xl border border-accent-500">
          <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="relative space-y-6 max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
              Ready to find your next lead?
            </h2>
            <p className="text-sm text-blue-100 leading-relaxed">
              Join thousands of verified specialists earning more with Crewora.
            </p>
            
            <div className="pt-2">
              <Link href="/worker/register">
                <button className="w-full sm:w-auto bg-white hover:bg-slate-50 text-accent-600 font-extrabold text-sm px-8 py-4 rounded-xl shadow-md border-none active:scale-98 inline-flex items-center justify-center">
                  Join as Crew Now
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
