'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { UserX } from 'lucide-react';
import type { Customer, PaginationMeta } from '@crewora/shared';
import apiClient from '@crewora/api-client';
import AdminShell from '@/components/admin/AdminShell';

const PAGE_SIZE = 20;

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/admin/customers', {
        params: { page, limit: PAGE_SIZE },
      });
      setCustomers(data.data.customers || []);
      setPagination(data.data.pagination || null);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleDeactivate = async (id: string, name: string) => {
    if (!window.confirm(`Deactivate ${name}? They will lose access to the platform.`)) return;
    setActioningId(id);
    try {
      await apiClient.patch(`/admin/customer/${id}/deactivate`);
      fetchCustomers();
    } catch (err) {
      console.error('Failed to deactivate customer:', err);
      alert('Failed to deactivate customer.');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <AdminShell active="customers">
      <div className="p-8 max-w-6xl space-y-8 text-left select-none">

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="text-2xl font-extrabold text-[#0b1528] tracking-tight">Customers</h1>
            <p className="text-xs text-slate-450 mt-0.5">
              {pagination ? `${pagination.total.toLocaleString()} registered customers` : 'Registered customers on the platform'}
            </p>
          </div>
          <button
            onClick={fetchCustomers}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-3 rounded-lg shadow-sm hover:shadow active:scale-97 transition-all border-none outline-none cursor-pointer"
          >
            Refresh
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/85 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Phone</th>
                  <th className="px-6 py-3.5">Address</th>
                  <th className="px-6 py-3.5">Joined</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-bold">Loading customers...</td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-bold">No customers found.</td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-650 font-bold text-xs flex items-center justify-center border border-slate-200 uppercase">
                            {customer.name.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-800">{customer.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-650 font-semibold">{customer.phone}</td>
                      <td className="px-6 py-4 text-slate-450 max-w-[220px] truncate">{customer.address || '—'}</td>
                      <td className="px-6 py-4 text-slate-450">{new Date(customer.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeactivate(customer.id, customer.name)}
                          disabled={actioningId === customer.id}
                          className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] px-3 py-1.5 rounded transition-colors border border-rose-100 cursor-pointer disabled:opacity-50"
                        >
                          <UserX size={12} />
                          {actioningId === customer.id ? 'Working...' : 'Deactivate'}
                        </button>
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
    </AdminShell>
  );
}
