import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.byslave.neonpatlat',
  appName: 'Neon Blast',
  webDir: 'dist',
  backgroundColor: '#070A16',
  ios: {
    contentInset: 'automatic',
  },
  android: {
    backgroundColor: '#070A16',
    allowMixedContent: false,
  },
}

export default config
