import { useFonts } from "expo-font";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { JSX, useEffect, useState } from "react";
import "react-native-reanimated";
import Toast, { BaseToast, BaseToastProps } from "react-native-toast-message";
import { getAccessToken } from "@/services/tokenService";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  PlaybackProvider,
  usePlayback,
} from "../components/playback/PlaybackProvider";
import BottomPlaybackBar from "@/components/playback/BottomPlaybackBar";
import FullScreenPlayback from "@/components/playback/FullScreenPlayback";
import { LogBox } from "react-native";
import { LikedTracksProvider } from "@/components/LikedTracksProvider";

LogBox.ignoreAllLogs(); // 모든 로그 무시
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = await getAccessToken();
      if (accessToken) {
        setIsAuthenticated(true);
      } else {
        router.replace("/login");
      }

      if (loaded) SplashScreen.hideAsync();
    };

    if (loaded) {
      initializeAuth();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  const customToastConfig = {
    success: (props: JSX.IntrinsicAttributes & BaseToastProps) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: "#4CAF50", // A green similar to the success color in your image
          borderRadius: 8, // Rounded corners
          height: 50, // Reduce the height
          paddingVertical: 10, // Adjust vertical padding for a sleeker appearance
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 15,
          fontWeight: "500",
        }}
        text2Style={{
          fontSize: 13,
          color: "#666",
        }}
      />
    ),
    error: (props: JSX.IntrinsicAttributes & BaseToastProps) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: "#F44336",
          borderRadius: 8,
          height: 50,
          paddingVertical: 10,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 15,
          fontWeight: "500",
        }}
      />
    ),
    info: (props: JSX.IntrinsicAttributes & BaseToastProps) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: "#007bff",
          borderRadius: 8,
          height: 50,
          paddingVertical: 10,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 15,
          fontWeight: "500",
        }}
      />
    ),
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LikedTracksProvider>
        <PlaybackProvider>
          {/* <StatusBar barStyle="dark-content" backgroundColor={"#FFFAFA"} /> */}
          <AppContent />
          <Toast
            config={customToastConfig}
            position="bottom"
            bottomOffset={60}
          />
        </PlaybackProvider>
      </LikedTracksProvider>
    </GestureHandlerRootView>
  );
}

const AppContent = () => (
  <>
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
    </Stack>
    <BottomPlaybackWithFullScreen />
  </>
);

const BottomPlaybackWithFullScreen = () => {
  const { isFullScreen, setIsFullScreen, currentTrack, isPlaying } =
    usePlayback();

  return !isFullScreen ? (
    <BottomPlaybackBar
      onSwipeUp={() => setIsFullScreen(true)}
      onPress={() => setIsFullScreen(true)}
      track={currentTrack}
      isPlaying={isPlaying}
    />
  ) : (
    <FullScreenPlayback
      onSwipeDown={() => setIsFullScreen(false)}
      track={currentTrack}
    />
  );
};
