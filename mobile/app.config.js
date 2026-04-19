module.exports = {
  expo: {
    name: "BlitzPay",
    slug: "blitzpay-mobile",
    scheme: "blitzpay",
    version: "1.0.0",
    orientation: "portrait",
    platforms: ["ios", "android", "web"],
    userInterfaceStyle: "light",
    splash: {
      backgroundColor: "#000000",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "app.blitzpay.mobile",
      infoPlist: {
        NSCameraUsageDescription: "Used to scan QR codes and credit cards for payments",
        NSFaceIDUsageDescription: "Used for biometric authentication",
        UIBackgroundModes: ["remote-notification"],
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#000000",
      },
      splash: {
        backgroundColor: "#000000",
      },
      package: "app.blitzpay.mobile",
      googleServicesFile: "./google-services.json",
      permissions: [
        "CAMERA",
        "USE_BIOMETRIC",
        "USE_FINGERPRINT",
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.USE_BIOMETRIC",
        "android.permission.USE_FINGERPRINT",
      ],
    },
    plugins: [
      [
        "@stripe/stripe-react-native",
        {
          merchantIdentifier: "merchant.app.blitzpay.mobile",
          enableGooglePay: true,
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            packagingOptions: {
              pickFirst: ["META-INF/LICENSE-MIT"],
              exclude: ["META-INF/AL2.0", "META-INF/LGPL2.1"],
            },
            extraMavenRepos: [
              {
                url: "https://cardinalcommerceprod.jfrog.io/artifactory/android",
                credentials: {
                  username: process.env.BRAINTREE_MAVEN_USERNAME,
                  password: process.env.BRAINTREE_MAVEN_PASSWORD,
                },
              },
            ],
          },
          ios: {
            deploymentTarget: "15.1",
          },
        },
      ],
      ["expo-splash-screen", { backgroundColor: "#000000" }],
      ["expo-camera", { cameraPermission: "Allow BlitzPay to access your camera to scan QR codes." }],
      ["expo-local-authentication", { faceIDPermission: "Allow BlitzPay to use Face ID for authentication." }],
      "expo-secure-store",
      ["expo-notifications", { sounds: [] }],
      ["./plugins/withNdkVersion", "30.0.14904198"],
      "./plugins/withTrueLayerAndroidConfig",
      "expo-font",
      "./plugins/withNetworkSecurityConfig",
      [
        "react-native-expo-braintree",
        {
          host: "blitzpay.example.com",
          pathPrefix: "/paypal-return",
          addFallbackUrlScheme: "true",
          appDelegateLanguage: "swift",
        },
      ],
    ],
    extra: {
      eas: {
        projectId: "283f0dd6-d7d4-4dcc-8613-66621b812e7f",
      },
    },
    owner: "m.mohammadi",
  },
};
