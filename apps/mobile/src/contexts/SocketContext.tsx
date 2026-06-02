'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { HardHat, CheckCircle2, X, ShieldCheck } from 'lucide-react';
import apiClient from '@crewora/api-client';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => useContext(SocketContext);

interface NotificationToast {
  id: string;
  type: 'new_job_invite' | 'job_match_accepted';
  title: string;
  message: string;
  payload: any;
}

// Synthesize a soft double chime using Web Audio API (zero external assets needed)
const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Tone 1: C5 (523.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.frequency.value = 523.25;
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.15);

    // Tone 2: E5 (659.25 Hz) after 120ms
    setTimeout(() => {
      if (ctx.state === 'closed') return;
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 659.25;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.08, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.25);
    }, 120);
  } catch (err) {
    console.warn('Unable to play audio chime due to user interaction policies:', err);
  }
};

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [toast, setToast] = useState<NotificationToast | null>(null);
  const [actioning, setActioning] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    let API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    if (typeof window !== 'undefined') {
      if (Capacitor.isNativePlatform()) {
        if (process.env.NEXT_PUBLIC_API_URL) {
          API_BASE = process.env.NEXT_PUBLIC_API_URL;
        } else {
          if (Capacitor.getPlatform() === 'android') {
            API_BASE = 'http://10.0.2.2:5000/api/v1';
          } else {
            API_BASE = 'http://localhost:5000/api/v1';
          }
        }
      } else {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          API_BASE = 'http://localhost:5000/api/v1';
        }
      }
    }

    const SOCKET_URL = API_BASE.replace('/api/v1', '');
    const s = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    s.emit('join', user.id);
    setSocket(s);

    // Register global event listeners for matchmaking notifications
    s.on('new_job_invite', (data: any) => {
      // Avoid showing toast if worker is offline/on job and gets retroactively invites?
      // Dashboards can handle filters, but toast should show for active leads
      playNotificationChime();
      
      // Auto dismiss after 8 seconds
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      
      setToast({
        id: Math.random().toString(),
        type: 'new_job_invite',
        title: 'New Job Matching Lead!',
        message: `${data.tradeCategory} needed: "${data.title}"`,
        payload: data,
      });

      toastTimeoutRef.current = setTimeout(() => setToast(null), 10000);
    });

    s.on('job_match_accepted', (data: any) => {
      playNotificationChime();

      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);

      setToast({
        id: Math.random().toString(),
        type: 'job_match_accepted',
        title: 'Contractor Found!',
        message: `${data.workerName} has accepted your job: "${data.jobTitle}"`,
        payload: data,
      });

      toastTimeoutRef.current = setTimeout(() => setToast(null), 10000);
    });

    // ─── Capacitor Native Push Notifications Setup ──────────────────────────────────
    if (Capacitor.isNativePlatform()) {
      PushNotifications.requestPermissions().then((result) => {
        if (result.receive === 'granted') {
          PushNotifications.register();
        }
      });

      PushNotifications.addListener('registration', async (token) => {
        try {
          await apiClient.post('/auth/device-token', { token: token.value });
        } catch (err) {
          console.error('Failed to register device token with backend', err);
        }
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on push notification registration:', error);
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        playNotificationChime();
        setToast({
          id: notification.id,
          type: notification.data?.type === 'new_job_invite' ? 'new_job_invite' : 'job_match_accepted',
          title: notification.title || 'Notification Received',
          message: notification.body || '',
          payload: notification.data || {},
        });
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const data = action.notification.data;
        if (data?.type === 'new_job_invite' && data?.matchId) {
          router.push('/worker/dashboard');
        } else if (data?.type === 'job_match_accepted' && data?.jobId) {
          router.push(`/customer/jobs/${data.jobId}`);
        }
      });
    }

    return () => {
      s.disconnect();
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router]);

  const handleToastDismiss = () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(null);
  };

  const handleAcceptMatch = async () => {
    if (!toast || toast.type !== 'new_job_invite' || actioning) return;
    setActioning(true);
    try {
      const matchId = toast.payload.matchId;
      await apiClient.post(`/jobs/worker/matches/${matchId}/respond`, {
        action: 'accept'
      });
      // Direct redirect to worker dashboard to see the active job
      router.push('/worker/dashboard');
      // Fire custom event to refresh worker dashboard in case user is already on it
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('worker:match_responded', { detail: { matchId, action: 'accept' } }));
      }
      handleToastDismiss();
    } catch (err: any) {
      console.error('Toast accept failed:', err);
      alert(err?.response?.data?.message || 'Could not accept job invite.');
    } finally {
      setActioning(false);
    }
  };

  const handleDeclineMatch = async () => {
    if (!toast || toast.type !== 'new_job_invite' || actioning) return;
    setActioning(true);
    try {
      const matchId = toast.payload.matchId;
      await apiClient.post(`/jobs/worker/matches/${matchId}/respond`, {
        action: 'decline'
      });
      // Fire custom event to refresh worker dashboard
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('worker:match_responded', { detail: { matchId, action: 'decline' } }));
      }
      handleToastDismiss();
    } catch (err: any) {
      console.error('Toast decline failed:', err);
    } finally {
      setActioning(false);
    }
  };

  const handleViewJobDetails = () => {
    if (!toast || toast.type !== 'job_match_accepted') return;
    const jobId = toast.payload.jobId;
    router.push(`/customer/jobs/${jobId}`);
    handleToastDismiss();
  };

  return (
    <SocketContext.Provider value={socket}>
      <div className="relative min-h-screen flex flex-col">
        {/* Floating Premium Toast Banner */}
        {toast && (
          <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[9999] bg-white/95 backdrop-blur-md border border-slate-100/80 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] p-4 flex flex-col gap-3 animate-slideDown select-none">
            
            {/* Toast Header */}
            <div className="flex gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                toast.type === 'new_job_invite' 
                  ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              }`}>
                {toast.type === 'new_job_invite' ? <HardHat size={18} /> : <ShieldCheck size={18} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  {toast.type === 'new_job_invite' ? 'Match Alert' : 'Status Update'}
                </span>
                <h4 className="text-xs font-black text-slate-800 truncate mt-0.5">{toast.title}</h4>
                <p className="text-[11px] text-slate-500 leading-normal mt-1">{toast.message}</p>
              </div>

              <button 
                onClick={handleToastDismiss}
                className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0 self-start hover:bg-slate-50 rounded-lg transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Match details & actions if Worker Lead */}
            {toast.type === 'new_job_invite' && (
              <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-50">
                <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                  <span>Urgency: <span className="text-rose-600 uppercase">{toast.payload.urgency}</span></span>
                  <span className="truncate max-w-[200px]">📍 {toast.payload.address}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeclineMatch}
                    disabled={actioning}
                    className="flex-1 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-100 hover:bg-rose-50/50 rounded-xl transition-all"
                  >
                    Decline
                  </button>
                  <button
                    onClick={handleAcceptMatch}
                    disabled={actioning}
                    className="flex-2 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    {actioning ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 size={13} />
                        <span>Accept Match</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Action if Client Match Accepted */}
            {toast.type === 'job_match_accepted' && (
              <div className="pt-2 border-t border-slate-50">
                <button
                  onClick={handleViewJobDetails}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                >
                  View Job Details & Contact
                </button>
              </div>
            )}

          </div>
        )}
        
        {/* Main Application Body */}
        {children}
      </div>
    </SocketContext.Provider>
  );
}
