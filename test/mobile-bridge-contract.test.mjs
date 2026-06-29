import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function read(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

test("CoffeeDex mobile shell loads the production web app through a native bridge", () => {
  const mobilePackage = readJson("mobile/package.json");
  const mobileAppConfig = readJson("mobile/app.json").expo;
  const easConfig = readJson("mobile/eas.json");
  const bridgeConfig = read("mobile/lib/bridge.ts");
  const bridgeComponent = read("mobile/components/CoffeeDexWebBridge.tsx");
  const bridgeRoute = read("mobile/app/index.tsx");

  assert.equal(mobileAppConfig.name, "CoffeeDex");
  assert.equal(mobileAppConfig.slug, "coffeedex");
  assert.equal(mobileAppConfig.scheme, "coffeedex");
  assert.equal(mobileAppConfig.ios.bundleIdentifier, "kr.lucasdev.coffeedex");
  assert.equal(mobileAppConfig.android.package, "kr.lucasdev.coffeedex");
  assert.deepEqual(mobileAppConfig.android.permissions, ["CAMERA"]);
  assert.match(JSON.stringify(mobileAppConfig.ios.infoPlist), /NSCameraUsageDescription/);
  assert.match(JSON.stringify(mobileAppConfig.ios.infoPlist), /NSPhotoLibraryUsageDescription/);

  assert.equal(mobilePackage.dependencies["react-native-webview"], "13.16.1");
  assert.equal(mobilePackage.dependencies["expo-haptics"], "~56.0.3");
  assert.equal(mobilePackage.dependencies["expo-splash-screen"], "~56.0.10");
  assert.equal(mobilePackage.scripts["doctor"], "npx --yes expo-doctor");
  assert.equal(mobilePackage.scripts["typecheck"], "tsc --noEmit");
  assert.equal(
    mobilePackage.scripts["build:ios:production"],
    "npx --yes eas-cli build --platform ios --profile production",
  );
  assert.equal(
    mobilePackage.scripts["build:android:production"],
    "npx --yes eas-cli build --platform android --profile production",
  );
  assert.match(JSON.stringify(mobileAppConfig.plugins), /expo-splash-screen/);

  assert.equal(easConfig.cli.appVersionSource, "remote");
  assert.equal(easConfig.build.preview.distribution, "internal");
  assert.equal(easConfig.build.preview.android.buildType, "apk");
  assert.equal(easConfig.build.production.channel, "production");
  assert.equal(easConfig.build.production.autoIncrement, true);

  assert.match(bridgeConfig, /https:\/\/coffee-lovat-psi\.vercel\.app/);
  assert.match(bridgeConfig, /coffeedex:\/\//);
  assert.match(bridgeConfig, /resolveCoffeeDexDeepLink/);
  assert.match(bridgeConfig, /accounts\.google\.com/);
  assert.match(bridgeConfig, /\.supabase\.co/);

  assert.match(bridgeComponent, /<WebView/);
  assert.match(bridgeComponent, /source=\{\{ uri: sourceUrl \}\}/);
  assert.match(bridgeComponent, /resolveCoffeeDexDeepLink/);
  assert.match(bridgeComponent, /SafeAreaProvider/);
  assert.match(bridgeComponent, /SafeAreaView/);
  assert.match(bridgeComponent, /renderLoading/);
  assert.match(bridgeComponent, /hasLoadError/);
  assert.match(bridgeComponent, /Linking\.openURL/);
  assert.match(bridgeComponent, /Share\.share/);
  assert.match(bridgeComponent, /Haptics/);
  assert.match(bridgeComponent, /pullToRefreshEnabled/);
  assert.match(bridgeComponent, /allowsBackForwardNavigationGestures/);
  assert.match(bridgeComponent, /thirdPartyCookiesEnabled/);
  assert.match(bridgeRoute, /CoffeeDexWebBridge/);
});
