import { Tabs } from 'expo-router';
import React from 'react';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';
import { SafeAreaView } from 'react-native-safe-area-context'; // 여기서 가져오기

export default function TabLayout() {

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top']}>
      {/* <Header /> */}
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: 'black',
          headerShown: false,
          tabBarStyle: {
            shadowColor: '#000', // 그림자 색상
            shadowOffset: { width: 0, height: -3 }, // 그림자 위치
            shadowOpacity: 0.07, // 그림자 불투명도
            shadowRadius: 6, // 그림자 반경
            elevation: 5, // Android 그림자 높이
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons name={focused ? 'file-clock' : 'file-clock-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="playlist"
          options={{
            title: 'Playlist',
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons name={focused ? 'music-box-multiple' : 'music-box-multiple-outline'} size={24} color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
