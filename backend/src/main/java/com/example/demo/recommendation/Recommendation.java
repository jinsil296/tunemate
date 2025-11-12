package com.example.demo.recommendation;

import java.sql.Timestamp;

import lombok.Data;

@Data
public class Recommendation {
    private String recommendationId;
    private String userId;
    private String uniqueId;
    private String title;
    private String recommendationType; // 'track' or 'playlist' or 'my'
    private String trackIds;
    private String artistIds;
    private String artistNames;
    private String artistGenres;
    private String albumImageUrl;
    private Timestamp createDt;
    private Timestamp updateDt;
}
