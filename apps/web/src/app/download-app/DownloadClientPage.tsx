'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { appDownloadService } from '@/services/appDownloadService';
import { AppDownloadButton } from '@/components/app-download/AppDownloadButton';
import { 
  ShieldCheck, Zap, MessageSquare, 
  ChevronDown, ChevronUp, Info, Calendar, Database, Layers, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export function DownloadClientPage() {
  const { t } = useLanguage();
  const metadata = appDownloadService.getMetadata();
  const downloadUrl = appDownloadService.getAndroidDownloadUrl();

  // Accordion state for installation guide steps
  const [activeStep, setActiveStep] = useState<number | null>(1);

  const toggleStep = (step: number) => {
    setActiveStep(activeStep === step ? null : step);
  };

  // Structured Data Schema for SEO (JSON-LD)
  const schemaMarkup = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'Crewora',
    'operatingSystem': 'Android',
    'applicationCategory': 'BusinessApplication',
    'downloadUrl': downloadUrl || 'https://crewora.com/download-app',
    'softwareVersion': metadata.version,
    'fileSize': metadata.apkSize,
    'datePublished': new Date(metadata.releaseDate).toISOString().split('T')[0],
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'INR'
    },
    'description': 'Connect with verified blue-collar workers instantly and manage bookings with zero platform fees, in-app messaging, and real-time alerts.'
  };

  return (
    <div className="flex-1 bg-slate-50 min-h-screen pb-16 animate-fadeIn">
      {/* JSON-LD Script for Google SEO indexing */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />

      {/* Hero Section Container */}
      <div className="bg-[#0b1528] text-white py-12 md:py-20 relative overflow-hidden">
        {/* Subtle background glow blobs */}
        <div className="absolute top-[-50px] right-[-50px] w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-100px] left-[-100px] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Title & CTA */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <Link 
                href="/" 
                className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors group mb-2"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Home</span>
              </Link>
              
              <div className="space-y-3">
                <span className="bg-primary-500/20 text-primary-300 border border-primary-500/30 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                  Android Release
                </span>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                  {t('download.page_title')}
                </h1>
                <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-xl">
                  {t('download.page_subtitle')}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <AppDownloadButton
                  variant="primary"
                  size="lg"
                  source="download_page"
                  showIcon={true}
                />
                
                {/* Meta details badge */}
                <div className="flex items-center gap-4 text-xs text-slate-400 px-1">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Version</span>
                    <span className="font-extrabold text-slate-300">{metadata.version}</span>
                  </div>
                  <div className="h-6 w-px bg-slate-800"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Size</span>
                    <span className="font-extrabold text-slate-300">{metadata.apkSize}</span>
                  </div>
                  <div className="h-6 w-px bg-slate-800"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Min OS</span>
                    <span className="font-extrabold text-slate-300">Android 8.0+</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Premium Interactive Mockup Showcases */}
            <div className="lg:col-span-5 flex justify-center gap-6 relative select-none">
              
              {/* Screen Mockup 1: Customer Explorer View */}
              <div className="relative border-4 border-slate-800 bg-[#F8FAFC] rounded-[32px] w-56 h-[380px] shadow-2xl overflow-hidden hidden sm:block transform -rotate-3 hover:rotate-0 transition-all duration-500">
                {/* Speaker & camera slot */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-4 w-24 bg-slate-800 rounded-b-xl z-20 flex items-center justify-center">
                  <div className="w-8 h-1 bg-slate-600 rounded-full"></div>
                </div>

                {/* Mock Phone Status Bar */}
                <div className="h-6 pt-1 px-4 flex justify-between items-center text-[8px] font-bold text-slate-400 z-10 relative">
                  <span>9:41 AM</span>
                  <div className="flex gap-1 items-center">
                    <span>5G</span>
                    <div className="w-3 h-1.5 border border-slate-400 rounded-sm"></div>
                  </div>
                </div>

                {/* Mock App Content */}
                <div className="px-3 pt-1 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-[#0b1528]">Crewora</span>
                    <div className="w-4 h-4 bg-slate-100 rounded-full flex items-center justify-center">
                      <span className="text-[6px] text-slate-500">🔔</span>
                    </div>
                  </div>
                  <div className="bg-slate-100 px-2 py-1 rounded text-[8px] text-slate-400 mb-2 border border-slate-200">
                    Search plumbing, wiring...
                  </div>

                  {/* Categories */}
                  <div className="flex gap-1.5 mb-3 overflow-hidden">
                    <span className="bg-primary-500 text-white font-extrabold text-[6px] px-2 py-0.5 rounded-full uppercase">ALL</span>
                    <span className="bg-white text-slate-500 font-extrabold text-[6px] px-2 py-0.5 rounded-full uppercase border border-slate-200">Plumbing</span>
                    <span className="bg-white text-slate-500 font-extrabold text-[6px] px-2 py-0.5 rounded-full uppercase border border-slate-200">Wiring</span>
                  </div>

                  {/* Worker Cards */}
                  <div className="space-y-2">
                    <div className="bg-white border border-slate-150 rounded-xl p-2.5 shadow-sm">
                      <div className="flex gap-2">
                        <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-[10px]">👩‍🔧</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-extrabold text-slate-900 flex items-center gap-0.5">
                              Sarah J. <span className="text-emerald-500 text-[6px]">✔</span>
                            </span>
                            <span className="text-[8px] font-black text-slate-950">$85/hr</span>
                          </div>
                          <span className="text-[6px] text-slate-400 block">Master Carpenter</span>
                          <div className="flex items-center gap-1.5 mt-1 text-[6px] text-slate-500">
                            <span className="flex items-center text-amber-500">★ 4.9</span>
                            <span>• 8 yr exp</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-150 rounded-xl p-2.5 shadow-sm opacity-90">
                      <div className="flex gap-2">
                        <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center text-[10px]">👨‍🔧</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-extrabold text-slate-900 flex items-center gap-0.5">
                              David C. <span className="text-emerald-500 text-[6px]">✔</span>
                            </span>
                            <span className="text-[8px] font-black text-slate-950">$65/hr</span>
                          </div>
                          <span className="text-[6px] text-slate-400 block">Electrician Pro</span>
                          <div className="flex items-center gap-1.5 mt-1 text-[6px] text-slate-500">
                            <span className="flex items-center text-amber-500">★ 4.8</span>
                            <span>• 10 yr exp</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Screen Mockup 2: Chat Message View */}
              <div className="relative border-4 border-slate-800 bg-[#F8FAFC] rounded-[32px] w-56 h-[380px] shadow-2xl overflow-hidden transform rotate-3 hover:rotate-0 transition-all duration-500">
                {/* Speaker & camera slot */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-4 w-24 bg-slate-800 rounded-b-xl z-20 flex items-center justify-center">
                  <div className="w-8 h-1 bg-slate-600 rounded-full"></div>
                </div>

                {/* Status Bar */}
                <div className="h-6 pt-1 px-4 flex justify-between items-center text-[8px] font-bold text-slate-400 z-10 relative">
                  <span>9:41 AM</span>
                  <div className="flex gap-1 items-center">
                    <span>5G</span>
                    <div className="w-3 h-1.5 border border-slate-400 rounded-sm"></div>
                  </div>
                </div>

                {/* Mock Chat Header */}
                <div className="px-3 py-1.5 bg-white border-b border-slate-150 flex items-center gap-1.5 text-left">
                  <span className="text-[8px] text-slate-500">←</span>
                  <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center text-[8px]">👩‍🔧</div>
                  <div className="flex-1">
                    <span className="text-[8px] font-extrabold text-slate-900 block leading-tight">Sarah Jenkins</span>
                    <span className="text-[5px] text-emerald-500 font-bold block">Online</span>
                  </div>
                </div>

                {/* Mock Chat Bubbles */}
                <div className="p-3 space-y-2.5 flex-1 overflow-y-auto text-left h-[230px]">
                  <div className="space-y-1">
                    <div className="bg-slate-200 text-slate-850 p-2 rounded-xl rounded-tl-none text-[7px] max-w-[80%] leading-normal">
                      Hi Sarah, can you help fix a wooden cabinet lock today?
                    </div>
                    <span className="text-[5px] text-slate-400 pl-1">9:32 AM</span>
                  </div>

                  <div className="space-y-1 flex flex-col items-end">
                    <div className="bg-primary-500 text-white p-2 rounded-xl rounded-tr-none text-[7px] max-w-[80%] leading-normal">
                      Sure! I am available in 30 minutes. My standard rate is $85/hr.
                    </div>
                    <span className="text-[5px] text-slate-400 pr-1 text-right">9:33 AM</span>
                  </div>

                  <div className="space-y-1">
                    <div className="bg-slate-200 text-slate-850 p-2 rounded-xl rounded-tl-none text-[7px] max-w-[80%] leading-normal">
                      That works, thank you! Let&apos;s book.
                    </div>
                    <span className="text-[5px] text-slate-400 pl-1">9:34 AM</span>
                  </div>
                </div>

                {/* Bottom Input Drawer Mockup */}
                <div className="absolute bottom-0 inset-x-0 bg-white border-t border-slate-150 p-2 flex items-center gap-1.5">
                  <div className="bg-slate-100 rounded-full px-2.5 py-1 text-[7px] text-slate-400 flex-1 border border-slate-200">
                    Write message...
                  </div>
                  <div className="w-5 h-5 bg-primary-500 text-white rounded-full flex items-center justify-center text-[7px] font-bold">
                    ➤
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Main Sections */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 md:mt-16 space-y-16">
        
        {/* Core Value Props / Features section */}
        <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-black text-[#0b1528]">
              {t('download.features_title')}
            </h2>
            <div className="w-12 h-1 bg-primary-500 mx-auto mt-2.5 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-shadow text-left space-y-4">
              <div className="w-10 h-10 bg-primary-50 text-primary-500 rounded-xl flex items-center justify-center">
                <MessageSquare size={20} className="stroke-[2.5]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-slate-900 text-sm">{t('download.feature_chat_title')}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{t('download.feature_chat_desc')}</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-shadow text-left space-y-4">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                <Zap size={20} className="stroke-[2.5]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-slate-900 text-sm">{t('download.feature_easy_title')}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{t('download.feature_easy_desc')}</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-shadow text-left space-y-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
                <ShieldCheck size={20} className="stroke-[2.5]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-slate-900 text-sm">{t('download.feature_push_title')}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{t('download.feature_push_desc')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Installation Walkthrough Accordion */}
        <section className="bg-white rounded-3xl border border-slate-200/60 p-6 md:p-8 shadow-sm space-y-6">
          <div className="text-left">
            <h2 className="text-lg md:text-xl font-extrabold text-[#0b1528]">
              {t('download.guide_title')}
            </h2>
            <p className="text-xs text-slate-400 mt-1">Follow these simple steps to install the APK file directly on your Android device.</p>
          </div>

          <div className="space-y-3">
            {/* Step 1 */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
              <button
                onClick={() => toggleStep(1)}
                className="w-full px-5 py-4 flex items-center justify-between text-left font-bold text-sm text-[#0b1528] cursor-pointer hover:bg-slate-50 transition-colors border-none outline-none"
              >
                <span className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#0b1528] text-white text-[10px] font-black flex items-center justify-center">1</span>
                  {t('download.guide_step_1_title')}
                </span>
                {activeStep === 1 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {activeStep === 1 && (
                <div className="px-5 pb-5 text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
                  {t('download.guide_step_1_desc')}
                </div>
              )}
            </div>

            {/* Step 2 */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
              <button
                onClick={() => toggleStep(2)}
                className="w-full px-5 py-4 flex items-center justify-between text-left font-bold text-sm text-[#0b1528] cursor-pointer hover:bg-slate-50 transition-colors border-none outline-none"
              >
                <span className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#0b1528] text-white text-[10px] font-black flex items-center justify-center">2</span>
                  {t('download.guide_step_2_title')}
                </span>
                {activeStep === 2 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {activeStep === 2 && (
                <div className="px-5 pb-5 text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
                  {t('download.guide_step_2_desc')}
                </div>
              )}
            </div>

            {/* Step 3 */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
              <button
                onClick={() => toggleStep(3)}
                className="w-full px-5 py-4 flex items-center justify-between text-left font-bold text-sm text-[#0b1528] cursor-pointer hover:bg-slate-50 transition-colors border-none outline-none"
              >
                <span className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#0b1528] text-white text-[10px] font-black flex items-center justify-center">3</span>
                  {t('download.guide_step_3_title')}
                </span>
                {activeStep === 3 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {activeStep === 3 && (
                <div className="px-5 pb-5 text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
                  {t('download.guide_step_3_desc')}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Technical Specs Panel */}
        <section className="bg-white rounded-3xl border border-slate-200/60 p-6 md:p-8 shadow-sm space-y-6 text-left">
          <h2 className="text-lg md:text-xl font-extrabold text-[#0b1528]">
            {t('download.specs_title')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Version */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-primary-50 text-[#0b1528] flex items-center justify-center shrink-0">
                <Layers size={16} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">{t('download.specs_version')}</span>
                <span className="text-xs font-extrabold text-slate-800 mt-0.5 block">{metadata.version}</span>
              </div>
            </div>

            {/* Released Date */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-primary-50 text-[#0b1528] flex items-center justify-center shrink-0">
                <Calendar size={16} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">{t('download.specs_released')}</span>
                <span className="text-xs font-extrabold text-slate-800 mt-0.5 block">{metadata.releaseDate}</span>
              </div>
            </div>

            {/* APK size */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-primary-50 text-[#0b1528] flex items-center justify-center shrink-0">
                <Database size={16} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">{t('download.specs_size')}</span>
                <span className="text-xs font-extrabold text-slate-800 mt-0.5 block">{metadata.apkSize}</span>
              </div>
            </div>

            {/* Minimum OS */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-primary-50 text-[#0b1528] flex items-center justify-center shrink-0">
                <Info size={16} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">{t('download.specs_min_os')}</span>
                <span className="text-xs font-extrabold text-slate-800 mt-0.5 block">{metadata.minAndroidVersion}</span>
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
