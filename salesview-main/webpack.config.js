const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

module.exports = {
  // Other webpack configuration...
  plugins: [
    new ReactRefreshWebpackPlugin(),
  ],
  resolve: {
    modules: ['src', 'node_modules'], // Ensure resolution stays within src and node_modules
  },
};
