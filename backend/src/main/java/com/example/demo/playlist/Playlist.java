package com.example.demo.playlist;

import java.sql.Timestamp;

import lombok.Data;

@Data
public class Playlist {
    private int id;
    private String userId;
    private String title;
    private String thumbnailUrl;
    private Timestamp createDt;
    private int totalTracks;
}
