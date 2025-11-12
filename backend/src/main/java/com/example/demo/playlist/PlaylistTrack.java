package com.example.demo.playlist;

import lombok.Data;

@Data
public class PlaylistTrack {
    private int id;
    private int playlistId;
    private String trackId;
    private String title;
    private String artistIds;
    private String artistNames;
    private String previewUrl;
    private String albumImageUrl;
    private int durationMs;
}
