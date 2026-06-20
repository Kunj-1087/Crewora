'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { HardHat, Briefcase, UserCheck, ShieldAlert, X } from 'lucide-react';
import apiClient from '@crewora/api-client';
import AdminShell from '@/components/admin/AdminShell';

export default function AdminDashboard() {
  // Platform overview + table state
  const [stats, setStats] = useState<any>(null);
  const [verificationQueue, setVerificationQueue] = useState<any[]>([]);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // Rejection dialog state
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectingWorkerId, setRejectingWorkerId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const { data } = await apiClient.get('/admin/stats');
      setStats(data.data.stats);
    } catch (err) {
      console.error('Failed to fetch admin statistics:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchQueue = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const { data } = await apiClient.get('/admin/verification-queue');
      setVerificationQueue(data.data.workers || []);
    } catch (err) {
      console.error('Failed to fetch verification queue:', err);
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const { data } = await apiClient.get('/admin/jobs', { params: { page: 1, limit: 5 } });
      setRecentJobs(data.data.jobs || []);
    } catch (err) {
      console.error('Failed to fetch recent jobs:', err);
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchQueue();
    fetchJobs();
  }, [fetchStats, fetchQueue, fetchJobs]);

  const handleApprove = async (id: string) => {
    try {
      await apiClient.post(`/admin/workers/${id}/approve`);
      fetchQueue();
      fetchStats();
    } catch (err) {
      console.error('Failed to approve worker:', err);
      alert('Failed to approve worker request.');
    }
  };

  const handleRejectClick = (id: string) => {
    setRejectingWorkerId(id);
    setRejectionReason('');
    setRejectionError(null);
    setRejectionModalOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectingWorkerId) return;
    if (rejectionReason.trim().length < 10) {
      setRejectionError('Please provide a detailed reason (at least 10 characters).');
      return;
    }
    try {
      await apiClient.post(`/admin/workers/${rejectingWorkerId}/reject`, {
        reason: rejectionReason.trim(),
      });
      setRejectionModalOpen(false);
      setRejectingWorkerId(null);
      setRejectionReason('');
      fetchQueue();
      fetchStats();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setRejectionError(message || 'Failed to reject worker.');
    }
  };

  return (
    <AdminShell active="overview">
      <div className="p-8 text-left space-y-8 max-w-5xl select-none">

        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="text-2xl font-extrabold text-[#0b1528] tracking-tight">Overview Dashboard</h1>
            <p className="text-xs text-slate-450 mt-0.5">{"Welcome back. Here's what needs your attention today."}</p>
          </div>
          <button
            onClick={() => { fetchStats(); fetchQueue(); fetchJobs(); }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-3 rounded-lg shadow-sm hover:shadow active:scale-97 transition-all border-none outline-none cursor-pointer"
          >
            Refresh Platform Logs
          </button>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex items-start justify-between">
            <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Customers</span>
              <span className="text-2xl font-extrabold text-slate-850 block">
                {loadingStats ? '...' : stats?.totalCustomers?.toLocaleString() || 0}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 pt-1">
                <span>Registered users</span>
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck size={16} className="stroke-[2.5]" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex items-start justify-between">
            <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Workers</span>
              <span className="text-2xl font-extrabold text-slate-850 block">
                {loadingStats ? '...' : stats?.totalWorkers?.toLocaleString() || 0}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 pt-1">
                <span>Registered workers</span>
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <HardHat size={16} className="stroke-[2.5]" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex items-start justify-between">
            <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Active Jobs</span>
              <span className="text-2xl font-extrabold text-slate-850 block">
                {loadingStats ? '...' : stats?.activeJobs?.toLocaleString() || 0}
              </span>
              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5 pt-1">
                <span>In progress &amp; open</span>
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Briefcase size={16} className="stroke-[2.5]" />
            </div>
          </div>

          <div className="bg-amber-50/50 rounded-xl border border-amber-200 p-5 shadow-sm flex items-start justify-between">
            <div className="space-y-3">
              <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">Pending Verifications</span>
              <span className="text-2xl font-extrabold text-amber-900 block">
                {loadingStats ? '...' : stats?.pendingVerifications?.toLocaleString() || 0}
              </span>
              <span className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5 pt-1">
                <span>Requires review</span>
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <ShieldAlert size={16} className="stroke-[2.5]" />
            </div>
          </div>

        </div>

        {/* Worker Verification Queue */}
        <div className="bg-white rounded-2xl border border-slate-200/85 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
            <h3 className="font-extrabold text-sm text-[#0b1528]">Worker Verification Queue</h3>
            <span className="text-xs font-bold text-slate-400">Awaiting Approval</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-3.5">Worker Details</th>
                  <th className="px-6 py-3.5">Trade Categories</th>
                  <th className="px-6 py-3.5">Registered Date</th>
                  <th className="px-6 py-3.5">Certifications</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingQueue ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-bold">Loading verification queue...</td>
                  </tr>
                ) : verificationQueue.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-bold">Queue empty. All workers verified!</td>
                  </tr>
                ) : (
                  verificationQueue.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-650 font-bold text-xs flex items-center justify-center border border-slate-200 uppercase">
                            {item.name.split(' ').map((n: string) => n.charAt(0)).join('')}
                          </div>
                          <div className="text-left">
                            <span className="block font-bold text-slate-800">{item.name}</span>
                            <span className="block text-[10px] text-slate-400">{item.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-650 font-semibold capitalize">
                        {item.tradeCategories ? item.tradeCategories.join(', ') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-slate-450">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                          {item.certifications?.length || 0} Certifications
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApprove(item.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1.5 rounded transition-colors border-none cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectClick(item.id)}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] px-3 py-1.5 rounded transition-colors border-none cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white rounded-2xl border border-slate-200/85 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
            <h3 className="font-extrabold text-sm text-[#0b1528]">Recent Jobs</h3>
            <span className="text-xs font-bold text-slate-400">Activity Log</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-450 font-black uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-3.5">Job Title</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Trade</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Posted Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingJobs ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-bold">Loading recent jobs...</td>
                  </tr>
                ) : recentJobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-bold">No jobs posted yet.</td>
                  </tr>
                ) : (
                  recentJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800 max-w-[200px] truncate">{job.title}</td>
                      <td className="px-6 py-4 text-slate-650 truncate max-w-[150px]">{job.customer?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 text-slate-500 font-semibold capitalize">{job.tradeCategory}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                          job.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : job.status === 'matched' || job.status === 'in_progress'
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : job.status === 'cancelled'
                            ? 'bg-rose-50 text-rose-700 border-rose-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
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
        </div>

      </div>

      {/* ─── Rejection Reason Modal ────────────────────────────────────────── */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setRejectionModalOpen(false)}></div>

          <div className="relative bg-white rounded-2xl max-w-md w-full border border-slate-200 p-6 shadow-2xl space-y-4 select-none text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-800">Reject Worker Registration</h3>
              <button
                onClick={() => setRejectionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer outline-none"
              >
                <X size={18} />
              </button>
            </div>

            {rejectionError && (
              <div className="bg-red-50 text-red-600 text-xs px-4 py-2.5 rounded-lg border border-red-100 font-semibold">
                {rejectionError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">Reason for Rejection</label>
              <textarea
                placeholder="Provide a reason (minimum 10 characters)..."
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-red-500 focus:bg-white transition-all resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectionModalOpen(false)}
                className="border border-slate-200 hover:border-slate-300 text-slate-500 font-bold text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
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
