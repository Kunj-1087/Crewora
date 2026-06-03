'use client';

import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Smartphone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { analyticsService } from '@/services/analyticsService';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  downloadUrl: string;
}

export function QRCodeModal({ isOpen, onClose, downloadUrl }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        downloadUrl,
        {
          width: 200,
          margin: 1,
          color: {
            dark: '#0b1528', // Crewora navy
            light: '#ffffff',
          },
        },
        (error: Error | null | undefined) => {
          if (error) console.error('Error generating QR code:', error);
        }
      );
      analyticsService.trackQRCodeScan();
    }
  }, [isOpen, downloadUrl]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div 
        className="relative bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-fadeIn"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-primary-500"
          aria-label={t('download.modal_qr_close')}
        >
          <X size={18} />
        </button>

        {/* Icon & Title */}
        <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-500 flex items-center justify-center mb-3">
          <Smartphone size={24} />
        </div>
        <h3 id="qr-modal-title" className="text-base font-extrabold text-[#0b1528]">
          {t('download.modal_qr_title')}
        </h3>
        <p className="text-[11px] text-slate-400 mt-2 max-w-[260px] leading-relaxed">
          {t('download.modal_qr_desc')}
        </p>

        {/* QR Code Canvas */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 my-4 flex items-center justify-center">
          <canvas ref={canvasRef} className="w-[180px] h-[180px] block" />
        </div>

        {/* Target Link */}
        <div className="w-full text-center">
          <span className="text-[9px] font-bold text-slate-400 block truncate max-w-[260px] mx-auto bg-slate-50 px-3 py-2 rounded-lg border border-slate-150">
            {downloadUrl}
          </span>
        </div>
      </div>
    </div>
  );
}
