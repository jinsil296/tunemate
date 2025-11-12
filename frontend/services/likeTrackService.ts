import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from './api-config';
import { convertplaylistTracksArray, PlaylistTrack, SpotifyTrack } from '@/types/spotify';

const LIKED_SONGS_KEY = 'liked_songs';

// 서버에서 좋아요 목록을 가져오는 함수
export const loadLikedSongsFromDB = async () => {
  try {
    const playlistId = 0;
    const response = await axios.get(`${API_BASE_URL}/api/playlist/${playlistId}/tracks`);
    const playlistTracksData: SpotifyTrack[] = convertplaylistTracksArray(response.data);
    const likedSongs = playlistTracksData; // 서버에서 받은 좋아요 목록
    
    // 가져온 목록을 AsyncStorage에 저장
    await AsyncStorage.setItem(LIKED_SONGS_KEY, JSON.stringify(likedSongs));

    return likedSongs;
  } catch (error) {
    console.error('Failed to load liked songs from DB:', error);
    return [];
  }
};

// AsyncStorage에서 좋아요 목록 가져오기
export const loadLikedSongs = async () => {
  try {
    const likedSongs = await AsyncStorage.getItem(LIKED_SONGS_KEY);
    return likedSongs ? JSON.parse(likedSongs) : [];
  } catch (error) {
    console.error('Failed to load liked songs from storage:', error);
    return [];
  }
};

// 좋아요 목록을 AsyncStorage에 저장하기
export const saveLikedSongs = async (track: SpotifyTrack[]) => {
  try {
    await AsyncStorage.setItem(LIKED_SONGS_KEY, JSON.stringify(track));
  } catch (error) {
    console.error('Failed to save liked songs to storage:', error);
  }
};

// 서버와 AsyncStorage에 좋아요 추가
export const addLikedSong = async (track: SpotifyTrack) => {
  try {
    await axios.post(`${API_BASE_URL}/api/playlist/track/save`, {
      playlistId: 0,
      trackId: track.id,
      title: track.name,
      artistIds: track.artists.map(artist => artist.id).join(','), // 아티스트 ID들
      artistNames: track.artists.map(artist => artist.name).join(','), // 아티스트 이름들
      previewUrl: track.preview_url || '', // 미리 듣기 URL
      albumImageUrl: track.album.images[0]?.url || '', // 앨범 이미지 URL
      durationMs: track.duration_ms // 트랙 길이
    });
    const likedSongs = await loadLikedSongs();
    likedSongs.push(track);
    await saveLikedSongs(likedSongs);
  } catch (error) {
    console.error('Failed to add liked song:', error);
  }
};

// 서버와 AsyncStorage에서 좋아요 제거
// 고민이다 deleteID로 할까 아님 트랙 아이디로 할까
export const removeLikedSong = async (track: SpotifyTrack) => {
  try {
    await axios.delete(`${API_BASE_URL}/api/playlist/track`, {
      params: {
        id: track.deleteId,
        playlistId: 0,
      },
    });
    const likedSongs = await loadLikedSongs();
    const updatedLikedSongs = likedSongs.filter((song: { id: string; }) => song.id !== track.id);
    await saveLikedSongs(updatedLikedSongs);
  } catch (error) {
    console.error('Failed to remove liked song:', error);
  }
};
