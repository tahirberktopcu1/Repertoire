import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.repertoire.app',
  appName: 'Repertoire',
  webDir: 'public',
  server: {
    url: 'https://repertoire-tau.vercel.app',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#0d1117',
      showSpinner: false,
    }
  },
  android: {
    allowMixedContent: true
  },
  ios: {
    contentInset: 'always'
  }
};

export default config;
