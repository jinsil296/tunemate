import React, { useEffect } from "react";
import { TouchableOpacity, Image, View, Text, StyleSheet } from "react-native";
import { API_BASE_URL } from "../services/api-config";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { saveTokens } from "@/services/tokenService";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { AuthTokens } from "@/types/spotify";

// 로그인 하고 stack 남는 거 해결
type RootStackParamList = {
  "(tabs)": undefined;
  login: undefined;
  search: undefined;
};
type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type LinkingEvent = {
  url: string;
};

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();

  // useEffect에서 활용
  useEffect(() => {
    const handleDeepLink = (event: LinkingEvent) => {
      console.log("뭐지");
      const { url } = event;
      const queryParams: Record<string, any> =
        Linking.parse(url).queryParams ?? {};

      const tokens: AuthTokens = {
        access_token: queryParams.access_token ?? "",
        refresh_token: queryParams.refresh_token ?? "",
        spotify_id: queryParams.spotify_id ?? "",
      };
      console.log(
        "tokens:::",
        !!tokens.access_token && !!tokens.refresh_token && !!tokens.spotify_id
      );

      if (tokens.access_token && tokens.refresh_token && tokens.spotify_id) {
        saveTokens(tokens).then(() => {
          console.log("로그인 성공, 토큰 저장 완료", tokens.access_token);
          navigation.reset({
            index: 0,
            routes: [{ name: "(tabs)" }],
          });
        });
      }
    };

    const linkingSubscription = Linking.addEventListener("url", handleDeepLink);
    return () => linkingSubscription.remove();
  }, []);

  const handleSpotifyLogin = async () => {
    const loginUrl = `${API_BASE_URL}/api/spotify/login`;
    Linking.openURL(loginUrl);
  };

  return (
    <View style={styles.container}>
      {/* 로고 및 제목 */}
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/images/logo.png")}
          style={{
            width: 70,
            height: 70,
          }}
        />
        <Text style={styles.title}>Tunemate</Text>
      </View>
      <Text style={styles.desc}>
        스포티파이로 로그인하여 {"\n"}
        개인화된 음악 추천을 받아보세요.
      </Text>
      {/* 로그인 버튼 */}
      <TouchableOpacity style={styles.loginButton} onPress={handleSpotifyLogin}>
        <View style={styles.buttonContent}>
          <Image
            source={require("../assets/images/Spotify_Primary_Logo_RGB_Green.png")}
            style={styles.img}
          />
          <Text style={styles.buttonText}>Spotify로 계속하기</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "white",
    padding: 30,
  },
  logoContainer: {
    marginBottom: 50,
    // flexDirection: 'row',
    alignItems: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#121212",
    marginTop: 10,
  },
  desc: {
    color: "#121212",
    marginTop: 25,
    marginBottom: 30,
    fontSize: 18,
    fontWeight: "bold",
  },
  loginButton: {
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "gray", // 투명 테두리: transparent
    paddingVertical: 10,
  },
  buttonContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  img: {
    width: 26, // 로고 크기 설정
    height: 26,
    marginRight: 10, // 텍스트와 로고 사이 여백
    backgroundColor: "black",
    borderRadius: 15,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#121212",
  },
});
