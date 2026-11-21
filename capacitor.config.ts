import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kelimedefterim.app',
  appName: 'Kelime Defterim',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;