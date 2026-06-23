'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus, CheckCircle2, LayoutDashboard, Briefcase, 
  MessageSquare, ShieldCheck, Settings, LogOut, MapPin, Calendar, Clock, Bell
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/contexts/SocketContext';
import apiClient from '@crewora/api-client';
import { Job } from '@crewora/shared';
import { FeedbackModal } from '@crewora/ui';

export default function CustomerDashboard() {
  const { user, isInitialized, logout } = useAuthStore();
  const socket = useSocket();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
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
    try {
      await apiClient.post(`/jobs/${selectedJobId}/complete`, {
        rating,
        comment
      });
      fetchJobs();
    } catch (err) {
      console.error('Failed to complete job', err);
    }
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

  useEffect(() => {
    if (user && user.role === 'customer') {
      fetchJobs();
    }
  }, [user, fetchJobs]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!isInitialized || !user || user.role !== 'customer') {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 min-h-screen">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Calculate Quick Stats
  const activeJobsCount = jobs.filter(j => j.status === 'matched' || j.status === 'in_progress').length;
  const completedJobsCount = jobs.filter(j => j.status === 'completed').length;
  const pendingJobsCount = jobs.filter(j => j.status === 'open').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      
      {/* ─── Global Top Header Row ────────────────────────────────────────── */}
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shrink-0 relative z-30">
        {/* Left Brand Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="text-2xl font-black text-[#2563eb] tracking-tighter">Crewora</Link>
        </div>

        {/* Center Navigation Links */}
        <nav className="flex items-center gap-10 h-full">
          <Link href="/customer/dashboard" className="text-sm font-bold text-[#2563eb] border-b-4 border-[#2563eb] h-full flex items-center px-2 transition-all">
            Dashboard
          </Link>
          <Link href="/customer/jobs" className="text-sm font-bold text-slate-500 hover:text-slate-900 h-full flex items-center px-2 transition-all">
            My Jobs
          </Link>
          <Link href="/customer/profile" className="text-sm font-bold text-slate-500 hover:text-slate-900 h-full flex items-center px-2 transition-all">
            Profile
          </Link>
        </nav>

        {/* Right Controls & Avatar */}
        <div className="flex items-center gap-6">
          <button className="relative p-2.5 text-slate-500 hover:text-[#2563eb] hover:bg-blue-50 rounded-xl transition-all">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white shadow-sm"></span>
          </button>
          
          <div className="h-8 w-px bg-slate-200"></div>

          <div 
            onClick={() => router.push('/customer/profile')}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-white bg-slate-100 flex items-center justify-center shrink-0 cursor-pointer shadow-sm hover:ring-2 hover:ring-blue-100 transition-all"
          >
            <img 
              src={user.profilePhoto || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120"} 
              alt="User Portrait" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>

      {/* ─── Layout Body below Header ─────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* ─── Left Sidebar Navigation ────────────────────────────────────────── */}
        <aside className="w-72 bg-[#F8FAFC] border-r border-slate-200 flex flex-col shrink-0 relative z-20">
          <div className="flex flex-col flex-1 p-6 space-y-10">
            
            {/* Navigation Section */}
            <div className="space-y-4">
              <span className="block text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">
                Navigation
              </span>
              <nav className="space-y-2">
                <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#2563eb] text-white font-bold text-sm shadow-lg shadow-blue-100 text-left">
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </button>
                <button 
                  onClick={() => router.push('/customer/jobs')}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-500 hover:bg-white hover:text-slate-900 font-bold text-sm transition-all text-left shadow-none hover:shadow-sm"
                >
                  <Briefcase size={18} />
                  <span>Active Jobs</span>
                </button>
                <button 
                  onClick={() => router.push('/inbox')}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-500 hover:bg-white hover:text-slate-900 font-bold text-sm transition-all text-left shadow-none hover:shadow-sm"
                >
                  <MessageSquare size={18} />
                  <span>Messages</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-500 hover:bg-white hover:text-slate-900 font-bold text-sm transition-all text-left shadow-none hover:shadow-sm">
                  <ShieldCheck size={18} />
                  <span>Verification</span>
                </button>
                <button 
                  onClick={() => router.push('/customer/profile')}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-500 hover:bg-white hover:text-slate-900 font-bold text-sm transition-all text-left shadow-none hover:shadow-sm"
                >
                  <Settings size={18} />
                  <span>Settings</span>
                </button>
              </nav>
            </div>

            {/* Quick Stats Widget */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 mt-auto">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Quick Stats</h4>
              <div className="space-y-5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-bold">Active Jobs</span>
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-[#2563eb] font-black flex items-center justify-center text-[11px]">
                    {activeJobsCount || 2}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-bold">Completed</span>
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-black flex items-center justify-center text-[11px]">
                    {completedJobsCount || 5}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-bold">Pending Matches</span>
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-[#2563eb] font-black flex items-center justify-center text-[11px]">
                    {pendingJobsCount || 1}
                  </span>
                </div>
              </div>
            </div>

            {/* Logout Trigger at the bottom */}
            <div className="pt-6 border-t border-slate-200">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-rose-500 hover:bg-rose-50 font-bold text-sm transition-all text-left"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>

          </div>
        </aside>

        {/* ─── Main Panel Content ─────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          
          <div className="flex-1 overflow-y-auto">
            <main className="p-10 space-y-10 max-w-6xl w-full mx-auto">
              
              {/* Welcome Banner */}
              <div className="bg-white rounded-3xl border border-slate-200 p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 shadow-sm">
                <div className="space-y-2">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                    Welcome back, {user.name.split(' ')[0]}
                  </h1>
                  <p className="text-sm text-slate-500 font-medium max-w-md">
                    Manage your projects and connect with trusted professionals in your area.
                  </p>
                </div>
                <button 
                  onClick={() => router.push('/customer/jobs/create')}
                  className="bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-sm px-6 py-4 rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-100 hover:shadow-xl active:scale-95 transition-all shrink-0"
                >
                  <Plus size={20} className="stroke-[3]" />
                  <span>Post New Job</span>
                </button>
              </div>

              {/* Grid: Active Jobs Section */}
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">My Active Jobs</h2>
                  <button 
                    onClick={() => router.push('/customer/jobs')}
                    className="text-sm font-bold text-[#2563eb] hover:underline"
                  >
                    View All
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {loading ? (
                    <div className="col-span-2 bg-slate-50 rounded-3xl p-12 text-center animate-pulse space-y-4">
                      <div className="h-6 bg-slate-200 rounded-full w-48 mx-auto"></div>
                      <div className="h-4 bg-slate-200 rounded-full w-32 mx-auto"></div>
                    </div>
                  ) : jobs.length === 0 ? (
                    <div className="col-span-2 bg-white rounded-[2rem] border border-slate-200 p-12 text-center shadow-sm">
                      <div className="w-16 h-16 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center mx-auto mb-4">
                        <Briefcase size={28} />
                      </div>
                      <h3 className="text-base font-black text-slate-900">No jobs yet</h3>
                      <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
                        Post your first job and get connected with trusted professionals in your area.
                      </p>
                      <button
                        onClick={() => router.push('/customer/jobs/create')}
                        className="mt-6 bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-2xl inline-flex items-center gap-2 shadow-lg shadow-blue-100 transition-all"
                      >
                        <Plus size={18} />
                        Post a Job
                      </button>
                    </div>
                  ) : (
                    jobs.map((job) => (
                      <div 
                        key={job.id} 
                        className="bg-white rounded-[2rem] border border-slate-200 p-6 space-y-6 hover:shadow-md transition-all shadow-sm cursor-pointer group"
                        onClick={() => router.push(`/customer/jobs/${job.id}`)}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full uppercase tracking-widest capitalize">
                            {job.tradeCategory}
                          </span>
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${
                            job.status === 'completed' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : job.status === 'matched' || job.status === 'in_progress'
                              ? 'bg-blue-50 text-blue-700 border-blue-100'
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {job.status.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="font-black text-slate-900 text-lg group-hover:text-[#2563eb] transition-colors leading-tight">{job.title}</h3>
                          <div className="flex items-center gap-5 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1.5 truncate max-w-[150px]"><MapPin size={14} className="text-[#2563eb]" /> {(job as any).address || (job.location as any)?.address || ''}</span>
                            <span className="flex items-center gap-1.5"><Calendar size={14} className="text-[#2563eb]" /> {new Date(job.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Assigned Worker / Work done triggers */}
                        {(job as any).assignedWorker && (job.status === 'matched' || job.status === 'in_progress') && (
                          <div className="pt-4 border-t border-slate-100 flex gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWorkDoneClick(job.id);
                              }}
                              className="flex-1 py-3.5 text-center text-xs font-bold text-white bg-[#2563eb] hover:bg-blue-700 rounded-xl shadow-md transition-all active:scale-95"
                            >
                              Work Done
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Matches Section — dynamically populated from workers list */}
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Find Professionals</h2>
                  <button 
                    onClick={() => router.push('/workers')}
                    className="text-sm font-bold text-[#2563eb] hover:underline"
                  >
                    Browse All Workers
                  </button>
                </div>

                <div className="bg-slate-50 rounded-3xl p-10 text-center border border-slate-100">
                  <ShieldCheck size={32} className="text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-black text-slate-600">Post a job to see matching professionals</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Our matching algorithm will find verified workers in your area based on your job requirements.
                  </p>
                </div>
              </div>

            </main>
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
