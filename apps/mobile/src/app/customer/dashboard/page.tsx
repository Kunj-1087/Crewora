'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  MapPin,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/contexts/SocketContext';
import apiClient from '@crewora/api-client';
import type { Job } from '@crewora/shared';
import { FeedbackModal } from '@crewora/ui';
import { Card } from '@/components/ui/Card';
import { Badge, type BadgeStatus } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { tradeMeta } from '@/lib/trades';
import { timeAgo, humanize } from '@/lib/format';
import { logError } from '@/lib/log';
import { cn } from '@/theme';

const MAX_PREVIEW = 3;

export default function CustomerDashboard() {
  const { user, isInitialized } = useAuthStore();
  const socket = useSocket();
  const router = useRouter();
  const { showToast } = useToast();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Real-time: worker accepted a job.
  useEffect(() => {
    if (!socket || !user || user.role !== 'customer') return;
    const handleJobAccepted = (data: { jobId: string }) => {
      setJobs((prev) =>
        prev.map((job) =>
          job.id === data.jobId ? ({ ...job, status: 'matched' } as Job) : job
        )
      );
    };
    socket.on('job_match_accepted', handleJobAccepted);
    return () => {
      socket.off('job_match_accepted', handleJobAccepted);
    };
  }, [socket, user]);

  useEffect(() => {
    if (isInitialized) {
      if (!user) router.push('/login');
      else if (user.role !== 'customer') router.push('/worker/dashboard');
    }
  }, [user, isInitialized, router]);

  const fetchJobs = useCallback(async () => {
    if (!user || user.role !== 'customer') return;
    try {
      const { data } = await apiClient.get('/jobs');
      setJobs(data.data.jobs || []);
    } catch (err) {
      logError(err, 'fetchJobs');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role === 'customer') fetchJobs();
  }, [user, fetchJobs]);

  const handleWorkDoneClick = (jobId: string) => {
    setSelectedJobId(jobId);
    setIsFeedbackOpen(true);
  };

  const handleFeedbackSubmit = async (rating: number, comment: string) => {
    if (!selectedJobId) return;
    try {
      await apiClient.post(`/jobs/${selectedJobId}/complete`, { rating, comment });
      showToast('Thanks for your feedback!', 'success');
      fetchJobs();
    } catch (err) {
      logError(err, 'completeJob');
      showToast('Could not submit feedback. Please try again.', 'error');
    }
  };

  if (!isInitialized || !user || user.role !== 'customer') {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-100 border-t-accent-600" />
      </div>
    );
  }

  const activeCount = jobs.filter(
    (j) => j.status === 'matched' || j.status === 'in_progress'
  ).length;
  const completedCount = jobs.filter((j) => j.status === 'completed').length;
  const preview = jobs.slice(0, MAX_PREVIEW);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pb-24">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-navy">
            Hello, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-body">Manage your jobs and matches.</p>
        </div>
        <button
          type="button"
          onClick={fetchJobs}
          aria-label="Refresh"
          className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : undefined} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card variant="outlined" padding="md">
          <p className="text-2xl font-bold text-navy">{activeCount}</p>
          <p className="text-xs font-medium text-gray-body">Active jobs</p>
        </Card>
        <Card variant="outlined" padding="md">
          <p className="text-2xl font-bold text-navy">{completedCount}</p>
          <p className="text-xs font-medium text-gray-body">Completed</p>
        </Card>
      </div>

      {/* Post a problem CTA */}
      <Card
        variant="elevated"
        pressable
        onClick={() => router.push('/customer/jobs/create')}
        className="flex items-center gap-4 bg-gradient-to-br from-accent-600 to-accent-700 text-white"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
          <Plus size={24} className="stroke-[2.5]" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-bold">Post a Problem</h2>
          <p className="text-xs text-white/80">
            Describe your issue and get matched with verified pros.
          </p>
        </div>
        <ChevronRight size={20} className="text-white/70" />
      </Card>

      {/* Recent requests */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-body">
            My Recent Requests
          </h2>
          {jobs.length > MAX_PREVIEW && (
            <button
              type="button"
              onClick={() => router.push('/customer/jobs')}
              className="text-xs font-semibold text-accent-700 hover:underline"
            >
              See All
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            preset="no-requests"
            action={{
              label: 'Post a Problem',
              onClick: () => router.push('/customer/jobs/create'),
            }}
          />
        ) : (
          <div className="space-y-3">
            {preview.map((job, i) => {
              const { label, Icon } = tradeMeta(job.tradeCategory);
              const canComplete =
                job.status === 'matched' || job.status === 'in_progress';
              return (
                <Card
                  key={job.id}
                  variant="outlined"
                  pressable
                  onClick={() => router.push(`/customer/jobs/${job.id}`)}
                  className="animate-fadeInDown"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                      <Icon size={18} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-accent-700">
                          {label}
                        </span>
                        <Badge status={job.status as BadgeStatus} dot>
                          {humanize(job.status)}
                        </Badge>
                      </div>
                      <h3 className="mt-1 line-clamp-2 text-sm font-bold text-navy">
                        {job.title}
                      </h3>
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-gray-body">
                        {job.location?.address && (
                          <span className="flex min-w-0 items-center gap-1">
                            <MapPin size={11} className="shrink-0" />
                            <span className="truncate">{job.location.address}</span>
                          </span>
                        )}
                        <span className="shrink-0">{timeAgo(job.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {canComplete && (
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        leftIcon={<CheckCircle2 size={16} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWorkDoneClick(job.id);
                        }}
                      >
                        Mark Work Done
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  );
}
