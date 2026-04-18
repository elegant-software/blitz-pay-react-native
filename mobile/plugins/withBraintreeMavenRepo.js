const { withProjectBuildGradle } = require('expo/config-plugins');

const BRAINTREE_MAVEN_BLOCK = `
    maven {
      url "https://cardinalcommerceprod.jfrog.io/artifactory/android"
      credentials {
        username System.getenv("BRAINTREE_MAVEN_USERNAME") ?: ""
        password System.getenv("BRAINTREE_MAVEN_PASSWORD") ?: ""
      }
    }`;

module.exports = function withBraintreeMavenRepo(config) {
  return withProjectBuildGradle(config, (cfg) => {
    const contents = cfg.modResults.contents;
    if (!contents.includes('cardinalcommerceprod.jfrog.io')) {
      cfg.modResults.contents = contents.replace(
        /allprojects\s*\{\s*\n(\s*)repositories\s*\{/,
        (match, indent) => `allprojects {\n${indent}repositories {${BRAINTREE_MAVEN_BLOCK}`,
      );
    }
    return cfg;
  });
};
