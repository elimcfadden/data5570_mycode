// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add extraNodeModules to help resolve react-native-web exports
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-web/dist/exports/DeviceEventEmitter': path.resolve(
    __dirname,
    'node_modules/react-native-web/dist/exports/DeviceEventEmitter/index.js'
  ),
};

module.exports = config;
