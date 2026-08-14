const designSystemConfig = require('../../../platform/design-system/tailwind.config.cjs');

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../../platform/design-system/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      ...designSystemConfig.theme.extend,
      fontFamily: {
        sans: ['Barlow', 'system-ui', 'sans-serif'],
        display: ['"Barlow Condensed"', 'Barlow', 'system-ui', 'sans-serif'],
      },
      colors: {
        ...designSystemConfig.theme.extend.colors,
        black: '#000000',
        sportsbook: {
          bg: 'var(--sb-bg)',
          surface: 'var(--sb-surface)',
          raised: 'var(--sb-surface-raised)',
          border: 'var(--sb-border)',
          muted: 'var(--sb-text-muted)',
          fg: 'var(--sb-text)',
          odds: 'var(--sb-odds)',
          'odds-hover': 'var(--sb-odds-hover)',
        },
      },
    },
  },
  plugins: [],
};
