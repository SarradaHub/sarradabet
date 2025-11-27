const path = require('path');
const fs = require('fs');

module.exports = {
  plugins: {
    'postcss-import': {
      resolve: (id, basedir) => {
        // Handle @sarradahub/design-system/css package export
        if (id === '@sarradahub/design-system/css') {
          // From apps/web, go up 3 levels to reach SarradaHub root, then to platform/design-system
          const packagePath = path.resolve(__dirname, '../../../platform/design-system');
          const cssPath = path.resolve(packagePath, 'dist/tokens/css-variables.css');
          
          if (fs.existsSync(cssPath)) {
            // Return absolute path
            return cssPath;
          } else {
            // Try node_modules as fallback
            const nodeModulesPath = path.resolve(__dirname, 'node_modules/@sarradahub/design-system');
            const nodeModulesCssPath = path.resolve(nodeModulesPath, 'dist/tokens/css-variables.css');
            if (fs.existsSync(nodeModulesCssPath)) {
              return nodeModulesCssPath;
            }
            throw new Error(`[postcss] Design system CSS not found. Tried:\n  - ${cssPath}\n  - ${nodeModulesCssPath}`);
          }
        }
        
        // Return id for default resolution (postcss-import will handle it)
        return id;
      }
    },
    tailwindcss: {},
    autoprefixer: {},
  }
}
