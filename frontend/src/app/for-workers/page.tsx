'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { CheckCircle, DollarSign, Smartphone, MapPin, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const BENEFITS = [
  { icon: CheckCircle, title: 'Regular Job Opportunities', description: 'Receive job requests from local customers in your service area regularly.' },
  { icon: DollarSign, title: 'No Commission Cut', description: 'Get paid directly. Crewora never takes a cut of your earnings.' },
  { icon: Smartphone, title: 'Simple to Use', description: 'Just register, set your status, and receive job notifications directly.' },
  { icon: MapPin, title: 'Local Work Only', description: 'Jobs in your preferred city and service radius. Save on travel.' },
];

const STEPS = [
  { step: 1, title: 'Create Your Profile', description: 'Register with your name, skills, and city. Takes 5 minutes.' },
  { step: 2, title: 'Get Verified', description: 'Our admin team reviews your profile and approves it within 24-48 hours.' },
  { step: 3, title: 'Start Matching', description: 'Set your status to Available to instantly receive customer jobs nearby.' },
];

export default function ForWorkersPage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col bg-slate-50 animate-fadeIn select-none">
      
      {/* Mini top bar */}
      <div className="px-4 h-12 flex items-center bg-white border-b border-slate-100 shrink-0">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={16} />
          <span>Home</span>
        </button>
        <span className="ml-auto mr-auto font-extrabold text-slate-900 text-sm">Join Crewora Crew</span>
        <div className="w-12"></div>
      </div>

      <div className="flex-1 overflow-y-auto pb-10">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary-950 via-primary-800 to-indigo-900 text-white px-6 py-8 rounded-b-[36px] shadow-sm text-left">
          <h1 className="text-xl font-black leading-tight tracking-tight">
            Looking for Service Work? <br />
            <span className="bg-gradient-to-r from-primary-200 to-white bg-clip-text text-transparent">
              Earn Without Commission
            </span>
          </h1>
          <p className="text-[11px] text-slate-300 mt-2 leading-relaxed max-w-xs">
            Connect directly with customers near you looking for plumbers, electricians, painters, and carpenters. No commissions, no middleman markups.
          </p>
          <div className="mt-4">
            <Link href="/worker/register">
              <Button size="md" variant="secondary" className="w-full bg-white text-primary-600 hover:bg-slate-50 font-extrabold">
                Register as Worker — Free
              </Button>
            </Link>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="px-5 pt-8 space-y-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
            Why Join Us?
          </h2>

          <div className="grid grid-cols-1 gap-3">
            {BENEFITS.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                    <Icon size={16} className="stroke-[2.5]" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-slate-900 text-xs">{benefit.title}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline Steps */}
        <div className="px-5 pt-8 space-y-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
            How It Works
          </h2>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            {STEPS.map((step) => (
              <div key={step.step} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-50 text-primary-600 font-bold text-xs flex items-center justify-center shrink-0">
                  {step.step}
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-slate-900">{step.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="px-5 pt-8 select-none">
          <div className="bg-gradient-to-tr from-primary-900 to-indigo-900 text-white rounded-2xl p-5 text-center shadow-md space-y-3">
            <h3 className="text-sm font-extrabold">Ready to start earning?</h3>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              Create your account now and get matching with customers within 48 hours.
            </p>
            <Link href="/worker/register">
              <Button size="md" variant="secondary" className="w-full bg-white text-primary-600">
                Join Crewora Crew
              </Button>
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
