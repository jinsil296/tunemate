import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Image,
  View,
  TextInput,
} from 'react-native';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import axios from 'axios';
import { getAccessToken, getSpotifyId } from '@/services/tokenService';
import { SpotifyTrack, SpotifySearchResponse, SpotifyArtist } from '@/types/spotify';
import { usePlayback } from '../../../components/playback/PlaybackProvider';
import { API_BASE_URL } from '@/services/api-config';
import UUID from 'react-native-uuid';
import Toast from 'react-native-toast-message';

const LIMIT = 20;
let debounceTimeout: NodeJS.Timeout;

export default function SearchScreen() {
  const [searchText, setSearchText] = useState<string>('');
  const [songs, setSongs] = useState<SpotifyTrack[]>([]);
  const [selectedSong, setSelectedSong] = useState<SpotifyTrack | null>(null);
  const [offset, setOffset] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const searchInputRef = useRef<TextInput>(null);
  const { playTrack } = usePlayback();
  
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    
    if (searchText.trim() === '') { // 검색어가 비어있을 때 즉시 곡 목록 초기화
      setSongs([]);
      clearTimeout(debounceTimeout); // 타이머 초기화
      return;
    }

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      handleSearch(searchText, true);
    }, 200);
  
    // Cleanup: 컴포넌트 언마운트 시 또는 타이머 초기화 시 기존 타이머 제거
    return () => clearTimeout(debounceTimeout);
  }, [searchText]);

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

  // Todo: 스크롤 감지할 때만 reset false고 검색 값 변경되면 무조건 0부터
  // - 노래 제목 재생아이콘 넘어가지 않게 말줄임
  // - 노래 계속 더 불러오면 선택했던 노래 정보가 사라짐. 
  const handleSearch = async (text: string, reset = false) => {
    setSearchText(text);
    if (!hasMore) setSelectedSong(null);

    if (text.trim() === '' || searchText === '') {
        setSongs([]);
        setOffset(0);
        return;
    }

    setLoading(true);

    try {
      if (!searchText) return;

      const accessToken = await getAccessToken();
      const response = await axios.get<SpotifySearchResponse>('https://api.spotify.com/v1/search', {
          params: {
              q: text,
              type: 'track',
              limit: LIMIT,
              offset: reset ? 0 : offset,
          },
          headers: {
              Authorization: `Bearer ${accessToken}`,
          },
      });

      const newTracks = response.data.tracks.items.map(track => ({
        ...track,
      }));
      
      setSongs(reset ? newTracks : [...songs, ...newTracks]);
      setOffset(reset ? LIMIT : offset + LIMIT);
      setHasMore(newTracks.length === LIMIT);
    } catch (error) {
        console.log('Error fetching search results:', error);
    } finally {
        setLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    const formattedSeconds = Number(seconds); // seconds를 숫자로 변환
    return `${minutes}:${formattedSeconds < 10 ? '0' : ''}${formattedSeconds}`;    
  };

  const handleSelectSong = (song: SpotifyTrack) => {
    setSelectedSong(song);
  };

  const loadMoreResults = () => {
    if (!loading && hasMore) {
      handleSearch(searchText);
    }
  };

  const handleRecommend = async (track: SpotifyTrack) => {
    if(!track) return;

    const recommendationId = String(UUID.v4()); // string 타입으로 변환
    const userId = await getSpotifyId();

    try {
      const artistIds = track.artists.map((artist) => artist.id).join(',');

      const accessToken = await getAccessToken();
      const artistResponse = await axios.get(`https://api.spotify.com/v1/artists`, {
        params: { ids: artistIds },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // 아티스트 ID별 장르를 매핑
      const artistGenresMap = artistResponse.data.artists.reduce((acc: Record<string, string[]>, artist: SpotifyArtist) => {
        acc[artist.id] = artist.genres || [];
        return acc;
      }, {});

      const params = {
        recommendationId: recommendationId,
        userId: userId,
        uniqueId: track.id,
        title: track.name,
        recommendationType: 'track',
        trackIds: track.id,
        artistIds: track.artists.map((artist) => artist.id).join(','),
        artistNames: track.artists.map((artist) => artist.name).join(','),
        artistGenres: track.artists.flatMap((artist) => artistGenresMap[artist.id] || []).join(',') || '',
        albumImageUrl: track.album.images[0]?.url,
        // durationMs: track.duration_ms
      }

      // 추천 데이터 전송
      await axios.post(`${API_BASE_URL}/api/recommendation`, params);
    
      router.push({
        pathname: '/search/result',
        params: { recommendationId: recommendationId },
      });
    } catch (error) {
      console.log('Error fetching artist genres or saving recommendation:', error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <SearchBarContainer>
        <Ionicons name="search" size={20} color="#999" />
        <StyledTextInput
          ref={searchInputRef}
          placeholder="추천받고 싶은 분위기의 곡을 검색해 보세요."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={(text: string) => {
            handleSearch(text, true);
          }}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => { handleSearch('', true); }}>
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </SearchBarContainer>
      <FlatList
        data={songs}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) => (
          <ResultItem isSelected={selectedSong?.id === item.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <TouchableOpacity
                onPress={() => { handlePlay(item); }}
                style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
              >
                <Thumbnail source={{ uri: item.album.images[0]?.url }} />
                <SongDetails style={{ flex: 1, paddingLeft: 10 }}>
                  <Title numberOfLines={2} ellipsizeMode="tail">{item.name}</Title>
                  <ArtistName numberOfLines={1}>
                    {item.artists.map(artist => artist.name).join(', ')} • {formatDuration(item.duration_ms)}
                  </ArtistName>
                </SongDetails>
              </TouchableOpacity>
              <ButtonContainer style={{ paddingLeft: 10 }}>
                <TouchableOpacity onPress={() => handleRecommend(item)}>
                  <Image
                    source={require('../../../assets/images/music_search.png')}
                    style={{ width: 25, height: 25 }}
                  />
                </TouchableOpacity>
              </ButtonContainer>
            </View>
          </ResultItem>
        )}
        ListEmptyComponent={() => !loading && <NoResultText>검색 결과가 없습니다.</NoResultText>}
        ListFooterComponent={loading ? <ActivityIndicator size="large" color="#666" /> : null}
        onEndReached={loadMoreResults}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{ paddingBottom: 150 }} // BottomBar 높이만큼 패딩 추가
      />

    </SafeAreaView>
  );
}

const SearchBarContainer = styled.View`
  flex-direction: row;
  align-items: center;
  border-bottom-width: 1px;
  border-bottom-color: #666;
  padding: 10px;
  margin: 10px;
`;

const StyledTextInput = styled.TextInput`
  flex: 1;
  font-size: 16px;
  color: #333;
  padding: 5px 5px 5px 15px;
`;

const ResultItem = styled.TouchableOpacity<{ isSelected: boolean }>`
  flex-direction: row;
  align-items: center;
  padding: 8px 15px;
  border-bottom-width: 0.2px;
  border-color: #f0f0f0;
  background-color: ${(props: { isSelected: boolean }) => (props.isSelected ? '#e0e0e0' : 'white')};
`;

const Thumbnail = styled.Image`
  width: 50px;
  height: 50px;
  background-color: #ccc;
  border: 0.3px gray;
  border-radius: 5px;
  margin-right: 8px;
`;

const SongDetails = styled.View`
  flex: 1;
  padding-top: 2px; /* 제목과 아티스트 간의 간격 조정 */
`;

const Title = styled.Text`
  font-weight: 500;
  font-size: 16px;
`;

const ArtistName = styled.Text`
  font-size: 14px; /* 폰트 사이즈 줄임 */
  color: #666; /* 약간 어두운 회색 */
  margin-top: 2px; /* 약간의 상단 간격 */
`;

const NoResultText = styled.Text`
  padding: 20px;
  text-align: center;
  color: #aaa;
`;

const ButtonText = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: bold;
`;

const ButtonContainer = styled.View`
  flex-direction: row;
  align-items: center;
  margin-left: 10px;
`;