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
      // Project-specific color overrides
      // Note: gray-900, yellow-400, and purple-500 are now provided by design system
      // (neutral.900, warning.400, secondary.600 respectively)
      colors: {
        ...designSystemConfig.theme.extend.colors,
        // Pure black for high contrast needs (e.g., text on yellow backgrounds)
        black: '#000000',
        // Purple-900 kept as project-specific brand color (not in design system)
        purple: {
          900: '#4C1D95',
        },
      },
    },
  },
  plugins: [],
}
