const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const { mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');

module.exports = function withApiNetwork(config) {
  const url = new URL(process.env.EXPO_PUBLIC_API_URL || 'https://localhost/api');
  // HTTP is allowed only for the configured development API host.
  const host = url.hostname.replace(/[<>&"']/g, '');
  const domain = url.protocol === 'http:'
    ? `<domain-config cleartextTrafficPermitted="true"><domain includeSubdomains="false">${host}</domain></domain-config>`
    : '';
  config = withAndroidManifest(config, config => {
    config.modResults.manifest.application[0].$['android:networkSecurityConfig'] = '@xml/api_network_security';
    return config;
  });
  return withDangerousMod(config, ['android', async config => {
    const directory = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/xml');
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, 'api_network_security.xml'), `<?xml version="1.0" encoding="utf-8"?>\n<network-security-config><base-config cleartextTrafficPermitted="false"/>${domain}</network-security-config>\n`);
    return config;
  }]);
};
