
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lovable.transcripcion',
  appName: 'transcripcion',
  webDir: 'dist',
  server: {
    url: 'https://94ff23dc-7155-4bd1-8438-2233abd9c25e.lovableproject.com?forceHideBadge=true',
    cleartext: true,
    // Forzar HTTPS para getUserMedia en dispositivos móviles
    iosScheme: 'https',
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    },
    Microphone: {
      iosCustomPresentationAnchor: true,
    },
    SpeechRecognition: {
      enabled: true,
    },
    CapacitorHttp: {
      enabled: true,
    },
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    backgroundColor: '#ffffff',
    preferredContentMode: 'mobile'
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    // Configuración específica para WebView y permisos
    webContentsDebuggingEnabled: true,
    permissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.MODIFY_AUDIO_SETTINGS',
      'android.permission.BLUETOOTH',
      'android.permission.BLUETOOTH_ADMIN',
      'android.permission.BLUETOOTH_CONNECT',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.MANAGE_EXTERNAL_STORAGE',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      // Agregar permisos específicos para WebView y micrófono
      'android.permission.CAMERA',
      'android.permission.WAKE_LOCK'
    ]
  }
};

export default config;
