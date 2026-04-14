const { withAppBuildGradle, withAndroidManifest, AndroidConfig } = require('expo/config-plugins');

const REDIRECT_SCHEME = 'blitzpay';
const REDIRECT_HOST = 'payments';

function ensureRedirectIntentFilter(androidManifest) {
  const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(androidManifest);
  const existing = (mainActivity['intent-filter'] ?? []).find((filter) => {
    const data = filter?.data ?? [];
    return data.some(
      (entry) =>
        entry?.$?.['android:scheme'] === REDIRECT_SCHEME &&
        entry?.$?.['android:host'] === REDIRECT_HOST
    );
  });
  if (existing) return androidManifest;

  mainActivity['intent-filter'] = mainActivity['intent-filter'] ?? [];
  mainActivity['intent-filter'].push({
    $: { 'android:autoVerify': 'false' },
    action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
    category: [
      { $: { 'android:name': 'android.intent.category.DEFAULT' } },
      { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
    ],
    data: [{ $: { 'android:scheme': REDIRECT_SCHEME, 'android:host': REDIRECT_HOST } }],
  });
  return androidManifest;
}

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
  if (contents.includes('coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.5")')) {
    return contents;
  }

  if (contents.includes('coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.0.4")')) {
    return contents.replace(
      'coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.0.4")',
      'coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.5")'
    );
  }

  return contents.replace(
    /dependencies\s*\{/,
    `dependencies {\n    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.5")`
  );
}

module.exports = function withTrueLayerAndroidConfig(config) {
  const withGradle = withAppBuildGradle(config, (nextConfig) => {
    let contents = nextConfig.modResults.contents;
    contents = ensureCompileOptions(contents);
    contents = ensurePackagingOptions(contents);
    contents = ensureDesugaringDependency(contents);
    nextConfig.modResults.contents = contents;
    return nextConfig;
  });

  return withAndroidManifest(withGradle, (nextConfig) => {
    nextConfig.modResults = ensureRedirectIntentFilter(nextConfig.modResults);
    return nextConfig;
  });
};
