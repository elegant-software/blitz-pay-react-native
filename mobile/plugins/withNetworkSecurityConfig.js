const { withAndroidManifest, withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const NETWORK_SECURITY_CONFIG = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="user" />
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">keycloak.elegantsoftware.de</domain>
        <trust-anchors>
            <certificates src="@raw/keycloak_cert" />
            <certificates src="user" />
            <certificates src="system" />
        </trust-anchors>
    </domain-config>
</network-security-config>
`;

const CERT_SOURCE = path.join(__dirname, "..", "certs", "keycloak_cert.pem");

function withNetworkSecurityConfig(config) {
  // Step 1: Write the XML file and copy the cert
  config = withDangerousMod(config, [
    "android",
    (config) => {
      const resBase = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "res"
      );

      // Write network security config
      const xmlDir = path.join(resBase, "xml");
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(
        path.join(xmlDir, "network_security_config.xml"),
        NETWORK_SECURITY_CONFIG
      );

      // Copy cert to raw resources
      const rawDir = path.join(resBase, "raw");
      fs.mkdirSync(rawDir, { recursive: true });
      if (fs.existsSync(CERT_SOURCE)) {
        fs.copyFileSync(CERT_SOURCE, path.join(rawDir, "keycloak_cert.pem"));
      }

      return config;
    },
  ]);

  // Step 2: Reference it in AndroidManifest.xml
  config = withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application[0];
    application.$["android:networkSecurityConfig"] =
      "@xml/network_security_config";
    application.$["android:usesCleartextTraffic"] = "true";
    return config;
  });

  return config;
}

module.exports = withNetworkSecurityConfig;
