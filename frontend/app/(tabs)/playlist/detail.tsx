import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ActivityIndicator, FlatList, View, TouchableOpacity, Text } from 'react-native';
import { API_BASE_URL } from '@/services/api-config';
import styled from 'styled-components/native';
import { useRoute } from '@react-navigation/native';
import { SpotifyTrack, Playlist, RecommendationReq, convertplaylistTracksArray } from '@/types/spotify';
import { FontAwesome, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { usePlayback } from '@/components/playback/PlaybackProvider';
import { router } from 'expo-router';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';
import PlaylistModal from '@/components/PlaylistModal';
import { useLikedSongs } from '@/components/LikedTracksProvider';
import Toast from 'react-native-toast-message';

export default function PlaylistDetail() {
  const route = useRoute();
  const { playlistId } = route.params as { playlistId: string };
  const [loading, setLoading] = useState(true);
  const [playlist, setPlaylist] = useState<Playlist>(); // 부모
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyTrack[]>([]); // 자식
  const [selectedSong, setSelectedSong] = useState<SpotifyTrack | null>(null);
  const { playTrack, playTrackList } = usePlayback();
  const { addSongToLikes, removeSongFromLikes, isLiked } = useLikedSongs(); // 좋아요 컨텍스트 사용
  // 모달 함수들
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const actionSheetRef = useRef<ActionSheetRef>(null);
  const openModal = () => {
    if (selectedTrack) {
      setIsModalVisible(true);
    }
  };
  const closeActionSheet = () => {
    setIsModalVisible(false);
    setSelectedTrack(null);
    fetchPlaylistTracks();
  };
  const openActionSheet = (item: SpotifyTrack) => {
    setSelectedTrack(item);
    actionSheetRef.current?.setModalVisible(true);
  };

  const fetchPlaylistTracks = async () => {
    if(!playlistId) return;

    try {
      // 트랙이 없을 수도 있음
      const playlist = await axios.get(`${API_BASE_URL}/api/playlist/detail/${playlistId}`);
      setPlaylist(playlist.data);

      const response = await axios.get(`${API_BASE_URL}/api/playlist/${playlistId}/tracks`);

      const playlistTracksData: SpotifyTrack[] = convertplaylistTracksArray(response.data);
      setPlaylistTracks(playlistTracksData);
    } catch (error) {
      console.error('Failed to fetch playlist data:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlaylistTracks();
  }, [playlistId]);

  const handlePlay = (track: SpotifyTrack) => {
    if (!track.preview_url) {
      Toast.show({
        type: 'info',
        text1: '재생이 제한된 트랙입니다.',
        visibilityTime: 2000, // Toast duration
        position: 'bottom',
        bottomOffset: 83.5,  // Offset to lift it slightly from the bottom
      });
      return;
    }
    handleSelectSong(track);
    playTrack(track);
  };

  const handlePlayAll = () => {
    const playableTracks = playlistTracks.filter(track => track.preview_url);

    if (playableTracks.length > 0) {
      playTrackList(playableTracks); // preview_url 있는 트랙만 재생 대기열에 추가
    } else {
      console.warn('재생 가능한 트랙이 없습니다');
    }
  }

  const onDelete = async () => {
    if (!selectedTrack || !playlist) return;
    try {
      if (playlist.id === 0) {
        // 스토리지에서만 삭제하는 로직
        await removeSongFromLikes(selectedTrack);
      } else {
        await axios.delete(`${API_BASE_URL}/api/playlist/track`, {
          params: {
            id: selectedTrack.deleteId,
            playlistId: playlist.id,
          },
        });
      }

      // setPlaylistTracks(playlistTracks.filter((item) => item.id !== selectedTrack.id));
      fetchPlaylistTracks();
      setSelectedTrack(null);
      actionSheetRef.current?.setModalVisible(false);
    } catch (error) {
      console.error('Failed to delete playlist:', error);
    }
  };

  const handleSelectSong = (song: SpotifyTrack) => {
    setSelectedSong(song);
  };
  
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    const formattedSeconds = Number(seconds); // seconds를 숫자로 변환
    return `${minutes}:${formattedSeconds < 10 ? '0' : ''}${formattedSeconds}`;    
  };

  if (loading) {
    return <ActivityIndicator size="large" style={{ backgroundColor: '#fff', width: '100%', height: '100%' }} 
    color="#000" />;
  }

  const PlaylistThumbnail = () => {
    if (playlistTracks.length === 1) {
      return <FullImage source={{ uri: playlistTracks[0].album.images[0]?.url }} />;
    }

    const adjustedUrls = playlistTracks.length === 2
    ? [playlistTracks[0].album.images[0]?.url, playlistTracks[1].album.images[0]?.url, 
       playlistTracks[1].album.images[0]?.url, playlistTracks[0].album.images[0]?.url]
    : playlistTracks.length === 3 
    ? [playlistTracks[0].album.images[0]?.url, playlistTracks[1].album.images[0]?.url, 
       playlistTracks[2].album.images[0]?.url, playlistTracks[0].album.images[0]?.url]
    : playlistTracks.slice(0, 4).map(track => track.album.images[0]?.url); // 4개 이상일 때 slice 사용

    return (
      <ThumbnailContainer>
        {adjustedUrls.map((url, index) => (
          <ThumbnailImage key={index} source={{ uri: url }} />
        ))}
      </ThumbnailContainer>
    );
  };
  
  return (
    <Container>
      <Header>
        <BackButton onPress={() => { router.back(); }}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </BackButton>
        <Title>플레이리스트</Title>
      </Header>
      <FlatList
        data={playlistTracks}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        ListHeaderComponent={
          <HeaderContent>
            <CenteredImageContainer>
              {playlist?.userId === 'system' ? (
                <LikeContainer>
                  <FontAwesome name="heart" size={70} color="red" />
                </LikeContainer>
              ) : playlistTracks.length > 0 ? (
                // 걍 여기서 플리트랙0번 이미지 넣자
                <PlaylistThumbnail />
                // <AlbumImage source={{ uri: playlistTracks[0].album.images[0]?.url }} />
              ) : (
                <Placeholder>
                  <MaterialIcons name="queue-music" size={70} color="#ccc" />
                </Placeholder>
              )}
            </CenteredImageContainer>
            <DescriptionContainer>
              <DescriptionText>
                <BoldText>{playlist?.title}{'\n'}</BoldText>
                <RegularText>{playlist?.totalTracks} tracks</RegularText>
              </DescriptionText>
            </DescriptionContainer>
            {playlistTracks.length > 0 && (
              <PlayButton onPress={handlePlayAll}>
                <FontAwesome name="play-circle" size={60} color="#000" />
              </PlayButton>
            )}
          </HeaderContent>
        }
        renderItem={({ item }) => (
          <ResultItem isSelected={selectedSong?.id === item.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <TouchableOpacity
                onPress={() => { handlePlay(item); }}
                style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
              >
                <Thumbnail source={{ uri: item.album.images[0]?.url }} />
                <SongDetails style={{ flex: 1, paddingLeft: 10 }}>
                  <SongTitle numberOfLines={2} ellipsizeMode="tail">{item.name}</SongTitle>
                  <ArtistName numberOfLines={1}>
                    {item.artists.map(artist => artist.name).join(', ')} • {formatDuration(item.duration_ms)}
                  </ArtistName>
                </SongDetails>
              </TouchableOpacity>
              <MenuButton onPress={() => openActionSheet(item)}>
                <Ionicons name="ellipsis-vertical" size={20} color="black" />
              </MenuButton>
            </View>
          </ResultItem>
        )}
        ListEmptyComponent={<EmptyText>플레이리스트에 트랙이 없습니다.</EmptyText>}
      />

      <ActionSheet
        ref={actionSheetRef}
        containerStyle={{
          backgroundColor: '#333333',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingBottom: 15,
        }}
      >
        <ActionSheetHeader>
          <ModalThumbnail source={{ uri: selectedTrack?.album.images[0]?.url }} />
          <TextContainer>
            <Text
              style={{
                color: '#fff',
                fontSize: 16,
              }}
              numberOfLines={1} 
              ellipsizeMode="tail"
            >
              {selectedTrack?.name}
            </Text>
            <Text
              style={{
                color: '#ccc',
                fontSize: 14,
                marginTop: 2,
              }}
            >
              {selectedTrack?.artists.map(artist => artist.name).join(', ')}
            </Text>
          </TextContainer>
          <CloseButton onPress={() => actionSheetRef.current?.setModalVisible(false)}>
            <Ionicons name="close" size={24} color="white" />
          </CloseButton>
        </ActionSheetHeader>
        <ActionSheetContent>
          <ActionSheetOption onPress={() => {
            // 닫고 모달 열기
            actionSheetRef.current?.setModalVisible(false);
            setTimeout(() => {  // 모달 열기 전에 setTimeout으로 delay 추가
              openModal();
            }, 300);
          }}>
            <MaterialIcons name="queue-music" size={20} color="#fff" />
            <OptionText>플레이리스트에 추가하기</OptionText>
          </ActionSheetOption>
          <ActionSheetOption onPress={onDelete}>
            <MaterialIcons name="delete" size={20} color="white" />
            <OptionText>플레이리스트에서 삭제하기</OptionText>
          </ActionSheetOption>
        </ActionSheetContent>
      </ActionSheet>

      {/* 재생목록 추가 모달 */}
      <PlaylistModal
        visible={isModalVisible}
        track={selectedTrack}
        onClose={closeActionSheet}
      />

    </Container>
  );
}

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #fff;
`;

const Header = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 15px;
  border-bottom-width: 1px;
  border-bottom-color: #ddd;
  background-color: #fff;
`;

const BackButton = styled.TouchableOpacity`
  position: absolute;
  left: 15px;
`;

const Title = styled.Text`
  font-weight: 500;
  font-size: 16px;
`;

const HeaderContent = styled.View`
  align-items: center;
  padding: 10px;
  background-color: #fafafa;
`;

const CenteredImageContainer = styled.View`
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 25px;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.2;
  shadow-radius: 4px;
  elevation: 5;
`;

const LikeContainer = styled.View`
  width: 200px;
  height: 200px;
  border-radius: 5px;
  background-color: #f5f5f5;
  justify-content: center;
  align-items: center;
`;

const ThumbnailContainer = styled.View`
  width: 200px;
  height: 200px;
  margin-right: 10px;
  border-radius: 4px;
  overflow: hidden;
  flex-direction: row;
  flex-wrap: wrap;
`;

const ThumbnailImage = styled.Image`
  width: 100px;
  height: 100px;
`;

const FullImage = styled.Image`
  width: 200px;
  height: 200px;
  border-radius: 5px;
`;

const Placeholder = styled.View`
  width: 200px;
  height: 200px;
  background-color: #3a3a3a;
  justify-content: center;
  align-items: center;
`;

const DescriptionContainer = styled.View`
  justify-content: center;
  align-items: center;
  width: 100%;
  /* background-color: #F0F0FF; */
`;

const DescriptionText = styled.Text`
  line-height: 24px; /* 문장 간격 조절 */
  font-size: 15px;
  color: #000;
  max-width: 75%;
  text-align: center; /* 텍스트 가운데 정렬 */
`;

const RegularText = styled.Text`
  color: #000;
`;

const BoldText = styled.Text`
  font-weight: bold;
  color: #000;
  font-size: 20px;
  padding-horizontal: 20px;
`;

const PlayButton = styled.TouchableOpacity`
  justify-content: center;
  align-items: center;
  padding: 10px;
`;

const LikeButton = styled.TouchableOpacity`
  padding: 10px;
`;

// =============
const ResultItem = styled.TouchableOpacity<{ isSelected: boolean }>`
  flex-direction: row;
  align-items: center;
  padding: 10px 15px;
  border-top-width: 0.2px;
  border-color: #f0f0f0;
  background-color: ${(props: { isSelected: boolean }) => (props.isSelected ? '#e0e0e0' : '#fff')};
`;

const Thumbnail = styled.Image`
  width: 50px;
  height: 50px;
  border: 0.3px gray;
  border-radius: 5px;
  margin-right: 10px;
`;

const SongDetails = styled.View`
  flex: 1;
  padding-top: 2px; /* 제목과 아티스트 간의 간격 조정 */
`;

const SongTitle = styled.Text`
  font-weight: 500;
  font-size: 16px;
`;

const ArtistName = styled.Text`
  font-size: 14px; /* 폰트 사이즈 줄임 */
  color: #666; /* 약간 어두운 회색 */
  margin-top: 2px; /* 약간의 상단 간격 */
`;

const EmptyText = styled.Text`
  text-align: center;
  color: #aaa;
  margin-top: 20px;
  font-size: 16px;
`;

// Action Sheet Components
const MenuButton = styled(TouchableOpacity)`
  padding: 8px;
`;

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

const CloseButton = styled.TouchableOpacity``;

const ActionSheetContent = styled.View`
  padding: 5px 0px 20px 20px;
  background-color: #333333;
`;

const ActionSheetOption = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 15px 0;
`;

const OptionText = styled.Text`
  font-size: 16px;
  color: #ffffff;
  padding-left: 10px;
`;

const ModalThumbnail = styled.Image`
  width: 40px;
  height: 40px;
  border-radius: 4px;
`;

const TextContainer = styled.View`
  flex: 1;
  margin-left: 10px;
`;