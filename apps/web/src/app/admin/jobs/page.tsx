'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { PaginationMeta, JobStatus } from '@crewora/shared';
import apiClient from '@crewora/api-client';
import AdminShell from '@/components/admin/AdminShell';

const PAGE_SIZE = 20;

type StatusFilter = 'all' | JobStatus;

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Matched', value: 'matched' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

// Shape returned by GET /admin/jobs — customer/worker relations are inlined.
interface AdminJobRow {
  id: string;
  title: string;
  tradeCategory: string;
  status: JobStatus;
  createdAt: string;
  customer?: { name: string; phone: string } | null;
  assignedWorker?: { name: string; phone: string } | null;
}

function statusClass(status: JobStatus): string {
  if (status === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (status === 'matched' || status === 'in_progress') return 'bg-blue-50 text-blue-700 border-blue-100';
  if (status === 'cancelled') return 'bg-rose-50 text-rose-700 border-rose-100';
  return 'bg-amber-50 text-amber-700 border-amber-100';
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<AdminJobRow[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/admin/jobs', {
        params: { page, limit: PAGE_SIZE, ...(filter !== 'all' ? { status: filter } : {}) },
      });
      setJobs(data.data.jobs || []);
      setPagination(data.data.pagination || null);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const changeFilter = (value: StatusFilter) => {
    setFilter(value);
    setPage(1);
  };

  return (
    <AdminShell active="jobs">
      <div className="p-8 max-w-6xl space-y-8 text-left select-none">

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="text-2xl font-extrabold text-[#0b1528] tracking-tight">Jobs</h1>
            <p className="text-xs text-slate-450 mt-0.5">
              {pagination ? `${pagination.total.toLocaleString()} jobs posted` : 'All service requests on the platform'}
            </p>
          </div>
          <button
            onClick={fetchJobs}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-3 rounded-lg shadow-sm hover:shadow active:scale-97 transition-all border-none outline-none cursor-pointer"
          >
            Refresh
          </button>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => changeFilter(value)}
              className={`text-[11px] font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer border ${
                filter === value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/85 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-3.5">Job Title</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Assigned Worker</th>
                  <th className="px-6 py-3.5">Trade</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Posted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-bold">Loading jobs...</td>
                  </tr>
                ) : jobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-bold">No jobs found.</td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800 max-w-[220px] truncate">{job.title}</td>
                      <td className="px-6 py-4 text-slate-650 truncate max-w-[150px]">{job.customer?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 text-slate-450 truncate max-w-[150px]">{job.assignedWorker?.name || '—'}</td>
                      <td className="px-6 py-4 text-slate-500 font-semibold capitalize">{job.tradeCategory}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${statusClass(job.status)}`}>
                          {job.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-right">{new Date(job.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/40">
              <span className="text-[11px] text-slate-400 font-bold">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="border border-slate-200 hover:border-slate-300 text-slate-500 font-bold text-[11px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer bg-white disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="border border-slate-200 hover:border-slate-300 text-slate-500 font-bold text-[11px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer bg-white disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </AdminShell>
  );
}
