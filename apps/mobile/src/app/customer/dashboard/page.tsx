'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/contexts/SocketContext';
import apiClient from '@crewora/api-client';
import { Job } from '@crewora/shared';
import { FeedbackModal } from '@crewora/ui';



export default function CustomerDashboard() {
  const { user, isInitialized } = useAuthStore();
  const socket = useSocket();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Listen for job acceptance via Socket.io in real-time
  useEffect(() => {
    if (!socket || !user || user.role !== 'customer') return;

    const handleJobAccepted = (data: any) => {
      setJobs((prevJobs) =>
        prevJobs.map((job) => {
          if (job.id === data.jobId) {
            return {
              ...job,
              status: 'matched',
              assignedWorker: {
                id: data.workerId,
                name: data.workerName,
              },
            } as any;
          }
          return job;
        })
      );
    };

    socket.on('job_match_accepted', handleJobAccepted);
    return () => {
      socket.off('job_match_accepted', handleJobAccepted);
    };
  }, [socket, user]);

  useEffect(() => {
    if (isInitialized) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'customer') {
        router.push('/worker/dashboard');
      }
    }
  }, [user, isInitialized, router]);

  const handleWorkDoneClick = (jobId: string) => {
    setSelectedJobId(jobId);
    setIsFeedbackOpen(true);
  };

  const handleFeedbackSubmit = async (rating: number, comment: string) => {
    if (!selectedJobId) return;
    await apiClient.post(`/jobs/${selectedJobId}/complete`, {
      rating,
      comment
    });
    fetchJobs();
  };

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
        <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] animate-fadeIn relative pb-20 select-none">
      
      {/* ─── Header: Hirer Dashboard ────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-[#0b1528] tracking-tight">Hirer Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage your postings and contracts</p>
        </div>
        <button
          onClick={() => router.push('/customer/jobs/create')}
          className="bg-accent-600 hover:bg-accent-700 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
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
                      <span className="text-[10px] font-extrabold text-accent-600 bg-accent-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
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

                  {/* Assigned Worker details */}
                  {(job as any).assignedWorker ? (
                    <div className="border-t border-slate-50 pt-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-700">Worker: {(job as any).assignedWorker.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {(job.status === 'matched' || job.status === 'in_progress') && (
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWorkDoneClick(job.id);
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-accent-600 hover:bg-accent-700 text-white font-extrabold text-xs shadow-sm transition-colors text-center select-none border-none outline-none"
                          >
                            <CheckCircle2 size={12} className="stroke-[2.5]" />
                            <span>Work Done</span>
                          </button>
                        </div>
                      )}
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


      </div>
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  );
}
