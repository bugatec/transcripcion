
export const detectEnvironment = () => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isCapacitor = window.Capacitor?.isNativePlatform() || false;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  return {
    isMobile,
    isCapacitor,
    isIOS,
    isAndroid
  };
};
