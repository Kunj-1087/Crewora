import React from 'react';
import Link from 'next/link';
import { MapPin, Calendar, Zap, Clock, Briefcase } from 'lucide-react';
import { Job } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDistanceToNow } from 'date-fns';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'info' | 'success' | 'warning' | 'error' }> = {
  draft:       { label: 'Draft',       variant: 'default' },
  open:        { label: 'Open',        variant: 'info' },
  matched:     { label: 'Matched',     variant: 'warning' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  completed:   { label: 'Completed',   variant: 'success' },
  cancelled:   { label: 'Cancelled',   variant: 'error' },
};

const TRADE_LABELS: Record<string, string> = {
  plumber: 'Plumber', electrician: 'Electrician', carpenter: 'Carpenter',
  painter: 'Painter', welder: 'Welder', mason: 'Mason',
  hvac: 'HVAC', tiler: 'Tiler', roofer: 'Roofer', other: 'Other',
};

interface JobCardProps {
  job: Job;
  viewAs?: 'customer' | 'worker' | 'admin';
  onAccept?: () => void;
  onDecline?: () => void;
}

export function JobCard({ job, viewAs = 'customer', onAccept, onDecline }: JobCardProps) {
  const statusCfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.open;

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-navy text-base truncate">{job.title}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 text-xs text-primary-600 font-medium">
              <Briefcase size={12} />
              {TRADE_LABELS[job.tradeCategory] || job.tradeCategory}
            </span>
            {job.urgency === 'asap' ? (
              <span className="inline-flex items-center gap-1 text-xs text-warning font-medium">
                <Zap size={12} />
                ASAP
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-gray-body">
                <Calendar size={12} />
                Scheduled
              </span>
            )}
          </div>
        </div>
        <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-body mt-3 line-clamp-2">{job.description}</p>

      {/* Meta */}
      <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-body">
        <span className="flex items-center gap-1">
          <MapPin size={12} className="text-primary-400" />
          {job.location.address}
        </span>
        {job.scheduledAt && (
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {new Date(job.scheduledAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 mt-4">
        {viewAs === 'customer' && (
          <Link href={`/customer/jobs/${job.id || job._id}`}>
            <Button variant="secondary" size="sm">View Details</Button>
          </Link>
        )}
        {viewAs === 'worker' && onAccept && onDecline && (
          <>
            <Button variant="outline" size="sm" onClick={onDecline}>Decline</Button>
            <Button variant="primary" size="sm" onClick={onAccept}>Accept Job</Button>
          </>
        )}
        {viewAs === 'admin' && (
          <Link href={`/admin/jobs/${job.id || job._id}`}>
            <Button variant="ghost" size="sm">View</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
