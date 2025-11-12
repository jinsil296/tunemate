import { FlatList, RefreshControl, Text } from "react-native";
import { useEffect, useState, useCallback } from "react";
import styled from "styled-components/native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { getAccessToken, getSpotifyId } from "@/services/tokenService";
import axios from "axios";
import { SpotifyPlaylist, SpotifyTrack } from "@/types/spotify";
import Header from "@/components/Header";
import UUID from "react-native-uuid";
import { API_BASE_URL } from "@/services/api-config";

interface PlaceholderItem {
  id: string;
  placeholder: boolean;
}

type PlaylistItem = SpotifyPlaylist | PlaceholderItem;

export default function HomeScreen() {
  const [selectedId, setSelectedId] = useState<string>("");
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const handleSelect = (id: string) => {
    setSelectedId((prevId) => (prevId === id ? "" : id));
  };

  // Todo: 로그인 전에 금지!
  const fetchPlaylists = async () => {
    try {
      const accessToken = await getAccessToken();
      const response = await axios.get(
        "https://api.spotify.com/v1/me/playlists",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setPlaylists(response.data.items);
    } catch (error) {
      console.error("플레이리스트를 가져오는 중 오류가 발생했습니다.", error);
    } finally {
      setRefreshing(false);
    }
  };

  const dataWithPlaceholder: PlaylistItem[] =
    playlists.length % 2 !== 0
      ? [...playlists, { id: "placeholder", placeholder: true }]
      : playlists;

  const handleRecommend = async () => {
    console.log("추천 요청, 선택된 플레이리스트 ID:", selectedId);
    if (!selectedId) return;

    const recommendationId = String(UUID.v4());

    try {
      const accessToken = await getAccessToken();
      const userId = await getSpotifyId();

      // 1. 선택된 플레이리스트의 세부 정보 가져오기
      const playlistResponse = await axios.get(
        `https://api.spotify.com/v1/playlists/${selectedId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const playlistTracks = playlistResponse.data.tracks.items;

      // 2. 인기 많은 곡 3곡 추출
      const top5PopularTracks = playlistTracks
        .map((trackItem: { track: any }) => trackItem.track)
        .sort(
          (a: { popularity: number }, b: { popularity: number }) =>
            b.popularity - a.popularity
        )
        .slice(0, 3);

      // 2. 가장 많이 포함된 아티스트 5명 추출
      const artistCountMap = playlistTracks.reduce(
        (
          acc: { [x: string]: any },
          trackItem: { track: { artists: any; popularity: number } }
        ) => {
          const trackArtists = trackItem.track.artists;
          trackArtists.forEach((artist: { id: string | number }) => {
            if (!acc[artist.id])
              acc[artist.id] = {
                count: 0,
                popularity: trackItem.track.popularity,
              };
            acc[artist.id].count += 1;
          });
          return acc;
        },
        {}
      );

      // 3. 등장 횟수를 기준으로 정렬된 아티스트 목록 생성
      let top5ArtistIds = Object.keys(artistCountMap)
        .sort((a, b) => {
          const countDiff = artistCountMap[b].count - artistCountMap[a].count;
          return countDiff !== 0
            ? countDiff
            : artistCountMap[b].popularity - artistCountMap[a].popularity;
        })
        .slice(0, 5);

      // 4. 각 아티스트의 장르 가져오기
      const artistResponse = await axios.get(
        `https://api.spotify.com/v1/artists`,
        {
          params: { ids: top5ArtistIds.join(",") },
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const uniqueGenres = new Set<string>();
      artistResponse.data.artists.forEach((artist: { genres: string[] }) => {
        artist.genres.forEach((genre) => uniqueGenres.add(genre));
      });
      const artistGenresMap = Array.from(uniqueGenres).join(", ");

      // 5. 서버로 전송할 데이터 준비
      const params = {
        recommendationId: recommendationId,
        userId: userId,
        uniqueId: selectedId,
        title: playlistResponse.data.name,
        recommendationType: "playlist",
        trackIds: top5PopularTracks
          .map((track: { id: string }) => track.id)
          .join(","),
        artistIds: top5ArtistIds.join(","),
        artistNames: artistResponse.data.artists
          .map((artist: { name: any }) => artist.name)
          .join(","),
        artistGenres: artistGenresMap,
        albumImageUrl: playlistResponse.data.images[0]?.url,
      };

      // 6. 백엔드로 데이터 전송
      await axios.post(`${API_BASE_URL}/api/recommendation`, params);

      // 7. 추천 결과 화면으로 라우팅
      router.push({
        pathname: "/result",
        params: { recommendationId: recommendationId },
      });
    } catch (error) {
      console.error("플레이리스트 기반 추천 중 오류가 발생했습니다:", error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPlaylists();
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      setSelectedId("");
      const initializeAuth = async () => {
        const accessToken = await getAccessToken();
        if (accessToken) {
          setIsAuthenticated(true);
          fetchPlaylists();
        } else {
          // router.replace('/login');
          console.log("메인화면");
        }
      };
      initializeAuth();
    }, [isAuthenticated])
  );

  return (
    <>
      <Header />
      <Container>
        <SearchBarContainer onPress={() => router.push("/search")}>
          <Ionicons
            style={{ paddingLeft: 15 }}
            name="search"
            size={20}
            color="#888"
          />
          <SearchText>Search</SearchText>
        </SearchBarContainer>

        {/* Spotify 라이브러리 + 추천 버튼 */}
        <HeaderRow>
          <DescriptionText>Spotify 라이브러리</DescriptionText>
          <RecommendButton
            onPress={handleRecommend}
            disabled={!selectedId}
            isDisabled={!selectedId}
          >
            <ButtonText>추천 받기</ButtonText>
          </RecommendButton>
        </HeaderRow>

        <FlatList
          data={dataWithPlaceholder}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CardContainer
              onPress={() => !("placeholder" in item) && handleSelect(item.id)}
              isSelected={item.id === selectedId}
              isHidden={"placeholder" in item}
            >
              {"placeholder" in item ? null : (
                <>
                  <Thumbnail
                    source={{
                      uri:
                        item.images[0]?.url ||
                        "https://via.placeholder.com/100",
                    }}
                  />
                  <CardContent>
                    <CardTitle numberOfLines={1} ellipsizeMode="tail">
                      {item.name}
                    </CardTitle>
                    <AdditionalInfo numberOfLines={2} ellipsizeMode="tail">
                      {item.tracks.total} tracks •{" "}
                      {item.owner.display_name || "Unknown"} •{" "}
                      {item.public ? "Public" : "Private"}
                    </AdditionalInfo>
                  </CardContent>
                  {item.id === selectedId && (
                    <CheckIcon name="check-circle" size={24} color="black" />
                  )}
                </>
              )}
            </CardContainer>
          )}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={{ marginTop: "60%", textAlign: "center" }}>
              Spotify 라이브러리가 없습니다. 새로운 라이브러리를 추가해보세요!
            </Text>
          }
        />
      </Container>
    </>
  );
}

const Container = styled.View`
  flex: 1;
  background-color: white;
  padding-horizontal: 10px;
`;

const SearchBarContainer = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: #f1f1f1;
  border-radius: 10px;
  padding-vertical: 10px;
  margin: 10px;
`;

const SearchText = styled.Text`
  font-size: 16px;
  color: #888;
  margin-left: 10px;
`;

const HeaderRow = styled.View`
  flex-direction: row;
  margin-top: 8px;
  padding-bottom: 10px;
  align-items: center;
  justify-content: space-between;
`;

// 새로운 스타일 컴포넌트를 정의합니다.
const DescriptionText = styled.Text`
  font-size: 18px;
  color: #333;
  font-weight: bold;
  margin: 10px;
  margin-left: 15px;
`;

const RecommendButton = styled.TouchableOpacity<{ disabled: boolean }>`
  background-color: ${(props: { isDisabled: boolean }) =>
    props.isDisabled ? "#9e9e9e" : "#121212"};
  padding: 8px 12px;
  margin-right: 10px;
  border-radius: 10px;
  opacity: ${(props: { isDisabled: boolean }) => (props.isDisabled ? 0.5 : 1)};
`;

const ButtonText = styled.Text`
  color: #fff;
  font-size: 14px;
  font-weight: bold;
`;

const CardContainer = styled.TouchableOpacity`
  flex: 1;
  margin: 10px;
  width: 48%;
  min-height: 200px; /* 카드 높이를 고정 */
  overflow: hidden;
  border-radius: 10px;
`;

const Thumbnail = styled.Image`
  width: 100%;
  aspect-ratio: 1;
  border: 0.2px gray;
  border-radius: 10px;
  margin-bottom: 10px;
`;

const CardContent = styled.View`
  flex: 1;
  align-items: flex-start;
`;

const CardTitle = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #333;
  text-align: left;
  max-height: 42px;
  overflow: hidden;
`;

const AdditionalInfo = styled.Text`
  font-size: 12px;
  color: #888;
  text-align: left;
  max-height: 38px;
  overflow: hidden;
`;

const CheckIcon = styled(MaterialIcons)`
  position: absolute;
  top: 5px;
  right: 5px;
`;
