import React from 'react';
import Link from 'next/link';
import { MapPin, Briefcase, Star, CheckCircle } from 'lucide-react';
import { Worker } from '@crewora/shared';
import { Badge } from './Badge';
import { Button } from './Button';
import { clsx } from 'clsx';

const TRADE_LABELS: Record<string, string> = {
  plumber: 'Plumber',
  electrician: 'Electrician',
  carpenter: 'Carpenter',
  painter: 'Painter',
  welder: 'Welder',
  mason: 'Mason',
  hvac: 'HVAC',
  tiler: 'Tiler',
  roofer: 'Roofer',
  other: 'Other',
};

const availabilityConfig = {
  available: { label: 'Available', variant: 'success' as const },
  unavailable: { label: 'Unavailable', variant: 'error' as const },
  on_a_job: { label: 'On a Job', variant: 'warning' as const },
};

interface WorkerCardProps {
  worker: Worker;
  distance?: string;
  compact?: boolean;
}

export function WorkerCard({ worker, distance, compact = false }: WorkerCardProps) {
  const avail = availabilityConfig[worker.availability];
  const initials = worker.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className={clsx(
      'card hover:shadow-lg transition-shadow duration-200 animate-fadeIn',
      compact ? 'p-4' : 'p-6'
    )}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 text-primary-600 font-bold text-lg">
          {worker.profilePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={worker.profilePhoto}
              alt={worker.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-semibold text-navy text-base">{worker.name}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                {worker.verificationStatus === 'approved' && (
                  <CheckCircle size={13} className="text-success flex-shrink-0" />
                )}
                <span className="text-xs text-gray-body">
                  {worker.verificationStatus === 'approved' ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
            </div>
            <Badge variant={avail.variant}>{avail.label}</Badge>
          </div>

          {/* Trade Categories */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {worker.tradeCategories.slice(0, 3).map((trade) => (
              <span
                key={trade}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-600"
              >
                <Briefcase size={10} />
                {TRADE_LABELS[trade] || trade}
              </span>
            ))}
            {worker.tradeCategories.length > 3 && (
              <span className="text-xs text-gray-caption">+{worker.tradeCategories.length - 3} more</span>
            )}
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-body">
            {worker.city && (
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-gray-caption" />
                {worker.city}
              </span>
            )}
            {distance && (
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-primary-400" />
                {distance} away
              </span>
            )}
            {worker.experienceYears !== undefined && (
              <span className="flex items-center gap-1">
                <Star size={12} className="text-warning" />
                {worker.experienceYears} yr{worker.experienceYears !== 1 ? 's' : ''} exp.
              </span>
            )}
          </div>

          {/* Bio */}
          {!compact && worker.bio && (
            <p className="text-sm text-gray-body mt-2 line-clamp-2">{worker.bio}</p>
          )}
        </div>
      </div>

      {/* Action */}
      {!compact && (
        <div className="mt-4 flex justify-end">
          <Link href={`/workers/${worker.id || worker._id}`}>
            <Button variant="secondary" size="sm">View Profile</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
