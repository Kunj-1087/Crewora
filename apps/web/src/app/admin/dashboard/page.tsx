'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Users, HardHat, Briefcase, FileCheck, Search, Bell, Mail, 
  LayoutDashboard, UserCheck, ShieldAlert, Settings, Info, LogOut, Check, X, SlidersHorizontal
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function AdminDashboard() {
  const router = useRouter();
  const { logout } = useAuthStore();
  
  // Local state for queue approval demonstration
  const [verificationQueue, setVerificationQueue] = useState([
    { id: '1', name: 'John Doe', email: 'john.doe@email.com', trade: 'Plumber', date: 'Oct 12, 2023', docs: '4 Documents', status: 'pending' },
    { id: '2', name: 'Jane Smith', email: 'jane.smith@email.com', trade: 'Electrician', date: 'Oct 11, 2023', docs: '3 Documents', status: 'pending' },
    { id: '3', name: 'Bob White', email: 'bob.w@email.com', trade: 'Carpenter', date: 'Oct 09, 2023', docs: '0 Documents', status: 'no_docs' },
  ]);

  const handleApprove = (id: string) => {
    setVerificationQueue(prev => prev.filter(item => item.id !== id));
  };

  const handleReject = (id: string) => {
    setVerificationQueue(prev => prev.filter(item => item.id !== id));
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      
      {/* ─── Sidebar Navigation ────────────────────────────────────────────── */}
      <aside className="w-64 bg-slate-900 text-slate-350 flex flex-col justify-between shrink-0 border-r border-slate-800 relative z-20">
        <div className="flex flex-col flex-1 p-5 space-y-8 text-left select-none">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-base">C</span>
            </div>
            <div>
              <h2 className="text-sm font-black text-white leading-none">Crewora</h2>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Marketplace Manager</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 pt-4">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-accent-600 text-white font-extrabold text-xs transition-all text-left">
              <LayoutDashboard size={14} />
              <span>Overview</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-450 hover:text-white font-bold text-xs transition-all text-left">
              <FileCheck size={14} />
              <span>Worker Verification</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-450 hover:text-white font-bold text-xs transition-all text-left">
              <Users size={14} />
              <span>Customers</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-450 hover:text-white font-bold text-xs transition-all text-left">
              <HardHat size={14} />
              <span>Workers</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-450 hover:text-white font-bold text-xs transition-all text-left">
              <Briefcase size={14} />
              <span>Jobs</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-450 hover:text-white font-bold text-xs transition-all text-left">
              <Settings size={14} />
              <span>Settings</span>
            </button>
          </nav>

          {/* Support Info */}
          <div className="pt-2 text-left">
            <Link href="#" className="flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-450 hover:text-white">
              <Info size={14} />
              <span>Support</span>
            </Link>
          </div>

        </div>

        {/* Footer Logout */}
        <div className="p-5 border-t border-slate-800 select-none">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-rose-950/20 text-rose-450 hover:text-rose-355 font-bold text-xs transition-all text-left border-none outline-none bg-transparent"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Panel Content ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 relative z-10 select-none">
          {/* Search bar */}
          <div className="relative w-72 flex items-center">
            <span className="absolute left-3 text-slate-400">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="Search workers, jobs or customers..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-accent-500 focus:bg-white text-xs pl-9 pr-3 py-2 rounded-lg outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>

          {/* Controls & Profile Dropdown */}
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-450 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border-none outline-none">
              <Bell size={16} />
            </button>
            <button className="p-2 text-slate-450 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border-none outline-none">
              <Mail size={16} />
            </button>
            
            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="block text-xs font-extrabold text-slate-850">Admin User</span>
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">System Administrator</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-accent-100 border border-accent-200 flex items-center justify-center text-accent-700 font-black text-xs">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Panels Scroll */}
        <main className="flex-1 overflow-y-auto p-8 text-left space-y-8 max-w-5xl select-none">
          
          {/* Welcome Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-left">
              <h1 className="text-2xl font-extrabold text-[#0b1528] tracking-tight">Overview Dashboard</h1>
              <p className="text-xs text-slate-450 mt-0.5">{"Welcome back. Here's what needs your attention today."}</p>
            </div>
            <button className="bg-accent-600 hover:bg-accent-700 text-white font-extrabold text-xs px-5 py-3 rounded-lg shadow-sm hover:shadow active:scale-97 transition-all border-none outline-none">
              Generate Report
            </button>
          </div>

          {/* 4 Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Customers */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex items-start justify-between">
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Customers</span>
                <span className="text-2xl font-extrabold text-slate-850 block">1,240</span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 pt-1">
                  <span>&uarr; +12% from last month</span>
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <UserCheck size={16} className="stroke-[2.5]" />
              </div>
            </div>

            {/* Total Workers */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex items-start justify-between">
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Workers</span>
                <span className="text-2xl font-extrabold text-slate-850 block">856</span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 pt-1">
                  <span>&uarr; +5.2% since yesterday</span>
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <HardHat size={16} className="stroke-[2.5]" />
              </div>
            </div>

            {/* Active Jobs */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex items-start justify-between">
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Active Jobs</span>
                <span className="text-2xl font-extrabold text-slate-850 block">42</span>
                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5 pt-1">
                  <span>8 ending within 48h</span>
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Briefcase size={16} className="stroke-[2.5]" />
              </div>
            </div>

            {/* Pending Verifications */}
            <div className="bg-amber-50/50 rounded-xl border border-amber-200 p-5 shadow-sm flex items-start justify-between">
              <div className="space-y-3">
                <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">Pending Verifications</span>
                <span className="text-2xl font-extrabold text-amber-900 block">15</span>
                <span className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5 pt-1">
                  <span>! Requires immediate review</span>
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <ShieldAlert size={16} className="stroke-[2.5]" />
              </div>
            </div>

          </div>

          {/* Worker Verification Queue Card Table */}
          <div className="bg-white rounded-2xl border border-slate-200/85 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
              <h3 className="font-extrabold text-sm text-[#0b1528]">Worker Verification Queue</h3>
              <button className="text-xs font-bold text-accent-600 hover:text-accent-700">View All</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider text-[10px]">
                    <th className="px-6 py-3.5">Worker Name</th>
                    <th className="px-6 py-3.5">Trade Category</th>
                    <th className="px-6 py-3.5">Registered Date</th>
                    <th className="px-6 py-3.5">Documents Submitted</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {verificationQueue.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-bold">
                        Queue empty. All workers verified!
                      </td>
                    </tr>
                  ) : (
                    verificationQueue.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200">
                              {item.name.split(' ').map(n => n.charAt(0)).join('')}
                            </div>
                            <div className="text-left">
                              <span className="block font-bold text-slate-800">{item.name}</span>
                              <span className="block text-[10px] text-slate-400">{item.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-semibold">{item.trade}</td>
                        <td className="px-6 py-4 text-slate-450">{item.date}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.status === 'no_docs' ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-700'}`}>
                            {item.docs}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {item.status === 'no_docs' ? (
                              <button className="text-[10px] font-extrabold text-accent-600 hover:text-accent-700 hover:underline border-none outline-none bg-transparent">
                                Send Request
                              </button>
                            ) : (
                              <>
                                <button 
                                  onClick={() => handleApprove(item.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1.5 rounded transition-colors"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleReject(item.id)}
                                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] px-3 py-1.5 rounded transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Jobs Tracking Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/85 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-550 bg-slate-50/40">
              <h3 className="font-extrabold text-sm text-[#0b1528]">Recent Jobs</h3>
              <div className="flex items-center gap-4 text-xs select-none">
                <button className="text-slate-450 hover:text-slate-700 flex items-center gap-1">
                  <SlidersHorizontal size={12} />
                </button>
                <button className="font-bold text-accent-600 hover:text-accent-700">All Jobs</button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-550 bg-slate-50 border-b border-slate-100 text-slate-450 font-black uppercase tracking-wider text-[10px]">
                    <th className="px-6 py-3.5">Job Title</th>
                    <th className="px-6 py-3.5">Customer</th>
                    <th className="px-6 py-3.5">Trade</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Posted Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  
                  {/* Job Row 1 */}
                  <tr className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">Commercial Wiring Overhaul</td>
                    <td className="px-6 py-4 text-slate-600">TechCorp Industries</td>
                    <td className="px-6 py-4 text-slate-500 font-semibold">Electrician</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                        In Progress
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-450 text-right">2h ago</td>
                  </tr>

                  {/* Job Row 2 */}
                  <tr className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">Residential Pipe Leak Repair</td>
                    <td className="px-6 py-4 text-slate-600">Alice Henderson</td>
                    <td className="px-6 py-4 text-slate-500 font-semibold">Plumber</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                        Pending Bid
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-450 text-right">5h ago</td>
                  </tr>

                  {/* Job Row 3 */}
                  <tr className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">Custom Cabinetry Install</td>
                    <td className="px-6 py-4 text-slate-600">David Miller</td>
                    <td className="px-6 py-4 text-slate-500 font-semibold">Carpenter</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-100">
                        Emergency
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-450 text-right">8h ago</td>
                  </tr>

                  {/* Job Row 4 */}
                  <tr className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">Garden Lighting System</td>
                    <td className="px-6 py-4 text-slate-600">Sunnyside Estates</td>
                    <td className="px-6 py-4 text-slate-500 font-semibold">Electrician</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Completed
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-450 text-right">Yesterday</td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>

    </div>
  );
}
