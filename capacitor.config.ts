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
    backgroundColor: '#1a1a2e',
    preferredContentMode: 'mobile',
  },
  plugins: {
    Geolocation: {
      // Request "always" permission for background tracking
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
}

export default config
