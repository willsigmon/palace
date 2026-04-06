import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.wsig.palace',
  appName: 'PALACE',
  webDir: 'public',
  server: {
    // Always load from the live URL — avoids static export issues with dynamic routes
    url: 'https://palace-tan.vercel.app',
    cleartext: false,
  },
  ios: {
    scheme: 'PALACE',
    contentInset: 'automatic',
    backgroundColor: '#fafafa',
    preferredContentMode: 'mobile',
    scrollEnabled: true,
    allowsLinkPreview: false,
  },
  plugins: {
    Geolocation: {},
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      style: 'DEFAULT',
      overlaysWebView: true,
    },
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#fafafa',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
}

export default config
