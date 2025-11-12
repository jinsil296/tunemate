import React, { useRef, useState, } from 'react';
import { FlatList, View, TouchableOpacity, Text } from 'react-native';
import styled from 'styled-components/native';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { RecommendationReq, SpotifyTrack } from '@/types/spotify';
import { usePlayback } from './playback/PlaybackProvider';
import { router } from 'expo-router';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';
import PlaylistModal from './PlaylistModal';
import Toast from 'react-native-toast-message';

interface RecommendationListProps {
  recommendedationTracks: SpotifyTrack[];
  recommendationReq: RecommendationReq;
}
  
export default function RecommendationLayout({ recommendedationTracks, recommendationReq }: RecommendationListProps) {
  const [likedSongs, setLikedSongs] = useState<string[]>([]);
  const [selectedSong, setSelectedSong] = useState<SpotifyTrack | null>(null);
  const { playTrack, playTrackList } = usePlayback();

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
  };
  const openActionSheet = (item: SpotifyTrack) => {
    setSelectedTrack(item);
    actionSheetRef.current?.setModalVisible(true);
  };

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
    const playableTracks = recommendedationTracks.filter(track => track.preview_url);

    if (playableTracks.length > 0) {
      playTrackList(playableTracks); // preview_url 있는 트랙만 재생 대기열에 추가
    } else {
      console.warn('재생 가능한 트랙이 없습니다');
    }
  }

  const handleLike = (id: string) => {
    setLikedSongs((prevLikes) =>
      prevLikes.includes(id) ? prevLikes.filter((songId) => songId !== id) : [...prevLikes, id]
    );
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

  return (
    <Container>
      <Header>
        <BackButton onPress={() => {router.back()}}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </BackButton>
        <Title>추천 트랙 리스트</Title>
      </Header>
      <FlatList
        data={recommendedationTracks}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        ListHeaderComponent={
          <>
            <CenteredImageContainer>
              <AlbumImage source={{ uri: recommendationReq.albumImageUrl }} />
            </CenteredImageContainer>
            <DescriptionContainer>
              <DescriptionText>
                {recommendationReq.recommendationType === 'playlist' ? (
                  <>
                    <BoldText>{recommendationReq.title}{'\n'}</BoldText>
                    <RegularText>플레이리스트 기반 추천 20곡</RegularText>
                  </>
                ) : (
                  <>
                    <BoldText>{recommendationReq.title}</BoldText>
                    <RegularText> - </RegularText>
                    <BoldText>{recommendationReq.artistNames}{'\n'}</BoldText>
                    <RegularText>트랙 기반 추천 20곡</RegularText>
                  </>
                )}
              </DescriptionText>
            </DescriptionContainer>
            <PlayButton onPress={() => handlePlayAll()}>
              <FontAwesome name="play-circle" size={60} color="#000" />
            </PlayButton>
          </>
        }
        renderItem={({ item }) => (
          <>
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
          </>
        )}
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
  background-color: #fafafa;
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

const CenteredImageContainer = styled.View`
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 25px;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 4px;
  elevation: 5;
`;

const AlbumImage = styled.Image`
  width: 230px;
  height: 230px;
  border-radius: 5px;
`;

const DescriptionContainer = styled.View`
  justify-content: center;
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