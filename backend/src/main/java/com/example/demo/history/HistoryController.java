package com.example.demo.history;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.recommendation.Recommendation;

@RestController
@RequestMapping("/api/history")
public class HistoryController {
    
    @Autowired
    private HistoryService historyService;

    @GetMapping("/{userId}")
    public ResponseEntity<List<Recommendation>> getRecommendedHistory(@PathVariable String userId) {
        try {
            List<Recommendation> history = historyService.getRecommendedHistory(userId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{recommendationId}")
    public ResponseEntity<String> deleteHistory(@PathVariable String recommendationId) {
        boolean isDeleted = historyService.deleteHistoryById(recommendationId);
        if (isDeleted) {
            return ResponseEntity.ok("히스토리가 성공적으로 삭제되었습니다.");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("히스토리를 찾을 수 없습니다.");
        }
    }
}
