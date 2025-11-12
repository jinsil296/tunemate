import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PanGestureHandler, GestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { SpotifyTrack } from '@/types/spotify';
import { usePlayback } from './PlaybackProvider'; // 경로를 적절히 설정
import PlaylistModal from '../PlaylistModal';
import { useLikedSongs } from '../LikedTracksProvider';

interface FullScreenPlaybackProps {
  onSwipeDown: () => void;
  track: SpotifyTrack | null;
}
// Todo: 재생목록 닫기 만들어서 하단 재생바 없애기
const FullScreenPlayback: React.FC<FullScreenPlaybackProps> = ({ onSwipeDown, track }) => {
  const translateY = useSharedValue(0);
  const { currentPosition, duration, togglePlayPause, 
    isPlaying, sound, playNextTrack, playPreviousTrack } = usePlayback(); // Hook을 최상위에서 호출
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { addSongToLikes, removeSongFromLikes, isLiked } = useLikedSongs(); // 좋아요 컨텍스트 사용

  const openActionSheet = () => {
    setIsModalVisible(true);
  };

  const closeActionSheet = () => {
    setIsModalVisible(false);
  };

  // // 사운드 상태 업데이트
  // useEffect(() => {
  //   const updatePlaybackStatus = () => {
  //     if (sound) {
  //       sound.setOnPlaybackStatusUpdate((status) => {
  //         if (status.isLoaded) {
  //           setCurrentPosition(status.positionMillis || 0);
  //           setDuration(status.durationMillis); // 전체 길이 설정
  //           // 노래가 끝났을 때 재생 상태 변경
  //           if (status.didJustFinish) {
  //             // 재생이 끝났을 때 재생 상태를 false로 변경
  //             // runOnJS(togglePlayPause)(); // 재생 버튼으로 변경
  //             playNextTrack();
  //           }
  //         }
  //       });
  //     }
  //   };

  //   updatePlaybackStatus();
  // }, [sound, togglePlayPause, playNextTrack]);

  const handleGesture = (event: GestureHandlerGestureEvent) => {
    const translationY = (event.nativeEvent.translationY as number) || 0;
    // translateY 값을 양수로 제한하여 상단으로 넘어가지 않도록 설정
    translateY.value = Math.max(translationY, 0);
  };

  const handleGestureEnd = () => {
    if (translateY.value > 100) {
      runOnJS(onSwipeDown)();
      translateY.value = withSpring(0);
    } else {
      translateY.value = withSpring(0);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleSeek = (event: any) => {
    const { locationX } = event.nativeEvent;
    const barWidth = 300; // 재생바의 너비 (실제 너비에 맞춰서 조정 필요)
  
    if (track) { // track이 null이 아닐 때만 실행
      const newPosition = (locationX / barWidth) * track.duration_ms; // 새 재생 위치 계산
      sound?.setPositionAsync(newPosition); // 사운드 위치 업데이트
    }
  };
  
  // 시간 포맷팅 함수
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.ceil((ms % 60000) / 1000); // 소수점 올림 처리
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  

  if (!track) return null; // 트랙이 없을 경우 컴포넌트 렌더링 안함

  const toggleLike = () => {
    if (isLiked(track.id)) {
      removeSongFromLikes(track);
    } else {
      addSongToLikes(track);
    }
  };

  return (
    <PanGestureHandler onGestureEvent={handleGesture} onEnded={handleGestureEnd}>
      <Animated.View style={[styles.overlay, animatedStyle]}>
        <SafeAreaView style={styles.safeContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onSwipeDown}>
            <Ionicons name="chevron-down" size={24} color="black" />
          </TouchableOpacity>
          <View>
            <Image source={{ uri: track.album.images[0].url }} style={styles.albumArt} />
          </View>
          <View style={styles.textContainer}>
            <View style={styles.trackInfo}>
              <Text style={styles.title}>{track.name}</Text>
              <Text style={styles.artist}>{track.artists.map((artist) => artist.name).join(', ')}</Text>
            </View>
          </View>

          {/* 좋아요, 플리에 추가 */}
          <View style={styles.iconContainer}>
            <TouchableOpacity onPress={toggleLike}>
              <FontAwesome
                name={isLiked(track.id) ? 'heart' : 'heart-o'}
                size={24}
                color={isLiked(track.id) ? '#e91e63' : '#888'}
              />
            </TouchableOpacity>
            <TouchableOpacity style={{marginLeft: 20}} onPress={openActionSheet}>
              <MaterialCommunityIcons name="playlist-plus" size={30} color="#888" />
            </TouchableOpacity>
          </View>

          {/* 재생 바 추가 */}
          <View style={styles.playbackContainer}>
            <Text style={styles.playbackTime}>{formatTime(currentPosition)}</Text>
            <TouchableOpacity style={styles.progressBar} onPress={handleSeek}>
              <View style={[styles.progress, { width: `${(currentPosition / (duration ?? 0)) * 100}%` }]} />
            </TouchableOpacity>
            <Text style={styles.playbackTime}>{formatTime(duration ?? 0)}</Text>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity onPress={playPreviousTrack}>
              <Ionicons name="play-skip-back" size={30} color="black" />
            </TouchableOpacity>
            <TouchableOpacity onPress={togglePlayPause}>
              <Ionicons name={isPlaying ? "pause" : "play"} size={50} color="black" />
            </TouchableOpacity>
            <TouchableOpacity onPress={playNextTrack}>
              <Ionicons name="play-skip-forward" size={30} color="black" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* 재생목록 추가 모달 */}
        <PlaylistModal
          visible={isModalVisible}
          track={track}
          onClose={closeActionSheet}
        />
        
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20, // 둥근 모서리 설정
    overflow: 'hidden', // 둥근 모서리 바깥 부분을 숨김 처리
  },
  safeContainer: {
    flex: 1,
    alignItems: 'center',
  },
  closeButton: {
    alignSelf: 'flex-start',
    marginTop: 20,
    marginBottom: 40
  },
  albumArt: {
    width: 320,
    height: 320,
    borderRadius: 8,
  },
  textContainer: {
    flexDirection: 'row',
    width: '85%',
    marginTop: 20,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    marginTop: 10,
    marginLeft: 'auto', // 자동으로 오른쪽 끝으로 붙음
  },
  trackInfo: {
    flexDirection: 'column',
    flex: 1,
    alignItems: 'flex-start',
  },
  title: {
    color: 'black',
    fontSize: 24,
    fontWeight: 'bold',
  },
  artist: {
    color: '#B3B3B3',
    fontSize: 18,
    marginTop: 5
  },
  playbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '85%',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    marginHorizontal: 10,
    marginVertical: 10
  },
  progress: {
    height: 4,
    backgroundColor: 'black', // 재생 진행 바 색상
  },
  playbackTime: {
    color: '#B3B3B3',
    fontSize: 14,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '60%',
    marginTop: 35,
  },
});

export default FullScreenPlayback;