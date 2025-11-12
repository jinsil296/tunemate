package com.example.demo.history;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.example.demo.recommendation.Recommendation;

@Mapper
public interface HistoryRepository {

    List<Recommendation> getRecommendedHistory(String userId);

    int deleteHistoryById(String recommendationId);
    
}
