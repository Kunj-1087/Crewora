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
import { StyleSheet, theme } from '@/theme';

interface MatchApplicant {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  locality: string;
  skills: string[];
  profilePhoto?: string;
  status: 'pending' | 'accepted' | 'declined';
  matchId: string;
}

export default function JobDetailsClient() {
  const { user, isInitialized } = useAuthStore();
  const socket = useSocket();
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;
  const { showToast } = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Real applicants from API
  const [applicants, setApplicants] = useState<MatchApplicant[]>([]);
  const [acceptedWorkerId, setAcceptedWorkerId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!jobId || !user || user.role !== 'customer') return;
    setLoading(true);
    setError(null);
    try {
      const [jobRes, matchesRes] = await Promise.all([
        apiClient.get(`/jobs/${jobId}`),
        apiClient.get(`/jobs/${jobId}/matches`),
      ]);
      
      const jobData = jobRes.data.data.job;
      setJob(jobData);
      
      // Transform matches into applicant format for the UI
      const rawMatches = matchesRes.data.data.matches || [];
      const mapped: MatchApplicant[] = rawMatches.map((m: any) => {
        const w = m.worker || m.workerId || {};
        return {
          id: w.id || m.workerId,
          matchId: m.id,
          name: w.name || 'Unknown',
          rating: 0,
          reviewCount: 0,
          experienceYears: w.experienceYears || 0,
          locality: w.city || w.city || '',
          skills: w.tradeCategories || [],
          profilePhoto: w.profilePhoto || '',
          status: m.status === 'accepted' ? 'accepted' : m.status === 'declined' ? 'declined' : 'pending',
        };
      });
      setApplicants(mapped);
      
      // If the job already has an assigned worker
      if (jobData.assignedWorkerId) {
        const assignedId = typeof jobData.assignedWorkerId === 'object'
          ? jobData.assignedWorkerId.id
          : jobData.assignedWorkerId;
        setAcceptedWorkerId(assignedId);
      }
    } catch (err) {
      logError(err, 'fetchJobDetail');
      setError(normalizeError(err).message);
    } finally {
      setLoading(false);
    }
  }, [jobId, user]);

  // Real-time refresh
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
    if (user && user.role === 'customer') {
      fetchData();
    }
  }, [user, fetchData]);

  const handleCancelJob = async () => {
    if (!job || !cancelReason.trim()) return;
    setCancelling(true);
    try {
      await apiClient.patch(`/jobs/${jobId}`, {
        status: 'cancelled',
        cancellationReason: cancelReason,
      });
      setShowCancelModal(false);
      showToast('Job cancelled successfully', 'success');
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

  const handleAcceptApplicant = async (applicantId: string, applicantName: string) => {
    try {
      // Optimistic UI update
      setAcceptedWorkerId(applicantId);
      setApplicants(prev =>
        prev.map(app => ({
          ...app,
          status: app.id === applicantId ? 'accepted' : 'declined',
        }))
      );
      
      // Assign worker via API — backend will update match statuses and decline others
      await apiClient.patch(`/jobs/${jobId}`, {
        assignedWorkerId: applicantId,
        status: 'matched',
      });
      
      showToast(`${applicantName} assigned! Contact them now.`, 'success');
      fetchData();
    } catch (err) {
      logError(err, 'acceptApplicant');
      // Revert optimistic update
      fetchData();
      showToast('Could not assign worker. Please try again.', 'error');
    }
  };

  const handleDeclineApplicant = (applicantId: string) => {
    // Optimistic UI — just hide from pending list
    setApplicants(prev =>
      prev.map(app => {
        if (app.id === applicantId) {
          return { ...app, status: 'declined' };
        }
        return app;
      })
    );
    showToast('Applicant declined', 'info');
  };

  // Header with truncated title if it is longer than 24 chars
  const truncatedTitle = job?.title 
    ? job.title.length > 24 
      ? `${job.title.substring(0, 24)}...`
      : job.title
    : 'Job Details';

  const Header = (
    <div style={styles.header}>
      <button
        type="button"
        onClick={() => router.push('/customer/dashboard')}
        aria-label="Back to dashboard"
        style={styles.backButton}
      >
        <ArrowLeft size={20} style={{ color: theme.colors.secondary }} />
      </button>
      <h1 style={styles.headerTitle}>{truncatedTitle}</h1>
    </div>
  );

  if (!isInitialized || !user || loading) {
    return (
      <div style={styles.outerContainer}>
        {Header}
        <div style={{ padding: theme.spacing[4] }}>
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div style={styles.outerContainer}>
        {Header}
        <div style={styles.errorStateCard}>
          <div style={styles.errorIconBg}>
            <AlertCircle size={32} style={{ color: theme.colors.error }} />
          </div>
          <h3 style={styles.errorTitleText}>{"Couldn't load job details"}</h3>
          <p style={styles.errorSubtitleText}>{error || 'Job not found'}</p>
          <div style={styles.errorActionsRow}>
            <button
              type="button"
              onClick={() => router.push('/customer/dashboard')}
              style={styles.errorBackBtn}
            >
              Go Back
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                fetchData();
              }}
              style={styles.errorRetryBtn}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { label: tradeLabel, Icon: TradeIcon } = tradeMeta(job.tradeCategory);
  
  const jobBadgeStatus = job.status as BadgeStatus;

  const isAssigned =
    job.status === 'matched' ||
    job.status === 'in_progress' ||
    job.status === 'completed' ||
    acceptedWorkerId !== null;

  const assignedWorker = job.assignedWorkerId as Worker | undefined;

  return (
    <div style={styles.outerContainer}>
      {Header}

      <div style={styles.scrollableContent}>
        {/* Core Problem Details Card */}
        <Card variant="elevated" style={styles.detailsCard}>
          <div style={styles.cardHeaderRow}>
            <div style={styles.cardHeaderLeft}>
              <div style={styles.categoryIconBg}>
                <TradeIcon size={20} strokeWidth={1.5} style={{ color: theme.colors.primary }} />
              </div>
              <div>
                <h2 style={styles.problemTitle}>{job.title}</h2>
                <div style={styles.badgeRow}>
                  <Badge variant="neutral">{tradeLabel}</Badge>
                  <Badge variant={job.urgency === 'asap' ? 'warning' : 'neutral'}>
                    {job.urgency === 'asap' ? 'ASAP' : 'Scheduled'}
                  </Badge>
                </div>
              </div>
            </div>
            <Badge status={jobBadgeStatus} dot>
              {humanize(job.status)}
            </Badge>
          </div>

          <p style={styles.problemDescription}>{job.description}</p>

          <div style={styles.metaDividerLine} />

          <div style={styles.metaBlock}>
            {job.location?.address && (
              <div style={styles.metaRowItem}>
                <MapPin size={15} style={{ color: theme.colors.textSecondary, marginRight: 8, flexShrink: 0 }} />
                <span style={styles.metaValueText}>{job.location.address}</span>
              </div>
            )}
            <div style={styles.metaRowItem}>
              <Calendar size={15} style={{ color: theme.colors.textSecondary, marginRight: 8, flexShrink: 0 }} />
              <span style={styles.metaValueText}>
                Posted on {new Date(job.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </Card>

        {/* Assigned Worker Info (Phone unlock when accepted) */}
        {isAssigned && (
          <Card variant="elevated" style={styles.assignedCard}>
            <div style={styles.assignedHeaderLabel}>
              <ShieldCheck size={16} style={{ color: theme.colors.success, marginRight: 6 }} />
              <span style={styles.assignedHeaderText}>
                {job.status === 'completed' ? 'Partner details' : 'Assigned local partner'}
              </span>
            </div>
            
            <div style={styles.assignedWorkerBody}>
              <Avatar 
                uri={assignedWorker?.profilePhoto || undefined} 
                name={assignedWorker?.name || applicants.find(a => a.id === acceptedWorkerId)?.name || 'Service Partner'} 
                size="lg" 
              />
              <div style={{ marginLeft: theme.spacing[3] }}>
                <h3 style={styles.assignedWorkerName}>
                  {assignedWorker?.name || applicants.find(a => a.id === acceptedWorkerId)?.name}
                </h3>
                <p style={styles.assignedWorkerSub}>
                  Verified {assignedWorker?.tradeCategories?.join(', ') || tradeLabel} Specialist
                </p>
              </div>
            </div>

            <a
              href={`tel:${assignedWorker?.phone || '+91 98765 43210'}`}
              style={styles.callButton}
            >
              <Phone size={16} style={{ color: '#FFFFFF', marginRight: 8 }} />
              <span style={styles.callButtonText}>
                Call { (assignedWorker?.name || applicants.find(a => a.id === acceptedWorkerId)?.name || '').split(' ')[0] }
              </span>
            </a>
            <p style={styles.callReassurance}>
              Coordinate rates, schedules, and materials directly on call.
            </p>
          </Card>
        )}

        {/* Applicants Section */}
        {!isAssigned && (
          <div style={styles.applicantsContainer}>
            <h3 style={styles.applicantsHeading}>
              Available Applicants ({applicants.filter(a => a.status !== 'declined').length})
            </h3>

            {applicants.filter(a => a.status !== 'declined').length === 0 ? (
              <div style={styles.emptyApplicantsCard}>
                <div style={styles.emptyApplicantsIconBg}>
                  <HardHat size={32} style={{ color: theme.colors.textMuted }} />
                </div>
                <h4 style={styles.emptyApplicantsTitle}>No applications yet</h4>
                <p style={styles.emptyApplicantsSubtext}>
                  Providers typically respond within a few hours. We will notify you as soon as they apply!
                </p>
              </div>
            ) : (
              <div style={styles.applicantsList}>
                {applicants.map((applicant) => {
                  const isAccepted = acceptedWorkerId === applicant.id;
                  const isDeclined = applicant.status === 'declined';
                  
                  // Skip rendering completely declined partners in pending state
                  if (isDeclined && !acceptedWorkerId) return null;

                  return (
                    <div
                      key={applicant.id}
                      style={
                        isAccepted
                          ? styles.applicantCardAccepted
                          : isDeclined
                          ? styles.applicantCardDeclined
                          : styles.applicantCard
                      }
                    >
                      <div style={styles.applicantInfoRow}>
                        <Avatar uri={applicant.profilePhoto} name={applicant.name} size="md" />
                        <div style={{ marginLeft: theme.spacing[3], flex: 1 }}>
                          <h4 style={styles.applicantNameText}>{applicant.name}</h4>
                          <div style={styles.ratingRow}>
                            <StarRating value={applicant.rating} size={14} />
                            <span style={styles.ratingCountText}>({applicant.reviewCount} reviews)</span>
                          </div>
                          <span style={styles.applicantExpText}>
                            {applicant.experienceYears} Years Exp · {applicant.locality}
                          </span>
                        </div>

                        {isDeclined && (
                          <div style={styles.declinedBadge}>
                            <span style={styles.declinedBadgeText}>Declined</span>
                          </div>
                        )}
                      </div>

                      {/* Skill chips */}
                      <div style={styles.skillsRow}>
                        {applicant.skills.map((skill) => (
                          <span key={skill} style={styles.skillChip}>
                            {skill}
                          </span>
                        ))}
                      </div>

                      {/* Action buttons (only visible if no one has been accepted and applicant is active) */}
                      {!acceptedWorkerId && !isDeclined && (
                        <div style={styles.applicantActionsRow}>
                          <button
                            type="button"
                            onClick={() => router.push(`/workers/${applicant.id}?jobId=${jobId}`)}
                            style={styles.viewProfileBtn}
                          >
                            View Profile
                          </button>
                          
                          <div style={styles.decisionButtons}>
                            <button
                              type="button"
                              onClick={() => handleDeclineApplicant(applicant.id)}
                              style={styles.declineButton}
                            >
                              Decline
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAcceptApplicant(applicant.id, applicant.name)}
                              style={styles.acceptButton}
                            >
                              Accept
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Cancel Job request option */}
        {!['completed', 'cancelled'].includes(job.status) && (
          <div style={styles.cancelSection}>
            <Button
              variant="outline"
              fullWidth
              leftIcon={<Trash2 size={16} />}
              onClick={() => setShowCancelModal(true)}
              style={styles.cancelRequestBtn}
            >
              Cancel Job Request
            </Button>
          </div>
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
          style={styles.cancelTextarea}
        />
      </ConfirmationModal>
    </div>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    backgroundColor: theme.colors.background,
    fontFamily: 'Inter, sans-serif',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    borderBottom: `1px solid ${theme.colors.border}`,
    backgroundColor: '#FFFFFF',
    padding: '12px 16px',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
    borderRadius: theme.radius.full,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  headerTitle: {
    fontSize: theme.typography.size.base,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
    margin: 0,
  },
  scrollableContent: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: theme.spacing[4],
    paddingBottom: 40,
    gap: theme.spacing[4],
    overflowY: 'auto',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.card,
    padding: theme.spacing[4],
    boxShadow: theme.shadows.sm,
  },
  cardHeaderRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'start',
    justifyContent: 'between',
    gap: theme.spacing[3],
  },
  cardHeaderLeft: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'start',
    gap: theme.spacing[3],
    flex: 1,
  },
  categoryIconBg: {
    display: 'flex',
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.primaryLight,
    flexShrink: 0,
  },
  problemTitle: {
    fontSize: theme.typography.size.base,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
    margin: 0,
    lineHeight: theme.typography.lineHeight.tight as any,
  },
  badgeRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing[2],
    marginTop: 6,
  },
  problemDescription: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeight.relaxed as any,
    marginTop: theme.spacing[3],
    marginBottom: 0,
  },
  metaDividerLine: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing[3],
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[4],
  },
  metaBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[2],
  },
  metaRowItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaValueText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.textSecondary,
  },
  assignedCard: {
    backgroundColor: '#FFFFFF',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.card,
    padding: theme.spacing[4],
    boxShadow: theme.shadows.sm,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[3],
  },
  assignedHeaderLabel: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignedHeaderText: {
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.bold as any,
    textTransform: 'uppercase',
    color: theme.colors.success,
  },
  assignedWorkerBody: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignedWorkerName: {
    fontSize: theme.typography.size.base,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
    margin: 0,
  },
  assignedWorkerSub: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.textSecondary,
    margin: 0,
    marginTop: 2,
  },
  callButton: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.success,
    borderRadius: theme.radius.button,
    padding: '12px 20px',
    textDecoration: 'none',
    cursor: 'pointer',
    boxShadow: theme.shadows.sm,
    marginTop: theme.spacing[1],
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.bold as any,
  },
  callReassurance: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'center',
    margin: 0,
  },
  applicantsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[3],
    marginTop: theme.spacing[2],
  },
  applicantsHeading: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.textSecondary,
    margin: 0,
    paddingLeft: theme.spacing[1],
  },
  applicantsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16, // Generous 16px breathing room gap between applicant cards
  },
  applicantCard: {
    backgroundColor: '#FFFFFF',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.card,
    padding: theme.spacing[4],
    boxShadow: theme.shadows.sm,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[3],
    transition: 'border 0.2s',
  },
  applicantCardAccepted: {
    backgroundColor: '#FFFFFF',
    border: `2px solid ${theme.colors.primary}`, // Highlighted state
    borderRadius: theme.radius.card,
    padding: theme.spacing[4],
    boxShadow: theme.shadows.md,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[3],
  },
  applicantCardDeclined: {
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.card,
    padding: theme.spacing[4],
    boxShadow: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[3],
    opacity: 0.6,
  },
  applicantInfoRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  applicantNameText: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
    margin: 0,
  },
  ratingRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingCountText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  applicantExpText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    display: 'block',
    marginTop: 4,
  },
  declinedBadge: {
    backgroundColor: theme.colors.errorLight,
    border: `1px solid ${theme.colors.error}`,
    borderRadius: theme.radius.full,
    padding: '4px 10px',
  },
  declinedBadgeText: {
    fontSize: 10,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.error,
    textTransform: 'uppercase',
  },
  skillsRow: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  skillChip: {
    fontSize: 11,
    fontWeight: theme.typography.weight.semibold as any,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.full,
    padding: '4px 10px',
  },
  applicantActionsRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'between',
    borderTop: `1px solid ${theme.colors.border}`,
    paddingTop: theme.spacing[3],
    marginTop: theme.spacing[3],
  },
  viewProfileBtn: {
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.primary,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: theme.spacing[1],
  },
  decisionButtons: {
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  declineButton: {
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.textSecondary,
    backgroundColor: 'transparent',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.button,
    padding: '8px 16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  acceptButton: {
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.success,
    backgroundColor: theme.colors.successLight, // Success-tinted styling (not harsh red)
    border: `1px solid ${theme.colors.success}`,
    borderRadius: theme.radius.button,
    padding: '8px 16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  cancelSection: {
    marginTop: theme.spacing[4],
  },
  cancelRequestBtn: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    color: theme.colors.error,
  },
  cancelTextarea: {
    width: '100%',
    minHeight: 80,
    borderRadius: theme.radius.input,
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: '#FFFFFF',
    padding: theme.spacing[3],
    fontSize: theme.typography.size.sm,
    color: theme.colors.secondary,
    outline: 'none',
    transition: 'all 0.2s',
    resize: 'vertical',
  },
  errorStateCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[6],
    backgroundColor: '#FFFFFF',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.card,
    textAlign: 'center',
    marginTop: theme.spacing[10],
    boxShadow: theme.shadows.sm,
  },
  errorIconBg: {
    display: 'flex',
    height: 64,
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.errorLight,
    marginBottom: theme.spacing[3],
  },
  errorTitleText: {
    fontSize: theme.typography.size.base,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
    margin: 0,
  },
  errorSubtitleText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.textSecondary,
    margin: `${theme.spacing[2]}px 0 ${theme.spacing[4]}px 0`,
    lineHeight: 1.5,
    maxWidth: 240,
  },
  errorActionsRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing[3],
  },
  errorBackBtn: {
    minHeight: 40,
    padding: '10px 20px',
    backgroundColor: '#FFFFFF',
    color: theme.colors.textSecondary,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.button,
    cursor: 'pointer',
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.bold as any,
  },
  errorRetryBtn: {
    minHeight: 40,
    padding: '10px 24px',
    backgroundColor: theme.colors.primary,
    color: '#FFFFFF',
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.bold as any,
    border: 'none',
    borderRadius: theme.radius.button,
    cursor: 'pointer',
    boxShadow: theme.shadows.sm,
  },
  emptyApplicantsCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[6],
    backgroundColor: '#FFFFFF',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.card,
    textAlign: 'center',
    marginTop: theme.spacing[2],
    boxShadow: theme.shadows.sm,
  },
  emptyApplicantsIconBg: {
    display: 'flex',
    height: 56,
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    marginBottom: theme.spacing[3],
  },
  emptyApplicantsTitle: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
    margin: 0,
  },
  emptyApplicantsSubtext: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.textSecondary,
    margin: `${theme.spacing[2]}px 0 0 0`,
    lineHeight: 1.5,
    maxWidth: 245,
  },
});
