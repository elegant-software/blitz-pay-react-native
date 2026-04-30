module.exports = {
  expo: {
    name: "BlitzPay Merchant",
    slug: "blitzpay-merchant",
    scheme: "blitzpaymerchant",
    version: "1.0.0",
    orientation: "portrait",
    platforms: ["ios", "android", "web"],
    userInterfaceStyle: "light",
    icon: "./assets/app-icon.png",
    splash: {
      image: "./assets/app-icon.png",
      resizeMode: "contain",
      backgroundColor: "#000000",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "app.blitzpay.merchant",
      infoPlist: {
        NSCameraUsageDescription: "Used to scan QR codes for payments",
        NSFaceIDUsageDescription: "Used for biometric authentication",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#000000",
      },
      splash: {
        backgroundColor: "#000000",
      },
      package: "app.blitzpay.merchant",
      permissions: [
        "CAMERA",
        "USE_BIOMETRIC",
        "USE_FINGERPRINT",
        "android.permission.CAMERA",
        "android.permission.USE_BIOMETRIC",
        "android.permission.USE_FINGERPRINT",
      ],
    },
    plugins: [
      [
        "expo-build-properties",
        {
          ios: {
            deploymentTarget: "15.1",
          },
        },
      ],
      ["expo-splash-screen", { backgroundColor: "#000000" }],
      ["expo-camera", { cameraPermission: "Allow BlitzPay Merchant to access your camera to scan QR codes." }],
      ["expo-local-authentication", { faceIDPermission: "Allow BlitzPay Merchant to use Face ID for authentication." }],
      "expo-secure-store",
      ["expo-notifications", { sounds: [] }],
      "expo-font",
    ],
    extra: {
      eas: {
        projectId: "",
      },
    },
    owner: "m.mohammadi",
  },
};