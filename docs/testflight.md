# Shipping *doing* to TestFlight

What's already set up in the repo:

- **`eas.json`** — build/submit profiles (development, preview, production).
- **`app.json`** — a unique bundle identifier (`com.sliuu.doing`) and Android package.
  If you'd rather use a different id, change both **before** your first build (it's
  effectively permanent once an app record exists on Apple's side).

The rest needs *your* Apple + Expo logins, so run these yourself once your Apple
Developer Program enrollment is approved.

## One-time setup

```sh
# 1. Install the Expo build CLI
npm install -g eas-cli

# 2. Log in (free Expo account — make one at expo.dev if needed)
eas login

# 3. Link this project to your Expo account.
#    Writes extra.eas.projectId into app.json — commit that change.
eas init
```

## Build + send to TestFlight

```sh
# 4. Build the iOS app in the cloud. First run will:
#    - prompt you to log into your Apple Developer account
#    - create signing certs + provisioning profile for you
#    - offer to create the App Store Connect app record — say yes
eas build --platform ios --profile production

# 5. Upload the finished build to TestFlight
eas submit --platform ios --latest
```

## Invite your friend

1. Go to **App Store Connect** → your app → **TestFlight** tab.
2. First external build goes through a quick **Beta App Review** (usually hours).
3. Add your friend as an **external tester** by email, or create a **public link**
   and text it to them.
4. They install the **TestFlight** app from the App Store, tap the link, and install
   *doing*. Builds are valid 90 days; run steps 4–5 again to ship an update.

## Notes

- `appVersionSource: "remote"` + `autoIncrement` (in `eas.json`) means EAS manages
  the build number for you — no "build number already used" errors on re-upload.
- To bump the user-facing version, change `expo.version` in `app.json`.

## Free alternative: Android

No Apple account needed. If your friend has an Android phone:

```sh
eas build --platform android --profile preview
```

EAS returns an install link / `.apk` you can send them directly.
