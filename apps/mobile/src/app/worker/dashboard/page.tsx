'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Check, HardHat, Calendar, MapPin, Phone, 
  X, CheckCircle2, User, RefreshCw, Star, Info 
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@crewora/api-client';
import { Badge } from '@crewora/ui';
import { Button } from '@crewora/ui';
import { EmptyState } from '@crewora/ui';
import { ErrorState } from '@crewora/ui';
import { JobCardSkeleton } from '@crewora/ui';
import { useSocket } from '@/contexts/SocketContext';
import { FeedbackModal } from '@crewora/ui';

type AvailabilityType = 'available' | 'unavailable' | 'on_a_job';
type TabType = 'pending' | 'accepted';

export default function WorkerDashboard() {
  const { user, isInitialized, updateUser } = useAuthStore();
  const socket = useSocket();
  const router = useRouter();

  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  
  // Status changing state
  const [changingStatus, setChangingStatus] = useState(false);
  const [actioningMatchId, setActioningMatchId] = useState<string | null>(null);
  const [successMatch, setSuccessMatch] = useState<any | null>(null);
  
  const [hasActiveJob, setHasActiveJob] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Sync dashboard if match was accepted/declined via toast notification
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

  // Listen for real-time invites and updates via Socket.io
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

  const handleAvailabilityChange = async (status: AvailabilityType) => {
    if (!user || changingStatus) return;
    setChangingStatus(true);
    try {
      const { data } = await apiClient.patch('/workers/me/availability', {
        availability: status
      });
      // Update local state store
      updateUser({ availability: status });
    } catch (err: any) {
      console.error('Failed to update availability:', err);
      alert(err?.response?.data?.message || 'Could not update your status.');
    } finally {
      setChangingStatus(false);
    }
  };

  const handleMatchResponse = async (matchId: string, action: 'accept' | 'decline') => {
    setActioningMatchId(matchId);
    try {
      const { data } = await apiClient.post(`/jobs/worker/matches/${matchId}/respond`, {
        action
      });
      
      if (action === 'accept') {
        // Find match object locally to display success
        const matchedJob = feed.find(item => item.id === matchId);
        setSuccessMatch(matchedJob);
        setHasActiveJob(true);
        // Toggle tab to active
        setActiveTab('accepted');
      } else {
        // Just remove from list
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

  if (!isInitialized || !user || user.role !== 'worker') {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-12">
        <JobCardSkeleton />
      </div>
    );
  }

  const getUrgencyColor = (urgency: string) => {
    return urgency === 'asap' 
      ? 'bg-rose-50 text-rose-600 border border-rose-100' 
      : 'bg-slate-50 text-slate-600 border border-slate-100';
  };

  const getStatusColorClasses = (status: string) => {
    switch (status) {
      case 'available':
        return { bg: 'bg-emerald-500', text: 'text-emerald-500', pill: 'bg-emerald-50 border-emerald-100 text-emerald-700' };
      case 'on_a_job':
        return { bg: 'bg-blue-500', text: 'text-blue-500', pill: 'bg-blue-50 border-blue-100 text-blue-700' };
      default:
        return { bg: 'bg-slate-400', text: 'text-slate-400', pill: 'bg-slate-100 border-slate-200 text-slate-700' };
    }
  };

  const currentStatusClasses = getStatusColorClasses(user.availability);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 animate-fadeIn pb-16">
      {/* Worker Availability Header */}
      <div className="bg-white px-5 py-5 border-b border-slate-100 select-none shadow-sm space-y-4 shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-base font-extrabold text-slate-900">Worker Dashboard</h1>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-slate-400">
              <span>verification: </span>
              <span className="text-emerald-600 capitalize bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                {user.verificationStatus}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/worker/profile')}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm active:scale-95 transition-all"
            >
              <User size={12} className="text-slate-550" />
              <span>Profile</span>
            </button>

            {/* Quick status pill display */}
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase border tracking-wider ${currentStatusClasses.pill}`}>
              <span className={`w-2 h-2 rounded-full ${currentStatusClasses.bg} animate-pulse`} />
              <span>{user.availability === 'unavailable' ? 'Offline' : user.availability.replace(/_/g, ' ')}</span>
            </div>
          </div>
        </div>

        {/* Availability Toggle Segments */}
        <div className="bg-slate-100 rounded-xl p-1 grid grid-cols-3 gap-1 relative z-10">
          {(['available', 'on_a_job', 'unavailable'] as AvailabilityType[]).map((status) => {
            const isSelected = user.availability === status;
            return (
              <button
                key={status}
                onClick={() => handleAvailabilityChange(status)}
                disabled={changingStatus}
                className={`py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-150 ${
                  isSelected 
                    ? status === 'available'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : status === 'on_a_job'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {status === 'unavailable' ? 'Offline' : status.replace(/_/g, ' ')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Jobs Section */}
      <div className="px-5 pt-5 flex-1 flex flex-col min-h-0">
        {/* Switcher Tab Header */}
        <div className="flex border-b border-slate-200 select-none mb-4 shrink-0">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all ${
              activeTab === 'pending'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Incoming Jobs
          </button>
          <button
            onClick={() => setActiveTab('accepted')}
            className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all ${
              activeTab === 'accepted'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            My Jobs
          </button>
        </div>

        {/* Warning Banner if has active job */}
        {activeTab === 'pending' && hasActiveJob && (
          <div className="mb-4 bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 text-amber-950 animate-fadeIn shrink-0 select-none">
            <Info className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <div className="text-xs">
              <span className="font-bold block">Active Job In Progress</span>
              <p className="mt-1 opacity-90">
                You have an active job in progress. You must mark it as <strong>&quot;Work Done&quot;</strong> under the Active Jobs tab before you can accept any new invitations.
              </p>
            </div>
          </div>
        )}

        {/* Dynamic Success Match banner */}
        {successMatch && (
          <div className="mb-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3 text-emerald-950 animate-fadeIn shrink-0 select-none">
            <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
            <div className="text-xs">
              <span className="font-bold block">Job Accepted!</span>
              <p className="mt-1 opacity-90">
                You&apos;re now matched with the customer for &quot;{successMatch.jobId?.title}&quot;. 
                Reach out to them below to coordinate timing and logistics.
              </p>
              <button 
                onClick={() => setSuccessMatch(null)}
                className="mt-2 text-primary-600 font-bold hover:underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Job Matches Feed */}
        <div className="space-y-4 flex-1 overflow-y-auto pb-6 scrollbar-none min-h-0">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <JobCardSkeleton key={i} />)
          ) : error ? (
            <ErrorState message={error} onRetry={() => fetchFeed(activeTab)} />
          ) : feed.length === 0 ? (
            <EmptyState
              icon={HardHat}
              title={
                activeTab === 'pending'
                  ? "No Job Invites Yet"
                  : "No Active Jobs"
              }
              description={
                activeTab === 'pending'
                  ? user.availability !== 'available'
                    ? "Your status is set to Offline or Busy. Switch to Available above to start receiving job invites from nearby customers."
                    : "No jobs match your trade and location right now. We'll notify you the moment a relevant request comes in."
                  : "No active jobs yet. Check the Incoming Jobs tab to review and accept new opportunities."
              }
            />
          ) : (
            feed.map((match) => {
              const job = match.jobId; // This is the mapped job object
              if (!job) return null;
              
              return (
                <div 
                  key={match.id} 
                  className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm line-clamp-1">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider select-none">
                          {job.tradeCategory}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider select-none ${getUrgencyColor(job.urgency)}`}>
                          {job.urgency}
                        </span>
                      </div>
                    </div>
                    {job.scheduledAt && (
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-full select-none">
                        {new Date(job.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                    {job.description}
                  </p>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold select-none pt-1">
                    <MapPin size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{job.address}</span>
                  </div>

                  {/* ACTIVE JOBS TAB: SHOW CLIENT DETAILS & PHONE */}
                  {activeTab === 'accepted' && job.customer && (
                    <div className="mt-3 bg-emerald-50/50 border border-emerald-100/60 rounded-xl p-3 flex flex-col gap-2.5 animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-emerald-600" />
                        <span className="text-xs font-bold text-slate-800">
                          Customer: {job.customer.name}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <a
                          href={`tel:${job.customer.phone}`}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-slate-850 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition-colors text-center select-none"
                        >
                          <Phone size={12} />
                          <span>Call Customer</span>
                        </a>

                        <button
                          onClick={() => handleWorkDoneClick(job.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-accent-600 hover:bg-accent-700 text-white font-bold text-xs shadow-sm transition-colors text-center select-none"
                        >
                          <Check size={12} className="stroke-[2.5]" />
                          <span>Work Done</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* PENDING INVITES TAB: ACCEPT/DECLINE ACTION BUTTONS */}
                  {activeTab === 'pending' && (
                    <div className="flex gap-2.5 pt-2 border-t border-slate-50 select-none">
                      <button
                        onClick={() => handleMatchResponse(match.id, 'decline')}
                        disabled={actioningMatchId !== null}
                        className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600 text-slate-500 font-bold text-xs transition-all duration-150"
                      >
                        <X size={14} />
                        <span>Decline</span>
                      </button>

                      <Button
                        onClick={() => handleMatchResponse(match.id, 'accept')}
                        isLoading={actioningMatchId === match.id}
                        disabled={actioningMatchId !== null || hasActiveJob}
                        variant="primary"
                        leftIcon={<Check size={14} />}
                        className="flex-1 py-2.5 bg-accent-600 hover:bg-accent-700 active:bg-accent-800 text-white text-xs font-bold rounded-xl"
                      >
                        Accept Match
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
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
