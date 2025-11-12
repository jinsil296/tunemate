import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, View, Text, RefreshControl, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import styled from 'styled-components/native';
import Header from '@/components/Header';
import { getSpotifyId } from '@/services/tokenService';
import axios from 'axios';
import { API_BASE_URL } from '@/services/api-config';
import { Swipeable } from 'react-native-gesture-handler';
import { RecommendationReq } from '@/types/spotify';
import Toast from 'react-native-toast-message';

export default function HistoryScreen() {
  const [historyList, setHistoryList] = useState<RecommendationReq[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const fetchHistory = async () => {
    const userId = await getSpotifyId();
    
    if (!userId) return;

    try {
      const history = await axios.get(`${API_BASE_URL}/api/history/${userId}`);
      setHistoryList(history.data);
    } catch (error) {
      console.log('Error history');
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return `${localDate.toLocaleDateString()} ${localDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const truncateTitle = (title: string, maxLength: number = 20) => {
    return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
  };

  const onPress = (recommendationId: string) => {
    router.push({
      pathname: '/history/detail',
      params: { recommendationId: recommendationId },
    });
  };

  const onDelete = async (recommendationId: string) => {
    if (!recommendationId) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/history/${recommendationId}`);
      // 새로 호출하는 게 아니라 있는 리스트에서 안 보이게
      setHistoryList(historyList.filter((item) => item.recommendationId !== recommendationId));

      Toast.show({
        type: 'success',
        text1: '추천 이력이 삭제되었습니다.',
        visibilityTime: 3000, // Toast duration
        position: 'bottom',
        bottomOffset: 83.5,  // Offset to lift it slightly from the bottom
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: '추천 이력 삭제에 실패하였습니다.',
        visibilityTime: 3000, // Toast duration
        position: 'bottom',
        bottomOffset: 83.5,  // Offset to lift it slightly from the bottom
      });
      console.error('Failed to delete history item:', error);
    }
  };

  const renderRightActions = (recommendationId: string) => (
    <View style={styles.limitedSwipe}>
      <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(recommendationId)}>
        <Ionicons name="trash" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <Header />
      <Container>
        <DescriptionText>추천 이력</DescriptionText>
        <FlatList
          data={historyList}
          keyExtractor={(item) => item.recommendationId}
          renderItem={({ item }) => (
            <View style={styles.shadowContainer}>
              <Swipeable
                renderRightActions={() => renderRightActions(item.recommendationId)}
                overshootRight={false}
                friction={2}
              >
                <View style={styles.card}>
                  <TouchableOpacity onPress={() => { onPress(item.recommendationId) }} style={styles.cardContainer}>
                    <View style={styles.cardContent}>
                      <Image source={{ uri: item.albumImageUrl }} style={styles.albumImage} />
                      <View style={styles.textContainer}>
                        <Text style={styles.songTitle} numberOfLines={1}>
                          {truncateTitle(item.title)}
                        </Text>
                        {item.recommendationType !== 'playlist' && (
                          <Text style={styles.artistName} numberOfLines={1}>{item.artistNames}</Text>
                        )}
                        <Text style={styles.dateText}>{formatDate(item.createDt)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.iconContainer}>
                    {item.recommendationType === 'playlist' ? (
                      <MaterialIcons name="queue-music" size={16} color="gray" />
                    ) : (
                      <Ionicons name="musical-notes" size={16} color="gray" />
                    )}
                  </View>
                </View>
              </Swipeable>
            </View>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>저장된 추천 이력이 없습니다.</Text>}
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

const DescriptionText = styled.Text`
  font-size: 23px;
  color: #333;
  font-weight: bold;
  margin: 10px 0px 2px 15px;
`;

const styles = StyleSheet.create({
  shadowContainer: {
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  limitedSwipe: {
    width: 70, // Limit the swipe width to reveal just the trash icon
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: 70,
    borderRadius: 10,
  },
  cardContainer: {
    flexDirection: 'row',
  },
  listContent: {
    padding: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    borderColor: '#ddd',
    borderWidth: 0.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  albumImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
    borderColor: 'gray',
    borderWidth: 0.2,
  },
  textContainer: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  artistName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 20,
    fontSize: 16,
  },
  iconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.2,
    borderColor: '#ccc',
    borderRadius: 50
  },
});
