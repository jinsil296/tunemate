import React, { useState } from 'react';
import { SafeAreaView, TouchableOpacity, StyleSheet, View, Text, Image, Modal, Animated, Easing } from 'react-native';
import styled from 'styled-components/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import { router } from 'expo-router';
import { clearTokens } from '@/services/tokenService';
import { usePlayback } from './playback/PlaybackProvider';

export default function CustomHeader() {
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(0))[0];
  const { clearPlayback } = usePlayback(); // PlaybackProvider에서 clearPlayback 함수 가져오기
  const openDialog = () => {
    setIsDialogVisible(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  };

  const closeDialog = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start(() => setIsDialogVisible(false));
  };

  const slideUp = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0], // 600: 화면의 대부분을 덮도록 설정
  });

  const handleLogout = async () => {
    setIsDialogVisible(false); // 다이얼로그를 먼저 닫기
    
    // clearPlayback이 완료된 후 로그아웃 처리
    await clearPlayback(); // 재생 상태 초기화
    await clearTokens(); // 토큰 삭제
    router.replace('/login'); // 그 후에 로그인 화면으로 이동
  };
  
  return (
    <SafeAreaView style={{ backgroundColor: 'white' }}>
      <View style={styles.headerContainer}>
        <View style={styles.section}>
          <Image
            source={require('../assets/images/logo.png')}
            style={{
              width: 20,
              height: 20,
              marginLeft: 5,
            }}
          />
          <Text style={styles.headerText}>Tunemate</Text>
        </View>

        <View style={styles.section}>
          {/* <EvilIcons name="search" size={25} color="black" style={styles.iconContainer} 
            onPress={() => router.push('/search')}
          /> */}
          <TouchableOpacity onPress={openDialog}>
            <MaterialCommunityIcons name="account" size={25} color="#121212" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 다이얼로그 모달 */}
      <Modal transparent visible={isDialogVisible} animationType="none">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeDialog}>
          <Animated.View style={[styles.dialogContainer, { transform: [{ translateY: slideUp }] }]}>
            {/* 인디케이터 */}
            <Indicator />

            {/* Account 제목 */}
            <Text style={styles.accountTitle}>Account</Text>

            {/* 로그아웃 및 회원탈퇴 버튼 */}
            <View style={styles.buttonContainer}>
              <Text style={styles.label}>Log Out</Text>
              <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
                <Text style={styles.buttonText}>Log Out</Text>
              </TouchableOpacity>
              <Text style={styles.label}>Delete Account</Text>
              <TouchableOpacity style={styles.actionButton} onPress={() => {/* 회원탈퇴 처리 */}}>
                <Text style={styles.buttonText}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// 인디케이터 스타일 정의
const Indicator = styled.View`
  width: 50px;
  height: 5px;
  background-color: #ccc;
  border-radius: 3px;
  align-self: center;
  margin-top: -10px; /* 다이얼로그 상단에 가깝게 */
  margin-bottom: 15px;
`;

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 10,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 10,
  },
  headerText: {
    color: '#121212',
    fontSize: 19,
    fontWeight: '600',
    paddingLeft: 5,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialogContainer: {
    height: '90%',
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  accountTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    // marginTop: 20,
  },
  label: {
    fontSize: 14,
    color: '#555',
    alignSelf: 'flex-start', // 왼쪽 정렬
    margin: 10,
    fontWeight: '500'
  },
  actionButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 15,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold'
  },
});

