const { withAppBuildGradle } = require('expo/config-plugins');

module.exports = function withNdkVersion(config, ndkVersion) {
  return withAppBuildGradle(config, (config) => {
    config.modResults.contents = config.modResults.contents.replace(
      /ndkVersion\s+.*/,
      `ndkVersion "${ndkVersion}"`
    );
    return config;
  });
};
