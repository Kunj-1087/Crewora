'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { UserX, X } from 'lucide-react';
import type { Worker, PaginationMeta, VerificationStatus } from '@crewora/shared';
import apiClient from '@crewora/api-client';
import AdminShell from '@/components/admin/AdminShell';

const PAGE_SIZE = 20;

type StatusFilter = 'all' | VerificationStatus;

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

const statusBadge: Record<VerificationStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  rejected: 'bg-rose-50 text-rose-700 border-rose-100',
};

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Rejection dialog state
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/admin/workers', {
        params: { page, limit: PAGE_SIZE, ...(filter !== 'all' ? { status: filter } : {}) },
      });
      setWorkers(data.data.workers || []);
      setPagination(data.data.pagination || null);
    } catch (err) {
      console.error('Failed to fetch workers:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const handleApprove = async (id: string) => {
    setActioningId(id);
    try {
      await apiClient.post(`/admin/workers/${id}/approve`);
      fetchWorkers();
    } catch (err) {
      console.error('Failed to approve worker:', err);
      alert('Failed to approve worker.');
    } finally {
      setActioningId(null);
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (!window.confirm(`Deactivate ${name}? They will lose access to the platform.`)) return;
    setActioningId(id);
    try {
      await apiClient.patch(`/admin/worker/${id}/deactivate`);
      fetchWorkers();
    } catch (err) {
      console.error('Failed to deactivate worker:', err);
      alert('Failed to deactivate worker.');
    } finally {
      setActioningId(null);
    }
  };

  const submitRejection = async () => {
    if (!rejectId) return;
    if (rejectReason.trim().length < 10) {
      setRejectError('Please provide a detailed reason (at least 10 characters).');
      return;
    }
    try {
      await apiClient.post(`/admin/workers/${rejectId}/reject`, { reason: rejectReason.trim() });
      setRejectId(null);
      setRejectReason('');
      setRejectError(null);
      fetchWorkers();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setRejectError(message || 'Failed to reject worker.');
    }
  };

  const changeFilter = (value: StatusFilter) => {
    setFilter(value);
    setPage(1);
  };

  return (
    <AdminShell active="workers">
      <div className="p-8 max-w-6xl space-y-8 text-left select-none">

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="text-2xl font-extrabold text-[#0b1528] tracking-tight">Workers</h1>
            <p className="text-xs text-slate-450 mt-0.5">
              {pagination ? `${pagination.total.toLocaleString()} workers` : 'Service providers on the platform'}
            </p>
          </div>
          <button
            onClick={fetchWorkers}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-3 rounded-lg shadow-sm hover:shadow active:scale-97 transition-all border-none outline-none cursor-pointer"
          >
            Refresh
          </button>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2">
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
                  <th className="px-6 py-3.5">Worker</th>
                  <th className="px-6 py-3.5">Trade Categories</th>
                  <th className="px-6 py-3.5">City</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-bold">Loading workers...</td>
                  </tr>
                ) : workers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-bold">No workers found.</td>
                  </tr>
                ) : (
                  workers.map((worker) => (
                    <tr key={worker.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-650 font-bold text-xs flex items-center justify-center border border-slate-200 uppercase">
                            {worker.name.charAt(0)}
                          </div>
                          <div className="text-left">
                            <span className="block font-bold text-slate-800">{worker.name}</span>
                            <span className="block text-[10px] text-slate-400">{worker.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-650 font-semibold capitalize max-w-[200px] truncate">
                        {worker.tradeCategories?.join(', ') || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-slate-450 capitalize">{worker.city || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${statusBadge[worker.verificationStatus]}`}>
                          {worker.verificationStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {worker.verificationStatus === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(worker.id)}
                                disabled={actioningId === worker.id}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1.5 rounded transition-colors border-none cursor-pointer disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => { setRejectId(worker.id); setRejectReason(''); setRejectError(null); }}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] px-3 py-1.5 rounded transition-colors border-none cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeactivate(worker.id, worker.name)}
                            disabled={actioningId === worker.id}
                            className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] px-3 py-1.5 rounded transition-colors border border-rose-100 cursor-pointer disabled:opacity-50"
                          >
                            <UserX size={12} />
                            Deactivate
                          </button>
                        </div>
                      </td>
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

      {/* ─── Rejection Reason Modal ────────────────────────────────────────── */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setRejectId(null)}></div>
          <div className="relative bg-white rounded-2xl max-w-md w-full border border-slate-200 p-6 shadow-2xl space-y-4 select-none text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-800">Reject Worker Registration</h3>
              <button
                onClick={() => setRejectId(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer outline-none"
              >
                <X size={18} />
              </button>
            </div>

            {rejectError && (
              <div className="bg-red-50 text-red-600 text-xs px-4 py-2.5 rounded-lg border border-red-100 font-semibold">
                {rejectError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">Reason for Rejection</label>
              <textarea
                placeholder="Provide a reason (minimum 10 characters)..."
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-red-500 focus:bg-white transition-all resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectId(null)}
                className="border border-slate-200 hover:border-slate-300 text-slate-500 font-bold text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer bg-white"
              >
                Cancel
              </button>
              <button
                onClick={submitRejection}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer border-none shadow-sm"
              >
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
