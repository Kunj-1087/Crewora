'use client';

import React, { useState } from 'react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { appDownloadService } from '@/services/appDownloadService';
import { Button } from '@crewora/ui';
import { Play, Download, Smartphone, X, Check, AlertTriangle } from 'lucide-react';
import { QRCodeModal } from './QRCodeModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { analyticsService } from '@/services/analyticsService';

interface AppDownloadButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  source?: 'hero' | 'navbar' | 'footer' | 'download_page';
  showIcon?: boolean;
  fullWidth?: boolean;
}

export function AppDownloadButton({
  variant = 'primary',
  size = 'md',
  source = 'hero',
  showIcon = true,
  fullWidth = false,
}: AppDownloadButtonProps) {
  const { isAndroid, isIOS, isDesktop, isLoaded } = useDeviceDetection();
  const { t } = useLanguage();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [iosModalOpen, setIosModalOpen] = useState(false);

  const getQRDownloadPageUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/download-app`;
    }
    return 'https://crewora.com/download-app';
  };

  const handleDownload = async () => {
    setError(null);
    setSuccess(false);

    const deviceType = isAndroid
      ? 'mobile_android'
      : isIOS
      ? 'mobile_ios'
      : isDesktop
      ? 'desktop'
      : 'unknown';

    analyticsService.trackDownloadClick(source, deviceType);

    if (isIOS) {
      setIosModalOpen(true);
      return;
    }

    if (isDesktop && source !== 'download_page') {
      setQrOpen(true);
      return;
    }

    setLoading(true);
    const result = await appDownloadService.downloadAndroidApp(source);
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || 'An unexpected error occurred during download.');
    }
  };

  const isPlayStore = appDownloadService.isPlayStoreRedirect();

  let buttonText = isPlayStore ? t('download.alternative') : t('download.cta');
  if (isLoaded && isIOS) {
    buttonText = t('download.coming_soon_ios');
  }

  let leftIconElement: React.ReactNode = null;
  if (showIcon) {
    if (success) {
      leftIconElement = <Check size={18} className="text-emerald-500 animate-scaleIn" />;
    } else if (isPlayStore) {
      leftIconElement = <Play size={16} className="fill-current text-white" />;
    } else {
      leftIconElement = <Download size={16} />;
    }
  }

  return (
    <>
      <div className={fullWidth ? 'w-full' : 'inline-block'}>
        <Button
          variant={variant}
          size={size}
          isLoading={loading}
          leftIcon={leftIconElement}
          fullWidth={fullWidth}
          onClick={handleDownload}
          disabled={!isLoaded}
          className="relative overflow-hidden transition-all duration-300 font-extrabold hover:shadow-md active:scale-95 cursor-pointer"
        >
          {buttonText}
        </Button>

        {error && (
          <div className="mt-2 text-xs text-error flex items-center gap-1.5 p-2 bg-error-light/30 rounded-lg border border-error/10 animate-fadeIn">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <QRCodeModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        downloadUrl={getQRDownloadPageUrl()}
      />

      {iosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div 
            className="relative bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-fadeIn"
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={() => setIosModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer outline-none"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
              <Smartphone size={24} />
            </div>
            
            <h3 className="text-base font-extrabold text-[#0b1528]">
              {t('download.coming_soon_ios')}
            </h3>
            
            <p className="text-[11px] text-slate-400 mt-2 max-w-[260px] leading-relaxed">
              {t('download.modal_ios_desc')}
            </p>

            <button
              onClick={() => setIosModalOpen(false)}
              className="mt-5 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer border-none"
            >
              {t('download.use_web_version')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
