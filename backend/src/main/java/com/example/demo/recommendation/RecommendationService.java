package com.example.demo.recommendation;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.spotify.model.SpotifyTrack;

@Service
public class RecommendationService {

    @Autowired
    private RecommendationRepository recommendationRepository;
    
	public void createRecommendation(Recommendation request) {
        // 추천 요청 데이터 저장
        recommendationRepository.insertRecommendation(request);
    }

    // 추천 기반이 될 데이터 호출
    public Recommendation getRecommendation(String recommendationId) {
        return recommendationRepository.getRecommendation(recommendationId);
    }
    
    // 추천 결과 저장
    public void saveRecommendedTracks(List<SpotifyTrack> tracks) {
        recommendationRepository.insertRecommendationTracks(tracks);
    }

    // 추천 결과 조회
    public List<SpotifyTrack> getTracksByRecommendationId(String recommendationId) {
        return recommendationRepository.findTracksByRecommendationId(recommendationId);
    }
}
