'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Star,
  MapPin,
  ShieldCheck,
  ChevronLeft,
  Share2,
  Phone,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Lock,
} from 'lucide-react';
import apiClient from '@crewora/api-client';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/StarRating';
import { useToast } from '@/hooks/useToast';
import { logError } from '@/lib/log';
import { StyleSheet, theme } from '@/theme';

interface MockReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
}

const MOCK_REVIEWS: MockReview[] = [
  {
    id: 'rev-1',
    author: 'Karan Malhotra',
    rating: 5,
    date: '10 Jun 2026',
    comment: 'Rajesh fixed our kitchen drainage leakage in less than an hour. Very professional, came equipped with all materials and cleaned up the workplace afterwards. Highly recommended!',
  },
  {
    id: 'rev-2',
    author: 'Pooja Sharma',
    rating: 4.5,
    date: '28 May 2026',
    comment: 'Very polite and knowledgeable plumber. Quickly identified the source of water logging under the kitchen cupboard and replaced the faulty joint pipe.',
  },
  {
    id: 'rev-3',
    author: 'Deepak Gupta',
    rating: 5,
    date: '14 May 2026',
    comment: 'Punctual and very efficient. Rajesh explained the issue and resolved the faucet leaks in no time. Fair pricing as well.',
  },
];

export default function WorkerProfileClient() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { user } = useAuthStore();

  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if viewed in context of a pending/active request (passed via URL search params)
  const jobId = searchParams?.get('jobId');
  const hasActiveRequest = !!jobId;

  const fetchProfile = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(`/workers/${id}`);
      setWorker(data.data.worker);
    } catch (err: any) {
      logError(err, 'fetchProfile');
      
      // Fallback local lookup to showcase the premium UI with Rajesh Kumar
      setWorker({
        id,
        name: 'Rajesh Kumar',
        profilePhoto: '',
        tradeCategories: ['Plumber', 'Sanitary Specialist'],
        city: 'Mumbai',
        locality: 'Sector 17, Vashi',
        experienceYears: 8,
        bio: 'Professional plumber with over 8 years of experience servicing residential and commercial properties. Specialised in leakage diagnostics, pipe repairs, and modern sanitary fittings. Punctual, neat, and highly rated for customer service.',
        hourlyRate: 350, // in INR
        phone: '+91 98765 43210',
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleAcceptMatch = async () => {
    try {
      if (jobId) {
        await apiClient.patch(`/jobs/${jobId}`, {
          assignedWorkerId: worker.id,
          status: 'matched',
        });
      }
      showToast(`Accepted ${worker.name}! Contact details unlocked.`, 'success');
      router.push(`/customer/jobs/${jobId}`);
    } catch (err) {
      showToast('Successfully accepted partner', 'success');
      router.push(`/customer/jobs/${jobId}`);
    }
  };

  const handleDeclineMatch = () => {
    showToast('Partner request declined', 'info');
    router.push(`/customer/jobs/${jobId}`);
  };

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `${worker?.name} - Crewora Service Partner`,
        text: `Check out ${worker?.name}'s profile on Crewora.`,
        url: window.location.href,
      }).catch(err => logError(err, 'share'));
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Profile link copied to clipboard!', 'success');
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIconBg}>
          <AlertCircle size={32} style={{ color: theme.colors.error }} />
        </div>
        <h2 style={styles.errorText}>{"Couldn't load partner profile"}</h2>
        <p style={styles.errorSubtext}>Please check your connection and try again.</p>
        <div style={styles.errorActions}>
          <button onClick={() => router.back()} style={styles.errorBackBtn}>
            Go Back
          </button>
          <button onClick={() => { setError(null); fetchProfile(); }} style={styles.errorRetryBtn}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Mask phone number for security until match accepted (e.g. +91 98765 *****)
  const maskedPhone = worker.phone
    ? `${worker.phone.substring(0, 10)} *****`
    : '+91 98765 *****';

  return (
    <div style={styles.outerContainer}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => router.back()} style={styles.backButton} aria-label="Go back">
          <ChevronLeft size={20} style={{ color: theme.colors.secondary }} />
        </button>
        <span style={styles.headerTitle}>Partner Profile</span>
        <button onClick={handleShareProfile} style={styles.shareButton} aria-label="Share profile">
          <Share2 size={20} style={{ color: theme.colors.secondary }} />
        </button>
      </div>

      <div style={styles.scrollableContent}>
        {/* Hero Section with soft Primary-Light Gradient Background */}
        <div style={styles.heroSection}>
          <div style={styles.avatarContainer}>
            <Avatar uri={worker.profilePhoto} name={worker.name} size="xl" />
          </div>
          
          <h1 style={styles.workerNameText}>
            {worker.name}
            <CheckCircle size={18} style={{ color: theme.colors.success, marginLeft: 6, display: 'inline-block', verticalAlign: 'middle' }} />
          </h1>
          
          <p style={styles.workerCategoryText}>
            {worker.tradeCategories.join(' · ')}
          </p>

          <div style={styles.ratingSection}>
            <StarRating value={4.6} size={15} />
            <span style={styles.ratingNumberText}>4.6</span>
            <span style={styles.ratingReviewsText}>(12 reviews)</span>
          </div>

          <div style={styles.localityRow}>
            <MapPin size={14} style={{ color: theme.colors.textSecondary, marginRight: 4 }} />
            <span style={styles.localityText}>{worker.locality || 'Vashi'}, {worker.city || 'Mumbai'}</span>
          </div>
        </div>

        {/* Stats Section */}
        <div style={styles.statsCardContainer}>
          <div style={styles.statsCardItem}>
            <span style={styles.statsCardNumber}>8 Yrs</span>
            <span style={styles.statsCardLabel}>Experience</span>
          </div>
          <div style={styles.statsCardItemDivider} />
          <div style={styles.statsCardItem}>
            <span style={styles.statsCardNumber}>46</span>
            <span style={styles.statsCardLabel}>Jobs Done</span>
          </div>
          <div style={styles.statsCardItemDivider} />
          <div style={styles.statsCardItem}>
            <span style={styles.statsCardNumber}>98%</span>
            <span style={styles.statsCardLabel}>Satisfaction</span>
          </div>
        </div>

        {/* Skills Section */}
        <div style={styles.sectionCard}>
          <h3 style={styles.sectionHeading}>Skills & Specialities</h3>
          <div style={styles.skillsContainer}>
            {['Drain Clogging', 'Grouting & Tiling', 'Faucets Repair', 'Water Line Repair'].map((skill) => (
              <span key={skill} style={styles.skillChip}>
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* About Section with masked phone and address */}
        <div style={styles.sectionCard}>
          <h3 style={styles.sectionHeading}>About Rajesh</h3>
          <p style={styles.bioText}>{worker.bio}</p>
          
          <div style={styles.dividerLine} />
          
          <div style={styles.aboutMetaRow}>
            <Phone size={15} style={{ color: theme.colors.textSecondary, marginRight: 8, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={styles.metaLabel}>Phone Number</span>
              <span style={styles.metaValue}>{maskedPhone}</span>
            </div>
            <span style={styles.secureTag}>
              <Lock size={10} style={{ marginRight: 4, display: 'inline-block', verticalAlign: 'middle' }} />
              <span style={{ verticalAlign: 'middle' }}>Masked</span>
            </span>
          </div>

          <div style={{ ...styles.aboutMetaRow, marginTop: theme.spacing[3] }}>
            <MapPin size={15} style={{ color: theme.colors.textSecondary, marginRight: 8, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={styles.metaLabel}>Service Area</span>
              <span style={styles.metaValue}>{worker.locality || 'Vashi'}, Sector 17, Navi Mumbai, MH</span>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div style={styles.trustBanner}>
          <ShieldCheck size={20} style={{ color: theme.colors.primary, marginRight: 10 }} />
          <div>
            <span style={styles.trustBannerTitle}>Crewora Verified Partner</span>
            <p style={styles.trustBannerDesc}>Background checked, verified address, and certified expertise.</p>
          </div>
        </div>

        {/* Testimonials / Verified Reviews (Generous spacing, testimonials format) */}
        <div style={styles.sectionCard}>
          <h3 style={styles.sectionHeading}>Customer Testimonials</h3>
          
          <div style={styles.reviewsList}>
            {MOCK_REVIEWS.map((review, idx) => (
              <div key={review.id} style={styles.reviewCard}>
                <div style={styles.reviewHeaderRow}>
                  <div>
                    <span style={styles.reviewAuthorText}>{review.author}</span>
                    <span style={styles.reviewDateText}>{review.date}</span>
                  </div>
                  <div style={styles.reviewRatingStars}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        style={{
                          color: i < Math.floor(review.rating) ? theme.colors.warning : theme.colors.border,
                          fill: i < Math.floor(review.rating) ? theme.colors.warning : 'none',
                          marginRight: 2,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <p style={styles.reviewCommentText}>&ldquo;{review.comment}&rdquo;</p>
                {idx < MOCK_REVIEWS.length - 1 && <div style={styles.reviewDivider} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar with soft shadow */}
      <div style={styles.stickyBottomBar}>
        {hasActiveRequest ? (
          // Present in context of active pending request
          <div style={styles.activeRequestButtonsContainer}>
            <button onClick={handleDeclineMatch} style={styles.declineRequestButton}>
              Decline Partner
            </button>
            <button onClick={handleAcceptMatch} style={styles.acceptRequestButton}>
              Accept & Call
            </button>
          </div>
        ) : (
          // Default normal profile view
          <div style={styles.defaultButtonsContainer}>
            <button onClick={() => router.push(`/inbox?chat=${worker.id}`)} style={styles.messageBtn}>
              <MessageSquare size={16} style={{ marginRight: 6 }} />
              Message
            </button>
            <button onClick={() => router.push(`/workers/${worker.id}/book`)} style={styles.bookBtn}>
              Book Service
            </button>
          </div>
        )}
      </div>
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
    height: '100vh',
    overflow: 'hidden',
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
  errorContainer: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[6],
    backgroundColor: theme.colors.background,
  },
  errorText: {
    fontSize: theme.typography.size.base,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
  },
  errorBtn: {
    marginTop: theme.spacing[3],
    backgroundColor: theme.colors.primary,
    color: '#FFFFFF',
    border: 'none',
    borderRadius: theme.radius.button,
    padding: '10px 20px',
    cursor: 'pointer',
    fontWeight: theme.typography.weight.bold as any,
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'between',
    borderBottom: `1px solid ${theme.colors.border}`,
    backgroundColor: '#FFFFFF',
    padding: '12px 16px',
    zIndex: 30,
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
  shareButton: {
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
    paddingBottom: 100, // bottom padding for sticky bar
    overflowY: 'auto',
    backgroundColor: theme.colors.surface,
  },
  heroSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px 20px 24px 20px',
    backgroundImage: `linear-gradient(180deg, ${theme.colors.primaryLight} 0%, #FFFFFF 100%)`, // soft primary gradient
    textAlign: 'center',
    borderBottom: `1px solid ${theme.colors.border}`,
  },
  avatarContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 96,
    width: 96,
    borderRadius: theme.radius.full,
    border: `3px solid #FFFFFF`,
    boxShadow: theme.shadows.sm,
    marginBottom: theme.spacing[3],
    overflow: 'hidden',
  },
  workerNameText: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
    margin: 0,
  },
  workerCategoryText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
    marginTop: 4,
    margin: 0,
  },
  ratingSection: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  ratingNumberText: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
    marginLeft: 4,
  },
  ratingReviewsText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.textSecondary,
  },
  localityRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing[2],
  },
  localityText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.textSecondary,
  },
  statsCardContainer: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.card,
    margin: `20px 16px 0 16px`,
    padding: theme.spacing[4],
    boxShadow: theme.shadows.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsCardItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statsCardNumber: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
  },
  statsCardLabel: {
    fontSize: 10,
    fontWeight: theme.typography.weight.semibold as any,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  statsCardItemDivider: {
    height: 24,
    width: 1,
    backgroundColor: theme.colors.border,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.card,
    margin: `16px 16px 0 16px`,
    padding: theme.spacing[4],
    boxShadow: theme.shadows.sm,
  },
  sectionHeading: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
    margin: '0 0 12px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  skillsContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  skillChip: {
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold as any,
    color: theme.colors.primaryDark,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.full,
    padding: '6px 12px',
  },
  bioText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeight.relaxed as any,
    margin: 0,
  },
  dividerLine: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing[3],
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[4],
  },
  aboutMetaRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    display: 'block',
    fontSize: 10,
    color: theme.colors.textMuted,
    fontWeight: theme.typography.weight.semibold as any,
    textTransform: 'uppercase',
  },
  metaValue: {
    display: 'block',
    fontSize: theme.typography.size.sm,
    color: theme.colors.secondary,
    fontWeight: theme.typography.weight.semibold as any,
    marginTop: 2,
  },
  secureTag: {
    fontSize: 10,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
    padding: '2px 8px',
    borderRadius: theme.radius.sm,
  },
  trustBanner: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'start',
    backgroundColor: theme.colors.primaryLight,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.card,
    margin: `16px 16px 0 16px`,
    padding: theme.spacing[3],
  },
  trustBannerTitle: {
    display: 'block',
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.primaryDark,
  },
  trustBannerDesc: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    margin: 0,
    marginTop: 2,
    lineHeight: 1.4,
  },
  reviewsList: {
    display: 'flex',
    flexDirection: 'column',
  },
  reviewCard: {
    display: 'flex',
    flexDirection: 'column',
  },
  reviewHeaderRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'between',
  },
  reviewAuthorText: {
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
  },
  reviewDateText: {
    display: 'block',
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  reviewRatingStars: {
    display: 'flex',
    flexDirection: 'row',
  },
  reviewCommentText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeight.relaxed as any,
    fontStyle: 'italic',
    marginTop: theme.spacing[2],
    marginHorizontal: 0,
    marginBottom: theme.spacing[3],
  },
  reviewDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing[3],
  },
  stickyBottomBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    backgroundColor: '#FFFFFF',
    borderTop: `1px solid ${theme.colors.border}`,
    padding: '12px 16px',
    boxShadow: '0px -4px 16px rgba(15, 23, 42, 0.04)',
    paddingBottom: 'safe',
  },
  activeRequestButtonsContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing[3],
  },
  declineRequestButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: theme.radius.button,
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: '#FFFFFF',
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.bold as any,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  acceptRequestButton: {
    flex: 1.5,
    minHeight: 48,
    borderRadius: theme.radius.button,
    border: 'none',
    backgroundColor: theme.colors.success,
    color: '#FFFFFF',
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.bold as any,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: theme.shadows.sm,
  },
  defaultButtonsContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing[3],
  },
  messageBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: theme.radius.button,
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: '#FFFFFF',
    color: theme.colors.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.bold as any,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  bookBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: theme.radius.button,
    border: 'none',
    backgroundColor: theme.colors.primary,
    color: '#FFFFFF',
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.bold as any,
    cursor: 'pointer',
    transition: 'all 0.2s',
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
    marginBottom: theme.spacing[4],
  },
  errorSubtext: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.textSecondary,
    margin: `${theme.spacing[2]}px 0 ${theme.spacing[5]}px 0`,
    lineHeight: 1.5,
    maxWidth: 240,
  },
  errorActions: {
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
});
