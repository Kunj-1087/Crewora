'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, ArrowUpRight, MapPin, User, Phone, CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/api/client';
import { Job } from '@/types';

export default function CustomerDashboard() {
  const { user, isInitialized } = useAuthStore();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
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

  const fetchConversations = useCallback(async () => {
    if (!user || user.role !== 'customer') return;
    try {
      const { data } = await apiClient.get('/inbox/conversations');
      setConversations(data.data.conversations || []);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role === 'customer') {
      fetchJobs();
      fetchConversations();
    }
  }, [user, fetchJobs, fetchConversations]);

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
        
        {/* ─── Total Monthly Spend Navy Card ────────────────────────────────────── */}
        <div className="bg-[#0b1528] rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#10b981]/15 rounded-full blur-3xl"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Total Monthly Spend</span>
              <h2 className="text-2xl font-black tracking-tight">$0.00</h2>
            </div>
            <div className="bg-emerald-500/20 text-[#4ade80] text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-0.5">
              <ArrowUpRight size={10} />
              0.0%
            </div>
          </div>
          
          {/* Progress bar indicator */}
          <div className="mt-5 space-y-2">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
              <span>Budget Limit ($5,000)</span>
              <span>0% Used</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#10b981] rounded-full" style={{ width: '0%' }}></div>
            </div>
          </div>
        </div>

        {/* ─── Active Jobs Card Section ────────────────────────────────────────── */}
        <div className="space-y-3">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">Active Jobs</h2>
          
          <div className="space-y-3">
            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin mx-auto" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center text-xs text-slate-400 font-bold">
                No active jobs. Click &quot;Post Job&quot; above to get started!
              </div>
            ) : (
              jobs.map((job) => (
                <div 
                  key={job.id} 
                  className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3.5 cursor-pointer hover:border-slate-200 transition-colors"
                  onClick={() => router.push(`/customer/jobs/${job.id}`)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold text-[#10b981] bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {job.tradeCategory}
                      </span>
                      <h3 className="font-extrabold text-[#0b1528] text-sm mt-1.5 leading-snug">{job.title}</h3>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full capitalize ${
                      job.status === 'completed' 
                        ? 'bg-emerald-50 text-[#065f46] border border-emerald-100'
                        : job.status === 'matched' || job.status === 'in_progress'
                        ? 'bg-indigo-50 text-[#1e1b4b] border border-indigo-100'
                        : 'bg-amber-50 text-amber-800 border border-amber-100'
                    }`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Assigned Contractor details */}
                  {(job as any).assignedWorker ? (
                    <div className="border-t border-slate-50 pt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-700">Contractor: {(job as any).assignedWorker.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ) : (
                    <div className="border-t border-slate-50 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>Waiting for matches...</span>
                      <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ─── Recent Messages List ────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">Recent Messages</h2>
            <button 
              onClick={() => router.push('/inbox')}
              className="text-xs font-bold text-[#10b981] hover:underline"
            >
              View Inbox
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 shadow-sm overflow-hidden">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 font-bold">
                No recent messages in your inbox.
              </div>
            ) : (
              conversations.slice(0, 3).map((c) => (
                <div 
                  key={c.id}
                  onClick={() => router.push(`/inbox?chat=${c.id}`)}
                  className="p-4 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer relative"
                >
                  {c.unread && (
                    <span className="absolute top-4 left-4 w-2.5 h-2.5 bg-[#10b981] rounded-full border-2 border-white"></span>
                  )}
                  
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={c.photo} 
                    alt={c.name} 
                    className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-100"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-1">
                      <h4 className="text-xs font-extrabold text-[#0b1528]">{c.name}</h4>
                      <span className="text-[9px] text-slate-400 font-medium">
                        {new Date(c.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 truncate">{c.lastMsg}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ─── Payment History Transactions Table ────────────────────────────── */}
        <div className="space-y-3">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">Payment History</h2>
          
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 text-center text-xs text-slate-400 font-bold">
            No recent payments. Complete bookings with matching workers to initiate escrow payments.
          </div>
        </div>

      </div>
    </div>
  );
}
