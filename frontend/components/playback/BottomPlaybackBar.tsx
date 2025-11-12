import React, { useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, { useSharedValue, runOnJS, useAnimatedStyle } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SpotifyTrack } from '@/types/spotify';
import { usePlayback } from './PlaybackProvider';
import styled from 'styled-components/native';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';

interface BottomPlaybackBarProps {
  onSwipeUp: () => void;
  onPress: () => void;
  track: SpotifyTrack | null;
  isPlaying: boolean; // 재생 상태 추가
}

const BottomPlaybackBar: React.FC<BottomPlaybackBarProps> = ({ onSwipeUp, onPress, track }) => {
  const translateY = useSharedValue(0); // 움직이는 값을 저장
  const { playTrack, togglePlayPause, isPlaying, clearPlayback } = usePlayback();
  const [visible, setVisible] = useState(false);
  const actionSheetRef = useRef<ActionSheetRef>(null);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleGesture = (event: PanGestureHandlerGestureEvent) => {
    const { nativeEvent } = event;
    if (nativeEvent.translationY < -50) { // 스와이프 업 조건
      runOnJS(onSwipeUp)(); // 풀스크린 전환
      translateY.value = 0; // 값 초기화
    }
  };

  const toggleMenu = () => {
    actionSheetRef.current?.setModalVisible(true);
  };

  if (!track) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => onSwipeUp()}>
        <Image source={{ uri: track.album.images[0].url }} style={styles.thumbnail} />
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>{track.name}</Text>
          <Text style={styles.artist} numberOfLines={1}>{track.artists.map(artist => artist.name).join(', ')}</Text>
        </View>
        <TouchableOpacity onPress={togglePlayPause}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleMenu} style={{paddingLeft: 6.5}}>
          <Ionicons name="ellipsis-vertical" size={20} color="white" />
        </TouchableOpacity>
      </TouchableOpacity>

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
          <TitleText>재생목록 옵션</TitleText>
          <TouchableOpacity onPress={() => {
            actionSheetRef.current?.setModalVisible(false); // 먼저 ActionSheet 닫기
            setTimeout(() => {  // 모달 열기 전에 setTimeout으로 delay 추가
              clearPlayback();
            }, 300);
          }}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </ActionSheetHeader>
        <ActionSheetContent>
          <ActionSheetOption onPress={() => clearPlayback()}>
          <MaterialCommunityIcons name="close-box-multiple" size={20} color="white" />
            <OptionText>재생목록 닫기</OptionText>
          </ActionSheetOption>
        </ActionSheetContent>
      </ActionSheet>
      
    </Animated.View>
  );
};

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

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 79,
    left: 10,
    right: 10,
    
    padding: 5,
    paddingRight: 10,
    // paddingLeft: 5,
    borderRadius: 10,
    backgroundColor: '#1e1e1e',
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#333',
  },
  touchArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 4,
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    maxWidth: '95%',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  artist: {
    color: '#b3b3b3',
    fontSize: 12,
  },
  dropdown: {
    position: 'absolute',
    bottom: 40, // 버튼 위에 나타나도록 위치 설정
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    width: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    padding: 10,
    fontSize: 16,
    color: '#333',
  },
});

export default BottomPlaybackBar;
