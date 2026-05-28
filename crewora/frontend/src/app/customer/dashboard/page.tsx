'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Briefcase, Calendar, MapPin, ChevronRight, MessageSquare, DollarSign, 
  ShieldCheck, CheckCircle2, Clock, Eye 
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/api/client';
import { Job } from '@/types';

// Mock values for dashboard aesthetic perfection (matches mockup screenshots)
const MOCK_ACTIVE_JOBS = [
  {
    id: 'mock-job-1',
    title: 'Custom Kitchen Cabinet Installation',
    category: 'carpenter',
    status: 'In Progress',
    progress: 65,
    worker: 'Sarah Jenkins',
    workerPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
    date: 'Oct 22, 2023'
  },
  {
    id: 'mock-job-2',
    title: 'Emergency Commercial Plumbing',
    category: 'plumber',
    status: 'Reviewing',
    progress: 90,
    worker: 'Marcus Thorne',
    workerPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    date: 'Oct 20, 2023'
  },
  {
    id: 'mock-job-3',
    title: 'Smart Home Electric Panel Wiring',
    category: 'electrician',
    status: 'Completed',
    progress: 100,
    worker: 'David Chen',
    workerPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    date: 'Oct 15, 2023'
  }
];

const MOCK_MESSAGES = [
  {
    id: 'msg-1',
    name: 'Sarah Jenkins',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
    text: "Sure, let's schedule our site visit tomorrow at 10 AM. I have updated the woodwork cabinet layout...",
    time: '2 hours ago',
    unread: true
  },
  {
    id: 'msg-2',
    name: 'David Chen',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    text: "I finished the wiring checks. Everything is fully functional and safe.",
    time: 'Yesterday',
    unread: false
  }
];

const MOCK_PAYMENTS = [
  { id: 'tx-101', service: 'Custom Kitchen Cabinet Installation', date: 'Oct 22, 2023', amount: 1250, status: 'Escrowed' },
  { id: 'tx-102', service: 'Smart Home Electric Panel Wiring', date: 'Oct 15, 2023', amount: 650, status: 'Released' },
  { id: 'tx-103', service: 'Bathroom Wall & Floor Tiling', date: 'Oct 05, 2023', amount: 980, status: 'Released' }
];

export default function CustomerDashboard() {
  const { user, isInitialized } = useAuthStore();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isInitialized) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'customer') {
        router.push('/worker/dashboard');
      }
    }
  }, [user, isInitialized, router]);

  const fetchJobs = useCallback(async () => {
    if (!user || user.role !== 'customer') return;
    try {
      const { data } = await apiClient.get('/jobs');
      setJobs(data.data.jobs || []);
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role === 'customer') {
      fetchJobs();
    }
  }, [user, fetchJobs]);

  if (!isInitialized || !user || user.role !== 'customer') {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 min-h-screen">
        <div className="w-8 h-8 border-4 border-[#10b981] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] animate-fadeIn relative pb-20 select-none">
      
      {/* ─── Header: Hirer Dashboard ────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-[#0b1528] tracking-tight">Hirer Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage your postings, contracts, and payments</p>
        </div>
        <button
          onClick={() => router.push('/customer/jobs/create')}
          className="bg-[#10b981] hover:bg-[#059669] text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <Plus size={14} className="stroke-[2.5]" />
          Post Job
        </button>
      </div>

      <div className="px-5 py-5 space-y-6">
        
        {/* ─── Active Jobs Card Section ────────────────────────────────────────── */}
        <div className="space-y-3">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">Active Jobs</h2>
          
          <div className="space-y-3">
            {MOCK_ACTIVE_JOBS.map((job) => (
              <div 
                key={job.id} 
                className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3.5"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold text-[#10b981] bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {job.category}
                    </span>
                    <h3 className="font-extrabold text-[#0b1528] text-sm mt-1.5 leading-snug">{job.title}</h3>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    job.status === 'Completed' 
                      ? 'bg-emerald-50 text-[#065f46] border border-emerald-100'
                      : job.status === 'Reviewing'
                      ? 'bg-amber-50 text-amber-800 border border-amber-100'
                      : 'bg-indigo-50 text-indigo-800 border border-indigo-100'
                  }`}>
                    {job.status}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                    <span>Task Progress</span>
                    <span>{job.progress}% Complete</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        job.progress === 100 ? 'bg-[#10b981]' : 'bg-[#10b981]/80'
                      }`} 
                      style={{ width: `${job.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Assigned Contractor details */}
                <div className="border-t border-slate-50 pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={job.workerPhoto} 
                      alt={job.worker} 
                      className="w-6 h-6 rounded-full object-cover border border-slate-100"
                    />
                    <span className="text-[11px] font-bold text-slate-700">{job.worker}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{job.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

{/* Recent Messages section temporarily disabled */}
        {/* ─── Recent Messages List ────────────────────────────────────────────── */}

        {/* ─── Payment History Transactions Table ────────────────────────────── */}
        <div className="space-y-3">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">Payment History</h2>
          
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-[#0b1528]">
                  {MOCK_PAYMENTS.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3.5 max-w-[120px] truncate">{payment.service}</td>
                      <td className="px-4 py-3.5 text-[10px] text-slate-400">{payment.date}</td>
                      <td className="px-4 py-3.5 text-right font-black">${payment.amount}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          payment.status === 'Released' 
                            ? 'bg-emerald-50 text-[#065f46]' 
                            : 'bg-indigo-50 text-indigo-700'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
