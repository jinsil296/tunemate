package com.example.demo.playlist;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/playlist")
public class PlaylistController {
    
    @Autowired
    private PlaylistService playlistService;

    @GetMapping("/{userId}")
    public ResponseEntity<List<Playlist>> getPlaylists(@PathVariable String userId) {
        try {
            List<Playlist> playlists = playlistService.getPlaylists(userId);
            return ResponseEntity.ok(playlists);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/create")
    public ResponseEntity<String> createPlaylist(@RequestBody Playlist playlist) {
        try {
            playlistService.createPlaylist(playlist);
            return ResponseEntity.ok("플레이리스트가 성공적으로 생성되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/detail/{playlistId}")
    public ResponseEntity<Playlist> getPlaylist(@PathVariable String playlistId) {
        try {
            Playlist playlist = playlistService.getPlaylist(playlistId);
            return ResponseEntity.ok(playlist);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{playlistId}")
    public ResponseEntity<String> deletePlaylist(@PathVariable String playlistId) {
        boolean isDeleted = playlistService.deletePlaylistById(playlistId);
        if (isDeleted) {
            return ResponseEntity.ok("플레이리스트가 성공적으로 삭제되었습니다.");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("플레이리스트를 찾을 수 없습니다.");
        }
    }

    @DeleteMapping("/track")
    public ResponseEntity<String> deleteTrack(@RequestParam String id, @RequestParam String playlistId) {
        boolean isDeleted = playlistService.deleteTrackById(id, playlistId);
        if (isDeleted) {
            return ResponseEntity.ok("트랙이 성공적으로 삭제되었습니다.");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("트랙을 찾을 수 없습니다.");
        }
    }

    @PutMapping("/{playlistId}")
    public ResponseEntity<String> updatePlaylist(@PathVariable String playlistId, @RequestBody Map<String, String> requestBody) {
        String title = requestBody.get("title");
        boolean isUpdated = playlistService.updatePlaylistById(playlistId, title);
        if (isUpdated) {
            return ResponseEntity.ok("플레이리스트가 성공적으로 수정되었습니다.");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("플레이리스트를 찾을 수 없습니다.");
        }
    }

    @GetMapping("/{playlistId}/tracks")
    public ResponseEntity<List<PlaylistTrack>> getPlaylistTracks(@PathVariable String playlistId) {
        List<PlaylistTrack> tracks = playlistService.getPlaylistTracksById(playlistId);
        return ResponseEntity.ok(tracks);
    }

    @PostMapping("/track/save")
    public ResponseEntity<String> addTrackToPlaylist(@RequestBody PlaylistTrack playlistTrack) {

        boolean isAdded = playlistService.addTrackToPlaylist(playlistTrack);

        if (isAdded) {
            return ResponseEntity.status(HttpStatus.CREATED).body("트랙이 플레이리스트에 추가되었습니다.");
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("트랙 추가에 실패했습니다.");
        }
    }
}
