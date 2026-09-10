import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.byslave.neonpatlat',
  appName: 'NEONPATLAT',
  webDir: 'dist',
  backgroundColor: '#070A16',
  ios: {
    contentInset: 'automatic',
  },
  android: {
    backgroundColor: '#070A16',
  },
}

export default config
