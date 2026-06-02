import { useState, useEffect } from 'react';

export interface DeviceInfo {
  isAndroid: boolean;
  isIOS: boolean;
  isMobile: boolean;
  isDesktop: boolean;
  isLoaded: boolean;
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isAndroid: false,
    isIOS: false,
    isMobile: false,
    isDesktop: true,
    isLoaded: false,
  });

  useEffect(() => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    
    const isAndroid = /android/i.test(ua);
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isMobile = isAndroid || isIOS || /webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isDesktop = !isMobile;

    setDeviceInfo({
      isAndroid,
      isIOS,
      isMobile,
      isDesktop,
      isLoaded: true,
    });
  }, []);

  return deviceInfo;
}
