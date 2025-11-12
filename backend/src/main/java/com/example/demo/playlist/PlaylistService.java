package com.example.demo.playlist;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PlaylistService {

    @Autowired
    private PlaylistRepository playlistRepository;

    public void createPlaylist(Playlist playlist) {
        playlistRepository.createPlaylist(playlist);
    }

    public List<Playlist> getPlaylists(String userId) {
        return playlistRepository.getPlaylists(userId);
    }

    public boolean deletePlaylistById(String playlistId) {
        int rowsAffected = playlistRepository.deletePlaylistById(playlistId);
        return rowsAffected > 0;
    }

    public boolean updatePlaylistById(String playlistId, String title) {
        int rowsAffected = playlistRepository.updatePlaylistById(playlistId, title);
        return rowsAffected > 0;
    }

    public List<PlaylistTrack> getPlaylistTracksById(String playlistId) {
        return playlistRepository.getPlaylistTracksById(playlistId);
    }

    public boolean addTrackToPlaylist(PlaylistTrack playlistTrack) {
        int rowsInserted = playlistRepository.addTrackToPlaylist(playlistTrack);
        return rowsInserted > 0;
    }

    public Playlist getPlaylist(String playlistId) {
        return playlistRepository.getPlaylist(playlistId);
    }

    public boolean deleteTrackById(String id, String playlistId) {
        int rowsAffected = playlistRepository.deleteTrackById(id, playlistId);
        return rowsAffected > 0;
    }
    
}
