import React, { useCallback, useRef, useState } from 'react';
import { Text, FlatList, TouchableOpacity, Modal, RefreshControl, View } from 'react-native';
import { Entypo, FontAwesome, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import styled from 'styled-components/native';
import Header from '@/components/Header';
import { getSpotifyId } from '@/services/tokenService';
import axios from 'axios';
import { API_BASE_URL } from '@/services/api-config';
import { useFocusEffect } from '@react-navigation/native';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';
import { Playlist } from '@/types/spotify';

  
interface PlaylistThumbnailProps {
  imageUrls: string[];
}

export default function PlaylistScreen() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const actionSheetRef = useRef<ActionSheetRef>(null);

  const openActionSheet = (item: Playlist) => {
    setSelectedPlaylist(item);
    actionSheetRef.current?.setModalVisible(true);
  };

  useFocusEffect(
    useCallback(() => {
      fetchPlaylist();
    }, [])
  );

  const fetchPlaylist = async () => {
    const userId = await getSpotifyId();
    if (!userId) return;

    try {
      const playlist = await axios.get(`${API_BASE_URL}/api/playlist/${userId}`);
      setPlaylists(playlist.data);
    } catch (error) {
      console.log('Error playlist :: ', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPlaylist();
  }, []);

  const handleCreateOrEditPlaylist = async () => {
    if (!title) return;

    try {
      const userId = await getSpotifyId();
      if (isEditMode && selectedPlaylist) {
        await axios.put(`${API_BASE_URL}/api/playlist/${selectedPlaylist.id}`, {
          title: title,
        });

        Toast.show({
          type: 'success',
          text1: '플레이리스트가 수정되었습니다.',
          visibilityTime: 3000, // Toast duration
          position: 'bottom',
          bottomOffset: 83.5,  // Offset to lift it slightly from the bottom
        });
      } else {
        await axios.post(`${API_BASE_URL}/api/playlist/create`, {
          userId: userId,
          title: title,
        });
      }

      setTitle('');
      setModalVisible(false);
      setIsEditMode(false);
      setSelectedPlaylist(null);
      fetchPlaylist();
    } catch (error) {
      console.error('플레이리스트 생성 또는 수정 실패:', error);
      setModalVisible(false);
    }
  };

  const onDelete = async (playlistId: number) => {
    if (!playlistId) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/playlist/${playlistId}`);
      setPlaylists(playlists.filter((item) => item.id !== playlistId));
      Toast.show({
        type: 'success',
        text1: '플레이리스트가 삭제되었습니다.',
        position: 'bottom',
        bottomOffset: 83.5,
      });
      setSelectedPlaylist(null);
      actionSheetRef.current?.setModalVisible(false);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: '플레이리스트 삭제에 실패하였습니다.',
        position: 'bottom',
        bottomOffset: 83.5,
      });
      console.error('Failed to delete playlist:', error);
    }
  };

  const onPress = (playlistId: number) => {
    router.push({
      pathname: '/playlist/detail',
      params: { playlistId: playlistId },
    });
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
    <>
      <Header />
      <Container>
        <Header2>
          <DescriptionText>플레이리스트</DescriptionText>
          <AddButton onPress={() => { setModalVisible(true); setIsEditMode(false); }}>
            <Entypo name="circle-with-plus" size={24} color="#1E90FF" />
          </AddButton>
        </Header2>

        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id+''} 
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => { onPress(item.id) }}>
              <PlaylistCard>
                <ThumbnailContainer>
                  {item.userId === 'system' ? ( // 좋아요 목록일 경우 고정 아이콘 표시
                    <LikeContainer>
                      <FontAwesome name="heart" size={24} color="red" />
                    </LikeContainer>
                  ) : item.thumbnailUrl ? (
                    // <Thumbnail source={{ uri: item.thumbnailUrl }} />
                    <PlaylistThumbnail imageUrls={item.thumbnailUrl.split(',')} />
                  ) : (
                    <Placeholder>
                      <MaterialIcons name="queue-music" size={24} color="#fff" />
                    </Placeholder>
                  )}
                </ThumbnailContainer>
                <TextContainer>
                  <Title numberOfLines={1} ellipsizeMode="tail">
                    {item.title}
                  </Title>
                  <View style={{flexDirection: 'row'}}>
                    <TrackCount>
                      {item.userId === 'system' && (
                        <MaterialCommunityIcons name="pin" size={17} color="blue" />
                      )}
                      {item.totalTracks} tracks
                    </TrackCount>
                  </View>
                </TextContainer>
                {item.userId !== 'system' && (
                  <MenuButton onPress={() => openActionSheet(item)}>
                    <Ionicons name="ellipsis-vertical" size={20} color="black" />
                  </MenuButton>
                )}
              </PlaylistCard>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ padding: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />

        {/* Action Sheet */}
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
            <TitleText>플레이리스트 옵션</TitleText>
            <TouchableOpacity onPress={() => actionSheetRef.current?.setModalVisible(false)}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </ActionSheetHeader>
          <ActionSheetContent>
            <ActionSheetOption onPress={() => {
              actionSheetRef.current?.setModalVisible(false); // 먼저 ActionSheet 닫기
              setTimeout(() => {  // 모달 열기 전에 setTimeout으로 delay 추가
                setTitle(selectedPlaylist?.title || ''); 
                setIsEditMode(true);
                setModalVisible(true);
              }, 300);
            }}>
              <MaterialIcons name="edit" size={20} color="white" />
              <OptionText>제목 수정하기</OptionText>
            </ActionSheetOption>
            <ActionSheetOption onPress={() => selectedPlaylist && onDelete(selectedPlaylist.id)}>
              <MaterialIcons name="delete" size={20} color="white" />
              <OptionText>삭제하기</OptionText>
            </ActionSheetOption>
          </ActionSheetContent>
        </ActionSheet>

        {/* Playlist Creation/Edit Modal */}
        <Modal
          transparent={true}
          visible={isModalVisible}
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <ModalContainer>
            <ModalContent>
              <ModalTitle>{isEditMode ? '플레이리스트 제목 수정' : '새 플레이리스트'}</ModalTitle>
              <Input
                placeholder="제목 입력"
                value={title}
                onChangeText={(text: string) => setTitle(text)}
              />
              <ButtonContainer>
                <CancelButton onPress={() => { setModalVisible(false); setIsEditMode(false); }}>
                  <CancelButtonText>취소</CancelButtonText>
                </CancelButton>
                <CreateButton
                  onPress={handleCreateOrEditPlaylist}
                  disabled={!title}
                  active={!!title}
                >
                  <ButtonText>{isEditMode ? '수정' : '생성'}</ButtonText>
                </CreateButton>
              </ButtonContainer>
            </ModalContent>
          </ModalContainer>
        </Modal>
      </Container>
    </>
  );
}

// Styled components
const Container = styled.View`
  flex: 1;
  background-color: #ffffff;
  padding-horizontal: 10px;
`;

const Header2 = styled.View`
  flex-direction: row;
  align-items: center;
  margin: 10px 0px 2px 15px;
`;

const DescriptionText = styled.Text`
  font-size: 23px;
  color: #333;
  font-weight: bold;
`;

const AddButton = styled.TouchableOpacity`
  margin-left: 5px;
`;

const PlaylistCard = styled.View`
  flex-direction: row;
  align-items: center;
  border-radius: 10px;
  margin-vertical: 6px;
`;

// const ThumbnailContainer = styled.View`
//   margin-right: 10px;
// `;

// const Thumbnail = styled.Image`
//   width: 60px;
//   height: 60px;
//   border-radius: 4px;
// `;

const ThumbnailContainer = styled.View`
  width: 60px;
  height: 60px;
  margin-right: 10px;
  border-radius: 4px;
  overflow: hidden;
  flex-direction: row;
  flex-wrap: wrap;
`;

const ThumbnailImage = styled.Image`
  width: 30px;
  height: 30px;
`;

const FullImage = styled.Image`
  width: 60px;
  height: 60px;
  border-radius: 4px;
`;

const LikeContainer = styled.View`
  width: 60px;
  height: 60px;
  border-radius: 4px;
  background-color: #f5f5f5;
  justify-content: center;
  align-items: center;
`;

const Placeholder = styled.View`
  width: 60px;
  height: 60px;
  border-radius: 4px;
  background-color: #ccc;
  justify-content: center;
  align-items: center;
`;

const TextContainer = styled.View`
  flex: 1;
  justify-content: center;
`;

const Title = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #333;
`;

const TrackCount = styled.Text`
  font-size: 12px;
  color: #888;
  margin-top: 4px;
`;

const MenuButton = styled(TouchableOpacity)`
  padding: 8px;
`;

// Action Sheet Components
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
  padding: 15px 0;
`;

const OptionText = styled.Text`
  font-size: 16px;
  color: #ffffff;
  padding-left: 10px;
`;

// Modal Components
const ModalContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
`;

const ModalContent = styled.View`
  width: 80%;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  align-items: center;
`;

const ModalTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 15px;
`;

const Input = styled.TextInput`
  width: 100%;
  height: 40px;
  border-color: #ccc;
  border-width: 1px;
  border-radius: 5px;
  padding-horizontal: 10px;
  margin-bottom: 10px;
`;

const ButtonContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 20px;
`;

const CreateButton = styled.TouchableOpacity<{ active: boolean }>`
  padding-horizontal: 15px;
  padding-vertical: 10px;
  border-radius: 5px;
  margin-left: 10px;
  background-color: ${(props: { active: any; }) => (props.active ? '#2196F3' : '#b0c4de')};
`;

const ButtonText = styled.Text`
  color: white;
  font-weight: bold;
`;

const CancelButton = styled.TouchableOpacity`
  padding-horizontal: 15px;
  padding-vertical: 10px;
  border-width: 1px;
  border-radius: 5px;
  border-color: #ddd;
`;

const CancelButtonText = styled.Text`
  color: #333;
`;
