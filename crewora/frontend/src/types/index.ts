// ─── Shared Domain Types ──────────────────────────────────────────────────────

export type TradeCategory =
  | 'plumber'
  | 'electrician'
  | 'carpenter'
  | 'painter'
  | 'welder'
  | 'mason'
  | 'hvac'
  | 'tiler'
  | 'roofer'
  | 'other';

export type AvailabilityStatus = 'available' | 'unavailable' | 'on_a_job';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type JobStatus = 'draft' | 'open' | 'matched' | 'in_progress' | 'completed' | 'cancelled';
export type UrgencyFlag = 'asap' | 'scheduled';
export type MatchStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface Customer {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  profilePhoto?: string;
  location?: { coordinates: [number, number] };
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Worker {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone: string;
  tradeCategories: TradeCategory[];
  bio?: string;
  experienceYears?: number;
  city: string;
  serviceRadius: number;
  availability: AvailabilityStatus;
  verificationStatus: VerificationStatus;
  profilePhoto?: string;
  certifications?: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Job {
  id: string;
  _id?: string;
  customerId: string;
  title: string;
  description: string;
  tradeCategory: TradeCategory;
  location: {
    address: string;
    coordinates: [number, number];
  };
  urgency: UrgencyFlag;
  scheduledAt?: string;
  status: JobStatus;
  assignedWorkerId?: string | Worker;
  postedAt: string;
  completedAt?: string;
  cancellationReason?: string;
  createdAt: string;
}

export interface Match {
  id: string;
  _id?: string;
  jobId: string | Job;
  workerId: string | Worker;
  status: MatchStatus;
  matchedAt: string;
  respondedAt?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: { field: string; message: string }[];
}
