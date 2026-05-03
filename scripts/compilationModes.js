export const COMPILATION_MODES = {
  android: {
    key: 'android',
    description: 'Android web bundle for native APK/AAB packaging',
    buildEnv: {
      VITE_BASE_URL: '/aurorae-haven/',
      VITE_COMPILE_MODE: 'android'
    }
  },
  'desktop-offline': {
    key: 'desktop-offline',
    description: 'Offline desktop distribution with embedded local server',
    buildEnv: {
      VITE_BASE_URL: './',
      VITE_COMPILE_MODE: 'desktop-offline'
    }
  },
  'web-online': {
    key: 'web-online',
    description: 'Online web app bundle for hosted deployment',
    buildEnv: {
      VITE_BASE_URL: '/aurorae-haven/',
      VITE_COMPILE_MODE: 'web-online'
    }
  }
}

export const getCompilationMode = (mode) => {
  return COMPILATION_MODES[mode] ?? null
}
