const { withAppBuildGradle } = require('expo/config-plugins');

function ensureCompileOptions(contents) {
  if (contents.includes('coreLibraryDesugaringEnabled true')) {
    return contents;
  }

  return contents.replace(
    /android\s*\{/,
    `android {\n    compileOptions {\n        coreLibraryDesugaringEnabled true\n        sourceCompatibility JavaVersion.VERSION_17\n        targetCompatibility JavaVersion.VERSION_17\n    }`
  );
}

function ensurePackagingOptions(contents) {
  if (contents.includes("pickFirst 'META-INF/LICENSE-MIT'")) {
    return contents;
  }

  return contents.replace(
    /packagingOptions\s*\{/,
    `packagingOptions {\n        resources {\n            excludes += '/META-INF/{AL2.0,LGPL2.1}'\n            pickFirsts += ['META-INF/LICENSE-MIT']\n        }`
  );
}

function ensureDesugaringDependency(contents) {
  if (contents.includes('coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.0.4")')) {
    return contents;
  }

  return contents.replace(
    /dependencies\s*\{/,
    `dependencies {\n    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.0.4")`
  );
}

module.exports = function withTrueLayerAndroidConfig(config) {
  return withAppBuildGradle(config, (nextConfig) => {
    let contents = nextConfig.modResults.contents;
    contents = ensureCompileOptions(contents);
    contents = ensurePackagingOptions(contents);
    contents = ensureDesugaringDependency(contents);
    nextConfig.modResults.contents = contents;
    return nextConfig;
  });
};
