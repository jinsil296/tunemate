package com.example.demo.spotify.model;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Data;

@Data
public class User {
    private Long id;
    private String spotifyId;  // Spotify 사용자 고유 ID
    private String email;
    private String displayName;
    private String accessToken; // OAuth2 액세스 토큰
    private String refreshToken; // OAuth2 리프레시 토큰
    private Integer expiresIn; // 액세스 토큰 유효 기간 (초 단위)
    private String scope;
    private String tokenType;
    private ExplicitContent explicitContent;
    private ExternalUrls externalUrls;
    private Followers followers;
    private String href;
    private List<Image> images;
    private String product;
    private String type;
    private String uri;
    private LocalDateTime createdAt;  // 매핑될 created_at
    private LocalDateTime updatedAt;  // 매핑될 created_at

    @Data
    public static class ExplicitContent {
        private boolean filterEnabled;
        private boolean filterLocked;
    }

    @Data
    public static class ExternalUrls {
        private String spotify;
    }

    @Data
    public static class Followers {
        private String href;
        private int total;
    }

    @Data
    public static class Image {
        private String url;
        private Integer height;
        private Integer width;
    }
}
