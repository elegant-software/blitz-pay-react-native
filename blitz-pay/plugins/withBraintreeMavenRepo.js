const { withProjectBuildGradle } = require('expo/config-plugins');

const MAVEN_BLOCK = `
    maven {
      url "https://cardinalcommerceprod.jfrog.io/artifactory/android"
      credentials {
        username System.getenv("BRAINTREE_MAVEN_USERNAME") ?: ""
        password System.getenv("BRAINTREE_MAVEN_PASSWORD") ?: ""
      }
    }`;

module.exports = function withBraintreeMavenRepo(config) {
  return withProjectBuildGradle(config, (nextConfig) => {
    const contents = nextConfig.modResults.contents;
    if (contents.includes('cardinalcommerceprod.jfrog.io')) {
      return nextConfig;
    }
    nextConfig.modResults.contents = contents.replace(
      /maven\s*\{\s*url\s*'https:\/\/www\.jitpack\.io'\s*\}/,
      `maven { url 'https://www.jitpack.io' }${MAVEN_BLOCK}`
    );
    return nextConfig;
  });
};
