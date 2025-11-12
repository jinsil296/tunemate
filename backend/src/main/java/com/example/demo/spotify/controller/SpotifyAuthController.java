package com.example.demo.spotify.controller;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.example.demo.spotify.model.User;
import com.example.demo.spotify.repository.UserRepository;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@RestController
public class SpotifyAuthController {
    @Value("${spotify.client-id}")
    private String clientId;

    @Value("${spotify.client-secret}")
    private String clientSecret;

    @Value("${spotify.redirect-uri}")
    private String redirectUri;

    @Value("${front-uri}")
    private String frontUri;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String tokenUrl = "https://accounts.spotify.com/api/token";
    private static final String RESPONSE_TYPE = "code";
    private static final String STATE = "some_random_state";
    private static final String SCOPE = "user-read-private user-read-email playlist-read-private playlist-read-collaborative "
            + "playlist-modify-public playlist-modify-private user-library-read user-library-modify "
            + "user-top-read user-read-playback-state user-modify-playback-state "
            + "user-read-currently-playing user-follow-read user-follow-modify";

    @Autowired
    private UserRepository userRepository;

    // 1번 단계. 사용자를 Spotify 로그인 페이지로 리다이렉트.
    // 사용자가 권한 부여를 허용하면 Spotify가 리다이렉트 URI로 권한 부여 코드를 보냄.
    @GetMapping("/api/spotify/login")
    public ResponseEntity<Void> redirectToSpotify() {
        String encodedScope = URLEncoder.encode(SCOPE, StandardCharsets.UTF_8);
        String url = String.format(
                "https://accounts.spotify.com/authorize?client_id=%s&response_type=%s&redirect_uri=%s&scope=%s&state=%s",
                clientId, RESPONSE_TYPE, redirectUri, encodedScope, STATE);
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(url));

        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }

    // 2번 단계. Spotify가 리다이렉트 URI로 권한 부여 코드를 보냄.
    // 이 엔드포인트에서 코드를 엑세스 토큰으로 교환.
    @GetMapping("/api/spotify/callback")
    public ResponseEntity<String> handleSpotifyCallback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error,
            HttpServletResponse httpRes,
            HttpSession session) {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED); // 주로 폼 데이터를 URL 인코딩하여 전송
        headers.setBasicAuth(clientId, clientSecret); // 클라이언트 ID와 시크릿으로 Basic 인증

        // 권한 부여 코드를 엑세스 토큰으로 교환. 엔드포인트 post에 요청을 보내면 됨
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "authorization_code");
        body.add("code", code);
        body.add("redirect_uri", redirectUri);

        // RestTemplate으로 Spotify API 호출
        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.exchange(tokenUrl, HttpMethod.POST, request, Map.class);

        if (response.getStatusCode() == HttpStatus.OK) {
            // Access token이 있는 경우 사용자 정보 가져오기
            Map<String, Object> tokenResponse = response.getBody();
            String accessToken = (String) tokenResponse.get("access_token");
            String refreshToken = (String) tokenResponse.get("refresh_token");
            String scope = (String) tokenResponse.get("scope");
            Integer expiresIn = (int) tokenResponse.get("expires_in");
            String tokenType = (String) tokenResponse.get("token_type");

            String userProfileUrl = "https://api.spotify.com/v1/me";
            HttpHeaders profileHeaders = new HttpHeaders();
            profileHeaders.setBearerAuth(accessToken);

            HttpEntity<String> profileRequest = new HttpEntity<>(profileHeaders);
            ResponseEntity<Map> profileResponse = restTemplate.exchange(userProfileUrl, HttpMethod.GET, profileRequest,
                    Map.class);

            if (profileResponse.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> userProfile = profileResponse.getBody();

                String spotifyId = (String) userProfile.get("id");
                String email = (String) userProfile.get("email");
                String displayName = (String) userProfile.get("display_name");

                // 데이터베이스에서 사용자 확인
                Optional<User> existingUser = userRepository.findBySpotifyId(spotifyId);

                if (existingUser.isPresent()) {
                    // 기존 사용자라면 refresh_token과 관련 데이터를 갱신
                    User user = existingUser.get();
                    user.setAccessToken(accessToken);
                    user.setRefreshToken(refreshToken);
                    user.setSpotifyId(spotifyId);
                    user.setExpiresIn(expiresIn);

                    userRepository.updateToken(user); // 업데이트된 정보 저장
                } else {
                    // 새 사용자 - 데이터베이스에 사용자 저장
                    User newUser = new User();
                    newUser.setSpotifyId(spotifyId);
                    newUser.setEmail(email);
                    newUser.setDisplayName(displayName);
                    newUser.setAccessToken(accessToken);
                    newUser.setRefreshToken(refreshToken);
                    newUser.setExpiresIn(expiresIn);
                    newUser.setScope(scope);
                    newUser.setTokenType(tokenType);

                    userRepository.save(newUser);
                }

                // spotify 애플리케이션 관리 페이지에서 권한을 해제하면 oAuth 진행할 때 http나, exp로 랜딩 안 됨.
                // https://d9ba-175-202-158-242.ngrok-free.app
                String redirectUrl = String.format(
                        frontUri + "?access_token=%s&refresh_token=%s&spotify_id=%s&expires_in=%d&token_type=%s",
                        URLEncoder.encode(accessToken, StandardCharsets.UTF_8),
                        URLEncoder.encode(refreshToken, StandardCharsets.UTF_8),
                        URLEncoder.encode(spotifyId, StandardCharsets.UTF_8),
                        expiresIn,
                        URLEncoder.encode(tokenType, StandardCharsets.UTF_8));
                httpRes.setHeader("Location", redirectUrl);
                System.out.println("반환 url ::::: " + redirectUrl);
                return ResponseEntity.status(HttpStatus.FOUND).build();
            }
        }

        // 실패 시 리다이렉트 URL에 상태값 포함
        String errorRedirectUrl = frontUri + "?status=failed";
        httpRes.setHeader("Location", errorRedirectUrl);

        // 일케 하면 모르겟음
        return ResponseEntity.status(HttpStatus.FOUND).build();
    }

    @PostMapping("/api/auth/refresh")
    public ResponseEntity<?> refreshAccessToken(@RequestBody User user) {
        String refreshToken = user.getRefreshToken();

        if (refreshToken == null || refreshToken.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("No refresh token provided");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setBasicAuth(clientId, clientSecret);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "refresh_token");
        body.add("refresh_token", refreshToken);

        HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, requestEntity, Map.class);
            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> responseBody = response.getBody();
                for (Map.Entry<String, Object> entry : responseBody.entrySet()) {
                    System.out.println(entry.getKey() + ":::::::: " + entry.getValue());
                }
                String accessToken = (String) responseBody.get("access_token");
                user.setAccessToken(accessToken);
                userRepository.updateToken(user);
                return ResponseEntity.ok(responseBody);
            } else {
                return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to refresh access token");
        }
    }
}
