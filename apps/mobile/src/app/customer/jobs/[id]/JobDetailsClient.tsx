'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  AlertCircle,
  Phone,
  Trash2,
  ShieldCheck,
  HardHat,
  Info,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/contexts/SocketContext';
import apiClient from '@crewora/api-client';
import type { Job, Worker } from '@crewora/shared';
import { Card } from '@/components/ui/Card';
import { Badge, type BadgeStatus } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/StarRating';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useToast } from '@/hooks/useToast';
import { tradeMeta } from '@/lib/trades';
import { humanize } from '@/lib/format';
import { normalizeError } from '@/lib/api/errors';
import { logError } from '@/lib/log';
import { cn } from '@/theme';

interface MatchView {
  id: string;
  status: BadgeStatus;
  worker?: Partial<Worker> & { name?: string; profilePhoto?: string };
}

interface JobReview {
  rating: number;
  comment?: string;
  createdAt: string;
}

export default function JobDetailsClient() {
  const { user, isInitialized } = useAuthStore();
  const socket = useSocket();
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;
  const { showToast } = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [matches, setMatches] = useState<MatchView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

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
    } catch (err) {
      logError(err, 'fetchJobDetail');
      setError(normalizeError(err).message);
    } finally {
      setLoading(false);
    }
  }, [jobId, user]);

  // Real-time refresh on match events.
  useEffect(() => {
    if (!socket || !user || user.role !== 'customer' || !jobId) return;
    const refresh = (data: { jobId: string }) => {
      if (data.jobId === jobId) fetchData();
    };
    socket.on('job_match_accepted', refresh);
    socket.on('job_matches_updated', refresh);
    return () => {
      socket.off('job_match_accepted', refresh);
      socket.off('job_matches_updated', refresh);
    };
  }, [socket, user, jobId, fetchData]);

  useEffect(() => {
    if (isInitialized) {
      if (!user) router.push('/login');
      else if (user.role !== 'customer') router.push('/worker/dashboard');
    }
  }, [user, isInitialized, router]);

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
      showToast('Job cancelled', 'success');
      fetchData();
    } catch (err) {
      logError(err, 'cancelJob');
      showToast(normalizeError(err).message, 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmitReview = async () => {
    if (rating < 1 || rating > 5) return;
    setSubmittingReview(true);
    try {
      await apiClient.post(`/jobs/${jobId}/review`, {
        rating,
        comment: comment.trim() || undefined,
      });
      showToast('Review submitted. Thank you!', 'success');
      fetchData();
    } catch (err) {
      logError(err, 'submitReview');
      showToast(normalizeError(err).message, 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const Header = (
    <div className="flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3">
      <button
        type="button"
        onClick={() => router.push('/customer/dashboard')}
        aria-label="Back to dashboard"
        className="-ml-1 rounded-full p-1.5 text-slate-600 transition-colors hover:bg-slate-100"
      >
        <ArrowLeft size={20} />
      </button>
      <h1 className="text-base font-bold text-navy">Job Details</h1>
    </div>
  );

  if (!isInitialized || !user || loading) {
    return (
      <div className="flex flex-1 flex-col">
        {Header}
        <div className="p-4">
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex flex-1 flex-col">
        {Header}
        <EmptyState
          icon={AlertCircle}
          title="Couldn't load job"
          description={error || 'Job not found'}
          action={{
            label: 'Back to Dashboard',
            onClick: () => router.push('/customer/dashboard'),
          }}
        />
      </div>
    );
  }

  const { label: tradeLabel, Icon: TradeIcon } = tradeMeta(job.tradeCategory);
  const assignedWorker = job.assignedWorkerId as Worker | undefined;
  const review = (job as Job & { review?: JobReview }).review;
  const isAssigned =
    job.status === 'matched' ||
    job.status === 'in_progress' ||
    job.status === 'completed';

  return (
    <div className="flex flex-1 flex-col">
      {Header}

      <div className="flex-1 space-y-4 p-4 pb-24">
        {/* Core job card */}
        <Card variant="elevated" className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                <TradeIcon size={18} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-bold text-navy">{job.title}</h2>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge variant="neutral">{tradeLabel}</Badge>
                  <Badge variant={job.urgency === 'asap' ? 'warning' : 'neutral'}>
                    {job.urgency === 'asap' ? 'ASAP' : 'Scheduled'}
                  </Badge>
                </div>
              </div>
            </div>
            <Badge status={job.status as BadgeStatus} dot>
              {humanize(job.status)}
            </Badge>
          </div>

          <p className="whitespace-pre-line rounded-xl border border-gray-border bg-gray-light p-3 text-sm leading-relaxed text-gray-body">
            {job.description}
          </p>

          <div className="space-y-2 border-t border-slate-100 pt-3 text-sm text-gray-body">
            {job.location?.address && (
              <div className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0 text-gray-caption" />
                <span>{job.location.address}</span>
              </div>
            )}
            {job.scheduledAt && (
              <div className="flex items-center gap-2">
                <Calendar size={15} className="shrink-0 text-gray-caption" />
                <span>Scheduled for {new Date(job.scheduledAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Cancelled notice */}
        {job.status === 'cancelled' && (
          <Card variant="outlined" className="flex gap-3 border-error/30 bg-error-light/40">
            <Info size={18} className="mt-0.5 shrink-0 text-error" />
            <div className="text-sm">
              <span className="block font-bold text-navy">Job cancelled</span>
              <p className="mt-1 text-gray-body">
                {job.cancellationReason || 'No reason provided.'}
              </p>
            </div>
          </Card>
        )}

        {/* Assigned worker */}
        {isAssigned && assignedWorker && (
          <Card variant="elevated" className="space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-accent-700">
              <ShieldCheck size={15} />
              {job.status === 'completed' ? 'Contractor details' : 'Assigned worker'}
            </div>
            <div className="flex items-center gap-3">
              <Avatar uri={assignedWorker.profilePhoto} name={assignedWorker.name} size="lg" />
              <div>
                <h3 className="text-sm font-bold text-navy">{assignedWorker.name}</h3>
                <p className="mt-0.5 text-xs text-gray-body">
                  Verified {assignedWorker.tradeCategories?.join(', ')}
                </p>
              </div>
            </div>
            {assignedWorker.phone && (
              <>
                <a
                  href={`tel:${assignedWorker.phone}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-600 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-700"
                >
                  <Phone size={16} />
                  Call {assignedWorker.name?.split(' ')[0]}
                </a>
                <p className="text-center text-[11px] text-gray-caption">
                  Align on price and details directly via phone.
                </p>
              </>
            )}
          </Card>
        )}

        {/* Review (completed) */}
        {job.status === 'completed' && assignedWorker && (
          <Card variant="elevated" className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-caption">
              Rate your experience
            </h3>

            {review ? (
              <div className="space-y-2 rounded-xl border border-gray-border bg-gray-light p-4">
                <StarRating value={review.rating} showValue />
                {review.comment ? (
                  <p className="text-sm italic text-gray-body">&quot;{review.comment}&quot;</p>
                ) : (
                  <p className="text-[13px] italic text-gray-caption">No comments written.</p>
                )}
                <span className="block text-right text-[11px] text-gray-caption">
                  Submitted {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-gray-border bg-gray-light py-4">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-caption">
                    Tap to rate
                  </span>
                  <StarRating value={rating} onChange={setRating} size={30} />
                </div>
                <div className="space-y-1">
                  <textarea
                    placeholder="Share feedback on communication, quality, punctuality… (optional)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="w-full resize-y rounded-xl border border-gray-border bg-white p-3 text-sm text-navy outline-none transition-[border-color,box-shadow] focus:border-accent-600 focus:ring-2 focus:ring-accent-100"
                  />
                  <div className="px-1 text-right text-[11px] text-gray-caption">
                    {comment.length}/500
                  </div>
                </div>
                <Button
                  fullWidth
                  onClick={handleSubmitReview}
                  isLoading={submittingReview}
                  disabled={rating === 0}
                >
                  Submit Review
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Matching activity (open) */}
        {job.status === 'open' && (
          <div className="space-y-3">
            <h3 className="px-1 text-xs font-bold uppercase tracking-wide text-gray-caption">
              Applicants ({matches.length})
            </h3>

            {matches.length === 0 ? (
              <Card variant="outlined" className="flex flex-col items-center py-8 text-center">
                <div className="relative mb-4 flex h-20 w-20 items-center justify-center">
                  <span className="absolute inline-flex h-16 w-16 animate-ping rounded-full bg-accent-400/20" />
                  <div className="z-10 flex h-12 w-12 items-center justify-center rounded-full bg-accent-100 text-accent-600">
                    <HardHat size={24} />
                  </div>
                </div>
                <h4 className="text-sm font-bold text-navy">Searching for workers…</h4>
                <p className="mt-1.5 max-w-xs text-[13px] text-gray-body">
                  We&apos;re matching this request with verified {tradeLabel.toLowerCase()}s
                  near you. Updates appear here instantly.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {matches.map((match, i) => (
                  <Card
                    key={match.id}
                    variant="outlined"
                    className="flex animate-fadeInDown items-center justify-between"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        uri={match.worker?.profilePhoto}
                        name={match.worker?.name}
                        size="md"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-navy">
                          {match.worker?.name}
                        </h4>
                        <p className="mt-0.5 text-[11px] text-gray-body">
                          {match.worker?.experienceYears != null
                            ? `${match.worker.experienceYears} yrs exp`
                            : ''}
                          {match.worker?.city ? ` · ${match.worker.city}` : ''}
                        </p>
                      </div>
                    </div>
                    <Badge status={match.status} dot>
                      {humanize(match.status)}
                    </Badge>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cancel */}
        {!['completed', 'cancelled'].includes(job.status) && (
          <Button
            variant="outline"
            fullWidth
            leftIcon={<Trash2 size={16} />}
            onClick={() => setShowCancelModal(true)}
            className={cn('border-error/40 text-error hover:bg-error-light')}
          >
            Cancel Job Request
          </Button>
        )}
      </div>

      <ConfirmationModal
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        title="Cancel job request"
        description="Tell us why so we can improve matching."
        confirmLabel="Cancel Job"
        cancelLabel="Go Back"
        tone="destructive"
        loading={cancelling}
        confirmDisabled={!cancelReason.trim()}
        onConfirm={handleCancelJob}
      >
        <textarea
          placeholder="Reason (e.g. plans changed, fixed it myself, hired offline)…"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          rows={3}
          className="w-full resize-y rounded-xl border border-gray-border bg-white p-3 text-sm text-navy outline-none transition-[border-color,box-shadow] focus:border-error focus:ring-2 focus:ring-red-100"
        />
      </ConfirmationModal>
    </div>
  );
}
