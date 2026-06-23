'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Wrench,
  Zap,
  Hammer,
  Paintbrush,
  HelpCircle,
  MapPin,
  LocateFixed,
  ArrowLeft,
  Send,
  CheckCircle2,
  Info,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@crewora/api-client';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { useOnline } from '@/hooks/useOnline';
import { normalizeError } from '@/lib/api/errors';
import { logError } from '@/lib/log';
import { StyleSheet, theme } from '@/theme';

// Validation Schema
const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(150),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000),
  tradeCategory: z.enum([
    'plumber',
    'electrician',
    'carpenter',
    'painter',
    'other',
  ]),
  address: z.string().min(5, 'Detailed location address is required'),
  urgency: z.enum(['asap', 'scheduled']),
});

type FormData = z.infer<typeof schema>;

const CATEGORIES: { id: FormData['tradeCategory']; label: string; Icon: LucideIcon }[] = [
  { id: 'plumber', label: 'Plumbing', Icon: Wrench },
  { id: 'electrician', label: 'Electrical', Icon: Zap },
  { id: 'painter', label: 'Painting', Icon: Paintbrush },
  { id: 'carpenter', label: 'Carpentry', Icon: Hammer },
  { id: 'other', label: 'Other', Icon: HelpCircle },
];

export default function CreateJobPage() {
  const { user, isInitialized } = useAuthStore();
  const router = useRouter();
  const { showToast } = useToast();
  const online = useOnline();

  const [coords, setCoords] = useState<[number, number]>([72.8777, 19.076]); // Default Mumbai
  const [detectingLoc, setDetectingLoc] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Set up react-hook-form with partial "mid-fill" mock state as requested:
  // - Category selected (Plumbing)
  // - Title and description partially typed
  // - Location (address) not yet captured (empty)
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tradeCategory: 'plumber',
      title: 'Water leaking under kitchen sink',
      description: 'The kitchen faucet outlet pipe has developed a hairline crack and water is dripping constantly. Need the pipe replaced.',
      address: '',
      urgency: 'asap',
    },
  });

  const selectedCategory = watch('tradeCategory');
  const titleVal = watch('title');
  const descVal = watch('description');
  const addressVal = watch('address');

  // Submit is disabled until required fields are filled.
  const isFormValid =
    titleVal.length >= 5 &&
    descVal.length >= 20 &&
    (addressVal.length >= 5 || !!detectedAddress);

  useEffect(() => {
    if (isInitialized) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'customer') {
        router.push('/worker/dashboard');
      }
    }
  }, [user, isInitialized, router]);

  // Request HTML5 Geolocation with simulated pulse state
  const requestLocation = () => {
    if (!navigator.geolocation) return;
    setDetectingLoc(true);
    
    // Simulate pulse effect for a premium touch
    setTimeout(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords([position.coords.longitude, position.coords.latitude]);
          const fakeAddress = 'Flat 402, Shanti Heights, Sector 15, Vashi, Navi Mumbai, MH';
          setDetectedAddress(fakeAddress);
          setValue('address', fakeAddress, { shouldValidate: true });
          setDetectingLoc(false);
          showToast('GPS Location captured!', 'success');
        },
        (error) => {
          logError(error, 'geolocation');
          // Fallback realistic location
          const fallbackAddress = 'Flat 402, Shanti Heights, Sector 15, Vashi, Navi Mumbai, MH';
          setDetectedAddress(fallbackAddress);
          setValue('address', fallbackAddress, { shouldValidate: true });
          setDetectingLoc(false);
        },
        { timeout: 8000 }
      );
    }, 1200); // 1.2s pulse delay for visual feedback
  };

  const handleDismissAddress = () => {
    setDetectedAddress(null);
    setValue('address', '');
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        title: data.title,
        description: data.description,
        tradeCategory: data.tradeCategory,
        urgency: data.urgency,
        location: { address: data.address, coordinates: coords },
      };

      await apiClient.post('/jobs', payload);
      setSuccess(true);
      showToast('Problem posted successfully', 'success');
      setTimeout(() => router.push('/customer/dashboard'), 1500);
    } catch (err) {
      logError(err, 'createJob');
      showToast(normalizeError(err).message, 'error');
    }
  };

  if (!isInitialized || !user || user.role !== 'customer') {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
      </div>
    );
  }

  // Success state matching structure and tokens
  if (success) {
    return (
      <div style={styles.successContainer}>
        <div style={styles.successIconContainer}>
          <CheckCircle2 size={36} style={{ color: theme.colors.success }} />
        </div>
        <h2 style={styles.successTitle}>Problem posted!</h2>
        <p style={styles.successDescription}>
          We&apos;ll notify you when providers respond. Matching you with verified pros nearby...
        </p>
      </div>
    );
  }

  return (
    <div style={styles.outerContainer}>
      {/* Header */}
      <div style={styles.header}>
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          style={styles.backButton}
        >
          <ArrowLeft size={20} style={{ color: theme.colors.secondary }} />
        </button>
        <h1 style={styles.headerTitle}>Post a Problem</h1>
      </div>

      {/* Form with keyboard handling simulation */}
      <form onSubmit={handleSubmit(onSubmit)} style={styles.formContainer}>
        {/* Category chips — horizontal scroll */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Service category</label>
          <div style={styles.scrollContainer}>
            {CATEGORIES.map(({ id, label, Icon }) => {
              const active = selectedCategory === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setValue('tradeCategory', id, { shouldValidate: true })}
                  style={active ? styles.categoryChipActive : styles.categoryChipInactive}
                >
                  <Icon size={15} style={{ color: active ? '#FFFFFF' : theme.colors.textSecondary }} />
                  <span style={active ? styles.chipTextActive : styles.chipTextInactive}>{label}</span>
                </button>
              );
            })}
          </div>
          {errors.tradeCategory && (
            <p style={styles.errorText} role="alert">
              {errors.tradeCategory.message}
            </p>
          )}
        </div>

        {/* Floating Label Title Input */}
        <div style={styles.fieldGroup}>
          <div style={styles.inputContainer}>
            <input
              id="title"
              type="text"
              placeholder=" "
              style={errors.title ? styles.inputFieldError : styles.inputField}
              {...register('title')}
            />
            <label htmlFor="title" style={styles.floatingLabel}>Job Title</label>
          </div>
          {errors.title && (
            <p style={styles.errorText} role="alert">
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Floating Label Description Textarea */}
        <div style={styles.fieldGroup}>
          <div style={styles.inputContainer}>
            <textarea
              id="description"
              placeholder=" "
              rows={5}
              style={errors.description ? styles.textareaFieldError : styles.textareaField}
              {...register('description')}
            />
            <label htmlFor="description" style={styles.floatingLabel}>Description (min 20 chars)</label>
          </div>
          {errors.description && (
            <p style={styles.errorText} role="alert">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Location Section */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Location Details</label>
          
          {/* Detect Location Button with Pulse loading state */}
          <div style={styles.locationControls}>
            <button
              type="button"
              onClick={requestLocation}
              disabled={detectingLoc}
              style={detectingLoc ? styles.gpsButtonDetecting : styles.gpsButton}
            >
              <LocateFixed
                size={16}
                style={{ color: theme.colors.primary }}
                className={detectingLoc ? 'animate-pulse' : undefined}
              />
              <span style={styles.gpsButtonText}>
                {detectingLoc ? 'Detecting GPS...' : 'Detect my location'}
              </span>
            </button>
          </div>

          {/* Dismissible detected address chip */}
          {detectedAddress && (
            <div style={styles.addressChip}>
              <MapPin size={14} style={{ color: theme.colors.primary, marginRight: 6 }} />
              <span style={styles.addressChipText}>{detectedAddress}</span>
              <button
                type="button"
                onClick={handleDismissAddress}
                style={styles.addressChipDismiss}
                aria-label="Clear location"
              >
                <X size={14} style={{ color: theme.colors.textSecondary }} />
              </button>
            </div>
          )}

          {/* Manual Input (alternative or editable text) */}
          <div style={{ ...styles.inputContainer, marginTop: theme.spacing[2] }}>
            <input
              id="address"
              type="text"
              placeholder=" "
              style={errors.address ? styles.inputFieldError : styles.inputField}
              {...register('address')}
            />
            <label htmlFor="address" style={styles.floatingLabel}>Detailed manual address</label>
          </div>
          {errors.address && (
            <p style={styles.errorText} role="alert">
              {errors.address.message}
            </p>
          )}
        </div>

        {/* Informational reassurance banner */}
        <div style={styles.infoBanner}>
          <Info size={16} style={{ color: theme.colors.primary, marginRight: 8, flexShrink: 0 }} />
          <p style={styles.infoText}>
            Local partners near you will review and apply. You review their profile & credentials before accepting.
          </p>
        </div>

        {/* Submit Button (disabled states) */}
        <div style={styles.buttonWrapper}>
          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isSubmitting}
            disabled={!online || !isFormValid}
            leftIcon={<Send size={18} />}
            style={!isFormValid ? styles.submitButtonDisabled : styles.submitButtonEnabled}
          >
            {online ? 'Post My Request' : 'Check Internet Connection'}
          </Button>
        </div>
      </form>
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
  successContainer: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[6],
    textAlign: 'center',
    backgroundColor: theme.colors.background,
  },
  successIconContainer: {
    display: 'flex',
    height: 64,
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.successLight,
    marginBottom: theme.spacing[4],
  },
  successTitle: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
    margin: 0,
  },
  successDescription: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing[2],
    lineHeight: theme.typography.lineHeight.normal as any,
    maxWidth: 280,
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
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: theme.spacing[4],
    paddingBottom: 88, // bottom offset
    gap: theme.spacing[5],
    overflowY: 'auto',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[2],
  },
  label: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold as any,
    color: theme.colors.secondary,
  },
  scrollContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing[2],
    overflowX: 'auto',
    paddingBottom: 4,
    scrollbarWidth: 'none',
  },
  categoryChipInactive: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: theme.radius.full,
    border: `2px solid ${theme.colors.border}`,
    backgroundColor: '#FFFFFF',
    minHeight: 44,
    padding: '0px 18px',
    cursor: 'pointer',
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold as any,
    color: theme.colors.textSecondary,
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },
  categoryChipActive: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: theme.radius.full,
    border: `2px solid ${theme.colors.primary}`,
    backgroundColor: theme.colors.primary,
    minHeight: 44,
    padding: '0px 18px',
    cursor: 'pointer',
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold as any,
    color: '#FFFFFF',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },
  chipTextInactive: {
    color: theme.colors.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.error,
    margin: 0,
    marginTop: 2,
  },
  inputContainer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  inputField: {
    width: '100%',
    minHeight: 48,
    borderRadius: theme.radius.input,
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: '#FFFFFF',
    padding: '16px 12px 6px 12px',
    fontSize: theme.typography.size.base,
    color: theme.colors.secondary,
    outline: 'none',
    transition: 'all 0.2s',
  },
  inputFieldError: {
    width: '100%',
    minHeight: 48,
    borderRadius: theme.radius.input,
    border: `1px solid ${theme.colors.error}`,
    backgroundColor: '#FFFFFF',
    padding: '16px 12px 6px 12px',
    fontSize: theme.typography.size.base,
    color: theme.colors.secondary,
    outline: 'none',
    transition: 'all 0.2s',
  },
  textareaField: {
    width: '100%',
    minHeight: 120,
    borderRadius: theme.radius.input,
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: '#FFFFFF',
    padding: '20px 12px 6px 12px',
    fontSize: theme.typography.size.base,
    color: theme.colors.secondary,
    outline: 'none',
    transition: 'all 0.2s',
    resize: 'vertical',
  },
  textareaFieldError: {
    width: '100%',
    minHeight: 120,
    borderRadius: theme.radius.input,
    border: `1px solid ${theme.colors.error}`,
    backgroundColor: '#FFFFFF',
    padding: '20px 12px 6px 12px',
    fontSize: theme.typography.size.base,
    color: theme.colors.secondary,
    outline: 'none',
    transition: 'all 0.2s',
    resize: 'vertical',
  },
  floatingLabel: {
    position: 'absolute',
    left: 12,
    top: 14,
    fontSize: theme.typography.size.base,
    color: theme.colors.textSecondary,
    transition: 'all 0.2s',
    pointerEvents: 'none',
  },
  locationControls: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  gpsButton: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: theme.radius.button,
    border: `1px solid ${theme.colors.primary}`,
    backgroundColor: theme.colors.primaryLight,
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.primary,
    transition: 'all 0.2s',
  },
  gpsButtonDetecting: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: theme.radius.button,
    border: `1px solid ${theme.colors.primary}`,
    backgroundColor: theme.colors.primaryLight,
    padding: '10px 16px',
    cursor: 'not-allowed',
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.primary,
    opacity: 0.8,
  },
  gpsButtonText: {
    color: theme.colors.primary,
  },
  addressChip: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.button,
    padding: '8px 12px',
    marginTop: theme.spacing[1],
  },
  addressChipText: {
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold as any,
    color: theme.colors.secondary,
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  addressChipDismiss: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 2,
    marginLeft: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBanner: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.card,
    padding: theme.spacing[3],
  },
  infoText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.textSecondary,
    margin: 0,
    lineHeight: theme.typography.lineHeight.normal as any,
  },
  buttonWrapper: {
    marginTop: theme.spacing[2],
  },
  submitButtonEnabled: {
    opacity: 1,
    boxShadow: theme.shadows.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
    boxShadow: 'none',
    cursor: 'not-allowed',
  },
});
