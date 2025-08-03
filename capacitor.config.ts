import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.8fd8ccd9aaff4cc190100e0c1316c7bb',
  appName: 'shop-smart-pro',
  webDir: 'dist',
  server: {
    url: 'https://8fd8ccd9-aaff-4cc1-9010-0e0c1316c7bb.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0f172a",
      showSpinner: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: "#0f172a"
    }
  }
};

export default config;