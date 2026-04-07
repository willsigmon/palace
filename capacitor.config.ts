import type { CapacitorConfig } from '@capacitor/cli'

const WEB_APP_URL =
  process.env.CAPACITOR_SERVER_URL
  ?? process.env.PALACE_WEB_URL
  ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://palace-tan.vercel.app')
const ALLOW_CLEARTEXT = WEB_APP_URL.startsWith('http://')

const config: CapacitorConfig = {
  appId: 'com.wsig.palace',
  appName: 'PALACE',
  webDir: 'public',
  server: {
    url: WEB_APP_URL,
    cleartext: ALLOW_CLEARTEXT,
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
