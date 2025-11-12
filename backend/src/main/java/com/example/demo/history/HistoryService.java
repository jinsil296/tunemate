package com.example.demo.history;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.recommendation.Recommendation;

@Service
public class HistoryService {

    @Autowired
    private HistoryRepository historyRepository;

    public List<Recommendation> getRecommendedHistory(String userId) {
        return historyRepository.getRecommendedHistory(userId);
    }

    public boolean deleteHistoryById(String recommendationId) {
        int rowsAffected = historyRepository.deleteHistoryById(recommendationId);
        return rowsAffected > 0;
    }
    
}
