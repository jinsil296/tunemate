package com.example.demo.spotify.model;

import lombok.Data;

@Data
public class SpotifyTrack {
    private int id;
    private String trackId;
    private String recommendationId;
    private String title;
    private String artistIds;
    private String artistNames;
    private String previewUrl;
    private String albumImageUrl;
    private int durationMs;
}
