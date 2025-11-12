package com.example.demo.recommendation;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.example.demo.spotify.model.SpotifyTrack;

@Mapper
public interface RecommendationRepository {

    void insertRecommendation(Recommendation request);

    Recommendation getRecommendation(String recommendationId);

    void insertRecommendationTracks(List<SpotifyTrack> tracks);

    List<SpotifyTrack> findTracksByRecommendationId(String recommendationId);
    
}