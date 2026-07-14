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
          bg: '#0a0a0b',
          surface: '#121214',
          raised: '#1a1a1e',
          border: '#2a2a2e',
          muted: '#8b8b95',
          odds: '#22c55e',
          'odds-hover': '#16a34a',
        },
      },
    },
  },
  plugins: [],
};
