// Device detection utility
export type DeviceType = 'iOS' | 'Android' | 'Web';

export function detectDevice(): DeviceType {
  if (typeof window === 'undefined') {
    // Server-side: default to Web
    return 'Web';
  }

  const userAgent = navigator.userAgent;
  
  // iOS detection (iPhone, iPad, iPod)
  if (/iPad|iPhone|iPod/.test(userAgent)) {
    return 'iOS';
  }
  
  // Android detection (mobile and tablet)
  if (/Android/.test(userAgent)) {
    return 'Android';
  }
  
  // Everything else is Web (desktop, laptop, other mobile browsers)
  return 'Web';
}