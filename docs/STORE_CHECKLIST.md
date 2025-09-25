# Store-ready Checklist (Play & App Store)
## Android (Google Play) — TWA via Bubblewrap
1. Install Node 18+, JDK 17+, Android Studio; `npm i -g @bubblewrap/cli`.
2. Use your live domain (Netlify primary), e.g. https://YOUR_DOMAIN.netlify.app
3. Initialize:
   ```bash
   bubblewrap init --manifest https://YOUR_DOMAIN.netlify.app/manifest.webmanifest
   ```
   Package ID: `app.revisesnap`. Generate keystore.
4. Build:
   ```bash
   bubblewrap build
   ```
   Upload `.aab` to Play Console.
5. Digital Asset Links:
   - Get SHA-256: `keytool -list -v -keystore my-release-key.jks`
   - Put it into `public/.well-known/assetlinks.json` and deploy.
6. Fill store listing (Education), screenshots, privacy (link to /privacy.html).

## iOS (App Store) — Capacitor wrapper
1. `npm i -D @capacitor/cli @capacitor/core`
2. `npx cap init "ReviseSnap" app.revisesnap`
3. In `capacitor.config.ts`: `server.url = 'https://YOUR_DOMAIN.netlify.app'`
4. `npx cap add ios && npx cap open ios` → Signing, NSCameraUsageDescription, NSMicrophoneUsageDescription.
5. Archive → Distribute to App Store Connect.

## Common
- PWA manifest + SW included.
- Test on real devices.
