import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import WebView, {
  type WebViewMessageEvent,
  type WebViewNavigation,
} from "react-native-webview";

import { COFFEEDEX_WEB_URL, isCoffeeDexBridgeUrl, resolveCoffeeDexDeepLink } from "../lib/bridge";

type NativeBridgeMessage =
  | { type: "haptic"; style?: HapticStyle }
  | { type: "share"; title?: string; message?: string; url?: string };

type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error";
type WebViewLoadProgressEvent = { nativeEvent: { progress: number } };

function getBridgeHapticStyle(style: HapticStyle | undefined) {
  if (style === "medium") return Haptics.ImpactFeedbackStyle.Medium;
  if (style === "heavy") return Haptics.ImpactFeedbackStyle.Heavy;
  return Haptics.ImpactFeedbackStyle.Light;
}

export function CoffeeDexWebBridge() {
  const webViewRef = useRef<React.ElementRef<typeof WebView>>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [sourceUrl, setSourceUrl] = useState(COFFEEDEX_WEB_URL);
  const [currentUrl, setCurrentUrl] = useState(COFFEEDEX_WEB_URL);
  const [loadProgress, setLoadProgress] = useState(0);
  const [hasLoadError, setHasLoadError] = useState(false);

  const injectedJavaScriptBeforeContentLoaded = useMemo(
    () => `
      window.CoffeeDexNativeBridge = {
        platform: ${JSON.stringify(Platform.OS)},
        version: "1.0.0",
        postMessage: function(payload) {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      };
      true;
    `,
    [],
  );

  const triggerLightHaptic = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const shareCurrentPage = useCallback(async () => {
    triggerLightHaptic();
    await Share.share({
      title: "CoffeeDex",
      message: `CoffeeDex에서 커피 기억을 남겨보세요.\n${currentUrl || COFFEEDEX_WEB_URL}`,
      url: currentUrl || COFFEEDEX_WEB_URL,
    });
  }, [currentUrl, triggerLightHaptic]);

  const reload = useCallback(() => {
    triggerLightHaptic();
    setHasLoadError(false);
    webViewRef.current?.reload();
  }, [triggerLightHaptic]);

  const goBack = useCallback(() => {
    triggerLightHaptic();
    if (canGoBack) {
      webViewRef.current?.goBack();
    }
  }, [canGoBack, triggerLightHaptic]);

  const handleNavigationStateChange = useCallback((navigationState: WebViewNavigation) => {
    setCanGoBack(navigationState.canGoBack);
    setCurrentUrl(navigationState.url);
  }, []);

  const handleProgress = useCallback((event: WebViewLoadProgressEvent) => {
    setLoadProgress(event.nativeEvent.progress);
  }, []);

  const handleShouldStartLoad = useCallback((request: WebViewNavigation) => {
    if (request.url === "about:blank") {
      return true;
    }

    const resolvedDeepLink = resolveCoffeeDexDeepLink(request.url);

    if (resolvedDeepLink) {
      setSourceUrl(resolvedDeepLink);
      setCurrentUrl(resolvedDeepLink);
      return false;
    }

    if (isCoffeeDexBridgeUrl(request.url)) {
      return true;
    }

    void Linking.openURL(request.url);
    return false;
  }, []);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as NativeBridgeMessage;

      if (message.type === "share") {
        void Share.share({
          title: message.title ?? "CoffeeDex",
          message: message.message ?? message.url ?? currentUrl,
          url: message.url ?? currentUrl,
        });
      }

      if (message.type === "haptic") {
        if (message.style === "success") {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (message.style === "warning") {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else if (message.style === "error") {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          void Haptics.impactAsync(getBridgeHapticStyle(message.style));
        }
      }
    } catch {}
  }, [currentUrl]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.toolbar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="뒤로가기"
            disabled={!canGoBack}
            onPress={goBack}
            style={[styles.toolbarButton, !canGoBack && styles.disabledButton]}
          >
            <Text style={styles.toolbarButtonText}>‹</Text>
          </Pressable>
          <Text numberOfLines={1} style={styles.toolbarTitle}>
            CoffeeDex
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="공유하기"
            onPress={shareCurrentPage}
            style={styles.toolbarButton}
          >
            <Text style={styles.toolbarButtonText}>↗</Text>
          </Pressable>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { opacity: loadProgress < 1 ? 1 : 0, width: `${loadProgress * 100}%` }]} />
        </View>
        {hasLoadError ? (
          <View style={styles.errorState}>
            <Text style={styles.errorTitle}>CoffeeDex를 불러오지 못했어요</Text>
            <Text style={styles.errorCopy}>
              네트워크 상태를 확인한 뒤 다시 시도해주세요. 외부 인증을 진행 중이었다면 앱으로 돌아와 새로고침하면 이어갈 수 있어요.
            </Text>
            <Pressable accessibilityRole="button" onPress={reload} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>다시 불러오기</Text>
            </Pressable>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            source={{ uri: sourceUrl }}
            style={styles.webView}
            containerStyle={styles.webViewContainer}
            injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            allowsInlineMediaPlayback
            allowsBackForwardNavigationGestures
            pullToRefreshEnabled
            mediaPlaybackRequiresUserAction={false}
            originWhitelist={["https://*", "coffeedex://*"]}
            setSupportMultipleWindows={false}
            onMessage={handleMessage}
            onLoadStart={() => setHasLoadError(false)}
            onLoadProgress={handleProgress}
            onNavigationStateChange={handleNavigationStateChange}
            onShouldStartLoadWithRequest={handleShouldStartLoad}
            onError={() => setHasLoadError(true)}
            onHttpError={(event) => {
              if (event.nativeEvent.statusCode >= 500) {
                setHasLoadError(true);
              }
            }}
            renderLoading={() => (
              <View style={styles.loadingState}>
                <ActivityIndicator color="#D6A73D" />
                <Text style={styles.loadingText}>CoffeeDex 여는 중</Text>
              </View>
            )}
            startInLoadingState
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#090704",
  },
  toolbar: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(214, 167, 61, 0.22)",
    backgroundColor: "#0D0905",
  },
  toolbarButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255, 248, 235, 0.08)",
  },
  disabledButton: {
    opacity: 0.38,
  },
  toolbarButtonText: {
    color: "#FFF4D7",
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "700",
  },
  toolbarTitle: {
    flex: 1,
    color: "#FFF4D7",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  progressTrack: {
    height: 2,
    backgroundColor: "#15100A",
  },
  progressFill: {
    height: 2,
    backgroundColor: "#D6A73D",
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: "#090704",
  },
  webView: {
    flex: 1,
    backgroundColor: "#090704",
  },
  loadingState: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#090704",
  },
  loadingText: {
    color: "#FFF4D7",
    fontSize: 14,
    fontWeight: "600",
  },
  errorState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 28,
    backgroundColor: "#090704",
  },
  errorTitle: {
    color: "#FFF4D7",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  errorCopy: {
    color: "#BFAF91",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  retryButton: {
    minHeight: 48,
    justifyContent: "center",
    borderRadius: 24,
    paddingHorizontal: 20,
    backgroundColor: "#D6A73D",
  },
  retryButtonText: {
    color: "#1A1208",
    fontSize: 15,
    fontWeight: "800",
  },
});
