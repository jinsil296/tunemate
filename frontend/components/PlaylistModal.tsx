// PlaylistActionSheet.tsx
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';
import axios from 'axios';
import { API_BASE_URL } from '@/services/api-config';
import Toast from 'react-native-toast-message';
import { Playlist, SpotifyTrack } from '@/types/spotify';
import { getSpotifyId } from '@/services/tokenService';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import styled from 'styled-components/native';
import { useLikedSongs } from './LikedTracksProvider';

interface PlaylistActionSheetProps {
  visible: boolean;
  track: SpotifyTrack| null; // 여기서 타입을 변경
  onClose: () => void;
}
interface PlaylistThumbnailProps {
  imageUrls: string[];
}

const PlaylistModal: React.FC<PlaylistActionSheetProps> = ({ visible, track, onClose }) => {
  if (!track) return null; // track이 null일 때는 아무것도 렌더링하지 않음
  const { addSongToLikes, isLiked } = useLikedSongs(); // 좋아요 컨텍스트 사용
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const actionSheetRef = useRef<ActionSheetRef>(null);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    const userId = await getSpotifyId();
    if (!userId) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/playlist/${userId}`);
      setPlaylists(response.data);
    } catch (error) {
      console.error('플레이리스트 불러오기 실패:', error);
    }
  };

  const addToPlaylist = async (playlist: Playlist) => {
    // "Liked Songs" 플레이리스트(고정 ID가 0이라고 가정)에 중복 확인 로직 추가
    if (playlist.id === 0) {
      // 중복 확인: 이미 좋아요 리스트에 있는지 확인
      if (isLiked(track.id)) {

        actionSheetRef.current?.setModalVisible(false);
        onClose();
        Toast.show({
          type: 'info',
          text1: "이미 좋아요 표시한 곡에 추가되어 있습니다.",
          position: 'bottom',
          bottomOffset: 83.5
        });
        return; // 이미 좋아요 리스트에 있는 경우, 함수 종료
      }

      // 좋아요 리스트에 추가
      await addSongToLikes(track);
      actionSheetRef.current?.setModalVisible(false);
      onClose();
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/playlist/track/save`, {
        playlistId: playlist.id,
        trackId: track.id,
        title: track.name,
        artistIds: track.artists.map(artist => artist.id).join(','), // 아티스트 ID들
        artistNames: track.artists.map(artist => artist.name).join(','), // 아티스트 이름들
        previewUrl: track.preview_url || '', // 미리 듣기 URL
        albumImageUrl: track.album.images[0]?.url || '', // 앨범 이미지 URL
        durationMs: track.duration_ms // 트랙 길이
      });
      if (playlist.id === 0) addSongToLikes(track);
      Toast.show({
        type: 'success',
        text1: `"${playlist.title}"에 추가되었습니다.`,
        position: 'bottom',
      });
      actionSheetRef.current?.setModalVisible(false);
      onClose();
    } catch (error) {
      console.error('플레이리스트에 곡 추가 실패:', error);
    }
  };

  const PlaylistThumbnail: React.FC<PlaylistThumbnailProps> = ({ imageUrls }) => {
    if (imageUrls.length === 1) {
      return <FullImage source={{ uri: imageUrls[0] }} />;
    }
  
    const adjustedUrls = imageUrls.length === 2
    ? [imageUrls[0], imageUrls[1], imageUrls[1], imageUrls[0]]
    : imageUrls.length === 3 ? [imageUrls[0], imageUrls[1], imageUrls[2], imageUrls[0]]
    : imageUrls.slice(0, 4);
  
    return (
      <ThumbnailContainer>
        {adjustedUrls.map((url, index) => (
          <ThumbnailImage key={index} source={{ uri: url }} />
        ))}
      </ThumbnailContainer>
    );
  };

  return (
    <Modal visible={visible} transparent={true} animationType="none" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          <ActionSheetHeader>
            <TitleText>플레이리스트 목록</TitleText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </ActionSheetHeader>
          <ActionSheetContent>
          {playlists.map((item) => (
            <ActionSheetOption
              key={item.id}
              onPress={() => addToPlaylist(item)}
            >
              <ThumbnailContainer>
                {item.userId === 'system' ? ( // 좋아요 목록일 경우 고정 아이콘 표시
                    <LikeContainer>
                      <FontAwesome name="heart" size={24} color="red" />
                    </LikeContainer>
                  ) : item.thumbnailUrl ? (
                  <PlaylistThumbnail imageUrls={item.thumbnailUrl.split(',')} />
                ) : (
                  <Placeholder>
                    {/* <Ionicons name="musical-notes" size={24} color="white" /> */}
                    <MaterialIcons name="queue-music" size={24} color="#fff" />
                  </Placeholder>
                )}
              </ThumbnailContainer>
              <Text style={styles.playlistText}>{item.title}</Text>
            </ActionSheetOption>
          ))}
          </ActionSheetContent>
        </View>
      </View>
    </Modal>
  );
};

const ActionSheetHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom-width: 1px;
  border-bottom-color: #444;
`;
const TitleText = styled.Text`
  font-size: 18px;
  color: #ffffff;
`;
const ActionSheetContent = styled.View`
  padding: 5px 0px 20px 20px;
  background-color: #333333;
`;
const ActionSheetOption = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 8px 0;
`;
const ThumbnailContainer = styled.View`
  width: 40px;
  height: 40px;
  margin-right: 10px;
  border-radius: 4px;
  overflow: hidden;
  flex-direction: row;
  flex-wrap: wrap;
`;

const ThumbnailImage = styled.Image`
  width: 20px;
  height: 20px;
`;

const FullImage = styled.Image`
  width: 40px;
  height: 40px;
  border-radius: 4px;
`;

const LikeContainer = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 4px;
  background-color: #f5f5f5;
  justify-content: center;
  align-items: center;
`;

const Placeholder = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 4px;
  background-color: #ccc;
  justify-content: center;
  align-items: center;
`;
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#333',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 15
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  playlistItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#555',
  },
  playlistText: {
    fontSize: 16,
    color: '#fff',
  },
  closeButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    color: '#888',
  },
});

export default PlaylistModal;
