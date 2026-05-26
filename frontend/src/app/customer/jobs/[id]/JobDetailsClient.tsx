'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Calendar, MapPin, AlertCircle, Phone, 
  Trash2, ShieldCheck, User, Star, HardHat, Info 
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/api/client';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { JobCardSkeleton } from '@/components/ui/Skeleton';
import { Job } from '@/types';

export default function JobDetailsClient() {
  const { user, isInitialized } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation State
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (isInitialized) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'customer') {
        router.push('/worker/dashboard');
      }
    }
  }, [user, isInitialized, router]);

  const fetchData = useCallback(async () => {
    if (!jobId || !user || user.role !== 'customer') return;
    setLoading(true);
    setError(null);
    try {
      const [jobRes, matchesRes] = await Promise.all([
        apiClient.get(`/jobs/${jobId}`),
        apiClient.get(`/jobs/${jobId}/matches`),
      ]);
      setJob(jobRes.data.data.job);
      setMatches(matchesRes.data.data.matches || []);
    } catch (err: any) {
      console.error('Failed to fetch job details:', err);
      setError(err?.response?.data?.message || 'Could not fetch job details.');
    } finally {
      setLoading(false);
    }
  }, [jobId, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancelJob = async () => {
    if (!job || !cancelReason.trim()) return;
    setCancelling(true);
    try {
      await apiClient.patch(`/jobs/${jobId}`, {
        status: 'cancelled',
        cancellationReason: cancelReason,
      });
      setShowCancelModal(false);
      fetchData(); // Refresh details
    } catch (err: any) {
      console.error('Failed to cancel job:', err);
      alert(err?.response?.data?.message || 'Could not cancel job.');
    } finally {
      setCancelling(false);
    }
  };

  if (!isInitialized || !user || loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-12 px-6">
        <JobCardSkeleton />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-6 text-center">
        <AlertCircle size={40} className="text-error mb-2" />
        <h3 className="text-lg font-bold text-slate-900">Error Loading Job</h3>
        <p className="text-slate-500 text-sm mt-1 mb-6">{error || 'Job not found'}</p>
        <Button onClick={() => router.push('/customer/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'open': return 'info';
      case 'matched':
      case 'in_progress': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getMatchStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="info">Pending response</Badge>;
      case 'accepted': return <Badge variant="success">Accepted</Badge>;
      case 'declined': return <Badge variant="error">Declined</Badge>;
      case 'expired': return <Badge variant="default">Expired</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const assignedWorker = job.assignedWorkerId as any; // Cast for simplified display

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 animate-fadeIn">
      {/* Top Header */}
      <div className="px-4 h-12 flex items-center bg-white border-b border-slate-100 shrink-0 select-none">
        <button 
          onClick={() => router.push('/customer/dashboard')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={16} />
          <span>Dashboard</span>
        </button>
        <span className="ml-auto mr-auto font-extrabold text-slate-900 text-sm">Job Details</span>
        <div className="w-12"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5 pb-10">
        
        {/* Job Core Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-slate-900">{job.title}</h2>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                <span className="bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">
                  {job.tradeCategory}
                </span>
                <span className="bg-rose-50 text-rose-600 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">
                  {job.urgency}
                </span>
              </div>
            </div>
            <Badge variant={getStatusVariant(job.status)}>{job.status}</Badge>
          </div>

          <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 rounded-xl p-3 border border-slate-100">
            {job.description}
          </div>

          {/* Location / Date info */}
          <div className="space-y-2 pt-1 border-t border-slate-50 text-xs text-slate-500 font-medium">
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <span>{job.location?.address}</span>
            </div>
            {job.scheduledAt && (
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-slate-400 shrink-0" />
                <span>Scheduled for: {new Date(job.scheduledAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Cancellation Reason if Cancelled */}
        {job.status === 'cancelled' && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 text-rose-900">
            <Info size={18} className="shrink-0 text-rose-500 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold block">Job Cancelled</span>
              <p className="mt-1 opacity-90">{job.cancellationReason || 'No reason provided.'}</p>
            </div>
          </div>
        )}

        {/* Assigned Worker Info (if matched) */}
        {(job.status === 'matched' || job.status === 'in_progress') && assignedWorker && (
          <div className="bg-white rounded-2xl border-2 border-emerald-500/20 p-5 shadow-sm space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2 text-emerald-700 font-black text-xs uppercase tracking-wider select-none">
              <ShieldCheck size={16} />
              <span>Assigned Worker Found</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 overflow-hidden shrink-0 border border-slate-200">
                {assignedWorker.profilePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={assignedWorker.profilePhoto} alt={assignedWorker.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={24} />
                )}
              </div>
              <div className="text-left">
                <h3 className="font-extrabold text-slate-900 text-sm">{assignedWorker.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verified {assignedWorker.tradeCategories?.join(', ')}
                </p>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-500 font-bold bg-amber-50 pl-1 pr-2 py-0.5 rounded-full w-max select-none">
                  <Star size={10} className="fill-amber-500" />
                  <span>4.9 (42 reviews)</span>
                </div>
              </div>
            </div>

            {/* Quick Action: Call Worker */}
            <div className="pt-2">
              <a 
                href={`tel:${assignedWorker.phone}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md transition-colors"
              >
                <Phone size={16} />
                <span>Call {assignedWorker.name}</span>
              </a>
              <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
                Please align on service price and details directly via phone call.
              </p>
            </div>
          </div>
        )}

        {/* Matchmaker Activity / Interested Workers List */}
        {job.status === 'open' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 select-none">
              Worker Matching Status
            </h3>

            {matches.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center select-none">
                <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-2">
                  <HardHat size={20} />
                </div>
                <h4 className="font-bold text-slate-800 text-xs">Finding matches...</h4>
                <p className="text-[10px] text-slate-400 mt-1">
                  We are notifying verified tradespeople nearby. They should respond shortly.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((match) => (
                  <div key={match.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 overflow-hidden shrink-0 border border-slate-100">
                        {match.worker?.profilePhoto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={match.worker.profilePhoto} alt={match.worker.name} className="w-full h-full object-cover" />
                        ) : (
                          <User size={16} />
                        )}
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-slate-900 text-xs">{match.worker?.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {match.worker?.experienceYears} yrs exp • {match.worker?.city}
                        </p>
                      </div>
                    </div>
                    {getMatchStatusBadge(match.status)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom Actions (e.g. Cancel Job) */}
        {!['completed', 'cancelled'].includes(job.status) && (
          <div className="pt-4 select-none">
            <button
              onClick={() => setShowCancelModal(true)}
              className="flex items-center justify-center gap-1.5 w-full py-3 rounded-xl border-2 border-rose-100 hover:bg-rose-50 text-rose-600 hover:text-rose-700 font-bold text-xs transition-colors"
            >
              <Trash2 size={14} />
              <span>Cancel Job Request</span>
            </button>
          </div>
        )}
      </div>

      {/* Cancellation Modal Overlay */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center md:items-center p-0 md:p-6 animate-fadeIn">
          <div className="bg-white w-full md:max-w-sm rounded-t-3xl md:rounded-2xl p-6 space-y-4 border border-slate-100 shadow-xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-base font-extrabold text-slate-900 text-center md:text-left select-none">
              Cancel Job Request
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed select-none">
              Are you sure you want to cancel this job? Please provide a brief explanation so we can improve matches.
            </p>

            <textarea
              placeholder="Reason for cancellation (e.g., plans changed, fixed it myself, hired offline)..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              required
              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all text-slate-800"
            />

            <div className="flex gap-3 select-none">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
              >
                No, Go Back
              </button>
              <Button
                variant="danger"
                onClick={handleCancelJob}
                isLoading={cancelling}
                disabled={!cancelReason.trim()}
                className="flex-1"
                size="sm"
              >
                Cancel Job
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
