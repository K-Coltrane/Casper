import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.casper.trading',
  appName: 'Casper',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
