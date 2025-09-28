import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.leanx.app',
  appName: 'LeanX',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
