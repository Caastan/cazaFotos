// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const nodeLibs = require('node-libs-react-native');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Soporte para .cjs si hiciera falta
config.resolver.sourceExts.push('cjs');

// Aquí inyectamos nuestros stubs
config.resolver.extraNodeModules = {
  ...nodeLibs,
  net: path.resolve(__dirname, 'shim-empty.js'),
  tls: path.resolve(__dirname, 'shim-empty.js'),
  // opcional: si sigues teniendo errores de ws, también lo stubeas
  ws: path.resolve(__dirname, 'shim-empty.js'),
};

module.exports = config;
