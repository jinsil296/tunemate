import React, { useState, useEffect } from "react";
import axios from "axios";
import { ActivityIndicator } from "react-native";
import { API_BASE_URL } from "@/services/api-config";
import { useRoute } from "@react-navigation/native";
import {
  SpotifyTrack,
  convertSpotifyTrack2Array,
  RecommendationReq,
} from "@/types/spotify";
import RecommendationLayout from "@/components/RecommendationLayout";

export default function RecommendationDetail() {
  const route = useRoute();
  const { recommendationId } = route.params as { recommendationId: string };
  const [loading, setLoading] = useState(true);
  const [recommendationReq, setRecommendationReq] =
    useState<RecommendationReq>();
  const [recommendedationTracks, setRecommendedationTracks] = useState<
    SpotifyTrack[]
  >([]);

  useEffect(() => {
    const fetchRecommendationTracks = async () => {
      if (!recommendationId) return;

      try {
        //바보다.. 부모 테이블 찾을 때 자식도 같이 찾아서 list로 같이 내려주면 되는데
        const recommendation = await axios.get(
          `${API_BASE_URL}/api/recommendation/${recommendationId}`
        );
        setRecommendationReq(recommendation.data);

        const response = await axios.get(
          `${API_BASE_URL}/api/recommendation/${recommendationId}/tracks`
        );
        const recommendationData: SpotifyTrack[] = convertSpotifyTrack2Array(
          response.data
        );
        setRecommendedationTracks(recommendationData);
      } catch (error) {
        console.error("이력 화면 Failed to fetch recommendation data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendationTracks();
  }, [recommendationId]);

  if (loading || !recommendationReq || !recommendedationTracks) {
    return (
      <ActivityIndicator
        size="large"
        style={{ backgroundColor: "#fff", width: "100%", height: "100%" }}
        color="#000"
      />
    );
  }

  return (
    <RecommendationLayout
      recommendedationTracks={recommendedationTracks}
      recommendationReq={recommendationReq}
    />
  );
}
