'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  MapPin,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  Bell,
  Home,
  ClipboardList,
  User as UserIcon,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/contexts/SocketContext';
import apiClient from '@crewora/api-client';
import type { Job } from '@crewora/shared';
import { FeedbackModal } from '@crewora/ui';
import { Badge, type BadgeStatus } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { tradeMeta } from '@/lib/trades';
import { timeAgo, humanize } from '@/lib/format';
import { logError } from '@/lib/log';
import { StyleSheet, theme } from '@/theme';

const MAX_PREVIEW = 3;

export default function CustomerDashboard() {
  const { user, isInitialized } = useAuthStore();
  const socket = useSocket();
  const router = useRouter();
  const { showToast } = useToast();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Real-time: worker accepted a job
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

  const fetchJobs = useCallback(async (silent = false) => {
    if (!user || user.role !== 'customer') return;
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    try {
      setError(null);
      const { data } = await apiClient.get('/jobs');
      setJobs(data.data.jobs || []);
    } catch (err) {
      logError(err, 'fetchJobs');
      // If we have no jobs loaded, show full error card. Otherwise show toast
      if (jobs.length === 0) {
        setError("Couldn't load your requests");
      } else {
        showToast("Couldn't sync your requests. Working offline.", 'error');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user, jobs.length, showToast]);

  useEffect(() => {
    if (user && user.role === 'customer') fetchJobs();
  }, [user, fetchJobs]);

  const handlePullToRefresh = () => {
    fetchJobs(true);
  };

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
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
      </div>
    );
  }

  // Error state (network failed to load)
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.greetingText}>Hello, {user.name.split(' ')[0]} 👋</h1>
          </div>
        </div>
        <div style={styles.errorStateCard}>
          <div style={styles.errorIconBg}>
            <AlertCircle size={32} style={{ color: theme.colors.error }} />
          </div>
          <h3 style={styles.errorTitleText}>{"Couldn't load your requests"}</h3>
          <p style={styles.errorSubtitleText}>Please check your connection and try again.</p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              fetchJobs();
            }}
            style={styles.retryButton}
          >
            Retry
          </button>
        </div>
        {/* Bottom tab bar */}
        <div style={styles.bottomTabBar}>
          <button
            type="button"
            onClick={() => router.push('/customer/dashboard')}
            style={styles.tabItem}
          >
            <Home size={22} strokeWidth={2} style={{ color: theme.colors.primary }} />
            <span style={{ ...styles.tabLabel, color: theme.colors.primary }}>Home</span>
          </button>
          <button
            type="button"
            onClick={() => router.push('/customer/jobs')}
            style={styles.tabItem}
          >
            <ClipboardList size={22} strokeWidth={1.5} style={{ color: theme.colors.textSecondary }} />
            <span style={styles.tabLabel}>Requests</span>
          </button>
          <button
            type="button"
            onClick={() => router.push('/notifications')}
            style={styles.tabItem}
          >
            <Bell size={22} strokeWidth={1.5} style={{ color: theme.colors.textSecondary }} />
            <span style={styles.tabLabel}>Inbox</span>
          </button>
          <button
            type="button"
            onClick={() => router.push('/customer/profile')}
            style={styles.tabItem}
          >
            <UserIcon size={22} strokeWidth={1.5} style={{ color: theme.colors.textSecondary }} />
            <span style={styles.tabLabel}>Profile</span>
          </button>
        </div>
      </div>
    );
  }

  // Empty state (no data yet)
  if (!loading && jobs.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.greetingText}>Hello, {user.name.split(' ')[0]} 👋</h1>
            <p style={styles.subtitleText}>Manage your jobs and matches.</p>
          </div>
          <div style={styles.headerActions}>
            <button
              type="button"
              onClick={handlePullToRefresh}
              aria-label="Refresh"
              style={styles.refreshButton}
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
        <div style={styles.emptyStateCard}>
          <div style={styles.emptyIconBg}>
            <ClipboardList size={32} style={{ color: theme.colors.textMuted }} />
          </div>
          <h3 style={styles.emptyTitleText}>No requests yet</h3>
          <p style={styles.emptySubtitleText}>Post your first problem and get connected with certified specialists near you.</p>
          <button
            type="button"
            onClick={() => router.push('/customer/jobs/create')}
            style={styles.emptyCtaButton}
          >
            Post your first problem
          </button>
        </div>
        {/* Bottom tab bar */}
        <div style={styles.bottomTabBar}>
          <button
            type="button"
            onClick={() => router.push('/customer/dashboard')}
            style={styles.tabItem}
          >
            <Home size={22} strokeWidth={2} style={{ color: theme.colors.primary }} />
            <span style={{ ...styles.tabLabel, color: theme.colors.primary }}>Home</span>
          </button>
          <button
            type="button"
            onClick={() => router.push('/customer/jobs')}
            style={styles.tabItem}
          >
            <ClipboardList size={22} strokeWidth={1.5} style={{ color: theme.colors.textSecondary }} />
            <span style={styles.tabLabel}>Requests</span>
          </button>
          <button
            type="button"
            onClick={() => router.push('/notifications')}
            style={styles.tabItem}
          >
            <Bell size={22} strokeWidth={1.5} style={{ color: theme.colors.textSecondary }} />
            <span style={styles.tabLabel}>Inbox</span>
          </button>
          <button
            type="button"
            onClick={() => router.push('/customer/profile')}
            style={styles.tabItem}
          >
            <UserIcon size={22} strokeWidth={1.5} style={{ color: theme.colors.textSecondary }} />
            <span style={styles.tabLabel}>Profile</span>
          </button>
        </div>
      </div>
    );
  }

  // Active = open, matched, in_progress
  const activeCount = jobs.filter(
    (j) => j.status === 'open' || j.status === 'matched' || j.status === 'in_progress'
  ).length;
  const completedCount = jobs.filter((j) => j.status === 'completed').length;
  const preview = jobs.slice(0, MAX_PREVIEW);

  // Skeleton loaders render structure matching actual layout
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <div>
            <div style={styles.skeletonTextLarge} />
            <div style={styles.skeletonTextSmall} />
          </div>
          <div style={styles.skeletonCircle} />
        </div>

        <div style={styles.statsRow}>
          <div style={styles.skeletonStatsCard} />
          <div style={styles.skeletonStatsCard} />
        </div>

        <div style={styles.skeletonCtaCard} />

        <div style={styles.recentSectionHeader}>
          <div style={styles.skeletonSectionTitle} />
        </div>

        <div style={styles.requestsList}>
          {[1, 2].map((i) => (
            <div key={i} style={styles.skeletonRequestCard}>
              <div style={styles.skeletonCardIcon} />
              <div style={{ flex: 1, marginLeft: theme.spacing[3] }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={styles.skeletonTextBadge} />
                  <div style={styles.skeletonTextBadge} />
                </div>
                <div style={styles.skeletonCardTitle} />
                <div style={styles.skeletonCardSubtitle} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Pull-to-refresh Indicator */}
      {isRefreshing && (
        <div style={styles.refreshIndicator}>
          <RefreshCw size={16} className="animate-spin" style={{ color: theme.colors.primary }} />
          <span style={styles.refreshText}>Syncing request pool...</span>
        </div>
      )}

      {/* Greeting Row */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.greetingText}>
            Hello, {user.name.split(' ')[0]} 👋
          </h1>
          <p style={styles.subtitleText}>Manage your jobs and matches.</p>
        </div>
        <div style={styles.headerActions}>
          <button
            type="button"
            onClick={handlePullToRefresh}
            aria-label="Pull to refresh"
            style={styles.refreshButton}
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : undefined} />
          </button>
          <div style={styles.bellContainer}>
            <button
              type="button"
              onClick={() => router.push('/notifications')}
              style={styles.bellButton}
            >
              <Bell size={22} strokeWidth={1.5} style={{ color: theme.colors.secondary }} />
            </button>
            {/* Notification bell badge in error red, small dot */}
            <div style={styles.bellBadge} />
          </div>
        </div>
      </div>

      {/* Stats row: two small cards */}
      <div style={styles.statsRow}>
        <div style={styles.statsCard}>
          <p style={styles.statsCount}>{activeCount}</p>
          <p style={styles.statsLabel}>Active Requests</p>
        </div>
        <div style={styles.statsCard}>
          <p style={styles.statsCount}>{completedCount}</p>
          <p style={styles.statsLabel}>Completed</p>
        </div>
      </div>

      {/* Primary CTA card: Post a Problem (large, sits above fold) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => router.push('/customer/jobs/create')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') router.push('/customer/jobs/create');
        }}
        style={styles.ctaCard}
      >
        <div style={styles.ctaIconContainer}>
          <Plus size={24} strokeWidth={2.5} style={{ color: theme.colors.primary }} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={styles.ctaTitle}>Post a Problem</h2>
          <p style={styles.ctaDescription}>
            Describe plumbing, electrical, carpentry work to get matched fast.
          </p>
        </div>
        <ChevronRight size={20} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
      </div>

      {/* Recent requests */}
      <div style={styles.recentSectionHeader}>
        <h2 style={styles.recentRequestsHeading}>My Recent Requests</h2>
        {jobs.length > MAX_PREVIEW && (
          <button
            type="button"
            onClick={() => router.push('/customer/jobs')}
            style={styles.seeAllLink}
          >
            See All
          </button>
        )}
      </div>

      <div style={styles.requestsList}>
        {preview.map((job) => {
          const { label: tradeLabel, Icon: TradeIcon } = tradeMeta(job.tradeCategory);
          const isPending = job.status === 'open';
          const isMatched = job.status === 'matched' || job.status === 'in_progress';
          
          const badgeStatus = job.status as BadgeStatus;

          return (
            <div
              key={job.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/customer/jobs/${job.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') router.push(`/customer/jobs/${job.id}`);
              }}
              style={styles.requestCard}
            >
              <div style={styles.cardHeader}>
                <div style={styles.cardIconContainer}>
                  <TradeIcon size={18} strokeWidth={1.5} style={{ color: theme.colors.primary }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.cardTitleRow}>
                    <span style={styles.categoryBadgeText}>{tradeLabel}</span>
                    <Badge status={badgeStatus} dot>
                      {job.status === 'open' ? 'Open' : job.status === 'completed' ? 'Completed' : 'In Progress'}
                    </Badge>
                  </div>
                  <h3 style={styles.cardTitleText}>{job.title}</h3>
                  
                  {/* Localized Indian Addresses and timestamp */}
                  <div style={styles.cardMetaRow}>
                    {job.location?.address && (
                      <div style={styles.locationContainer}>
                        <MapPin size={11} style={{ marginRight: 2, color: theme.colors.textMuted }} />
                        <span style={styles.metaText}>{job.location.address}</span>
                      </div>
                    )}
                    <span style={styles.metaDivider}>·</span>
                    <span style={styles.metaText}>{timeAgo(job.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Show applicants notice if open request */}
              {isPending && (
                <div style={styles.applicantBadgeRow}>
                  <span style={styles.applicantText}>
                    ⚡ 3 verified partners applying
                  </span>
                </div>
              )}

              {/* Quick action button for completing matching active jobs */}
              {isMatched && (
                <div style={styles.cardActionRow}>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    leftIcon={<CheckCircle2 size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWorkDoneClick(job.id);
                    }}
                    style={styles.markDoneButton}
                  >
                    Mark Work Done
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Bottom tab bar — Home, Requests, Notifications, Profile */}
      <div style={styles.bottomTabBar}>
        <button
          type="button"
          onClick={() => router.push('/customer/dashboard')}
          style={styles.tabItem}
        >
          <Home size={22} strokeWidth={2} style={{ color: theme.colors.primary }} />
          <span style={{ ...styles.tabLabel, color: theme.colors.primary }}>Home</span>
        </button>

        <button
          type="button"
          onClick={() => router.push('/customer/jobs')}
          style={styles.tabItem}
        >
          <ClipboardList size={22} strokeWidth={1.5} style={{ color: theme.colors.textSecondary }} />
          <span style={styles.tabLabel}>Requests</span>
        </button>

        <button
          type="button"
          onClick={() => router.push('/notifications')}
          style={styles.tabItem}
        >
          <div style={{ position: 'relative' }}>
            <Bell size={22} strokeWidth={1.5} style={{ color: theme.colors.textSecondary }} />
            <div style={styles.tabBellBadge} />
          </div>
          <span style={styles.tabLabel}>Inbox</span>
        </button>

        <button
          type="button"
          onClick={() => router.push('/customer/profile')}
          style={styles.tabItem}
        >
          <UserIcon size={22} strokeWidth={1.5} style={{ color: theme.colors.textSecondary }} />
          <span style={styles.tabLabel}>Profile</span>
        </button>
      </div>

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing[4],
    paddingBottom: 88, // space for tab bar
    fontFamily: 'Inter, sans-serif',
  },
  loadingContainer: {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[8],
  },
  spinner: {
    height: 32,
    width: 32,
    borderWidth: 4,
    borderColor: theme.colors.primaryLight,
    borderTopColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    animation: 'spin 1s linear infinite',
  },
  refreshIndicator: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
    paddingVertical: theme.spacing[2],
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.button,
    marginBottom: theme.spacing[3],
  },
  refreshText: {
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold as any,
    color: theme.colors.primaryDark,
  },
  headerRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'between',
    marginBottom: theme.spacing[5],
  },
  greetingText: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
    margin: 0,
  },
  subtitleText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
    margin: 0,
    marginTop: 2,
  },
  headerActions: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  refreshButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
    borderRadius: theme.radius.full,
    border: 'none',
    backgroundColor: 'transparent',
    color: theme.colors.textSecondary,
    cursor: 'pointer',
  },
  bellContainer: {
    position: 'relative',
  },
  bellButton: {
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
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    height: 8,
    width: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.error,
  },
  statsRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing[3],
    marginBottom: theme.spacing[5],
  },
  statsCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.card,
    padding: theme.spacing[4],
    boxShadow: theme.shadows.sm,
  },
  statsCount: {
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
    margin: 0,
  },
  statsLabel: {
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold as any,
    color: theme.colors.textSecondary,
    margin: 0,
    marginTop: 4,
  },
  ctaCard: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[4],
    backgroundImage: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%)`,
    borderRadius: theme.radius.card,
    padding: theme.spacing[4],
    color: '#FFFFFF',
    boxShadow: theme.shadows.lg,
    cursor: 'pointer',
    marginBottom: theme.spacing[5],
  },
  ctaIconContainer: {
    display: 'flex',
    height: 48,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.button,
    backgroundColor: '#FFFFFF',
  },
  ctaTitle: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold as any,
    margin: 0,
    color: '#FFFFFF',
  },
  ctaDescription: {
    fontSize: theme.typography.size.xs,
    color: 'rgba(255, 255, 255, 0.85)',
    margin: 0,
    marginTop: 4,
    lineHeight: theme.typography.lineHeight.normal as any,
  },
  recentSectionHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'between',
    marginBottom: theme.spacing[3],
  },
  recentRequestsHeading: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.bold as any,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: theme.colors.textSecondary,
    margin: 0,
  },
  seeAllLink: {
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold as any,
    color: theme.colors.primary,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  requestsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[3],
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.card,
    padding: theme.spacing[4],
    boxShadow: theme.shadows.sm,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing[3],
  },
  cardIconContainer: {
    display: 'flex',
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.primaryLight,
    flexShrink: 0,
  },
  cardTitleRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'between',
    width: '100%',
  },
  categoryBadgeText: {
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.bold as any,
    textTransform: 'uppercase',
    color: theme.colors.primaryDark,
  },
  cardTitleText: {
    fontSize: theme.typography.size.base,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
    margin: '4px 0 6px 0',
    lineHeight: theme.typography.lineHeight.tight as any,
  },
  cardMetaRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    flexWrap: 'wrap',
  },
  locationContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  metaText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.textSecondary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 150,
  },
  metaDivider: {
    color: theme.colors.textMuted,
  },
  applicantBadgeRow: {
    marginTop: theme.spacing[3],
    padding: '8px 12px',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.sm,
  },
  applicantText: {
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold as any,
    color: theme.colors.primary,
  },
  cardActionRow: {
    marginTop: theme.spacing[3],
    borderTop: `1px solid ${theme.colors.border}`,
    paddingTop: theme.spacing[3],
  },
  markDoneButton: {
    minHeight: 40,
  },
  bottomTabBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    display: 'flex',
    height: 64,
    alignItems: 'center',
    justifyContent: 'around',
    borderTop: `1px solid ${theme.colors.border}`,
    backgroundColor: '#FFFFFF',
    paddingBottom: 'safe',
    boxShadow: '0px -4px 16px rgba(15, 23, 42, 0.04)',
  },
  tabItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.textSecondary,
  },
  tabBellBadge: {
    position: 'absolute',
    top: 0,
    right: -2,
    height: 6,
    width: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.error,
  },

  // Skeleton styling elements
  skeletonTextLarge: {
    height: 22,
    width: 140,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    marginBottom: 6,
  },
  skeletonTextSmall: {
    height: 14,
    width: 180,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.sm,
  },
  skeletonCircle: {
    height: 40,
    width: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.border,
  },
  skeletonStatsCard: {
    flex: 1,
    height: 74,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.card,
  },
  skeletonCtaCard: {
    height: 98,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.card,
    marginBottom: theme.spacing[5],
  },
  skeletonSectionTitle: {
    height: 16,
    width: 120,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.sm,
  },
  skeletonRequestCard: {
    display: 'flex',
    flexDirection: 'row',
    padding: theme.spacing[4],
    backgroundColor: '#FFFFFF',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.card,
    height: 96,
  },
  skeletonCardIcon: {
    height: 40,
    width: 40,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.border,
  },
  skeletonTextBadge: {
    height: 14,
    width: 60,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.sm,
  },
  skeletonCardTitle: {
    height: 18,
    width: '80%',
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    marginTop: 8,
  },
  skeletonCardSubtitle: {
    height: 12,
    width: '50%',
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    marginTop: 8,
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
  retryButton: {
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
  emptyStateCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[6],
    backgroundColor: '#FFFFFF',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.card,
    textAlign: 'center',
    marginTop: theme.spacing[6],
    boxShadow: theme.shadows.sm,
  },
  emptyIconBg: {
    display: 'flex',
    height: 64,
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    marginBottom: theme.spacing[3],
  },
  emptyTitleText: {
    fontSize: theme.typography.size.base,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
    margin: 0,
  },
  emptySubtitleText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.textSecondary,
    margin: `${theme.spacing[2]}px 0 ${theme.spacing[4]}px 0`,
    lineHeight: 1.5,
    maxWidth: 240,
  },
  emptyCtaButton: {
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
});
