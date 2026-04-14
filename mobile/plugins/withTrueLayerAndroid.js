const { withAppBuildGradle, withAndroidManifest } = require('expo/config-plugins');

function applyBuildGradlePatch(contents) {
  let updated = contents;

  if (!updated.includes('coreLibraryDesugaringEnabled true')) {
    updated = updated.replace(
      /compileSdk rootProject\.ext\.compileSdkVersion\s*\n/,
      `compileSdk rootProject.ext.compileSdkVersion\n\n    compileOptions {\n        coreLibraryDesugaringEnabled true\n    }\n`,
    );
  }

  if (!updated.includes("pickFirsts += ['META-INF/LICENSE-MIT']")) {
    updated = updated.replace(
      /packagingOptions \{\n([\s\S]*?)\n    \}/,
      (match, inner) => `packagingOptions {\n${inner}\n        resources {\n            excludes += '/META-INF/{AL2.0,LGPL2.1}'\n            pickFirsts += ['META-INF/LICENSE-MIT']\n        }\n    }`,
    );
  }

  if (!updated.includes('coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.5")')) {
    updated = updated.replace(
      /dependencies \{\n/,
      `dependencies {\n    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.5")\n`,
    );
  }

  return updated;
}

module.exports = function withTrueLayerAndroid(config) {
  config = withAppBuildGradle(config, (cfg) => {
    cfg.modResults.contents = applyBuildGradlePatch(cfg.modResults.contents);
    return cfg;
  });

  config = withAndroidManifest(config, (cfg) => {
    const mainActivity = cfg.modResults.manifest.application?.[0]?.activity?.find(
      (activity) => activity.$['android:name'] === '.MainActivity',
    );

    if (!mainActivity) {
      return cfg;
    }

    const existingIntentFilter = mainActivity['intent-filter']?.find((intentFilter) => {
      const data = intentFilter.data?.[0]?.$;
      return data?.['android:scheme'] === 'blitzpay';
    });

    if (!existingIntentFilter) {
      mainActivity['intent-filter'] = [
        ...(mainActivity['intent-filter'] ?? []),
        {
          action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
          category: [
            { $: { 'android:name': 'android.intent.category.DEFAULT' } },
            { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
          ],
          data: [
            {
              $: {
                'android:scheme': 'blitzpay',
                'android:host': 'checkout',
                'android:pathPrefix': '/truelayer-return',
              },
            },
          ],
        },
      ];
    }

    return cfg;
  });

  return config;
};
