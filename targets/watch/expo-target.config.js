/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'watch',
  name: 'DosifyWatch',
  displayName: 'Dosify',
  icon: '../../assets/images/dosify.png',
  colors: {
    $accent: '#3B9BE8',
  },
  deploymentTarget: '10.0',
  bundleIdentifier: '.watchkitapp',
  frameworks: ['SwiftUI', 'WatchConnectivity'],
  entitlements: {
    'com.apple.security.application-groups': ['group.com.dhafee.dosify'],
  },
};
