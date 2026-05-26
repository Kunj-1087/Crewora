'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ChevronLeft, Check, Calendar as CalendarIcon, Clock, ShieldCheck, DollarSign,
  Briefcase, Star, MapPin, AlertCircle, Info, Lock, CheckCircle2
} from 'lucide-react';
import apiClient from '@/lib/api/client';

// Services catalog mapped to worker profiles
const SERVICES_BY_WORKER: Record<string, {
  name: string;
  role: string;
  photo: string;
  services: { id: string; title: string; price: number; duration: string; desc: string }[];
}> = {
  // Sarah Jenkins
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d': {
    name: 'Sarah Jenkins',
    role: 'Master Carpenter',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
    services: [
      { id: 's-101', title: 'Custom Kitchen Cabinet Installation', price: 350, duration: '4 hours', desc: 'Complete measurement, layout, and mounting of kitchen wall cabinets and cupboards.' },
      { id: 's-102', title: 'Mahogany Wood Refinishing & Polishing', price: 180, duration: '2 hours', desc: 'Stripping old varnish, sanding down to base wood, and applying premium finishing oils.' },
      { id: 's-103', title: 'Custom Furniture Framing & Assembly', price: 750, duration: '1 day', desc: 'On-site framing and assembly of custom dining tables, beds, shelves, or structures.' }
    ]
  },
  // David Chen
  'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e': {
    name: 'David Chen',
    role: 'Master Electrician',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    services: [
      { id: 's-201', title: 'Smart Home Electric Panel Diagnostics', price: 150, duration: '1.5 hours', desc: 'Full diagnostic inspect of circuits, fuses, load balancing, and smart breakers.' },
      { id: 's-202', title: 'Emergency Wire/Socket Fixes', price: 95, duration: '1 hour', desc: 'Locating and repairing sparks, burnt sockets, or dead wires in walls.' },
      { id: 's-203', title: 'High-Speed EV Charging Plug Hookup', price: 350, duration: '3 hours', desc: 'Installation of high-capacity outlet box and line check from panel.' }
    ]
  },
  // Elena Rodriguez
  'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f': {
    name: 'Elena Rodriguez',
    role: 'Professional Tiler & Mason',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
    services: [
      { id: 's-301', title: 'Bathroom Wall & Floor Tiling', price: 450, duration: '4 hours', desc: 'Laying ceramic or porcelain tiles, including waterproofing membrane, alignment, and grout.' },
      { id: 's-302', title: 'Granite Kitchen Backsplash Setup', price: 280, duration: '2 hours', desc: 'Cutting and mounting granite or marble backsplash panels with waterproof sealant.' }
    ]
  },
  // Default fallback
  'default': {
    name: 'Expert Partner',
    role: 'Verified Professional',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
    services: [
      { id: 's-def-1', title: 'General Service Consultation', price: 120, duration: '1 hour', desc: 'Initial diagnostics and scope review for specialized contract projects.' },
      { id: 's-def-2', title: 'Full Day Dedicated Service Block', price: 750, duration: '8 hours', desc: 'Uninterrupted expert work on-site or remote.' }
    ]
  }
};

const TIME_SLOTS = [
  '09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'
];

export default function BookWorkerClient() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1); // 1: Service, 2: Schedule, 3: Review
  
  // States
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Retrieve worker profile metadata
  const workerMeta = SERVICES_BY_WORKER[id] || SERVICES_BY_WORKER['default'];
  
  const selectedService = workerMeta.services.find(s => s.id === selectedServiceId);

  useEffect(() => {
    // Select first service by default
    if (workerMeta.services.length > 0) {
      setSelectedServiceId(workerMeta.services[0].id);
    }
  }, [workerMeta]);

  // Calendar dates mock grid - October 2023
  // Starts on Sunday (1st). We will render October 16-22 for active scheduling
  const daysInOctober = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleNextStep = () => {
    if (currentStep === 1 && !selectedServiceId) return;
    if (currentStep === 2 && (!selectedDate || !selectedTimeSlot)) return;
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleConfirmBooking = async () => {
    setIsSuccess(true);
    // Simulate API delay
    setTimeout(() => {
      router.push('/customer/dashboard');
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-[#F8FAFC] p-6 text-center select-none animate-fadeIn">
        <div className="w-16 h-16 bg-emerald-50 text-[#10b981] rounded-full flex items-center justify-center border border-emerald-100 shadow-md mb-4">
          <CheckCircle2 className="w-8 h-8 text-[#10b981]" />
        </div>
        <h2 className="text-lg font-black text-[#0b1528]">Booking Confirmed!</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
          Your request has been registered and locked in secure escrow. Redirecting to your Hirer Dashboard...
        </p>
        <div className="w-8 h-8 border-4 border-[#10b981] border-t-transparent rounded-full animate-spin mt-6"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] relative animate-fadeIn select-none pb-28">
      
      {/* ─── Back Button & Header ────────────────────────────────────────────── */}
      <div className="sticky top-0 bg-white border-b border-slate-100 h-14 px-4 flex items-center gap-3 z-30 shadow-sm shrink-0">
        <button onClick={() => router.back()} className="text-slate-800 hover:text-navy p-1 transition-colors">
          <ChevronLeft size={20} className="stroke-[2.5]" />
        </button>
        <span className="text-sm font-extrabold text-[#0b1528] tracking-tight">Book {workerMeta.name}</span>
      </div>

      {/* ─── 3-Step Progress Header ───────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 py-3.5 px-6 grid grid-cols-3 text-center text-[10px] font-black text-slate-400 select-none">
        <div className={`flex flex-col items-center gap-1 ${currentStep >= 1 ? 'text-[#10b981]' : ''}`}>
          <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${currentStep >= 1 ? 'border-[#10b981] bg-emerald-50' : 'border-slate-200'}`}>1</span>
          <span>SELECT SERVICE</span>
        </div>
        <div className={`flex flex-col items-center gap-1 ${currentStep >= 2 ? 'text-[#10b981]' : ''}`}>
          <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${currentStep >= 2 ? 'border-[#10b981] bg-emerald-50' : 'border-slate-200'}`}>2</span>
          <span>SCHEDULE WORK</span>
        </div>
        <div className={`flex flex-col items-center gap-1 ${currentStep >= 3 ? 'text-[#10b981]' : ''}`}>
          <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${currentStep >= 3 ? 'border-[#10b981] bg-emerald-50' : 'border-slate-200'}`}>3</span>
          <span>REVIEW BOOKING</span>
        </div>
      </div>

      <div className="px-5 py-5 space-y-6 flex-1 text-left">
        
        {/* ─── STEP 1: SERVICE SELECTION ──────────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Available Services</h3>
            
            <div className="space-y-3">
              {workerMeta.services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => setSelectedServiceId(service.id)}
                  className={`bg-white rounded-2xl border p-4 shadow-sm cursor-pointer transition-all ${
                    selectedServiceId === service.id 
                      ? 'border-[#10b981] bg-emerald-50/10' 
                      : 'border-slate-200 hover:border-slate-350'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{service.title}</h4>
                    <span className="text-sm font-black text-[#0b1528] whitespace-nowrap">${service.price}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{service.duration} duration</p>
                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">{service.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── STEP 2: SCHEDULE SCHEDULE ──────────────────────────────────────── */}
        {currentStep === 2 && (
          <div className="space-y-5">
            
            {/* Calendar Grid Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Date (October 2023)</h3>
              
              <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-4">
                <div className="text-xs font-extrabold text-[#0b1528] text-center uppercase tracking-wider">
                  October 2023
                </div>
                
                {/* Weekday headers */}
                <div className="grid grid-cols-7 text-center text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                </div>
                
                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty placeholders for offset days (Oct 1 2023 was Sunday, so no offset) */}
                  {daysInOctober.map((day) => {
                    const isSelectable = day >= 16 && day <= 24;
                    const isSelected = selectedDate === day;
                    
                    return (
                      <button
                        key={day}
                        disabled={!isSelectable}
                        onClick={() => setSelectedDate(day)}
                        className={`h-9 w-full rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                          isSelected
                            ? 'bg-[#10b981] text-white font-black'
                            : isSelectable
                            ? 'bg-emerald-50 text-[#065f46] hover:bg-emerald-100/80 border border-emerald-100'
                            : 'text-slate-300 bg-transparent'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Time Slots Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Time Slot</h3>
              
              <div className="grid grid-cols-2 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const isSelected = selectedTimeSlot === slot;
                  return (
                    <button
                      key={slot}
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`py-3.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isSelected 
                          ? 'border-[#10b981] bg-emerald-50/20 text-[#065f46] font-black' 
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-350'
                      }`}
                    >
                      <Clock size={13} />
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ─── STEP 3: REVIEW BOOKING ─────────────────────────────────────────── */}
        {currentStep === 3 && selectedService && (
          <div className="space-y-5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Review Contract</h3>
            
            {/* Booking Summary Panel (Deep Navy) */}
            <div className="bg-[#0b1528] rounded-2xl p-5 text-white shadow-md space-y-4">
              <div className="flex justify-between items-start border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Service Item</span>
                  <h4 className="text-sm font-black mt-1 text-white">{selectedService.title}</h4>
                </div>
                <span className="text-sm font-black text-[#4ade80]">${selectedService.price}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Contractor</span>
                  <span className="font-extrabold mt-0.5 block">{workerMeta.name}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Schedule</span>
                  <span className="font-extrabold mt-0.5 block">Oct {selectedDate}, 2023 at {selectedTimeSlot}</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-3 flex justify-between items-center text-xs font-black">
                <span>Total Amount Due</span>
                <span className="text-base text-[#4ade80]">${selectedService.price}.00</span>
              </div>
            </div>

            {/* Escrow Escrow */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex gap-3 text-left">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#10b981] flex items-center justify-center shrink-0">
                <Lock size={15} />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-extrabold text-[#065f46] uppercase tracking-wider">Secure Escrow Escrow</h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Your funds are deposited securely into escrow. The worker will only be paid once you approve the job as completed.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ─── Bottom Floating Actions Navigation ─────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 md:absolute md:bottom-0 bg-white border-t border-slate-100 p-4 z-40 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] select-none shrink-0 flex gap-3">
        {currentStep > 1 && (
          <button 
            onClick={handlePrevStep}
            className="border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-[#0b1528] font-extrabold text-xs px-5 py-3.5 rounded-xl transition-colors"
          >
            BACK
          </button>
        )}
        
        {currentStep < 3 ? (
          <button 
            disabled={currentStep === 2 && (!selectedDate || !selectedTimeSlot)}
            onClick={handleNextStep}
            className={`flex-1 font-extrabold text-xs py-3.5 rounded-xl transition-colors text-center text-white ${
              (currentStep === 2 && (!selectedDate || !selectedTimeSlot))
                ? 'bg-slate-200 cursor-not-allowed text-slate-400'
                : 'bg-[#10b981] hover:bg-[#059669] shadow-sm'
            }`}
          >
            CONTINUE
          </button>
        ) : (
          <button 
            onClick={handleConfirmBooking}
            className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white font-extrabold text-xs py-3.5 rounded-xl shadow-sm transition-all active:scale-[0.98] text-center"
          >
            CONFIRM BOOKING
          </button>
        )}
      </div>

    </div>
  );
}
