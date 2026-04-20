export const COMPILATION_MODES = {
  android: {
    key: 'android',
    description: 'Android web bundle for native APK/AAB packaging',
    authProviders: ['google', 'facebook', 'github'],
    buildEnv: {
      VITE_BASE_URL: './',
      AURORAE_COMPILE_MODE: 'android',
      VITE_AUTH_REQUIRED: 'true'
    }
  },
  'desktop-offline': {
    key: 'desktop-offline',
    description: 'Offline desktop distribution with embedded local server',
    authProviders: [],
    buildEnv: {
      AURORAE_COMPILE_MODE: 'desktop-offline',
      VITE_AUTH_REQUIRED: 'false'
    }
  },
  'web-online': {
    key: 'web-online',
    description: 'Online web app bundle for authenticated deployment',
    authProviders: ['google', 'facebook', 'github'],
    buildEnv: {
      VITE_BASE_URL: '/aurorae-haven/',
      AURORAE_COMPILE_MODE: 'web-online',
      VITE_AUTH_REQUIRED: 'true'
    }
  }
}

export const getCompilationMode = (mode) => {
  return COMPILATION_MODES[mode] ?? null
}
