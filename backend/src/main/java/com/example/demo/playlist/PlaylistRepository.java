package com.example.demo.playlist;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PlaylistRepository {

    void createPlaylist(Playlist playlist);

    List<Playlist> getPlaylists(String userId);

    int deletePlaylistById(String playlistId);

    int updatePlaylistById(String playlistId, String title);

    List<PlaylistTrack> getPlaylistTracksById(String playlistId);

    int addTrackToPlaylist(PlaylistTrack playlistTrack);

    Playlist getPlaylist(String playlistId);

    int deleteTrackById(String id, String playlistId);
    
}
