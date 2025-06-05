const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add Node.js polyfills for React Native
config.resolver.alias = {
  ...(config.resolver.alias || {}),
};

// Add polyfills for Node.js globals
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config; 