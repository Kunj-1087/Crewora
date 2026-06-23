'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Check, HardHat, Calendar, MapPin, Phone, 
  X, CheckCircle2, User, RefreshCw, Star, Info, Bell, Settings, LogOut, SlidersHorizontal,
  LayoutDashboard
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@crewora/api-client';
import { useSocket } from '@/contexts/SocketContext';
import { FeedbackModal } from '@crewora/ui';

type AvailabilityType = 'available' | 'unavailable' | 'on_a_job';
type TabType = 'pending' | 'accepted';

export default function WorkerDashboard() {
  const { user, isInitialized, updateUser, logout } = useAuthStore();
  const socket = useSocket();
  const router = useRouter();

  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [showProfileNotice, setShowProfileNotice] = useState(true);
  
  // Status changing state
  const [changingStatus, setChangingStatus] = useState(false);
  const [actioningMatchId, setActioningMatchId] = useState<string | null>(null);
  const [successMatch, setSuccessMatch] = useState<any | null>(null);
  
  const [hasActiveJob, setHasActiveJob] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Sync dashboard if match responded
  useEffect(() => {
    const handleToastResponse = (e: Event) => {
      const { matchId, action } = (e as CustomEvent).detail;
      if (action === 'accept') {
        const matchedJob = feed.find(item => item.id === matchId);
        if (matchedJob) {
          setSuccessMatch(matchedJob);
        }
        setActiveTab('accepted');
      } else {
        setFeed(prev => prev.filter(item => item.id !== matchId));
      }
    };

    window.addEventListener('worker:match_responded', handleToastResponse);
    return () => {
      window.removeEventListener('worker:match_responded', handleToastResponse);
    };
  }, [feed]);

  // Listen for real-time invites via Socket.io
  useEffect(() => {
    if (!socket || !user || user.role !== 'worker') return;

    const handleNewInvite = (data: any) => {
      if (activeTab === 'pending') {
        const incomingMatch = {
          id: data.matchId,
          status: 'pending',
          jobId: {
            id: data.jobId,
            title: data.title,
            description: data.description,
            tradeCategory: data.tradeCategory,
            address: data.address,
            urgency: data.urgency,
            scheduledAt: data.scheduledAt,
            status: 'open',
          }
        };

        setFeed((prev) => {
          if (prev.some((m) => m.id === data.matchId)) return prev;
          return [incomingMatch, ...prev];
        });
      }
    };

    const handleJobCancelled = (data: any) => {
      setFeed((prev) => prev.filter((match) => match.jobId?.id !== data.jobId));
    };

    socket.on('new_job_invite', handleNewInvite);
    socket.on('job_cancelled', handleJobCancelled);
    return () => {
      socket.off('new_job_invite', handleNewInvite);
      socket.off('job_cancelled', handleJobCancelled);
    };
  }, [socket, user, activeTab]);

  useEffect(() => {
    if (isInitialized) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'worker') {
        router.push('/customer/dashboard');
      }
    }
  }, [user, isInitialized, router]);

  const fetchFeed = useCallback(async (statusTab: TabType) => {
    if (!user || user.role !== 'worker') return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/jobs/worker/feed', {
        params: { status: statusTab }
      });
      setFeed(data.data.jobs || []);
    } catch (err: any) {
      console.error('Failed to fetch worker feed:', err);
      setError(err?.response?.data?.message || 'Could not fetch your jobs feed.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const checkActiveJobs = useCallback(async () => {
    if (!user || user.role !== 'worker') return;
    try {
      const { data } = await apiClient.get('/jobs/worker/feed', {
        params: { status: 'accepted' }
      });
      setHasActiveJob(data.data.jobs && data.data.jobs.length > 0);
    } catch (err) {
      console.error('Failed to check active jobs:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role === 'worker') {
      checkActiveJobs();
    }
  }, [user, checkActiveJobs]);

  useEffect(() => {
    if (user && user.role === 'worker') {
      fetchFeed(activeTab);
    }
  }, [user, activeTab, fetchFeed]);

  const handleAvailabilityChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || changingStatus) return;
    const targetStatus: AvailabilityType = e.target.checked ? 'available' : 'unavailable';
    setChangingStatus(true);
    try {
      await apiClient.patch('/workers/me/availability', {
        availability: targetStatus
      });
      updateUser({ availability: targetStatus });
    } catch (err: any) {
      console.error('Failed to update availability:', err);
    } finally {
      setChangingStatus(false);
    }
  };

  const handleMatchResponse = async (matchId: string, action: 'accept' | 'decline') => {
    setActioningMatchId(matchId);
    try {
      await apiClient.post(`/jobs/worker/matches/${matchId}/respond`, {
        action
      });
      
      if (action === 'accept') {
        const matchedJob = feed.find(item => item.id === matchId);
        setSuccessMatch(matchedJob);
        setHasActiveJob(true);
        setActiveTab('accepted');
      } else {
        setFeed(prev => prev.filter(item => item.id !== matchId));
      }
    } catch (err: any) {
      console.error('Failed to respond to match invite:', err);
      alert(err?.response?.data?.message || 'Could not respond to job invite.');
    } finally {
      setActioningMatchId(null);
    }
  };

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
    setHasActiveJob(false);
    fetchFeed(activeTab);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!isInitialized || !user || user.role !== 'worker') {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 min-h-screen">
        <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isAvailable = user.availability === 'available';

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      
      {/* ─── Left Sidebar Navigation ────────────────────────────────────────── */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800 relative z-20">
        <div className="flex flex-col flex-1 p-5 space-y-6 text-left">
          
          {/* Logo */}
          <div className="flex items-center gap-3 select-none">
            <div className="w-8 h-8 bg-accent-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-base">C</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-white leading-none">Crewora</h2>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Worker Portal</span>
            </div>
          </div>

          {/* Profile Card Summary */}
          <div className="flex items-center gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-700/35">
            <div className="w-10 h-10 rounded-full overflow-hidden relative bg-slate-100 shrink-0">
              <img 
                src={user.profilePhoto || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120"} 
                alt="Worker Portrait" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-left min-w-0 select-none">
              <span className="block text-xs font-extrabold text-white truncate">{user.name}</span>
              <span className="block text-[9px] text-[#10b981] font-bold uppercase tracking-wider flex items-center gap-0.5 mt-0.5">
                <CheckCircle2 size={10} className="fill-[#10b981] text-slate-900 border-none" />
                Verified Specialist
              </span>
            </div>
          </div>

          {/* View New Leads Button */}
          <button 
            onClick={() => setActiveTab('pending')}
            className="w-full bg-accent-600 hover:bg-accent-700 text-white font-extrabold text-xs py-3 rounded-lg shadow-sm border-none outline-none transition-all active:scale-97 select-none"
          >
            View New Leads
          </button>

          {/* Navigation links */}
          <nav className="flex-1 space-y-1 pt-1">
            <button 
              onClick={() => setActiveTab('pending')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-extrabold text-xs transition-all text-left ${activeTab === 'pending' ? 'bg-accent-600 text-white' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <LayoutDashboard size={14} />
              <span>Dashboard</span>
            </button>
            <button 
              onClick={() => setActiveTab('accepted')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-extrabold text-xs transition-all text-left ${activeTab === 'accepted' ? 'bg-accent-600 text-white' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <HardHat size={14} />
              <span>Active Jobs</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs transition-all text-left">
              <Phone size={14} />
              <span>Messages</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs transition-all text-left">
              <CheckCircle2 size={14} />
              <span>Verification</span>
            </button>
            <button 
              onClick={() => router.push('/worker/profile')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs transition-all text-left"
            >
              <Settings size={14} />
              <span>Settings</span>
            </button>
          </nav>

          {/* Help Center */}
          <div className="pt-2 text-left select-none">
            <Link href="#" className="flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white">
              <Info size={14} />
              <span>Help Center</span>
            </Link>
          </div>

        </div>

        {/* Footer Logout */}
        <div className="p-5 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-rose-950/20 text-rose-400 hover:text-rose-300 font-bold text-xs transition-all text-left border-none outline-none bg-transparent"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Content Pane ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Row with status switch toggle */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-8 shrink-0 relative z-10 select-none">
          <div className="text-left">
            <h1 className="text-base font-extrabold text-slate-850">
              Hello, <span className="text-slate-900">{user.name.split(' ')[0]}</span>
            </h1>
          </div>

          {/* Available toggle switch */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-extrabold tracking-tight uppercase ${isAvailable ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              <span>{isAvailable ? 'Available' : 'Offline'}</span>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={isAvailable}
                onChange={handleAvailabilityChange}
                disabled={changingStatus}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-accent-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </header>

        {/* Scrollable Container */}
        <main className="flex-1 overflow-y-auto p-8 text-left space-y-6 max-w-5xl">
          
          {/* Complete profile alert notice (Mockup 7 Alert banner) */}
          {showProfileNotice && (
            <div className="bg-blue-50 border border-blue-150 rounded-2xl p-4 flex justify-between items-center text-blue-950 select-none animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Info size={14} className="stroke-[2.5]" />
                </div>
                <div className="text-xs font-semibold">
                  Complete your profile to receive more job requests &rarr;{' '}
                  <Link href="/worker/profile" className="text-blue-700 hover:underline font-extrabold">
                    Complete Now
                  </Link>
                </div>
              </div>
              <button 
                onClick={() => setShowProfileNotice(false)}
                className="text-blue-400 hover:text-blue-600 font-extrabold border-none outline-none bg-transparent"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Active Invitation Success Banner */}
          {successMatch && (
            <div className="bg-emerald-50 border border-emerald-150 rounded-2xl p-4 flex gap-3 text-emerald-950 animate-fadeIn">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-extrabold block">Job Match Confirmed!</span>
                <p className="mt-0.5 text-slate-500">
                  You matched for &quot;{successMatch.jobId?.title}&quot;. Get in touch with the client to schedule details.
                </p>
                <button 
                  onClick={() => setSuccessMatch(null)} 
                  className="mt-2 text-accent-600 font-bold hover:underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Opportunities Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-slate-200/60 pb-3">
              <div className="text-left select-none">
                <h2 className="text-lg font-extrabold text-[#0b1528] tracking-tight">Job Opportunities Near You</h2>                    <p className="text-xs text-slate-400 mt-0.5">Based on your skills and location ({user.city || 'Mumbai'})</p>
              </div>
              <button className="flex items-center gap-1.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 font-extrabold text-xs px-3.5 py-2 rounded-lg transition-colors border-none outline-none">
                <SlidersHorizontal size={12} />
                <span>Filter Preferences</span>
              </button>
            </div>

            {/* List */}
            <div className="space-y-4">
              
              {loading ? (
                <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center animate-pulse space-y-3">
                  <div className="h-4 bg-slate-100 rounded w-1/3 mx-auto"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/2 mx-auto"></div>
                </div>
              ) : feed.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                    <HardHat size={24} className="text-slate-300" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-slate-700">No job opportunities right now</h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                      New job requests matching your skills will appear here in real-time. Stay available to get matched faster.
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Make sure your profile is complete and skills are up to date{' '}
                    <Link href="/worker/profile" className="text-accent-600 hover:text-accent-700 font-bold hover:underline">
                      in your Settings
                    </Link>
                    .
                  </p>
                </div>
              ) : (
                feed.map((match) => {
                  const job = match.jobId;
                  if (!job) return null;

                  return (
                    <div 
                      key={match.id} 
                      className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col md:flex-row justify-between gap-6 shadow-sm hover:border-slate-350 transition-colors"
                    >
                      <div className="flex-1 space-y-4 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider capitalize">
                            {job.tradeCategory}
                          </span>
                          <span className={`text-[9px] font-black border px-2 py-0.5 rounded-full uppercase tracking-wider select-none ${job.urgency === 'asap' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                            {job.urgency}
                          </span>
                          {job.scheduledAt && (
                            <span className="text-[9px] text-slate-400 font-bold flex items-center gap-0.5">
                              <Calendar size={10} /> {new Date(job.scheduledAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-base font-extrabold text-slate-800 leading-snug">{job.title}</h3>
                          <div className="flex flex-wrap gap-4 text-[10px] text-slate-400 font-bold">
                            <span className="flex items-center gap-0.5"><MapPin size={11} /> {job.address}</span>
                            {job.customer && (
                              <span className="flex items-center gap-0.5">
                                <User size={11} /> Client: <strong className="text-slate-650 font-extrabold">{job.customer.name}</strong>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl bg-slate-50 border border-slate-100 p-3 rounded-lg">
                            {job.description}
                          </p>
                        </div>

                        {/* If accepted, show client phone detail */}
                        {activeTab === 'accepted' && job.customer && (
                          <div className="pt-2 flex gap-3 select-none">
                            <a
                              href={`tel:${job.customer.phone}`}
                              className="flex items-center gap-1.5 py-2 px-4 rounded-lg bg-slate-850 hover:bg-slate-900 text-white font-bold text-xs"
                            >
                              <Phone size={12} />
                              <span>Call Customer ({job.customer.phone})</span>
                            </a>
                            <button
                              onClick={() => handleWorkDoneClick(job.id)}
                              className="flex items-center gap-1.5 py-2 px-4 rounded-lg bg-accent-600 hover:bg-accent-700 text-white font-bold text-xs"
                            >
                              <Check size={12} className="stroke-[2.5]" />
                              <span>Work Done</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Accept/Decline triggers */}
                      {activeTab === 'pending' && (
                        <div className="shrink-0 flex md:flex-col justify-end gap-2.5 md:pt-4 select-none">
                          <button
                            onClick={() => handleMatchResponse(match.id, 'decline')}
                            disabled={actioningMatchId !== null}
                            className="flex-1 md:flex-none border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 font-extrabold text-xs px-5 py-3 rounded-lg transition-colors border-none outline-none"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleMatchResponse(match.id, 'accept')}
                            disabled={actioningMatchId !== null || hasActiveJob}
                            className="flex-1 md:flex-none bg-accent-600 hover:bg-accent-700 disabled:bg-accent-400 text-white font-extrabold text-xs px-5 py-3 rounded-lg shadow-sm transition-all border-none outline-none"
                          >
                            Accept Job
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

            </div>

            {/* Footer update details text */}
            <div className="pt-4 text-center select-none">
              <p className="text-xs text-slate-400">
                Looking for more jobs in other categories?{' '}
                <Link href="/worker/profile" className="text-accent-600 hover:text-accent-700 font-bold hover:underline">
                  Update your Profile Skills
                </Link>
              </p>
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
