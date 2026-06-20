'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  HardHat, MapPin, 
  X, CheckCircle2, User, Info, Settings, LogOut, SlidersHorizontal, ShieldCheck,
  LayoutDashboard, Clock, MessageSquare
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
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [showProfileNotice, setShowProfileNotice] = useState(true);
  
  // Status changing state
  const [changingStatus, setChangingStatus] = useState(false);
  const [actioningMatchId, setActioningMatchId] = useState<string | null>(null);
  
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

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
    try {
      const { data } = await apiClient.get('/jobs/worker/feed', {
        params: { status: statusTab }
      });
      setFeed(data.data.jobs || []);
    } catch (err: any) {
      console.error('Failed to fetch worker feed:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

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

  const handleFeedbackSubmit = async (rating: number, comment: string) => {
    // Note: feedback logic can be implemented here if needed for workers to rate customers
    console.log('Feedback submitted:', rating, comment);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!isInitialized || !user || user.role !== 'worker') {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 min-h-screen">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isAvailable = user.availability === 'available';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      
      {/* ─── Global Top Header Row ────────────────────────────────────────── */}
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shrink-0 relative z-30">
        {/* Left Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="text-2xl font-black text-[#2563eb] tracking-tighter">Crewora</Link>
        </div>

        {/* Right Info & Toggle */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 font-medium">
              Hello, <strong className="text-slate-900 font-bold">{user.name.split(' ')[0]}</strong>
            </span>
            <div className="w-10 h-10 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200"></div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold tracking-wide uppercase ${isAvailable ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
              <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
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
              <div className="w-12 h-6.5 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5.5 after:w-5.5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>
      </header>

      {/* ─── Layout Wrapper below Header ────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* ─── Left Sidebar Navigation ────────────────────────────────────────── */}
        <aside className="w-72 bg-[#F8FAFC] border-r border-slate-200 flex flex-col shrink-0 relative z-20">
          <div className="flex flex-col flex-1 p-6 space-y-8">
            
            {/* Profile Card at Top */}
            <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-full overflow-hidden relative bg-slate-100 shrink-0 border border-slate-200">
                <img 
                  src={user.profilePhoto || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120"} 
                  alt="Worker Portrait" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left min-w-0">
                <span className="block text-sm font-bold text-slate-900 truncate">{user.name}</span>
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Worker Portal</span>
              </div>
            </div>

            {/* View New Leads CTA */}
            <button 
              onClick={() => setActiveTab('pending')}
              className="w-full bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-sm py-4 rounded-xl shadow-md transition-all active:scale-95"
            >
              View New Leads
            </button>

            {/* Navigation links */}
            <nav className="flex-1 space-y-1.5">
              <button 
                onClick={() => setActiveTab('pending')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all text-left ${activeTab === 'pending' ? 'bg-[#2563eb] text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'}`}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </button>
              <button 
                onClick={() => setActiveTab('accepted')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all text-left ${activeTab === 'accepted' ? 'bg-[#2563eb] text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'}`}
              >
                <HardHat size={18} />
                <span>Active Jobs</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-500 hover:bg-white hover:text-slate-900 font-bold text-sm transition-all text-left group">
                <MessageSquare size={18} className="group-hover:text-[#2563eb]" />
                <span>Messages</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-500 hover:bg-white hover:text-slate-900 font-bold text-sm transition-all text-left group">
                <ShieldCheck size={18} className="group-hover:text-[#2563eb]" />
                <span>Verification</span>
              </button>
              <button 
                onClick={() => router.push('/worker/profile')}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-500 hover:bg-white hover:text-slate-900 font-bold text-sm transition-all text-left group"
              >
                <Settings size={18} className="group-hover:text-[#2563eb]" />
                <span>Settings</span>
              </button>
            </nav>

            {/* Help Center & Sign Out */}
            <div className="pt-6 border-t border-slate-200 space-y-2">
              <Link href="#" className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-500 hover:bg-white hover:text-slate-900 font-bold text-sm transition-all">
                <Info size={18} />
                <span>Help Center</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-rose-500 hover:bg-rose-50 font-bold text-sm transition-all text-left"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>

          </div>
        </aside>

        {/* ─── Main Content Pane ──────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          
          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            <main className="p-10 space-y-10 max-w-6xl w-full mx-auto flex-1">
              
              {/* Complete profile alert notice */}
              {showProfileNotice && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex justify-between items-center animate-fadeIn shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-[#2563eb] flex items-center justify-center shrink-0">
                      <Info size={20} className="stroke-[2.5]" />
                    </div>
                    <div className="text-sm font-medium text-blue-900">
                      Complete your profile to receive more job requests. <Link href="/worker/profile" className="text-[#2563eb] hover:underline font-bold ml-1">Complete Now &rarr;</Link>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowProfileNotice(false)}
                    className="text-blue-400 hover:text-blue-600 transition-colors p-1"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}

              {/* Opportunities Section */}
              <div className="space-y-8">
                <div className="flex justify-between items-end border-b border-slate-100 pb-6">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Job Opportunities Near You</h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Based on your skills and location ({user.city || 'Toronto, ON'})</p>
                  </div>
                  <button className="flex items-center gap-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm">
                    <SlidersHorizontal size={16} />
                    <span>Filter Preferences</span>
                  </button>
                </div>

                {/* List */}
                <div className="grid grid-cols-1 gap-6">
                  
                  {loading ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-12 text-center animate-pulse space-y-4">
                      <div className="h-6 bg-slate-200 rounded-full w-48 mx-auto"></div>
                      <div className="h-4 bg-slate-200 rounded-full w-64 mx-auto"></div>
                    </div>
                  ) : feed.length === 0 ? (
                    <>
                      {/* Mock opportunity card 1 */}
                      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 flex flex-col md:flex-row justify-between gap-8 shadow-sm hover:shadow-md transition-all">
                        <div className="flex-1 space-y-6">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                              <span className="text-rose-500">⚡</span> Urgent
                            </span>
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full uppercase tracking-widest">
                              Plumbing
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 ml-1 uppercase tracking-widest">
                              <Clock size={12} /> 2 hours ago
                            </span>
                          </div>
                          
                          <div className="space-y-4">
                            <h3 className="text-xl font-black text-slate-900 leading-tight">Main Kitchen Leak Fix</h3>
                            <div className="flex flex-wrap gap-6 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                              <span className="flex items-center gap-1.5"><MapPin size={14} className="text-[#2563eb]" /> 3.2 km away</span>
                              <span className="flex items-center gap-1.5">
                                <User size={14} className="text-[#2563eb]" /> Rajesh <CheckCircle2 size={12} className="fill-blue-500 text-white" />
                              </span>
                            </div>
                            <div className="text-sm text-slate-700 leading-relaxed bg-blue-50/50 border-l-4 border-[#2563eb] p-6 rounded-r-2xl italic font-medium">
                              &quot;Kitchen sink is leaking heavily and needs immediate attention. Water is starting to pool on the floor.&quot;
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-col justify-center gap-3 min-w-[160px]">
                          <button className="bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-sm py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-95">Accept Job</button>
                          <button className="border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500 font-bold text-sm py-4 rounded-2xl transition-all">Decline</button>
                        </div>
                      </div>

                      {/* Mock opportunity card 2 */}
                      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 flex flex-col md:flex-row justify-between gap-8 shadow-sm hover:shadow-md transition-all">
                        <div className="flex-1 space-y-6">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full uppercase tracking-widest">
                              Electrician
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 ml-1 uppercase tracking-widest">
                              <Clock size={12} /> 5 hours ago
                            </span>
                          </div>
                          
                          <div className="space-y-4">
                            <h3 className="text-xl font-black text-slate-900 leading-tight">Light Fixture Installation</h3>
                            <div className="flex flex-wrap gap-6 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                              <span className="flex items-center gap-1.5"><MapPin size={14} className="text-[#2563eb]" /> 1.5 km away</span>
                              <span className="flex items-center gap-1.5">
                                <User size={14} className="text-[#2563eb]" /> Sarah <CheckCircle2 size={12} className="fill-blue-500 text-white" />
                              </span>
                            </div>
                            <div className="text-sm text-slate-700 leading-relaxed bg-blue-50/50 border-l-4 border-[#2563eb] p-6 rounded-r-2xl italic font-medium">
                              &quot;Install 3 new pendant lights in a dining room. Fixtures are already purchased. Requires basic wiring check.&quot;
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-col justify-center gap-3 min-w-[160px]">
                          <button className="bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-sm py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-95">Accept Job</button>
                          <button className="border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500 font-bold text-sm py-4 rounded-2xl transition-all">Decline</button>
                        </div>
                      </div>
                    </>
                  ) : (
                    feed.map((match) => {
                      const job = match.jobId;
                      if (!job) return null;

                      return (
                        <div 
                          key={match.id} 
                          className="bg-white rounded-[2rem] border border-slate-200 p-8 flex flex-col md:flex-row justify-between gap-8 shadow-sm hover:shadow-md transition-all"
                        >
                          <div className="flex-1 space-y-6">
                            <div className="flex flex-wrap items-center gap-3">
                              {job.urgency === 'asap' && (
                                <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                                  ⚡ Urgent
                                </span>
                              )}
                              <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full uppercase tracking-widest capitalize">
                                {job.tradeCategory}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 ml-1 uppercase tracking-widest">
                                <Clock size={12} /> {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            
                            <div className="space-y-4">
                              <h3 className="text-xl font-black text-slate-900 leading-tight">{job.title}</h3>
                              <div className="flex flex-wrap gap-6 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                                <span className="flex items-center gap-1.5 truncate max-w-[200px] text-ellipsis overflow-hidden whitespace-nowrap"><MapPin size={14} className="text-[#2563eb]" /> {job.address}</span>
                                <span className="flex items-center gap-1.5">
                                  <User size={14} className="text-[#2563eb]" /> {job.customer?.name || 'Customer'} <CheckCircle2 size={12} className="fill-blue-500 text-white" />
                                </span>
                              </div>
                              <div className="text-sm text-slate-700 leading-relaxed bg-blue-50/50 border-l-4 border-[#2563eb] p-6 rounded-r-2xl italic font-medium">
                                &quot;{job.description}&quot;
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex flex-col justify-center gap-3 min-w-[160px]">
                            <button 
                              onClick={() => handleMatchResponse(match.id, 'accept')}
                              disabled={actioningMatchId === match.id}
                              className="bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-sm py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
                            >
                              {actioningMatchId === match.id ? 'Processing...' : 'Accept Job'}
                            </button>
                            <button 
                              onClick={() => handleMatchResponse(match.id, 'decline')}
                              disabled={actioningMatchId === match.id}
                              className="border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500 font-bold text-sm py-4 rounded-2xl transition-all disabled:opacity-50"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="text-center pt-8 border-t border-slate-100">
                  <p className="text-sm text-slate-400 italic font-medium">
                    Looking for more jobs in other categories? <Link href="/worker/profile" className="text-[#2563eb] hover:underline font-bold">Update your Profile Skills</Link>
                  </p>
                </div>
              </div>
            </main>

            {/* Global Footer */}
            <footer className="bg-[#0B1528] text-white py-12 px-10 shrink-0 select-none">
              <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="text-left space-y-2">
                  <div className="text-xl font-black tracking-tighter">Crewora</div>
                  <p className="text-slate-400 text-xs font-medium">© 2026 Crewora. All rights reserved.</p>
                </div>
                
                <nav className="flex flex-wrap justify-center gap-8 text-xs font-bold uppercase tracking-widest">
                  <Link href="#" className="text-slate-400 hover:text-white transition-colors">Trust & Safety</Link>
                  <Link href="#" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link>
                  <Link href="#" className="text-slate-400 hover:text-white transition-colors">Terms of Service</Link>
                  <Link href="#" className="text-slate-400 hover:text-white transition-colors">Insurance</Link>
                  <Link href="#" className="text-slate-400 hover:text-white transition-colors">Support</Link>
                </nav>
              </div>
            </footer>
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
