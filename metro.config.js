const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// TFLite model dosyalarını asset olarak paketle
config.resolver.assetExts.push('tflite');

module.exports = config;
