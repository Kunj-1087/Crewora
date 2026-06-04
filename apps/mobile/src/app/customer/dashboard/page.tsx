'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, CheckCircle2, User, Search, Bell, Mail, LayoutDashboard, Briefcase, 
  MessageSquare, ShieldCheck, Settings, LogOut, MapPin, Calendar, Clock, Star, Play
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
        <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Calculate Quick Stats
  const activeJobsCount = jobs.filter(j => j.status === 'matched' || j.status === 'in_progress').length;
  const completedJobsCount = jobs.filter(j => j.status === 'completed').length;
  const pendingJobsCount = jobs.filter(j => j.status === 'open').length;

  return (
    <div className="min-h-screen flex bg-slate-550 bg-[#F8FAFC]">
      
      {/* ─── Left Sidebar Navigation ────────────────────────────────────────── */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800 relative z-20">
        <div className="flex flex-col flex-1 p-5 space-y-8 text-left">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-base">C</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-white leading-none">Crewora</h2>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Client Portal</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 pt-4">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-accent-600 text-white font-extrabold text-sm transition-all text-left">
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-sm transition-all text-left">
              <Briefcase size={16} />
              <span>Active Jobs</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-sm transition-all text-left">
              <MessageSquare size={16} />
              <span>Messages</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-sm transition-all text-left">
              <ShieldCheck size={16} />
              <span>Verification</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-sm transition-all text-left">
              <Settings size={16} />
              <span>Settings</span>
            </button>
          </nav>

          {/* Quick Stats Widget */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/30 text-left select-none space-y-3">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quick Stats</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Active Jobs</span>
                <span className="w-5 h-5 rounded-full bg-accent-600/30 text-accent-300 font-extrabold flex items-center justify-center text-[10px]">
                  {activeJobsCount || 2}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Completed</span>
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-[10px]">
                  {completedJobsCount || 5}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Pending Matches</span>
                <span className="w-5 h-5 rounded-full bg-amber-500/25 text-amber-300 font-extrabold flex items-center justify-center text-[10px]">
                  {pendingJobsCount || 1}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Logout */}
        <div className="p-5 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-rose-950/20 text-rose-400 hover:text-rose-300 font-bold text-sm transition-all text-left border-none outline-none bg-transparent"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Panel Content ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-8 shrink-0 relative z-10">
          {/* Search bar */}
          <div className="relative w-72 flex items-center">
            <span className="absolute left-3 text-slate-400">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="Search workers, jobs or customers..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-accent-500 focus:bg-white text-xs pl-9 pr-3 py-2 rounded-lg outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>

          {/* Controls & Avatar */}
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-450 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border-none outline-none">
              <Bell size={16} />
            </button>
            <button className="p-2 text-slate-450 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border-none outline-none">
              <Mail size={16} />
            </button>
            
            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="block text-xs font-extrabold text-slate-800">{user.name}</span>
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Customer</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-accent-100 border border-accent-200 flex items-center justify-center text-accent-700 font-black text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Panels Scroll */}
        <main className="flex-1 overflow-y-auto p-8 text-left space-y-8 max-w-5xl">
          
          {/* Welcome Banner */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-[#0b1528] tracking-tight">
                Welcome back, {user.name.split(' ')[0]}
              </h1>
              <p className="text-xs text-slate-400 leading-normal">
                Manage your projects and connect with trusted professionals.
              </p>
            </div>
            <button 
              onClick={() => router.push('/customer/jobs/create')}
              className="bg-accent-600 hover:bg-accent-700 text-white font-extrabold text-xs px-5 py-3.5 rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow active:scale-97 transition-all shrink-0 border-none outline-none"
            >
              <Plus size={14} className="stroke-[2.5]" />
              <span>Post New Job</span>
            </button>
          </div>

          {/* Grid: Active Jobs Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">My Active Jobs</h2>
              <button 
                onClick={() => router.push('/customer/jobs')}
                className="text-xs font-bold text-accent-600 hover:text-accent-700"
              >
                View All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                <div className="col-span-2 bg-white rounded-2xl border border-slate-100 p-8 text-center animate-pulse space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-1/3 mx-auto"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/4 mx-auto"></div>
                </div>
              ) : jobs.length === 0 ? (
                // Fallback / Mockup Data if no active jobs are posted in DB yet
                <>
                  {/* Plumbing Active Card Mock */}
                  <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-4 hover:border-slate-350 transition-colors shadow-sm cursor-pointer">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Plumbing
                      </span>
                      <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>In Progress</span>
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-slate-800 text-sm">Leaky Faucet in Kitchen</h3>
                      <div className="flex items-center gap-4 text-[10px] text-slate-400 font-semibold pt-1">
                        <span className="flex items-center gap-0.5"><MapPin size={10} /> Seattle, WA</span>
                        <span className="flex items-center gap-0.5"><Calendar size={10} /> Posted 2 days ago</span>
                      </div>
                    </div>
                  </div>

                  {/* Electrical Active Card Mock */}
                  <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-4 hover:border-slate-350 transition-colors shadow-sm cursor-pointer">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Electrical
                      </span>
                      <span className="text-[10px] font-extrabold text-[#1e1b4b] bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Matched
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-slate-800 text-sm">Living Room Rewiring</h3>
                      <div className="flex items-center gap-4 text-[10px] text-slate-400 font-semibold pt-1">
                        <span className="flex items-center gap-0.5"><MapPin size={10} /> Bellevue, WA</span>
                        <span className="flex items-center gap-0.5"><Calendar size={10} /> Posted 4 hours ago</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                jobs.map((job) => (
                  <div 
                    key={job.id} 
                    className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-4 hover:border-slate-350 transition-colors shadow-sm cursor-pointer"
                    onClick={() => router.push(`/customer/jobs/${job.id}`)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-extrabold text-accent-600 bg-accent-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider capitalize">
                        {job.tradeCategory}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        job.status === 'completed' 
                          ? 'bg-emerald-50 text-[#065f46]'
                          : job.status === 'matched' || job.status === 'in_progress'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-slate-800 text-sm leading-snug">{job.title}</h3>
                      <div className="flex items-center gap-4 text-[10px] text-slate-400 font-semibold pt-1">
                        <span className="flex items-center gap-0.5 truncate max-w-[150px]"><MapPin size={10} /> {(job as any).address || (job.location as any)?.address || ''}</span>
                        <span className="flex items-center gap-0.5"><Calendar size={10} /> {new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Assigned Worker / Work done triggers */}
                    {(job as any).assignedWorker && (job.status === 'matched' || job.status === 'in_progress') && (
                      <div className="pt-2 border-t border-slate-100 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWorkDoneClick(job.id);
                          }}
                          className="flex-1 py-2 text-center text-xs font-extrabold text-white bg-accent-600 hover:bg-accent-700 rounded-lg shadow-sm border-none outline-none"
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

          {/* Recent Matches Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Recent Matches</h2>
              <button 
                onClick={() => router.push('/workers')}
                className="text-xs font-bold text-accent-600 hover:text-accent-700"
              >
                Explore More Workers
              </button>
            </div>

            <div className="space-y-3">
              
              {/* Match Card 1 (Sarah Jenkins) */}
              <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 text-left">
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 relative border border-slate-150">
                    <img 
                      src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120" 
                      alt="Sarah Jenkins" 
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 bg-[#10b981] p-0.5 rounded-full border border-white">
                      <CheckCircle2 size={10} className="text-white fill-[#10b981] border-none" />
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-800 text-sm">Sarah Jenkins</h3>
                      <span className="text-[9px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.25 rounded">
                        Master Plumber
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold pt-0.5">
                      <span className="flex items-center gap-0.5"><Clock size={10} /> 12 years exp</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5"><MapPin size={10} /> 2.4 miles away</span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 flex justify-end">
                  <button 
                    onClick={() => router.push('/workers')}
                    className="border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 font-extrabold text-xs px-4 py-2.5 rounded-lg transition-colors border-none outline-none"
                  >
                    View Profile
                  </button>
                </div>
              </div>

              {/* Match Card 2 (Marco Rossi) */}
              <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 text-left">
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 relative border border-slate-150">
                    <img 
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120" 
                      alt="Marco Rossi" 
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 bg-[#10b981] p-0.5 rounded-full border border-white">
                      <CheckCircle2 size={10} className="text-white fill-[#10b981] border-none" />
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-800 text-sm">Marco Rossi</h3>
                      <span className="text-[9px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.25 rounded">
                        Licensed Electrician
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold pt-0.5">
                      <span className="flex items-center gap-0.5"><Clock size={10} /> 8 years exp</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5"><MapPin size={10} /> 5.1 miles away</span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 flex justify-end">
                  <button 
                    onClick={() => router.push('/workers')}
                    className="border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 font-extrabold text-xs px-4 py-2.5 rounded-lg transition-colors border-none outline-none"
                  >
                    View Profile
                  </button>
                </div>
              </div>

            </div>
          </div>

        </main>
      </div>

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  );
}
