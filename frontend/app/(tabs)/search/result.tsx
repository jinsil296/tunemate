import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/services/api-config";
import { useRoute } from "@react-navigation/native";
import { getAccessToken } from "@/services/tokenService";
import { RecommendationReq, SpotifyTrack, seed_genres } from "@/types/spotify";
import RecommendationTracks from "@/components/RecommendationTracks";
import { ActivityIndicator } from "react-native";

export default function TrackResultScreen() {
  const route = useRoute();
  const { recommendationId } = route.params as { recommendationId: string };
  const [loading, setLoading] = useState(true);
  const [recommendationReq, setRecommendationReq] =
    useState<RecommendationReq>();
  const [recommendedationTracks, setRecommendedationTracks] = useState<
    SpotifyTrack[]
  >([]);

  useEffect(() => {
    const Recommendations = async () => {
      if (!recommendationId) return;

      try {
        const recommendation = await axios.get(
          `${API_BASE_URL}/api/recommendation/${recommendationId}`
        );

        const recommendationData = recommendation.data;
        setRecommendationReq(recommendationData);

        const accessToken = await getAccessToken();

        // 1. 최대 3명의 아티스트 ID만 사용
        const artistIds = recommendationData.artistIds.split(",").slice(0, 3);

        // 2. 장르 문자열을 배열로 분리하고, 유효한 장르만 필터링
        const genres = Array.from(
          new Set(
            recommendationData.artistGenres
              .split(",")
              .map((genre: string) => genre.trim()) // 공백 제거
              .filter((genre: string) => seed_genres.includes(genre)) // 유효한 장르만 선택
          )
        ).slice(0, Math.max(0, 4 - artistIds.length)); // 남은 슬롯 수에 따라 최대 선택

        // Spotify 추천 API 호출
        const spotifyResponse = await axios.get(
          "https://api.spotify.com/v1/recommendations",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: {
              seed_artists: artistIds.join(","),
              seed_genres: genres.join(","),
              seed_tracks: recommendationData.trackIds,
              limit: 20,
            },
          }
        );

        setRecommendedationTracks(spotifyResponse.data.tracks);
      } catch (error) {
        console.error("검색 화면 Failed to fetch recommendation data:", error);
      } finally {
        setLoading(false);
      }
    };

    Recommendations();
  }, [recommendationId]);

  if (loading || !recommendationReq) {
    return (
      <ActivityIndicator
        size="large"
        style={{ backgroundColor: "#fff", width: "100%", height: "100%" }}
        color="#000"
      />
    );
  }

  return (
    <RecommendationTracks
      recommendedationTracks={recommendedationTracks}
      recommendationId={recommendationId}
      recommendationReq={recommendationReq}
    />
  );
}
