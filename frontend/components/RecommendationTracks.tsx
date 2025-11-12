import React, { useEffect } from 'react';
import styled from 'styled-components/native';
import { RecommendationReq, SpotifyTrack } from '@/types/spotify';
import axios from 'axios';
import { API_BASE_URL } from '@/services/api-config';
import RecommendationLayout from './RecommendationLayout';

interface RecommendationListProps {
  recommendedationTracks: SpotifyTrack[];
  recommendationId: string;
  recommendationReq: RecommendationReq;
}
  
export default function RecommendationTracks({ recommendedationTracks, recommendationId, recommendationReq }: RecommendationListProps) {
  useEffect(() => {
    const saveRecommendationTracks = async () => {
      if (!recommendedationTracks.length || !recommendationId) return; // 조건 추가

      try {
        const tracks = recommendedationTracks.map((track) => ({
          trackId: track.id,
          recommendationId: recommendationId,
          title: track.name,
          artistIds: track.artists.map(artist => artist.id).join(','), // 아티스트 ID들
          artistNames: track.artists.map(artist => artist.name).join(','), // 아티스트 이름들
          previewUrl: track.preview_url || '', // 미리 듣기 URL
          albumImageUrl: track.album.images[0]?.url || '', // 앨범 이미지 URL
          durationMs: track.duration_ms // 트랙 길이
        }));

        const response = await axios.post(
          `${API_BASE_URL}/api/recommendation/tracks/save`, tracks
        );

        if (response.status === 200) {
          console.log("Tracks saved successfully:", response.data);
        } else {
          console.error("Failed to save tracks:", response);
        }
      } catch (error) {
        console.error("Error while sending recommendation tracks:", error);
      }
    }

    saveRecommendationTracks();
  }, [recommendedationTracks, recommendationId]);

  return (
    <RecommendationLayout 
      recommendedationTracks={recommendedationTracks}
      recommendationReq={recommendationReq}
    />
  );
}