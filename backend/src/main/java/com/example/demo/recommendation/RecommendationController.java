package com.example.demo.recommendation;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.spotify.model.SpotifyTrack;

@RestController
@RequestMapping("/api/recommendation")
public class RecommendationController {
    @Autowired
    private RecommendationService recommendationService;

    @PostMapping
    public void createRecommendation(@RequestBody Recommendation request) {
        recommendationService.createRecommendation(request);
    }

    // 추천 기반이 될 데이터 호출
    @GetMapping("/{recommendationId}")
    public ResponseEntity<Recommendation> getRecommendation(@PathVariable String recommendationId) {
        try {
            Recommendation recommendation = recommendationService.getRecommendation(recommendationId);
            return ResponseEntity.ok(recommendation);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // 추천 결과 저장
    @PostMapping("/tracks/save")
    public ResponseEntity<?> saveRecommendedTracks(@RequestBody List<SpotifyTrack> tracks) {
        try {
            System.out.println("추천 결과 저장 :: " + tracks);
            recommendationService.saveRecommendedTracks(tracks);
            return ResponseEntity.ok().body("Tracks saved successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to save tracks");
        }
    }
    
    // 추천 결과 조회
    @GetMapping("/{recommendationId}/tracks")
    public ResponseEntity<List<SpotifyTrack>> getRecommendationTracks(@PathVariable String recommendationId) {
        List<SpotifyTrack> tracks = recommendationService.getTracksByRecommendationId(recommendationId);
        return ResponseEntity.ok(tracks);
    }
}
